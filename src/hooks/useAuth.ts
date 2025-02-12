// src/hooks/useAuth.ts
import { useEffect, useCallback, useRef } from 'react';
import axios from 'axios';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import endpoints from 'src/shared/endpoints.json';
import { createLogger, LogLevel } from 'src/utils/Logger';

import {
  setIsLoggedIn,
  setUserName,
  setIsInLoginProcess,
  isLoggedInSignal
} from '../signals/appSignals';
import { isNullOrEmptyString } from '../utils/typeSafetyUtils';
import type { AuthResponse, IAuthProps, LoginCredentials, MyResponse, SignUpCredentials } from '@handterm/types';
import { TokenKeys } from '@handterm/types';

const logger = createLogger({
  prefix: 'Auth',
  level: LogLevel.ERROR
});

const API_URL = endpoints.api.BaseUrl;


export function useAuth(): IAuthProps {
  const queryClient = useQueryClient();

  const clearTokens = () => {
    localStorage.removeItem(TokenKeys.AccessToken);
    localStorage.removeItem(TokenKeys.RefreshToken);
    localStorage.removeItem(TokenKeys.ExpiresAt);
    localStorage.removeItem(TokenKeys.ExpiresIn);
    localStorage.removeItem(TokenKeys.IdToken);
    localStorage.removeItem(TokenKeys.GithubUsername);
    setIsLoggedIn(false);
    isLoggedInSignal.value = false;
  };

  // Token refresh mutation
  const refreshMutation = useMutation({
    mutationFn: async (): Promise<MyResponse<AuthResponse>> => {
      const refreshToken = localStorage.getItem(TokenKeys.RefreshToken);
      if (refreshToken == null || refreshToken === '') {
        clearTokens();
        throw new Error('No refresh token');
      }

      try {
        const response = await axios.post(
          `${API_URL}${endpoints.api.RefreshToken}`,
          { refreshToken }
        );

        if (response.status === 500) {
          logger.error('Server error during token refresh');
          throw new Error('Server error during token refresh');
        }

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
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 500) {
          throw new Error('Server error during token refresh');
        }
        throw error;
      }
    },
    onSuccess: (response: MyResponse<AuthResponse>) => {
      if (response.data != null && typeof response.data === 'object' && 'AccessToken' in response.data) {
        setExpiresAtLocalStorage(response.data.ExpiresIn);
        setIsLoggedIn(true);
        isLoggedInSignal.value = true;
        localStorage.setItem(TokenKeys.AccessToken, response.data.AccessToken);
        void queryClient.invalidateQueries({ queryKey: ['auth', 'session'] });
      }
    },
    retry: (failureCount: number, error: unknown): boolean => {
      if (axios.isAxiosError(error) && error.response?.status === 500) {
        if(failureCount > 50){
          clearTokens();
        }
        return false;
      }
      return failureCount < 3;
    },
    retryDelay: (attemptIndex: number): number => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Token validation and refresh function
  const validateAndRefreshToken = useCallback(async (): Promise<MyResponse<AuthResponse>> => {
    try {
      const accessToken = localStorage.getItem(TokenKeys.AccessToken);
      const refreshToken = localStorage.getItem(TokenKeys.RefreshToken);
      const expiresAt = localStorage.getItem(TokenKeys.ExpiresAt);
      const expiresIn = localStorage.getItem(TokenKeys.ExpiresIn);
      const idToken = localStorage.getItem(TokenKeys.IdToken);
      const githubUsername = localStorage.getItem(TokenKeys.GithubUsername);

      // If we have no refresh token and no refresh attempt is in progress,
      // initiate a refresh attempt or clear tokens and return error
      if (!refreshToken && !refreshMutation.isPending) {
        try {
          const response = await refreshMutation.mutateAsync();
          if (response.data?.AccessToken != null) {
            setIsLoggedIn(true);
            return {
              status: 200,
              data: response.data,
              message: "Token refreshed",
              error: []
            };
          }
        } catch (error) {
          // Only clear tokens if refresh fails AND refresh token is missing
          if (localStorage.getItem(TokenKeys.RefreshToken) == null) {
            clearTokens();
          }
          return {
            status: 401,
            message: "Token refresh failed",
            error: []
          };
        }
      } else if (refreshToken == null) {
        clearTokens();
        return {
          status: 401,
          message: "No refresh token available",
          error: []
        };
      }

      // If we have a refresh token but no access token, attempt to refresh
      if (accessToken == null || expiresAt == null || expiresIn == null) {
        try {
          const response = await refreshMutation.mutateAsync();
          if (response.data?.AccessToken != null) {
            setIsLoggedIn(true);
            return {
              status: 200,
              data: response.data,
              message: "Token refreshed",
              error: []
            };
          }
        } catch (error) {
          // Only clear tokens if refresh fails AND refresh token is missing
          if (!localStorage.getItem(TokenKeys.RefreshToken)) {
            clearTokens();
          }
          return {
            status: 401,
            message: "Token refresh failed",
            error: []
          };
        }
      }

      // If we have all required tokens
      if (accessToken != null && refreshToken != null && expiresAt != null && expiresIn != null) {
        const expirationTime = parseInt(expiresAt);
        const currentTime = Date.now();
        const bufferTime = 5 * 60 * 1000; // 5 minutes buffer

        // If token is expired or will expire within buffer time
        if (currentTime + bufferTime > expirationTime) {
          const response = await refreshMutation.mutateAsync();
          if ((response.data?.AccessToken) != null) {
            setIsLoggedIn(true);
            return {
              status: 200,
              data: response.data,
              message: "Token refreshed",
              error: []
            };
          }
        }

        // If token is still valid
        if (currentTime < expirationTime) {
          setIsLoggedIn(true);
          return {
            status: 200,
            data: {
              AccessToken: accessToken,
              ExpiresAt: expiresAt,
              ExpiresIn: parseInt(expiresIn, 10),
              IdToken: idToken ?? '',
              RefreshToken: refreshToken,
              githubUsername: githubUsername ?? ''
            },
            message: "Token valid",
            error: []
          };
        }
      }

      // If we get here, we're not logged in

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

  // Track if we just logged in to avoid redundant getUser call
  const justLoggedIn = useRef(false);

  // Session management with automatic token validation
  const { data: session, isPending } = useQuery<MyResponse<AuthResponse>>({
    queryKey: ['auth', 'session'],
    queryFn: async (): Promise<MyResponse<AuthResponse>> => {
      try {
        // First check if we have the necessary tokens before attempting validation
        const accessToken = localStorage.getItem(TokenKeys.AccessToken);
        const refreshToken = localStorage.getItem(TokenKeys.RefreshToken);

        if (!accessToken || !refreshToken) {
          throw new Error('Missing required tokens');
        }

        const isValid = await validateAndRefreshToken();
        if (isValid.status != 200) {
          // NOTE: Don't do stuff like this.
          // clearTokens(); // Ensure tokens are cleared on validation failure
          throw new Error('Token validation failed');
        }

        // Skip getUser if we just logged in
        if (justLoggedIn.current) {
          justLoggedIn.current = false;
          return {
            status: 200,
            data: {
              AccessToken: localStorage.getItem(TokenKeys.AccessToken) ?? '',
              RefreshToken: localStorage.getItem(TokenKeys.RefreshToken) ?? '',
              IdToken: localStorage.getItem(TokenKeys.IdToken) ?? '',
              ExpiresAt: localStorage.getItem(TokenKeys.ExpiresAt) || '',
              ExpiresIn: parseInt(localStorage.getItem(TokenKeys.ExpiresIn) || '0', 10),
              githubUsername: localStorage.getItem(TokenKeys.GithubUsername) || undefined
            },
            message: 'Login successful',
            error: []
          };
        }

        const currentAccessToken = localStorage.getItem(TokenKeys.AccessToken);
        if (typeof currentAccessToken !== 'string' || currentAccessToken === '') throw new Error('No AccessToken');
        const config = {
          headers: {
            'Authorization': `Bearer ${currentAccessToken}`,
            'Content-Type': 'application/json'
          }
        };

        const response = await axios.get(`${API_URL}${endpoints.api.GetUser}`, config);
        if (response.data != null && typeof response.data === 'object' && 'userId' in response.data) {
          return {
            status: 200,
            data: {
              AccessToken: localStorage.getItem(TokenKeys.AccessToken) ?? '',
              RefreshToken: localStorage.getItem(TokenKeys.RefreshToken) ?? '',
              IdToken: localStorage.getItem(TokenKeys.IdToken) ?? '',
              ExpiresAt: localStorage.getItem(TokenKeys.ExpiresAt) || '',
              ExpiresIn: parseInt(localStorage.getItem(TokenKeys.ExpiresIn) || '0', 10),
              githubUsername: localStorage.getItem(TokenKeys.GithubUsername) || undefined
            },
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
      if (data.data?.ExpiresIn != null && typeof data.data.ExpiresIn === 'number') {
        setExpiresAtLocalStorage(data.data.ExpiresIn);
        setIsLoggedIn(true);
        isLoggedInSignal.value = true;
        localStorage.setItem(TokenKeys.AccessToken, data.data.AccessToken);
        localStorage.setItem(TokenKeys.RefreshToken, data.data.RefreshToken);
        localStorage.setItem(TokenKeys.IdToken, data.data.IdToken);

        if (typeof data.data.githubUsername === 'string') {
          localStorage.setItem(TokenKeys.GithubUsername, data.data.githubUsername);
        }
        setIsInLoginProcess(false);
        justLoggedIn.current = true;
        void queryClient.invalidateQueries({ queryKey: ['auth', 'session'] });
      }
    },
    onError: () => {
      setIsLoggedIn(false);
      setIsInLoginProcess(false);
    },
    onSettled: () => setIsInLoginProcess(false),

  });

  const setExpiresAtLocalStorage = (expiresIn: number) => {
    const expiresAt = Date.now() + expiresIn * 1000;
    if (!isNullOrEmptyString(expiresIn)) localStorage.setItem(TokenKeys.ExpiresIn, expiresIn.toString());
    if (expiresAt != null && !Number.isNaN(expiresAt)) {
      localStorage.setItem(TokenKeys.ExpiresAt, expiresAt.toString());
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

    // Sync when storage changes
    const onStorageChange = (): void => { void syncLoginState() };
    window.addEventListener('storage', onStorageChange);

    return () => {
      window.removeEventListener('storage', onStorageChange);
    };
  }, []);

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
