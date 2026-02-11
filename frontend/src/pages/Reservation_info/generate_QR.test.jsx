import { fireEvent, render, screen } from '@testing-library/react';
import QRCodeGenerator from './generate_QR';

jest.mock('react-qr-code', () => {
  return function MockQrCode(props) {
    return <div data-testid="qr-code" data-value={props.value} />;
  };
});

describe('QRCodeGenerator', () => {
  test('does not render when hidden', () => {
    render(
      <QRCodeGenerator
        isVisible={false}
        reservationData={{ id: 'r-1' }}
        onClose={jest.fn()}
      />
    );

    expect(screen.queryByTestId('qr-code')).not.toBeInTheDocument();
  });

  test('renders QR code and close button when visible', () => {
    const onClose = jest.fn();
    jest.spyOn(Date, 'now').mockReturnValue(1700000000000);

    render(
      <QRCodeGenerator
        isVisible={true}
        onClose={onClose}
        reservationData={{
          id: 'r-7',
          movie: 'Interstellar',
          date: '2026-02-12',
          time: '9:00 PM',
          seat: 'C10',
          theater: 'IMAX',
        }}
      />
    );

    const qr = screen.getByTestId('qr-code');
    expect(qr).toBeInTheDocument();

    const parsed = JSON.parse(qr.getAttribute('data-value'));
    expect(parsed).toEqual(
      expect.objectContaining({
        ticketId: 'r-7',
        movie: 'Interstellar',
        seat: 'C10',
        theater: 'IMAX',
        verification: 'TICKET-r-7-1700000000000',
      })
    );

    fireEvent.click(screen.getByRole('button'));
    expect(onClose).toHaveBeenCalledTimes(1);

    Date.now.mockRestore();
  });
});
