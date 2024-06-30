import { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

const config = {
headers: {
  "Content-Type": "application/json",
  }
}
export const useAuth = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

  useEffect(() => {
    // Optionally check session validity on hook mount

  }, []);

  const checkSession = async () => {
    try {
      // This could be a call to a `/session` endpoint that verifies the session
      await axios.get(`${API_URL}/session`, config);
      setIsLoggedIn(true);
    } catch (error) {
      console.error('Session check failed:', error);
      setIsLoggedIn(false);
    }
  };

  const signUp = async (username: string, password: string, email: string) => {
    try {
      await axios.post(`${API_URL}/signup`, { username, password, email }, config);
      // Handle post-signup logic (e.g., auto-login or redirect to login page)
    } catch (error) {
      console.error('Signup failed:', error);
      throw error;
    }
  };

  const getCurrentUser = async () => {
    try {
      const response = await axios.get(`${API_URL}/currentUser`, config);
      return response.data; // Contains username, attributes, etc.
    } catch (error) {
      console.error('Error fetching current user:', error);
      return null;
    }
  };
  const login = async (username: string, password: string) => {
    try {
      const response = await axios.post(`${API_URL}/login`, { username, password });
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
      await axios.get(`${API_URL}/logout`);
      setIsLoggedIn(false);
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    }
  };

  const refreshSession = async () => {
    try {
      // This endpoint should refresh the session and set a new HttpOnly cookie
      await axios.post(`${API_URL}/refresh-session`);
      setIsLoggedIn(true);
    } catch (error) {
      console.error('Session refresh failed:', error);
      setIsLoggedIn(false);
      throw error;
    }
  };

  const changePassword = async (oldPassword: string, newPassword: string) => {
    try {
      await axios.post(`${API_URL}/change-password`, { oldPassword, newPassword });
    } catch (error) {
      console.error('Password change failed:', error);
      throw error;
    }
  };

  return { isLoggedIn, login, logout, signUp, refreshSession, getCurrentUser, checkSession, changePassword };
};