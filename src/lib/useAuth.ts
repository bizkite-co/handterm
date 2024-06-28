import { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = 'https://your-api-gateway-url';

export const useAuth = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

  useEffect(() => {
    // Optionally check session validity on hook mount
    const checkSession = async () => {
      try {
        // This could be a call to a `/session` endpoint that verifies the session
        await axios.get(`${API_BASE_URL}/session`);
        setIsLoggedIn(true);
      } catch (error) {
        console.error('Session check failed:', error);
        setIsLoggedIn(false);
      }
    };

    checkSession();
  }, []);

  const signUp = async (username: string, password: string, email: string) => {
    try {
      await axios.post(`${API_BASE_URL}/signup`, { username, password, email });
      // Handle post-signup logic (e.g., auto-login or redirect to login page)
    } catch (error) {
      console.error('Signup failed:', error);
      throw error;
    }
  };

  const getCurrentUser = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/currentUser`);
      return response.data; // Contains username, attributes, etc.
    } catch (error) {
      console.error('Error fetching current user:', error);
      return null;
    }
  };
  const login = async (username: string, password: string) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/login`, { username, password });
      // The API should set an HttpOnly cookie directly, no need to handle tokens here
      setIsLoggedIn(true);
      return response.data; // Return session data if needed
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await axios.get(`${API_BASE_URL}/logout`);
      setIsLoggedIn(false);
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    }
  };

  const refreshSession = async () => {
    try {
      // This endpoint should refresh the session and set a new HttpOnly cookie
      await axios.post(`${API_BASE_URL}/refresh-session`);
      setIsLoggedIn(true);
    } catch (error) {
      console.error('Session refresh failed:', error);
      setIsLoggedIn(false);
      throw error;
    }
  };

  return { isLoggedIn, login, logout, signUp, refreshSession, getCurrentUser };
};