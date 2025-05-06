/**
 * Unit Tests for OnboardingUI and HomePageUI Components
 * Tests unauthenticated and authenticated flows for OnboardingUI using Auth mock,
 * and verifies rendering of tasks and greeting in HomePageUI.
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { OnboardingUI } from '../components/OnboardingUI';
import { HomePageUI } from '../components/HomePageUI';
import { Auth } from '../utils/Auth';

// Mock Auth class to control authentication state
jest.mock('../utils/Auth');

// Mock Auth0
jest.mock('@auth0/auth0-react', () => ({
  useAuth0: () => ({
    isAuthenticated: false,
    loginWithRedirect: jest.fn(),
    user: { name: 'Test User' }
  })
}));

const mockAuth = {
  isAuthenticated: jest.fn(),
  login: jest.fn(),
  register: jest.fn(),
  getUser: jest.fn(),
};

Auth.mockImplementation(() => mockAuth);
const sampleUser = { name: 'Bob', email: 'bob@example.com' };

describe('OnboardingUI Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mock implementations
    mockAuth.isAuthenticated.mockReturnValue(false);
    mockAuth.getUser.mockReturnValue(sampleUser);
  });

  describe('Unauthenticated user', () => {
    test('renders welcome message', () => {
      render(<OnboardingUI auth={mockAuth} />);
      expect(screen.getByText(/welcome to questchampion/i)).toBeInTheDocument();
    });

    test('shows Register and Login buttons', () => {
      render(<OnboardingUI auth={mockAuth} />);
      expect(screen.getByRole('button', { name: /register/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
    });

    test('calls register() when Register button clicked', () => {
      render(<OnboardingUI auth={mockAuth} />);
      const registerButton = screen.getByRole('button', { name: /register/i });
      fireEvent.click(registerButton);
      expect(mockAuth.register).toHaveBeenCalledTimes(1);
    });

    test('calls login() when Login button clicked', () => {
      render(<OnboardingUI auth={mockAuth} />);
      const loginButton = screen.getByRole('button', { name: /login/i });
      fireEvent.click(loginButton);
      expect(mockAuth.login).toHaveBeenCalledTimes(1);
    });
  });

  describe('Authenticated user', () => {
    beforeEach(() => {
      mockAuth.isAuthenticated.mockReturnValue(true);
    });

    test('hides Register and Login buttons', () => {
      render(<OnboardingUI auth={mockAuth} />);
      expect(screen.queryByRole('button', { name: /register/i })).toBeNull();
      expect(screen.queryByRole('button', { name: /login/i })).toBeNull();
    });

    test('displays greeting with user name', () => {
      render(<OnboardingUI auth={mockAuth} />);
      expect(
        screen.getByText(new RegExp(`hello, ${sampleUser.name}`, 'i'))
      ).toBeInTheDocument();
    });
  });
});

describe('HomePageUI Component', () => {
  const mockTasks = [
    {
      taskId: '1',
      title: 'Task 1',
      description: 'First task',
      startTime: new Date('2025-05-01T08:00:00'),
      endTime: new Date('2025-05-01T09:00:00'),
      recurrence: 'None',
      location: 'Office',
      googleEventId: '',
      update: jest.fn(),
    },
    {
      taskId: '2',
      title: 'Task 2',
      description: 'Second task',
      startTime: new Date('2025-05-02T10:00:00'),
      endTime: new Date('2025-05-02T11:00:00'),
      recurrence: 'Daily',
      location: 'Home',
      googleEventId: '',
      update: jest.fn(),
    },
  ];
  const mockUser = { userId: 'u1', name: 'Alice', email: 'alice@example.com' };

  test('displays greeting with user name', () => {
    render(<HomePageUI user={mockUser} tasks={mockTasks} />);
    expect(screen.getByText(/hello, alice/i)).toBeInTheDocument();
  });

  test('renders correct number of tasks', () => {
    render(<HomePageUI user={mockUser} tasks={mockTasks} />);
    expect(screen.getAllByRole('listitem')).toHaveLength(mockTasks.length);
  });

  test('shows task titles and descriptions', () => {
    render(<HomePageUI user={mockUser} tasks={mockTasks} />);
    mockTasks.forEach((t) => {
      expect(screen.getByText(new RegExp(t.title, 'i'))).toBeInTheDocument();
      expect(screen.getByText(new RegExp(t.description, 'i'))).toBeInTheDocument();
    });
  });
}); 