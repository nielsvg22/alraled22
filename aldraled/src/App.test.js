import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the header brand', () => {
  try {
    render(<App />);
  } catch (e) {
    const details = Array.isArray(e?.errors)
      ? e.errors.map(err => err?.message || String(err)).join('\n')
      : '';
    throw new Error(details || e?.message || String(e));
  }
  expect(screen.getByText(/ALRA/i)).toBeInTheDocument();
});
