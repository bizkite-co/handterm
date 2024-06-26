// src/lib/useAuth.ts

import { useState } from 'react';
import { CognitoUserPool, AuthenticationDetails, CognitoUser, CognitoUserAttribute, CognitoRefreshToken } from 'amazon-cognito-identity-js';

const poolData = {
  UserPoolId: 'us-east-1_apGvoR62E',
  ClientId: '776i4gt2nij7ce30m9jlo9fcq0'
};

const userPool = new CognitoUserPool(poolData);

export const useAuth = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const signUp = (username: string, password: string, email: string, callback: (error: any, result: any) => void) => {
    const attributeList = [
      new CognitoUserAttribute({
        Name: 'email',
        Value: email
      }),
      // Add other attributes here
    ];

    userPool.signUp(username, password, attributeList, attributeList, (err, result) => {
      if (err) {
        console.error(err);
        callback(err, null);
        return;
      }
      console.log('Sign up successful!', result);
      callback(null, result);
    });
  };

  const changePassword = (oldPassword: string, newPassword: string, callback: (error: any, result: any) => void) => {
    const cognitoUser = userPool.getCurrentUser();
    if (cognitoUser) {
      cognitoUser.changePassword(oldPassword, newPassword, (err, result) => {
        if (err) {
          console.error(err);
          callback(err, null);
          return;
        }
        console.log('Password changed successfully!', result);
        callback(null, result);
      });
    } else {
      console.error('User not authenticated!');
      callback('User not authenticated!', null);
    }
  };

  const getCurrentUser = () => {
    const result = userPool.getCurrentUser()?.getUsername();
    return result;
  }


  const login = (username: string, password: string, callback: (error: any, result: any) => void) => {
    const authenticationDetails = new AuthenticationDetails({
      Username: username,
      Password: password,
    });

    const cognitoUser = new CognitoUser({
      Username: username,
      Pool: userPool
    });

    cognitoUser.authenticateUser(authenticationDetails, {
      onSuccess: (session) => {
        console.log('Authentication successful!', session.getIdToken().getJwtToken());
        setIsLoggedIn(true);
        // Store tokens in sessionStorage
        sessionStorage.setItem('idToken', session.getIdToken().getJwtToken());
        sessionStorage.setItem('accessToken', session.getAccessToken().getJwtToken());
        sessionStorage.setItem('refreshToken', session.getRefreshToken().getToken());
        const refreshTokenTimeout = (
          session.getIdToken().getExpiration() 
          - Math.floor(Date.now() / 1000) - 300
        ) * 1000;
        setTimeout(refreshSession, refreshTokenTimeout);
        callback(null, session);
      },
      onFailure: (err) => {
        console.error('Authentication failed!', err);
        setIsLoggedIn(false);
        callback(err, null);
      },
      // Add newPasswordRequired, mfaRequired, etc. as needed
    });
  };

  const refreshSession = () => {
    const currentUser = userPool.getCurrentUser();
    if (currentUser != null) {
      currentUser.getSession((err: any, session: { isValid: () => any; getRefreshToken: () => CognitoRefreshToken; }) => {
        if (err) {
          console.error(err);
          return;
        }
        if (session.isValid()) {
          currentUser.refreshSession(session.getRefreshToken(), (refreshErr, newSession) => {
            if (refreshErr) {
              console.error(refreshErr);
            } else {
              // Update state/session storage with new tokens
              console.log('Session refreshed successfully.', newSession.getIdToken().getJwtToken());
              // Optionally decode new ID token for user data
            }
          });
        }
      });
    }
  };

  const logout = () => {
    if (userPool.getCurrentUser()) {
      userPool.getCurrentUser()?.signOut();
    }
    setIsLoggedIn(false);
  };

  return { isLoggedIn, login, logout, signUp, refreshSession, getCurrentUser, changePassword };
};