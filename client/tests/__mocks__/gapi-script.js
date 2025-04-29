// __mocks__/gapi-script.js
export const gapi = {
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
      getAuthInstance: jest.fn(() => ({
        signIn: jest.fn(),
        signOut: jest.fn(),
      })),
    },
  };
  