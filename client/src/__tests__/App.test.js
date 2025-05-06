import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../App';
// jest.mock('gapi-script');

// Mock Auth0
jest.mock('@auth0/auth0-react', () => ({
  useAuth0: () => ({
    isAuthenticated: true,
    isLoading: false,
    user: { name: 'Test User' }
  })
}));

test('renders dashboard header when authenticated', () => {
  render(<App />);
  const headerElement = screen.getByText(/dashboard/i);
  expect(headerElement).toBeInTheDocument();
});

test('renders authenticated content', () => {
  render(<App />);
  // Since we're authenticated, we should see the HomePageUI
  // Let's check for something that would be in the HomePageUI
  const mainContent = screen.getByRole('main');
  expect(mainContent).toBeInTheDocument();
});
