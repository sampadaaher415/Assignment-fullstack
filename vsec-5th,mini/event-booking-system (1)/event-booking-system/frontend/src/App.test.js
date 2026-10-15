import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import App from './App';

const sampleEvents = [
  {
    _id: 'e1',
    title: 'Music Fest Live',
    description: 'Live music',
    category: 'Music',
    date: '2099-12-01',
    time: '18:30',
    venue: 'City Open Grounds',
    price: 299,
    totalSeats: 48,
    availableSeats: 40,
  },
];

beforeEach(() => {
  global.fetch = jest.fn(() =>
    Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(sampleEvents) })
  );
});

afterEach(() => {
  delete global.fetch;
});

function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </MemoryRouter>
  );
}

test('shows the event listing on the home page', async () => {
  renderAt('/');
  expect(screen.getByRole('link', { name: /seatwise home/i })).toBeInTheDocument();
  expect(await screen.findByText('Music Fest Live')).toBeInTheDocument();
  expect(screen.getByText('40 of 48 seats left')).toBeInTheDocument();
});

test('sends logged-out visitors from My tickets to the login page', async () => {
  renderAt('/my-bookings');
  expect(await screen.findByRole('heading', { name: /log in/i })).toBeInTheDocument();
});
