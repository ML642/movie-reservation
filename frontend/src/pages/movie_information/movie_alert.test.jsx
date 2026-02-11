import { fireEvent, render, screen } from '@testing-library/react';
import CustomAlert from './movie_alert';

jest.mock(
  'react-router-dom',
  () => ({
    Link: ({ to, children, ...props }) => (
      <a href={to} {...props}>
        {children}
      </a>
    ),
  }),
  { virtual: true }
);

describe('CustomAlert', () => {
  test('does not render when closed', () => {
    render(<CustomAlert open={false} onBack={jest.fn()} />);

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  test('renders reservation details when open', () => {
    render(
      <CustomAlert
        open={true}
        movieTitle="Dune"
        theaterName="IMAX Downtown"
        seat={['A1', 'A2']}
        showtime="7:00 PM"
        onBack={jest.fn()}
      />
    );

    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    expect(screen.getByText('Reservation Confirmed')).toBeInTheDocument();
    expect(screen.getByText('A1, A2')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /view my reservation/i })).toHaveAttribute(
      'href',
      '/my-reservations'
    );
  });

  test('calls onBack when back button is clicked', () => {
    const onBack = jest.fn();
    render(<CustomAlert open={true} onBack={onBack} />);

    fireEvent.click(screen.getByRole('button', { name: /back/i }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  test('calls onBack on Escape key press', () => {
    const onBack = jest.fn();
    render(<CustomAlert open={true} onBack={onBack} />);

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
