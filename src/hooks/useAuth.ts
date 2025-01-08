// src/hooks/useAuth.ts
import { useEffect, useCallback } from 'react';
import axios from 'axios';
import { TokenKeys } from '../constants/tokens';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import endpoints from 'src/shared/endpoints.json';
import { createLogger, LogLevel } from 'src/utils/Logger';

import {
  setIsLoggedIn,
  setUserName,
  setIsInLoginProcess,
  isLoggedInSignal
} from '../signals/appSignals';
import { type MyResponse } from '../types/Types';
import { isNullOrEmptyString } from '../utils/typeSafetyUtils';

const logger = createLogger({
  prefix: 'Auth',
  level: LogLevel.ERROR
});

const API_URL = endpoints.api.BaseUrl;

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
  expiresAt: string;
  ExpiresIn: string;
  githubUsername?: string | undefined; // Explicitly define githubUsername as string | undefined
}

export interface IAuthProps {
  login: (username: string, password: string) => Promise<MyResponse<AuthResponse>>;
  signup: (credentials: SignUpCredentials) => Promise<MyResponse<unknown>>;
  verify: (username: string, code: string) => Promise<unknown>;
  refreshToken: () => Promise<MyResponse<AuthResponse>>;
  validateAndRefreshToken: () => Promise<MyResponse<AuthResponse>>;
  isLoggedIn: boolean;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  isPending: boolean;
}

