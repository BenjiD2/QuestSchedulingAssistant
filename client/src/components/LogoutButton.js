// Component for the logout button.
// Initiates the Auth0 logout process when clicked.

import React from "react";
import { useAuth0 } from "@auth0/auth0-react";

const LogoutButton = () => {
  const { logout } = useAuth0();

  return (
    <button 
      onClick={() => logout({ 
        logoutParams: {
          returnTo: window.location.origin
        }
      })}
      className="logout-button"
      style={{
        backgroundColor: '#f0f2f8',
        color: '#333',
        border: '1px solid #dfe1e8',
        padding: '8px 18px',
        borderRadius: '6px',
        fontSize: '14px',
        fontWeight: '500',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s ease',
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = '#e4e7f2';
        e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = '#f0f2f8';
        e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)';
      }}
    >
      <span style={{ marginRight: '6px' }}>🚪</span>
      Log Out
    </button>
  );
};

export default LogoutButton; 