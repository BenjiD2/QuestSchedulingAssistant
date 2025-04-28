/**
 * Unit Tests for OnboardingUI and HomePageUI Components
 * Tests unauthenticated and authenticated flows for OnboardingUI using Auth mock,
 * and verifies rendering of tasks and greeting in HomePageUI.
 */

const React = require('react');
const { render, screen, fireEvent } = require('@testing-library/react');
const { OnboardingUI } = require('../components/OnboardingUI');
const { HomePageUI } = require('../components/HomePageUI');
const { Auth } = require('../Auth/Auth');

// Mock Auth class to control authentication state
jest.mock('../Auth/Auth');

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

    test('renders welcome message', () => {
      render(React.createElement(OnboardingUI, { auth: new Auth() }));
      expect(screen.getByText(/welcome to questchampion/i)).toBeInTheDocument();
    });

    test('shows Register and Login buttons', () => {
      render(React.createElement(OnboardingUI, { auth: new Auth() }));
      expect(screen.getByRole('button', { name: /register/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
    });

    test('calls register() when Register button clicked', () => {
      render(React.createElement(OnboardingUI, { auth: new Auth() }));
      fireEvent.click(screen.getByRole('button', { name: /register/i }));
      expect(mockAuth.register).toHaveBeenCalledTimes(1);
    });

    test('calls login() when Login button clicked', () => {
      render(React.createElement(OnboardingUI, { auth: new Auth() }));
      fireEvent.click(screen.getByRole('button', { name: /login/i }));
      expect(mockAuth.login).toHaveBeenCalledTimes(1);
    });
  });

  describe('Authenticated user', () => {
    beforeEach(() => {
      mockAuth.isAuthenticated.mockReturnValue(true);
      mockAuth.getUser.mockReturnValue(sampleUser);
    });

    test('hides Register and Login buttons', () => {
      render(React.createElement(OnboardingUI, { auth: new Auth() }));
      expect(screen.queryByRole('button', { name: /register/i })).toBeNull();
      expect(screen.queryByRole('button', { name: /login/i })).toBeNull();
    });

    test('displays greeting with user name', () => {
      render(React.createElement(OnboardingUI, { auth: new Auth() }));
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
    render(React.createElement(HomePageUI, { user: mockUser, tasks: mockTasks }));
    expect(screen.getByText(/hello, alice/i)).toBeInTheDocument();
  });

  test('renders correct number of tasks', () => {
    render(React.createElement(HomePageUI, { user: mockUser, tasks: mockTasks }));
    expect(screen.getAllByRole('listitem')).toHaveLength(mockTasks.length);
  });

  test('shows task titles and descriptions', () => {
    render(React.createElement(HomePageUI, { user: mockUser, tasks: mockTasks }));
    mockTasks.forEach((t) => {
      expect(screen.getByText(new RegExp(t.title, 'i'))).toBeInTheDocument();
      expect(screen.getByText(new RegExp(t.description, 'i'))).toBeInTheDocument();
    });
  });
});
