// Main application component.
// Handles routing based on user authentication status.

import React, { useEffect, useState } from 'react';
import './App.css';
import { HomePageUI } from './components/HomePageUI';
import { OnboardingUI } from './components/OnboardingUI';
import { useAuth0 } from '@auth0/auth0-react';

function App() {
  const { isAuthenticated, isLoading, user, getAccessTokenSilently } = useAuth0();
  const [syncedUser, setSyncedUser] = useState(null);
  
  // useEffect to sync user with backend upon authentication
  useEffect(() => {
    const syncUserWithBackend = async () => {
      if (isAuthenticated && user) {
        // Clear previous synced user on new login/user change to ensure fresh data
        setSyncedUser(null); 
        console.log('🔑 User authenticated, attempting to sync with backend...', user);
        try {
          // Optionally, get an access token if your backend /sync endpoint is protected
          // const token = await getAccessTokenSilently(); 
          // headers: { Authorization: `Bearer ${token}` },

          const response = await fetch('http://localhost:8080/api/users/sync', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(user), // Send the whole Auth0 user object
          });

          if (!response.ok) {
            const errorData = await response.json();
            console.error('❌ Backend sync failed:', response.status, errorData);
            throw new Error(errorData.error || 'Failed to sync user with backend');
          }

          const backendUser = await response.json();
          console.log('✅ User synced with backend successfully:', backendUser);
          setSyncedUser(backendUser); // Set the synced user from our backend
          // Optionally, you could update a global state or context with this backendUser
          // For now, HomePageUI will fetch its own data based on user.sub

        } catch (error) {
          console.error('❌ Error during user sync with backend:', error);
          // Potentially set an error state here to inform the user or HomePageUI
        }
      }
    };

    syncUserWithBackend();
  }, [isAuthenticated, user, getAccessTokenSilently]); // Dependencies
  
  if (isLoading || (isAuthenticated && !syncedUser)) {
    // Show loading if Auth0 is loading OR if authenticated but waiting for backend sync
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #e4e7f2 100%)'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '12px',
            background: '#4254A6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px',
            fontSize: '32px'
          }}>
            🏆
          </div>
          <p style={{
            fontSize: '18px',
            color: '#4254A6',
            fontWeight: 'bold'
          }}>
            Loading Quest Data...
          </p>
        </div>
      </div>
    );
  }
  
  // If not authenticated, show onboarding screen
  if (!isAuthenticated) {
    return <OnboardingUI />;
  }
  
  // Pass syncedUser (from MongoDB) to HomePageUI instead of Auth0 user directly for primary data
  // Auth0 user might still be useful for things like raw picture URL if not in our DB
  return (
    <div className="app">
      <main className="app-main">
        <HomePageUI user={syncedUser} auth0Profile={user} />
      </main>
    </div>
  );
}

export default App;

