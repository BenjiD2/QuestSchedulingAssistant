// GoogleCalendar.test.js
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import GoogleCalendar from "./GoogleCalendar";
jest.mock("gapi-script");

// Mock the gapi object using jest
jest.mock("gapi-script", () => ({
  gapi: {
    load: jest.fn((lib, callback) => callback()),
    client: {
      init: jest.fn(),
      calendar: {
        events: {
          list: jest.fn(),
        },
      },
    },
    auth2: {
      getAuthInstance: jest.fn(),
    },
  },
}));

// Test suite for GoogleCalendar Component
describe("GoogleCalendar Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders sign in button when not signed in", () => {
    render(<GoogleCalendar />);
    const button = screen.getByText("Sign in with Google");
    expect(button).toBeInTheDocument();
  });

  it("calls gapi.load and gapi.client.init on mount", () => {
    render(<GoogleCalendar />);
    expect(gapi.load).toHaveBeenCalledWith("client:auth2", expect.any(Function));
    expect(gapi.client.init).toHaveBeenCalled();
  });

  it("signs in and fetches events when clicking sign in button", async () => {
    // Mock signIn and calendar list
    const mockSignIn = jest.fn(() => Promise.resolve());
    const mockList = jest.fn(() => Promise.resolve({
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

    const signInButton = screen.getByText("Sign in with Google");
    fireEvent.click(signInButton);

    // Wait for async updates
    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.getByText("Event 1 (2024-04-28T10:00:00Z)")).toBeInTheDocument();
      expect(screen.getByText("Event 2 (2024-04-29)")).toBeInTheDocument();
    });
  });

  it("signs out and clears events when clicking sign out button", async () => {
    const mockSignIn = jest.fn(() => Promise.resolve());
    const mockSignOut = jest.fn(() => Promise.resolve());
    const mockList = jest.fn(() => Promise.resolve({
      result: { items: [{ id: "1", summary: "Test Event", start: { date: "2024-04-30" } }] },
    }));

    gapi.auth2.getAuthInstance.mockReturnValue({ signIn: mockSignIn, signOut: mockSignOut });
    gapi.client.calendar.events.list = mockList;

    render(<GoogleCalendar />);

    // Sign in first
    fireEvent.click(screen.getByText("Sign in with Google"));
    await waitFor(() => {
      expect(screen.getByText("Test Event (2024-04-30)")).toBeInTheDocument();
    });

    // Now sign out
    fireEvent.click(screen.getByText("Sign out"));

    // Verify sign out was called and 
    // the event is not displayed and sign-in button is back
    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalled();
      expect(screen.queryByText("Test Event (2024-04-30)")).not.toBeInTheDocument();
      expect(screen.getByText("Sign in with Google")).toBeInTheDocument();
    });
  });
});
