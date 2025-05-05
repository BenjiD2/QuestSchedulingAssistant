import React, { useEffect } from 'react';

/**
 * Callback component that handles the Auth0 authentication redirect
 * @param {Object} props - Component props
 * @param {Object} props.auth - Auth instance
 * @param {Function} props.onSuccess - Function to call on successful authentication
 */
export const Callback = ({ auth, onSuccess }) => {
  useEffect(() => {
    // Skip auth handling in dev mode and redirect immediately
    if (auth.devMode) {
      if (onSuccess) {
        onSuccess();
      } else {
        window.location.href = '/';
      }
      return;
    }
    
    // Process the authentication if we're in the callback page
    if (/access_token|id_token|error/.test(window.location.hash)) {
      auth.handleAuthentication()
        .then(() => {
          if (onSuccess) {
            onSuccess();
          } else {
            // Ensure we redirect to the root to load the Dashboard
            window.location.href = '/';
          }
        })
        .catch(err => {
          console.error('Error during authentication', err);
          window.location.href = '/';
        });
    } else {
      // If no auth tokens in URL, redirect to home
      window.location.href = '/';
    }
  }, [auth, onSuccess]);

  return (
    <div className="callback-container">
      <h1>Logging you in...</h1>
      <p>Please wait while we complete the authentication process.</p>
    </div>
  );
}; 