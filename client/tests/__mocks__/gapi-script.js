// __mocks__/gapi-script.js
// mock version of the gapi client for Jest unit tests

export const gapi = {
    load: jest.fn((_, callback) => {
      callback();   // simulate successfully loading the gapi library
    }),
    client: {
      init: jest.fn(() => Promise.resolve()),   // simulates successfully initializing the api client
      calendar: {
        events: {
          list: jest.fn(),
        },
      },
    },
    auth2: {        //  returns fake sign in and sign out methods
      getAuthInstance: jest.fn(() => ({
        signIn: jest.fn(() => Promise.resolve()),
        signOut: jest.fn(() => Promise.resolve()),
      })),
    },
  };
  