// Import testing-library extensions
import '@testing-library/jest-dom';

// Set up a mock for localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};

// Assign the mock to global object
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
}); 