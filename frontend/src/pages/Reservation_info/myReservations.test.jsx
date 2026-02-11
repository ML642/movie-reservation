import { render, screen, waitFor } from '@testing-library/react';
import axios from 'axios';
import MyReservations from './myReservations';
import { getUserFromToken, isAuthenticated } from '../../utils/jwtDecoder';

const mockNavigate = jest.fn();

jest.mock(
  'axios',
  () => ({
    post: jest.fn(),
    delete: jest.fn(),
  }),
  { virtual: true }
);
jest.mock('../../utils/jwtDecoder', () => ({
  getUserFromToken: jest.fn(),
  isAuthenticated: jest.fn(),
}));
jest.mock('./generate_QR', () => () => null);
jest.mock(
  'react-router-dom',
  () => ({
    useNavigate: () => mockNavigate,
    useLocation: () => ({ key: 'test-location-key' }),
    Link: ({ to, children, ...props }) => (
      <a href={to} {...props}>
        {children}
      </a>
    ),
  }),
  { virtual: true }
);

describe('MyReservations page', () => {
  beforeAll(() => {
    window.scrollTo = jest.fn();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    process.env.REACT_APP_API_URL = 'http://localhost:5000';
  });

  test('redirects to login when user is not authenticated', async () => {
    isAuthenticated.mockReturnValue(false);

    render(<MyReservations />);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
    expect(screen.getByText(/Unable to load reservations/i)).toBeInTheDocument();
  });

  test('renders fetched reservations for authenticated user', async () => {
    isAuthenticated.mockReturnValue(true);
    getUserFromToken.mockReturnValue({ id: 'u-1', name: 'Mike' });
    localStorage.setItem('token', 'test-token');

    axios.post.mockResolvedValueOnce({
      data: {
        success: true,
        data: [
          {
            id: 'r-1',
            movie: 'Inception',
            poster: 'https://example.com/poster.jpg',
            date: '2026-02-15',
            time: '7:00 PM',
            seat: 'A1',
            status: 'upcoming',
            theater: 'Screen 1',
            price: '$12.99',
            bookingDate: '2026-02-11',
            genre: 'Science Fiction',
            duration: '148 min',
            rating: 'PG-13',
          },
        ],
      },
    });

    render(<MyReservations />);

    expect(await screen.findByText('Inception')).toBeInTheDocument();
    expect(axios.post).toHaveBeenCalledWith(
      'http://localhost:5000/api/reservation/id',
      {},
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token',
        }),
      })
    );
  });

  test('redirects to login when reservations API returns 401', async () => {
    isAuthenticated.mockReturnValue(true);
    getUserFromToken.mockReturnValue({ id: 'u-1', name: 'Mike' });
    localStorage.setItem('token', 'expired-token');

    axios.post.mockRejectedValueOnce({
      response: { status: 401 },
    });

    render(<MyReservations />);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });
});
