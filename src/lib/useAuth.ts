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
        // Decode the ID token to get user data
        const idTokenPayload = session.getIdToken().decodePayload();
        console.log("Username:", idTokenPayload['cognito:username']);
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
              console.log('Session refreshed successfully.');
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

  return { isLoggedIn, login, logout, signUp };
};