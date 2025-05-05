import { render, screen } from '@testing-library/react';
import App from './App';
// jest.mock('gapi-script');

test('renders dashboard header', () => {
  render(<App />);
  const headerElement = screen.getByText(/dashboard/i);
  expect(headerElement).toBeInTheDocument();
});
