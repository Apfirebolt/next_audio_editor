import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import RegisterPage from '../register/page';

jest.mock('next/navigation', () => ({ useRouter: jest.fn() }));
jest.mock('../../components/Header', () => () => <header>Site header</header>);
jest.mock('../../components/Footer', () => () => <footer>Site footer</footer>);

describe('Register page', () => {
  const router = { push: jest.fn() };
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
    useRouter.mockReturnValue(router);
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it('sends the registration details and redirects after success', async () => {
    global.fetch.mockResolvedValue({ ok: true });
    render(<RegisterPage />);

    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'new-user' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'user@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'secret' } });
    fireEvent.submit(screen.getByRole('button', { name: 'Create account' }).closest('form'));

    await waitFor(() => expect(router.push).toHaveBeenCalledWith('/dashboard'));
    expect(global.fetch).toHaveBeenCalledWith('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'new-user', email: 'user@example.com', password: 'secret' }),
    });
  });

  it('shows the API error when registration fails', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      json: jest.fn().mockResolvedValue({ message: 'Email already registered' }),
    });
    render(<RegisterPage />);

    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'existing-user' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'user@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'secret' } });
    fireEvent.submit(screen.getByRole('button', { name: 'Create account' }).closest('form'));

    expect(await screen.findByText('Email already registered')).toBeInTheDocument();
    expect(router.push).not.toHaveBeenCalled();
  });
});