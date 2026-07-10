import { fireEvent, render, screen } from '@testing-library/react';
import AuthNotice from './AuthNotice';

describe('AuthNotice', () => {
  test('renders nothing without a message', () => {
    const { container } = render(<AuthNotice notice={{ type: 'info' }} onClose={jest.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  test('uses the default title for a known notice type', () => {
    render(<AuthNotice notice={{ type: 'success', message: 'Account created' }} onClose={jest.fn()} />);
    expect(screen.getByText('Success')).toBeInTheDocument();
    expect(screen.getByText('Account created')).toBeInTheDocument();
  });

  test('uses a supplied title instead of the default title', () => {
    render(<AuthNotice notice={{ type: 'error', title: 'Try again', message: 'Request failed' }} onClose={jest.fn()} />);
    expect(screen.getByText('Try again')).toBeInTheDocument();
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
  });

  test('falls back to info content for an unknown type', () => {
    render(<AuthNotice notice={{ type: 'other', message: 'An update is available' }} onClose={jest.fn()} />);
    expect(screen.getByText('Notice')).toBeInTheDocument();
  });

  test('calls onClose once from the close button', () => {
    const onClose = jest.fn();
    render(<AuthNotice notice={{ message: 'Saved' }} onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: /close notification/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
