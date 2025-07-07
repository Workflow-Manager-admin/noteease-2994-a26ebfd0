import { render, screen } from '@testing-library/react';
import App from './App';

// PUBLIC_INTERFACE
test("renders NoteEase minimal app", () => {
  render(<App />);
  expect(screen.getByText(/NoteEase/i)).toBeInTheDocument();
});
