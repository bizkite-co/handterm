// src/hooks/useAuth.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import ENDPOINTS from 'src/shared/endpoints.json';
import { MyResponse } from '../types/Types';
import {
  setIsLoggedIn,
  setUserName,
  setIsInLoginProcess,
  isLoggedInSignal
} from '../signals/appSignals';

const API_URL = ENDPOINTS.api.BaseUrl;

interface LoginCredentials {
  username: string;
  password: string;
}

interface SignUpCredentials extends LoginCredentials {
  email: string;
}

interface AuthResponse {
  AccessToken: string;
  RefreshToken: string;
  IdToken: string;
  ExpiresIn: string;
  ExpiresAt?: number;  // Added ExpiresAt
  githubUsername?: string;
}

export interface IAuthProps {
  login: (username: string, password: string) => Promise<MyResponse<AuthResponse>>;
  signup: (credentials: SignUpCredentials) => Promise<MyResponse<unknown>>;
  verify: (username: string, code: string) => Promise<unknown>;
  refreshToken: () => Promise<MyResponse<AuthResponse>>;
  isLoggedIn: boolean;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  isPending: boolean;
}

export function useAuth(): IAuthProps {
  const queryClient = useQueryClient();

  // Session management
  const { data: session, isPending } = useQuery({
    queryKey: ['auth', 'session'],
    queryFn: async (): Promise<MyResponse<AuthResponse>> => {
      try {
        const accessToken = localStorage.getItem('AccessToken');
        const expiresAt = localStorage.getItem('ExpiresAt');

        // Check if token is expired
        if (!accessToken || (expiresAt && parseInt(expiresAt) < Date.now())) {
          throw new Error('Token expired');
        }

        const config = {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          withCredentials: true
        };

        const response = await axios.get(`${API_URL}${ENDPOINTS.api.GetUser}`, config);
        return {
          status: 200,
          data: response.data as AuthResponse,
          message: 'Session valid',
          error: []
        };
      } catch (error) {
        localStorage.removeItem('AccessToken');
        localStorage.removeItem('RefreshToken');
        localStorage.removeItem('ExpiresAt');
        setIsLoggedIn(false);
        setUserName(null);
        return {
          status: 401,
          data: undefined,
          message: 'Session invalid',
          error: ['Session expired or invalid']
        };
      }
    },
    enabled: !!localStorage.getItem('AccessToken') &&
             (!localStorage.getItem('ExpiresAt') ||
              parseInt(localStorage.getItem('ExpiresAt') || '0') > Date.now()),
    retry: false,
    staleTime: 5 * 60 * 1000 // Consider session stale after 5 minutes
  });

  // Token refresh mutation
  const refreshMutation = useMutation({
    mutationFn: async (): Promise<MyResponse<AuthResponse>> => {
      const refreshToken = localStorage.getItem('RefreshToken');
      if (!refreshToken) throw new Error('No refresh token');

      const response = await axios.post(
        `${API_URL}${ENDPOINTS.api.RefreshToken}`,
        { refreshToken },
        { withCredentials: true }
      );
      return {
        status: 200,
        data: response.data,
        message: 'Token refreshed',
        error: []
      };
    },
    onSuccess: (data) => {
      if (data.data) {
        const expiresAt = Date.now() + parseInt(data.data.ExpiresIn) * 1000;
        setIsLoggedIn(true);
        localStorage.setItem('AccessToken', data.data.AccessToken);
        localStorage.setItem('ExpiresAt', expiresAt.toString());
        // Invalidate session query to trigger re-fetch with new token
        queryClient.invalidateQueries({ queryKey: ['auth', 'session'] });
      }
    },
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginCredentials): Promise<MyResponse<AuthResponse>> => {
      const response = await axios.post(
        `${API_URL}${ENDPOINTS.api.SignIn}`,
        credentials,
        { withCredentials: true }
      );
      return {
        status: 200,
        data: response.data,
        message: 'Login successful',
        error: []
      };
    },
    onSuccess: (data) => {
      if (data.data) {
        const expiresAt = Date.now() + parseInt(data.data.ExpiresIn) * 1000;
        isLoggedInSignal.value = true;
        localStorage.setItem('AccessToken', data.data.AccessToken);
        localStorage.setItem('RefreshToken', data.data.RefreshToken);
        localStorage.setItem('IdToken', data.data.IdToken);
        localStorage.setItem('ExpiresAt', expiresAt.toString());

        if (data.data.githubUsername) {
          localStorage.setItem('githubUsername', data.data.githubUsername);
        }
        setIsLoggedIn(true);
        setIsInLoginProcess(false);
        queryClient.invalidateQueries({ queryKey: ['auth', 'session'] });
      }
    },
    onError: () => {
      setIsLoggedIn(false);
      setIsInLoginProcess(false);
    }
  });

  // Signup mutation
  const signupMutation = useMutation({
    mutationFn: async (credentials: SignUpCredentials): Promise<MyResponse<unknown>> => {
      const response = await axios.post(
        `${API_URL}${ENDPOINTS.api.SignUp}`,
        credentials,
        { withCredentials: true }
      );
      return {
        status: 200,
        data: response.data,
        message: 'Signup successful',
        error: []
      };
    },
    onSuccess: () => {
      setIsInLoginProcess(false);
    },
    onError: () => {
      setIsInLoginProcess(false);
    }
  });

  // Verify email mutation
  const verifyMutation = useMutation({
    mutationFn: async ({ username, code }: { username: string; code: string }) => {
      const response = await axios.post(
        `${API_URL}${ENDPOINTS.api.ConfirmSignUp}`,
        { username, code },
        { withCredentials: true }
      );
      return response.data;
    }
  });

  return {
    // Session state
    isLoggedIn: !!session?.data,
    isPending,

    // Auth methods
    login: (username: string, password: string) =>
      loginMutation.mutateAsync({ username, password }),
    signup: signupMutation.mutateAsync,
    verify: (username: string, code: string) =>
      verifyMutation.mutateAsync({ username, code }),
    refreshToken: refreshMutation.mutateAsync,

    // Loading states
    isLoading: loginMutation.isPending || signupMutation.isPending,
    isError: loginMutation.isError || signupMutation.isError,
    error: loginMutation.error || signupMutation.error,
  };
}
