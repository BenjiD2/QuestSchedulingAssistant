export const gapi = {
    load: jest.fn((_, callback) => {
      callback();
    }),
    client: {
      init: jest.fn(() => Promise.resolve()),
      calendar: {
        events: {
          list: jest.fn(),
        },
      },
    },
    auth2: {
      getAuthInstance: jest.fn(() => ({
        signIn: jest.fn(() => Promise.resolve()),
        signOut: jest.fn(() => Promise.resolve()),
      })),
    },
  };
  