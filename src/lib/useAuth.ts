// src/lib/useAuth.ts

import { useState, useEffect } from 'react';
import axios from 'axios';
import { ENDPOINTS } from '../../shared/endpoints';

const API_URL = import.meta.env.VITE_API_URL;

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

  const getUser = async () => {
    try {
      debugger;
      const response = await axios.get(`${API_URL}${ENDPOINTS.api.GetUser}`, config);
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

  const refreshSession = async () => {
    try {
      // This endpoint should refresh the session and set a new HttpOnly cookie
      await axios.post(`${API_URL}${ENDPOINTS.api.RefreshSession}`);
      setIsLoggedIn(true);
    } catch (error) {
      console.error('Session refresh failed:', error);
      setIsLoggedIn(false);
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

  return { isLoggedIn, login: signIn, logout: signOut, signUp, refreshSession, getUser, checkSession, changePassword };
};