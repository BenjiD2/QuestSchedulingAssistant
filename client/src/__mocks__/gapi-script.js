const gapi = {
  load: jest.fn((api, callback) => {
    if (callback) callback();
  }),
  client: {
    init: jest.fn(),
    calendar: {
      events: {
        list: jest.fn()
      }
    }
  },
  auth2: {
    getAuthInstance: jest.fn()
  }
};

global.gapi = gapi;

export { gapi }; 