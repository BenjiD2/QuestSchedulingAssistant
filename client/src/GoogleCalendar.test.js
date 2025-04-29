
/**
 * Unit tests for the GoogleCalendar component.
 * It checks that the "Sign in with Google" button shows up when the user is not signed in, and 
 * ensures that the Google API client (gapi) is initialized when the google calendar component is rendered. 
 * We test that signing in makes us fetch the user's calendar events and displays upcoming events. 
 * We also make sure that signing out clears the events being displayed and restores the sign in button so 
 * that the user can authenticate again. 
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import GoogleCalendar from "./GoogleCalendar";
import { gapi } from "gapi-script"; 

describe("GoogleCalendar Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // tests if the sign in button renders when the user is not signed in
  it("renders sign in button when not signed in", () => {
    render(<GoogleCalendar />);
    expect(screen.getByText(/sign in with google/i)).toBeInTheDocument();
  });

  // tests if gapi.load is called on we render the google calendar component and gapi.client.init is then called
  it("calls gapi.load and gapi.client.init", async () => {
    render(<GoogleCalendar />);
    expect(gapi.load).toHaveBeenCalledWith("client:auth2", expect.any(Function));
  
    await waitFor(() => {
      expect(gapi.client.init).toHaveBeenCalled();
    });
  });

  // tests if we actually sign in and then fetch events after clicking the sign in button
  it("signs in and fetches events when clicking sign in button", async () => {
    const mockSignIn = jest.fn(() => Promise.resolve());
    const mockList = jest.fn(() => Promise.resolve({  // retrieve mock items
      result: {
        items: [
          { id: "1", summary: "Event 1", start: { dateTime: "2024-04-28T10:00:00Z" } },
          { id: "2", summary: "Event 2", start: { date: "2024-04-29" } },
        ],
      },
    }));

    // Set up mock authentication instance
    gapi.auth2.getAuthInstance.mockReturnValue({ signIn: mockSignIn, signOut: jest.fn() });
    // Set up mock calendar list
    gapi.client.calendar.events.list = mockList;

    render(<GoogleCalendar />);

    // render the google calendar
    fireEvent.click(screen.getByText(/sign in with google/i));
    await waitFor(() => expect(mockSignIn).toHaveBeenCalled());

    // event should appear after sign in
    expect(await screen.findByText(/Event 1 \(2024-04-28T10:00:00Z\)/)).toBeInTheDocument();
    expect(screen.getByText(/Event 2 \(2024-04-29\)/)).toBeInTheDocument();
  });


  // tests signing out and removing all the displayed events of the user's calendar
  it("signs out and clears events when clicking sign out button", async () => {
    const mockSignIn = jest.fn(() => Promise.resolve()); // sign in and sign out mocks
    const mockSignOut = jest.fn(() => Promise.resolve());

    // mock the calendar events list to return a single test event
    const mockList = jest.fn(() => Promise.resolve({
      result: {
        items: [{ id: "1", summary: "Test Event", start: { date: "2024-04-30" } }],
      },
    }));

    gapi.auth2.getAuthInstance.mockReturnValue({ signIn: mockSignIn, signOut: mockSignOut });
    gapi.client.calendar.events.list = mockList;

    render(<GoogleCalendar />);

    fireEvent.click(screen.getByText(/sign in with google/i));
    await waitFor(() => expect(screen.getByText(/Test Event \(2024-04-30\)/)).toBeInTheDocument());

    fireEvent.click(screen.getByText(/sign out/i));
    // Verify sign out was called and 
    // the event is not displayed and sign-in button is back
    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalled();
      expect(screen.queryByText(/Test Event \(2024-04-30\)/)).not.toBeInTheDocument();
      expect(screen.getByText(/sign in with google/i)).toBeInTheDocument(); // sign-in button should be back
    });
  });
});
