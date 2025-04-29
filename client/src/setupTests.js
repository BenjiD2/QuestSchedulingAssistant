// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

jest.mock('gapi-script', () => ({
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
        getAuthInstance: jest.fn(() => ({
          signIn: jest.fn(),
          signOut: jest.fn(),
        })),
      },
    },
  }));
  