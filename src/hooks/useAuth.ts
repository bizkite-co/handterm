// src/hooks/useAuth.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useEffect } from 'react';
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
  ExpiresAt?: number;
  githubUsername?: string;
}

export interface IAuthProps {
  login: (username: string, password: string) => Promise<MyResponse<AuthResponse>>;
  signup: (credentials: SignUpCredentials) => Promise<MyResponse<unknown>>;
  verify: (username: string, code: string) => Promise<unknown>;
  refreshToken: () => Promise<MyResponse<AuthResponse>>;
  validateAndRefreshToken: () => Promise<boolean>;
  isLoggedIn: boolean;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  isPending: boolean;
}

export function useAuth(): IAuthProps {
  const queryClient = useQueryClient();

  // Token validation and refresh function
  const validateAndRefreshToken = async (): Promise<boolean> => {
    try {
      const accessToken = localStorage.getItem('AccessToken');
      const expiresAt = localStorage.getItem('ExpiresAt');
      const refreshToken = localStorage.getItem('RefreshToken');

      if (!accessToken || !refreshToken) {
        setIsLoggedIn(false);
        isLoggedInSignal.value = false;
        return false;
      }

      // Check if token is expired or will expire soon (within 5 minutes)
      const isExpiringSoon = expiresAt && parseInt(expiresAt) - Date.now() < 5 * 60 * 1000;

      if (isExpiringSoon) {
        // Attempt to refresh the token
        const response = await refreshMutation.mutateAsync();
        if (response.data?.AccessToken) {
          // Token refresh successful
          setIsLoggedIn(true);
          return true;
        }
      } else if (expiresAt && parseInt(expiresAt) > Date.now()) {
        // Token is still valid
        setIsLoggedIn(true);
        return true;
      }

      // If we get here, either token refresh failed or token is expired
      setIsLoggedIn(false);
      isLoggedInSignal.value = false;
      return false;
    } catch (error) {
      console.error('Token validation failed:', error);
      setIsLoggedIn(false);
      isLoggedInSignal.value = false;
      return false;
    }
  };

  // Session management with automatic token validation
  const { data: session, isPending } = useQuery<MyResponse<AuthResponse>>({
    queryKey: ['auth', 'session'],
    queryFn: async (): Promise<MyResponse<AuthResponse>> => {
      try {
        const isValid = await validateAndRefreshToken();
        if (!isValid) {
          throw new Error('Token validation failed');
        }

        const accessToken = localStorage.getItem('AccessToken');
        const config = {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
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
        isLoggedInSignal.value = false;
        setUserName(null);
        return {
          status: 401,
          data: undefined,
          message: 'Session invalid',
          error: ['Session expired or invalid']
        };
      }
    },
    enabled: !!localStorage.getItem('AccessToken'),
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
        { refreshToken }
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
        setExpiresAtLocalStorage(data.data.ExpiresIn);
        setIsLoggedIn(true);
        isLoggedInSignal.value = true;
        localStorage.setItem('AccessToken', data.data.AccessToken);
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
        credentials
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
        setExpiresAtLocalStorage(data.data.ExpiresIn);

        isLoggedInSignal.value = true;
        localStorage.setItem('AccessToken', data.data.AccessToken);
        localStorage.setItem('RefreshToken', data.data.RefreshToken);
        localStorage.setItem('IdToken', data.data.IdToken);

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

  const setExpiresAtLocalStorage = (expiresIn: string) => {
    const expiresAt = Date.now() + parseInt(expiresIn) * 1000;
    if (Number.isNaN(expiresAt)) {
      console.error("expiresAt is NaN", expiresAt);
    }
    else {
      localStorage.setItem('ExpiresAt', expiresAt.toString());
    }
  }

  // Signup mutation
  const signupMutation = useMutation({
    mutationFn: async (credentials: SignUpCredentials): Promise<MyResponse<unknown>> => {
      const response = await axios.post(
        `${API_URL}${ENDPOINTS.api.SignUp}`,
        credentials
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
        { username, code }
      );
      return response.data;
    }
  });

  // Add a side effect to synchronize login state and validate token
  useEffect(() => {
    const syncLoginState = async () => {
      const isValid = await validateAndRefreshToken();
      isLoggedInSignal.value = isValid;
      setIsLoggedIn(isValid);
    };

    // Sync on initial load and when storage changes
    syncLoginState();
    window.addEventListener('storage', () => syncLoginState());

    return () => {
      window.removeEventListener('storage', () => syncLoginState());
    };
  }, []);

  return {
    isLoggedIn: !!session?.data,
    isPending,
    login: (username: string, password: string) =>
      loginMutation.mutateAsync({ username, password }),
    signup: (credentials: SignUpCredentials) =>
      signupMutation.mutateAsync(credentials),
    verify: (username: string, code: string) =>
      verifyMutation.mutateAsync({ username, code }),
    refreshToken: refreshMutation.mutateAsync,
    validateAndRefreshToken,
    isLoading: loginMutation.isPending || signupMutation.isPending,
    isError: loginMutation.isError || signupMutation.isError,
    error: loginMutation.error || signupMutation.error,
  };
}