export function useAuth(): IAuthProps {
  const queryClient = useQueryClient();

  // Token refresh mutation
  const refreshMutation = useMutation({
    mutationFn: async (): Promise<MyResponse<AuthResponse>> => {
      const refreshToken = localStorage.getItem(TokenKeys.RefreshToken);
      if (typeof refreshToken !== 'string' || refreshToken === '') throw new Error('No refresh token');

      const response = await axios.post(
        `${API_URL}${endpoints.api.RefreshToken}`,
        { refreshToken }
      );

      if (response.data != null && typeof response.data === 'object' && 'AccessToken' in response.data) {
        return {
          status: 200,
          data: response.data as AuthResponse,
          message: 'Token refreshed',
          error: []
        };
      } else {
        throw new Error('Invalid refresh token response');
      }
    },
    onSuccess: (data) => {
      if (data.data != null && typeof data.data === 'object' && 'AccessToken' in data.data) {
        setExpiresAtLocalStorage(data.data.ExpiresIn);
        setIsLoggedIn(true);
        isLoggedInSignal.value = true;
        localStorage.setItem(TokenKeys.AccessToken, data.data.AccessToken);
        void queryClient.invalidateQueries({ queryKey: ['auth', 'session'] });
      }
    },
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Token validation and refresh function
  const validateAndRefreshToken = useCallback(async (): Promise<MyResponse<AuthResponse>> => {
    try {
      const accessToken = localStorage.getItem(TokenKeys.AccessToken);
      const expiresAt = localStorage.getItem(TokenKeys.ExpiresAt);
      const expiresIn = localStorage.getItem(TokenKeys.ExpiresIn);
      const refreshToken = localStorage.getItem(TokenKeys.RefreshToken);
      const idToken = localStorage.getItem(TokenKeys.IdToken);
      const githubUsername = localStorage.getItem(TokenKeys.GithubUsername);

      // Exit early if any of these are missing
      if (accessToken == null || refreshToken == null || expiresAt == null || expiresIn == null) {
        setIsLoggedIn(false);
        isLoggedInSignal.value = false;
        return {
          status: 401,
          message: "You are not logged in.",
          error: []
        };
      }

      // Check if token is expired or will expire soon (within 5 minutes)
      const isExpiringSoon = expiresAt != null ? parseInt(expiresAt) - Date.now() < 5 * 60 * 1000 : false;

      if (isExpiringSoon) {
        // Attempt to refresh the token
        const response = await refreshMutation.mutateAsync();
        if (response.data?.AccessToken != null && typeof response.data.AccessToken === 'string') {
          // Token refresh successful
          setIsLoggedIn(true);
          return {
            status: 200,
            data: {
              AccessToken: response.data.AccessToken,
              expiresAt: response.data.expiresAt,
              ExpiresIn: response.data.ExpiresIn,
              IdToken: response.data.IdToken,
              RefreshToken: response.data.RefreshToken,
              githubUsername: response.data.githubUsername
            },
            message: "Token refreshed",
            error: []
          };
        }
      } else if (expiresAt != null && parseInt(expiresAt) > Date.now()) {
        // Token is still valid
        setIsLoggedIn(true);
        return {
          status: 200,
          data: {
            AccessToken: accessToken,
            expiresAt: expiresAt,
            ExpiresIn: expiresIn,
            IdToken: idToken ?? '',
            RefreshToken: refreshToken,
            githubUsername: githubUsername ?? ''
          },
          message: "Token refreshed",
          error: []
        };
      }

      // If we get here, either token refresh failed or token is expired
      setIsLoggedIn(false);
      isLoggedInSignal.value = false;
      return {
        status: 401,
        message: "Token refresh failed.",
        error: []
      };
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Token validation failed:', error.message);
      } else {
        logger.error('An unexpected error occurred during token validation');
      }
      setIsLoggedIn(false);
      isLoggedInSignal.value = false;
      return {
        status: 401,
        message: "Token validation failed",
        error: []
      };
    }
  }, [refreshMutation]);

  // Session management with automatic token validation
  const { data: session, isPending } = useQuery<MyResponse<AuthResponse>>({
    queryKey: ['auth', 'session'],
    queryFn: async (): Promise<MyResponse<AuthResponse>> => {
      try {
        const isValid = await validateAndRefreshToken();
        if (isValid != null) {
          throw new Error('Token validation failed');
        }

        const accessToken = localStorage.getItem(TokenKeys.AccessToken);
        if (typeof accessToken !== 'string' || accessToken === '') throw new Error('No AccessToken');
        const config = {
          headers: {
            'AUTHORIZATION': `Bearer ${accessToken}`,
            'CONTENT_TYPE': 'application/json'
          }
        };

        const response = await axios.get(`${API_URL}${endpoints.api.GetUser}`, config);
        if (response.data != null && typeof response.data === 'object' && 'AccessToken' in response.data) {
          return {
            status: 200,
            data: response.data as AuthResponse,
            message: 'Session valid',
            error: []
          };
        } else {
          throw new Error('Invalid session response');
        }
      } catch (error) {
        if (error instanceof Error) {
          logger.error('Session validation failed:', error.message);
        } else {
          logger.error('An unexpected error occurred during session validation');
        }
        if (typeof localStorage.getItem(TokenKeys.AccessToken) === 'string') localStorage.removeItem(TokenKeys.AccessToken);
        if (typeof localStorage.getItem(TokenKeys.RefreshToken) === 'string') localStorage.removeItem(TokenKeys.RefreshToken);
        if (typeof localStorage.getItem(TokenKeys.ExpiresAt) === 'string') localStorage.removeItem(TokenKeys.ExpiresAt);
        if (typeof localStorage.getItem(TokenKeys.ExpiresIn) === 'string') localStorage.removeItem(TokenKeys.ExpiresIn);
        if (typeof localStorage.getItem(TokenKeys.IdToken) === 'string') localStorage.removeItem(TokenKeys.IdToken);
        if (typeof localStorage.getItem(TokenKeys.GithubUsername) === 'string') localStorage.removeItem(TokenKeys.GithubUsername);
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
    enabled: typeof localStorage.getItem(TokenKeys.AccessToken) === 'string',
    retry: false,
    staleTime: 5 * 60 * 1000 // Consider session stale after 5 minutes
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginCredentials): Promise<MyResponse<AuthResponse>> => {
      const response = await axios.post(
        `${API_URL}${endpoints.api.SignIn}`,
        credentials
      );
      if (response.data != null && typeof response.data === 'object' && 'AccessToken' in response.data) {
        return {
          status: 200,
          data: response.data as AuthResponse,
          message: 'Login successful',
          error: []
        };
      } else {
        throw new Error('Invalid login response');
      }
    },
    onSuccess: (data) => {
      if (data.data?.ExpiresIn != null && typeof data.data.ExpiresIn === 'string') {
        setExpiresAtLocalStorage(data.data.ExpiresIn);
        setIsLoggedIn(true);
        isLoggedInSignal.value = true;
        localStorage.setItem(TokenKeys.AccessToken, data.data.AccessToken);
        localStorage.setItem(TokenKeys.RefreshToken, data.data.RefreshToken);
        localStorage.setItem(TokenKeys.IdToken, data.data.IdToken);

        if (typeof data.data.githubUsername === 'string') {
          localStorage.setItem(TokenKeys.GithubUsername, data.data.githubUsername);
        }
        setIsLoggedIn(true);
        setIsInLoginProcess(false);
        void queryClient.invalidateQueries({ queryKey: ['auth', 'session'] });
      }
    },
    onError: () => {
      setIsLoggedIn(false);
      setIsInLoginProcess(false);
    },
    onSettled: () => setIsInLoginProcess(false),

  });

  const setExpiresAtLocalStorage = (expiresIn: string) => {
    const expiresAt = Date.now() + parseInt(expiresIn) * 1000;
    if (!isNullOrEmptyString(expiresIn)) localStorage.setItem('expiresIn', expiresIn);
    if (expiresAt != null && !Number.isNaN(expiresAt)) {
      localStorage.setItem('expiresAt', expiresAt.toString());
    }
  }

  // Signup mutation
  const signupMutation = useMutation({
    mutationFn: async (credentials: SignUpCredentials): Promise<MyResponse<unknown>> => {
      const response = await axios.post(
        `${API_URL}${endpoints.api.SignUp}`,
        credentials
      );
      if (response.data != null && typeof response.data === 'object') {
        return {
          status: 200,
          data: response.data,
          message: 'Signup successful',
          error: []
        };
      } else {
        throw new Error('Invalid signup response');
      }
    },
    onSuccess: () => {
      void setIsInLoginProcess(false);
    },
    onError: () => {
      void setIsInLoginProcess(false);
    },
  });

  // Verify email mutation
  const verifyMutation = useMutation({
    mutationFn: async ({ username, code }: { username: string; code: string }) => {
      const response = await axios.post(
        `${API_URL}${endpoints.api.ConfirmSignUp}`,
        { username, code }
      );
      if (response.data != null && typeof response.data === 'object') {
        return response.data as unknown;
      } else {
        throw new Error('Invalid verify response');
      }
    },
    onSuccess: () => void setIsInLoginProcess(false),
    onError: () => void setIsInLoginProcess(false),
  });

  // Add a side effect to synchronize login state and validate token
  useEffect(() => {
    const syncLoginState = async () => {
      const myResponse = await validateAndRefreshToken();
      if (myResponse.status === 200) {
        isLoggedInSignal.value = true;
        setIsLoggedIn(true);
      } else {
        isLoggedInSignal.value = false;
        setIsLoggedIn(false);
      }
    };

    // Sync on initial load and when storage changes
    void syncLoginState();
    const onStorageChange = (): void => { void syncLoginState() };
    window.addEventListener('storage', onStorageChange);

    return () => {
      window.removeEventListener('storage', onStorageChange);
    };
  }, [validateAndRefreshToken]);

  const isLoading = loginMutation.isPending ?? signupMutation.isPending ?? verifyMutation.isPending;
  const isError = loginMutation.isError ?? signupMutation.isError ?? verifyMutation.isError;
  const error = loginMutation.error ?? signupMutation.error ?? verifyMutation.error;

  if (session?.data != null && typeof session.data === 'object' && 'AccessToken' in session.data) {
    return {
      isLoggedIn: true,
      isPending,
      login: async (username: string, password: string) => await loginMutation.mutateAsync({ username, password }),
      signup: async (credentials: SignUpCredentials) => await signupMutation.mutateAsync(credentials),
      verify: async (username: string, code: string) => await verifyMutation.mutateAsync({ username, code }),
      refreshToken: async () => await refreshMutation.mutateAsync(),
      validateAndRefreshToken,
      isLoading,
      isError,
      error,
    }
  } else {
    return {
      isLoggedIn: false,
      isPending,
      login: async (username: string, password: string) => await loginMutation.mutateAsync({ username, password }),
      signup: async (credentials: SignUpCredentials) => await signupMutation.mutateAsync(credentials),
      verify: async (username: string, code: string) => await verifyMutation.mutateAsync({ username, code }),
      refreshToken: async () => await refreshMutation.mutateAsync(),
      validateAndRefreshToken,
      isLoading,
      isError,
      error,
    };
  }
}
