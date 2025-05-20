// Main application component.
// Handles routing based on user authentication status.

import React from 'react';
import './App.css';
import { HomePageUI } from './components/HomePageUI';
import { OnboardingUI } from './components/OnboardingUI';
import { useAuth0 } from '@auth0/auth0-react';

function App() {
  const { isAuthenticated, isLoading, user } = useAuth0();
  
  if (isLoading) {
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
            Loading...
          </p>
        </div>
      </div>
    );
  }
  
  // If not authenticated, show onboarding screen
  if (!isAuthenticated) {
    return <OnboardingUI />;
  }
  
  // If authenticated, show HomePageUI
  return (
    <div className="app">
      <main className="app-main">
        <HomePageUI user={user} />
      </main>
    </div>
  );
}

export default App;

