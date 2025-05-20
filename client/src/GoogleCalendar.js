// Google Calendar integration component.
// Handles fetching and displaying events from Google Calendar.

import React, { useEffect, useState } from "react";
import { gapi } from "gapi-script";

const CLIENT_ID = "174375671713-4nkbn9ga7v5piqjrokpj454jfinrja9f.apps.googleusercontent.com";
const SCOPES = "https://www.googleapis.com/auth/calendar.readonly";

function GoogleCalendar() {
  const [events, setEvents] = useState([]);
  const [isSignedIn, setIsSignedIn] = useState(false);

  useEffect(() => {
    function start() {
      gapi.client.init({
        clientId: CLIENT_ID,
        discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"],
        scope: SCOPES,
      });
    }

    gapi.load("client:auth2", start);
  }, []);

  const handleAuthClick = () => {
    gapi.auth2.getAuthInstance().signIn().then(() => {
      setIsSignedIn(true);
      listUpcomingEvents();
    });
  };

  const handleSignoutClick = () => {
    gapi.auth2.getAuthInstance().signOut();
    setIsSignedIn(false);
    setEvents([]);
  };

  const listUpcomingEvents = () => {
    gapi.client.calendar.events.list({
      calendarId: "primary", // 'primary' = main calendar
      timeMin: new Date().toISOString(),
      showDeleted: false,
      singleEvents: true,
      maxResults: 10,
      orderBy: "startTime",
    }).then(response => {
      const events = response.result.items;
      setEvents(events);
    });
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Google Calendar Events</h1>
      {!isSignedIn ? (
        <button onClick={handleAuthClick}>Sign in with Google</button>
      ) : (
        <button onClick={handleSignoutClick}>Sign out</button>
      )}
      <ul>
        {events.map((event) => (
          <li key={event.id}>
            {event.summary} ({event.start.dateTime || event.start.date})
          </li>
        ))}
      </ul>
    </div>
  );
}

export default GoogleCalendar;