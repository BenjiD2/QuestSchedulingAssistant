
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import GoogleCalendar from "./GoogleCalendar";
import { gapi } from "gapi-script"; // Safe to import after mocking above

describe("GoogleCalendar Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders sign in button when not signed in", () => {
    render(<GoogleCalendar />);
    expect(screen.getByText(/sign in with google/i)).toBeInTheDocument();
  });

  it("calls gapi.load and gapi.client.init on mount", async () => {
    render(<GoogleCalendar />);
  
    // 1. Check that gapi.load was called correctly
    expect(gapi.load).toHaveBeenCalledWith("client:auth2", expect.any(Function));
  
    // 2. Explicitly wait for gapi.client.init to be called
    await waitFor(() => {
      expect(gapi.client.init).toHaveBeenCalled();
    });
  });

  it("signs in and fetches events when clicking sign in button", async () => {
    const mockSignIn = jest.fn(() => Promise.resolve());
    const mockList = jest.fn(() => Promise.resolve({
      result: {
        items: [
          { id: "1", summary: "Event 1", start: { dateTime: "2024-04-28T10:00:00Z" } },
          { id: "2", summary: "Event 2", start: { date: "2024-04-29" } },
        ],
      },
    }));

    gapi.auth2.getAuthInstance.mockReturnValue({ signIn: mockSignIn, signOut: jest.fn() });
    gapi.client.calendar.events.list = mockList;

    render(<GoogleCalendar />);

    fireEvent.click(screen.getByText(/sign in with google/i));

    await waitFor(() => expect(mockSignIn).toHaveBeenCalled());

    expect(await screen.findByText(/Event 1 \(2024-04-28T10:00:00Z\)/)).toBeInTheDocument();
    expect(screen.getByText(/Event 2 \(2024-04-29\)/)).toBeInTheDocument();
  });

  it("signs out and clears events when clicking sign out button", async () => {
    const mockSignIn = jest.fn(() => Promise.resolve());
    const mockSignOut = jest.fn(() => Promise.resolve());
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
    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalled();
      expect(screen.queryByText(/Test Event \(2024-04-30\)/)).not.toBeInTheDocument();
      expect(screen.getByText(/sign in with google/i)).toBeInTheDocument();
    });
  });
});
