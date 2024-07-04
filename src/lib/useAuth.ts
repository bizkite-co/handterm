// src/lib/useAuth.ts

import { useState, useEffect } from 'react';
import axios from 'axios';
import { ENDPOINTS } from '../shared/endpoints';

const API_URL = ENDPOINTS.api.BaseUrl;

const config = {
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Correctly positioned and boolean value
};

export const useAuth = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

  useEffect(() => {
    // Optionally check session validity on hook mount

  }, []);

  const checkSession = async () => {
    try {
      // This could be a call to a `/session` endpoint that verifies the session
      await axios.get(`${API_URL}${ENDPOINTS.api.CheckSession}`, config);
      setIsLoggedIn(true);
    } catch (error) {
      console.error('Session check failed:', error);
      setIsLoggedIn(false);
    }
  };

  const signUp = async (username: string, password: string, email: string) => {
    if (!username || !password || !email) {
      throw new Error('All fields are required');
    }
    try {
      await axios.post(`${API_URL}${ENDPOINTS.api.SignUp}`, { username, password, email }, config);
      // Handle post-signup logic (e.g., auto-login or redirect to login page)
    } catch (error) {
      console.error('Signup failed:', error);
      throw error;
    }
  };
  const refreshTokenIfNeeded = async () => {
    const accessToken = localStorage.getItem('AccessToken');
    const refreshToken = localStorage.getItem('RefreshToken');
    const expiresAt = localStorage.getItem('ExpiresAt');

    if (!expiresAt || !refreshToken) {
      console.error('No refresh token or expiry time found');
      setIsLoggedIn(false);
      return false; // Indicate that the session could not be refreshed
    }

    const isTokenExpired = new Date().getTime() > parseInt(expiresAt);
    if (!accessToken || isTokenExpired) {
      try {
        const response = await axios.post(`${API_URL}${ENDPOINTS.api.RefreshToken}`, { refreshToken }, config);
        // Assuming the response contains the new access token and its expiry time
        localStorage.setItem('AccessToken', response.data.AccessToken);
        localStorage.setItem('ExpiresAt', (new Date().getTime() + response.data.ExpiresIn * 1000).toString(10));
        console.log('Token refreshed successfully');
        return true; // Indicate that the session was successfully refreshed
      } catch (error) {
        console.error('Token refresh failed:', error);
        setIsLoggedIn(false);
        return false; // Indicate that the session could not be refreshed
      }
    }
    return true; // Token is valid and not expired
  };

  const getAuthConfig = async () => {
    // Ensure refreshTokenIfNeeded is awaited to complete the refresh before proceeding
    await refreshTokenIfNeeded();

    const accessToken = localStorage.getItem('AccessToken');
    if (!accessToken) {
      throw new Error('No access token found');
    }
    // Include the Access Token in the Authorization header
    return {
      ...config, // Spread the existing config to keep content-type
      headers: {
        ...config.headers, // Spread any existing headers
        'Authorization': `Bearer ${accessToken}`, // Add the Authorization header with the Access Token
      }
    };
  };

  const setUser = async (profile: string) => {
    // Set the user profile string for the current logged in user
    try {
      const authConfig = await getAuthConfig();
      await axios.post(`${API_URL}${ENDPOINTS.api.SetUser}`, { profile }, authConfig);
    } catch (error) {
      console.error('Error setting user profile:', error);
    }
  }

  const saveLog = async (key: string, content: string) => {
    try {
      const keyContentBodyJson = JSON.stringify({ key, content });
      const authConfig = await getAuthConfig();
      await axios.post(`${API_URL}${ENDPOINTS.api.SaveLog}`, {body: keyContentBodyJson }, authConfig);
      return true;
    } catch (error) {
      console.error('Error saving log:', error);
      return false;
    }
  }

  const getLog = async (key: string) => {
    try {
      const authConfig = await getAuthConfig();
      const response = await axios.get(`${API_URL}${ENDPOINTS.api.GetLog}/${key}`, authConfig);
      return response.data;
    } catch (error) {
      console.error('Error fetching log:', error);
      return null;
    }
  }

  const listLog = async (limit: number) => {
    try {
      const authConfig = await getAuthConfig();
      const response = await axios.get(`${API_URL}${ENDPOINTS.api.ListLog}`, authConfig);
      return response.data;
    } catch (error) {
      console.error('Error fetching log:', error);
      return null;
    }
  }

  const getUser = async () => {
    try {
      // Make the request with the Access Token
      const authConfig = await getAuthConfig();
      const response = await axios.get(`${API_URL}${ENDPOINTS.api.GetUser}`, authConfig);
      return response.data; // Contains username, attributes, etc.
    } catch (error) {
      console.error('Error fetching current user:', error);
      return null;
    }
  };

  const signIn = async (username: string, password: string) => {
    if (!username || !password) {
      throw new Error('All fields are required');
    }
    try {
      const response = await axios.post(`${API_URL}${ENDPOINTS.api.SignIn}`, { username, password });
      // The API should set an HttpOnly cookie directly, no need to handle tokens here
      console.log('Login successful:', response.data);
      setIsLoggedIn(true);
      localStorage.setItem('AccessToken', response.data.AccessToken);
      localStorage.setItem('RefreshToken', response.data.RefreshToken);
      localStorage.setItem('IdToken', response.data.IdToken);
      localStorage.setItem('SignedInAs', username);
      localStorage.setItem(
        'ExpiresAt',
        (new Date().getTime() + response.data.ExpiresIn * 1000).toString(10)
      );
      return response.data; // Return session data if needed
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await axios.get(`${API_URL}${ENDPOINTS.api.SignOut}`);
      setIsLoggedIn(false);
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    }
  };

  const changePassword = async (oldPassword: string, newPassword: string) => {
    try {
      await axios.post(`${API_URL}${ENDPOINTS.api.ChangePassword}`, { oldPassword, newPassword });
    } catch (error) {
      console.error('Password change failed:', error);
      throw error;
    }
  };

  return { isLoggedIn, login: signIn, logout: signOut, signUp, getUser, checkSession, changePassword, setUser, saveLog, getLog, listLog };
};