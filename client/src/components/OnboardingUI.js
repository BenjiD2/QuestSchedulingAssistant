import React, { useEffect } from 'react';
import { useAuth0 } from "@auth0/auth0-react";

/**
 * OnboardingUI Component
 * Simply redirects to Auth0 Universal Login 
 */
export const OnboardingUI = () => {
  const { isAuthenticated, loginWithRedirect } = useAuth0();
  
  // Auto-login when component loads
  useEffect(() => {
    if (!isAuthenticated) {
      // Redirect to Auth0 Universal Login
      loginWithRedirect();
    }
  }, [isAuthenticated, loginWithRedirect]);
  
  // Show loading spinner while redirecting
  return (
    <div style={{
      minHeight: '100vh',
      background: 'white',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
    }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center'
      }}>
        <div style={{ 
          width: '60px', 
          height: '60px', 
          borderRadius: '12px', 
          background: '#4254A6', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          fontSize: '32px',
          marginBottom: '24px'
        }}>
          🏆
        </div>
        
        <h1 style={{
          fontSize: '28px',
          fontWeight: '700',
          color: '#2a2f45',
          marginBottom: '16px'
        }}>
          QuestChampion
        </h1>
        
        <p style={{
          fontSize: '16px',
          color: '#6b7084',
          marginBottom: '32px'
        }}>
          Redirecting to login...
        </p>
        
        <div style={{ 
          width: '40px', 
          height: '40px', 
          borderRadius: '50%', 
          border: '4px solid #f3f3f3', 
          borderTop: '4px solid #4254A6',
          animation: 'spin 1s linear infinite'
        }}></div>
        
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
}; 