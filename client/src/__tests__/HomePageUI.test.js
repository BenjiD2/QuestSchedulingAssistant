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

    it('should render Google Calendar sync button in tasks card', () => {
        render(<HomePageUI user={mockUser} />);

        // Find the button within the tasks card
        const tasksCard = screen.getByText('Tasks').closest('.dashboard-card');
        const syncButton = within(tasksCard).getByText('Sync with Google Calendar');

        // Verify the button exists and has the correct text
        expect(syncButton).toBeInTheDocument();
        expect(syncButton).toHaveTextContent('Sync with Google Calendar');
    });

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

    it('should add task to Google Calendar', async () => {
        const { gapi } = require('gapi-script');
        console.log('Starting add task test');

        // Render the component with initial state
        const { rerender } = render(<HomePageUI user={mockUser} />);
        console.log('Component rendered');

        // First sign in to Google Calendar
        const syncButton = screen.getByText('Sync with Google Calendar');
        console.log('Found sync button, clicking...');

        // Click the sync button and wait for all promises to resolve
        await act(async () => {
            fireEvent.click(syncButton);
            // Wait for gapi.load callback
            await new Promise(resolve => setTimeout(resolve, 50));
            // Wait for gapi.client.init
            await new Promise(resolve => setTimeout(resolve, 50));
            // Wait for sign in
            await new Promise(resolve => setTimeout(resolve, 50));
            // Wait for calendar events list
            await new Promise(resolve => setTimeout(resolve, 50));
        });
        console.log('Sync button clicked and all promises resolved');

        // Force a re-render to ensure isSignedIn is updated
        rerender(<HomePageUI user={mockUser} />);
        console.log('Component re-rendered after sign in');

        // Now add a task
        const addTaskButton = screen.getByText('Add Task');
        console.log('Found add task button, clicking...');
        await act(async () => {
            fireEvent.click(addTaskButton);
        });
        console.log('Add task button clicked');

        const testTask = {
            title: "Test Task",
            description: "Test Description",
            startTime: "2024-03-20T10:00",
            endTime: "2024-03-20T11:00",
            location: "Test Location",
            duration: 60
        };

        // Fill in the task form
        console.log('Looking for form inputs...');
        const titleInput = screen.getByLabelText(/title/i);
        const descriptionInput = screen.getByLabelText(/description/i);
        const startTimeInput = screen.getByLabelText(/start time/i);
        const endTimeInput = screen.getByLabelText(/end time/i);
        const locationInput = screen.getByLabelText(/location/i);
        const durationInput = screen.getByLabelText(/duration/i);
        console.log('Found all form inputs');

        await act(async () => {
            fireEvent.input(titleInput, { target: { value: testTask.title } });
            fireEvent.input(descriptionInput, { target: { value: testTask.description } });
            fireEvent.input(startTimeInput, { target: { value: testTask.startTime } });
            fireEvent.input(endTimeInput, { target: { value: testTask.endTime } });
            fireEvent.input(locationInput, { target: { value: testTask.location } });
            fireEvent.input(durationInput, { target: { value: testTask.duration.toString() } });
        });
        console.log('Filled in all form inputs');

        // Submit the form
        const form = screen.getByTestId('task-form');
        console.log('Found form, submitting...');
        await act(async () => {
            fireEvent.submit(form);
            // Wait for the form submission to complete
            await new Promise(resolve => setTimeout(resolve, 100));
        });
        console.log('Form submitted');

        // Log all gapi mock calls
        console.log('gapi.load calls:', gapi.load.mock.calls);
        console.log('gapi.client.calendar.events.insert calls:', gapi.client.calendar.events.insert.mock.calls);

        // Verify the calendar API was called with the correct parameters
        expect(gapi.client.calendar.events.insert).toHaveBeenCalledWith({
            calendarId: "primary",
            resource: {
                summary: testTask.title,
                description: testTask.description,
                location: testTask.location,
                start: {
                    dateTime: testTask.startTime,
                    timeZone: "UTC"
                },
                end: {
                    dateTime: testTask.endTime,
                    timeZone: "UTC"
                }
            }
        });
    });
}); 