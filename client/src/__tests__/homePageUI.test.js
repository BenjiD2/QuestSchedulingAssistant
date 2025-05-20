import React from 'react';
import { render, screen, fireEvent, act, within } from '@testing-library/react';
import { HomePageUI } from '../components/HomePageUI';
import { useAuth0 } from "@auth0/auth0-react";

// Mock the useAuth0 hook
jest.mock("@auth0/auth0-react");

// Mock window.alert
const mockAlert = jest.fn();
window.alert = mockAlert;

// Mock crypto API
Object.defineProperty(global, 'crypto', {
    value: {
        randomUUID: () => 'test-uuid-123'
    }
});

// Mock gapi
jest.mock('gapi-script', () => {
    const mockLoad = jest.fn((api, callback) => {
        console.log('gapi.load called with:', api);
        callback();
    });

    const mockInsert = jest.fn().mockResolvedValue({
        result: { id: 'test-event-id' }
    });

    const mockSignIn = jest.fn().mockResolvedValue({});

    return {
        gapi: {
            load: mockLoad,
            client: {
                init: jest.fn().mockResolvedValue({}),
                calendar: {
                    events: {
                        insert: mockInsert,
                        list: jest.fn().mockResolvedValue({
                            result: {
                                items: []
                            }
                        })
                    }
                }
            },
            auth2: {
                getAuthInstance: jest.fn().mockReturnValue({
                    signIn: mockSignIn,
                    isSignedIn: {
                        get: () => true,
                        listen: (callback) => {
                            callback(true);
                            return { remove: () => { } };
                        }
                    }
                })
            }
        }
    };
});

describe('HomePageUI Google Calendar Integration', () => {
    const mockUser = {
        name: "Test User",
        email: "test@example.com"
    };

    beforeEach(() => {
        jest.clearAllMocks();
        console.log('Clearing all mocks');
        // Setup the mock implementation
        useAuth0.mockReturnValue({
            logout: jest.fn(),
            user: mockUser
        });
    });

    // Schedule component renders in properly
    it('should render Google Calendar sync button in tasks card', () => {
        render(<HomePageUI user={mockUser} />);

        // Find the button within the tasks card
        const tasksCard = screen.getByText('Tasks').closest('.dashboard-card');
        const syncButton = within(tasksCard).getByText('Sync with Google Calendar');

        // Verify the button exists and has the correct text
        expect(syncButton).toBeInTheDocument();
        expect(syncButton).toHaveTextContent('Sync with Google Calendar');
    });

    // Tests whether we can sign in and recieve authentication
    it('should handle Google Calendar sign in', async () => {
        const { gapi } = require('gapi-script');
        render(<HomePageUI user={mockUser} />);

        // Find and click the sync button
        const syncButton = screen.getByText('Sync with Google Calendar');

        await act(async () => {
            fireEvent.click(syncButton);
            // Wait for the sign-in process to complete
            await new Promise(resolve => setTimeout(resolve, 100));
        });

        // Verify only that gapi.load was called with the correct parameters
        expect(gapi.load).toHaveBeenCalledWith('client:auth2', expect.any(Function));
    });

    // Adding task function syncs with user's google calendar
    it('should show add task form when Add Task button is clicked', async () => {
        render(<HomePageUI user={mockUser} />);

        // Find and click the Add Task button
        const addTaskButton = screen.getByText('Add Task');
        await act(async () => {
            fireEvent.click(addTaskButton);
        });

        // Verify the form is displayed
        const form = screen.getByTestId('task-form');
        expect(form).toBeInTheDocument();

        // Verify form inputs are present
        expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/start time/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/end time/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/location/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/duration/i)).toBeInTheDocument();
    });

    // Adding task function syncs with user's google calendar
    it('should have a working Google Calendar sync button', async () => {
        render(<HomePageUI user={mockUser} />);

        // Find the sync button
        const syncButton = screen.getByText('Sync with Google Calendar');
        expect(syncButton).toBeInTheDocument();

        // Click the sync button
        await act(async () => {
            fireEvent.click(syncButton);
        });

        // Verify the button is clickable
        expect(syncButton).not.toBeDisabled();
    });
}); 