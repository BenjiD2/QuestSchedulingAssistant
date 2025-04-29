import '@testing-library/jest-dom';
// sets up a global mock for the gapi-script library to test components that use the Google Calendar API without using the actual API

// mock of the global gapi object used by the Google API client
global.gapi = {
  load: jest.fn((lib, callback) => callback()),

  client: {    // mock the gapi.client object (contains the actual api services)
    init: jest.fn(() => Promise.resolve()),   // returning that we successfully set up without actually using the API

    calendar: {   // mock the list of calendar events provided by the real api 
      events: {
        list: jest.fn(() => Promise.resolve({
          result: {
            items: [], // returns an empty list of calendar events
          },
        })),
      },
    },
  },

  // dummy signIn and signOut methods
  auth2: {
    getAuthInstance: jest.fn(() => ({
      signIn: jest.fn(() => Promise.resolve()),
      signOut: jest.fn(() => Promise.resolve()),
      isSignedIn: {
        get: jest.fn(() => false),
      },
    })),
  },
};

// replace the "gapi-script" module with our gapi mock for testing reasons 
jest.mock('gapi-script', () => ({
  gapi: global.gapi,
}));
