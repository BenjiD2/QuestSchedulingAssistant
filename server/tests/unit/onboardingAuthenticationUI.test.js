/**
 * Unit Tests for OnboardingUI and HomePageUI Components
 * Tests unauthenticated and authenticated flows for OnboardingUI using Auth mock,
 * and verifies rendering of tasks and greeting in HomePageUI.
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { OnboardingUI } from '../../../client/src/components/OnboardingUI';
import { HomePageUI } from '../../../client/src/components/HomePageUI';
import { Auth } from '../../../client/src/utils/Auth';

// Mock Auth class to control authentication state
jest.mock('../../../client/src/utils/Auth');
// mock the Auth0 hook so HomePageUI's `useAuth0()` call won't fail
jest.mock('@auth0/auth0-react', () => ({
  useAuth0: () => ({
    logout: jest.fn(),    // HomePageUI immediately does `const { logout } = useAuth0()`
  }),
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
  });

  describe('Unauthenticated user', () => {
    beforeEach(() => {
      mockAuth.isAuthenticated.mockReturnValue(false);
    });

    // should display the welcome header when user is not authenticated
    test('renders welcome message', () => {
      render(<OnboardingUI auth={new Auth()} />);
      expect(screen.getByText(/welcome to questchampion/i)).toBeInTheDocument();
    });

    // should show both Register and Login buttons for unauthenticated user
    test('shows Register and Login buttons', () => {
      render(<OnboardingUI auth={new Auth()} />);
      expect(screen.getByRole('button', { name: /register/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
    });

    // should call auth.register once when Register button is clicked
    test('calls register() when Register button clicked', () => {
      render(<OnboardingUI auth={new Auth()} />);
      fireEvent.click(screen.getByRole('button', { name: /register/i }));
      expect(mockAuth.register).toHaveBeenCalledTimes(1);
    });

    // should call auth.login once when Login button is clicked
    test('calls login() when Login button clicked', () => {
      render(<OnboardingUI auth={new Auth()} />);
      fireEvent.click(screen.getByRole('button', { name: /login/i }));
      expect(mockAuth.login).toHaveBeenCalledTimes(1);
    });
  });

  describe('Authenticated user', () => {
    beforeEach(() => {
      mockAuth.isAuthenticated.mockReturnValue(true);
      mockAuth.getUser.mockReturnValue(sampleUser);
    });

    // should hide Register and Login buttons when user is authenticated
    test('hides Register and Login buttons', () => {
      render(<OnboardingUI auth={new Auth()} />);
      expect(screen.queryByRole('button', { name: /register/i })).toBeNull();
      expect(screen.queryByRole('button', { name: /login/i })).toBeNull();
    });

    // should greet the authenticated user by name
    test('displays greeting with user name', () => {
      render(<OnboardingUI auth={new Auth()} />);
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

  // should render personalized greeting on the home page
  test('displays greeting with user name', () => {
    render(<HomePageUI user={mockUser} tasks={mockTasks} />);
    expect(screen.getByText(/hello, alice/i)).toBeInTheDocument();
  });

  // should render a list item for each task provided
  test('renders correct number of tasks', () => {
    render(<HomePageUI user={mockUser} tasks={mockTasks} />);
    expect(screen.getAllByRole('listitem')).toHaveLength(mockTasks.length);
  });

  // should display each task's title and description in the list
  test('shows task titles and descriptions', () => {
    render(<HomePageUI user={mockUser} tasks={mockTasks} />);
    mockTasks.forEach((t) => {
      expect(screen.getByText(new RegExp(t.title, 'i'))).toBeInTheDocument();
      expect(screen.getByText(new RegExp(t.description, 'i'))).toBeInTheDocument();
    });
  });
});
