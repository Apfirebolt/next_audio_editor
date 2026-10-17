import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import axios from 'axios';
import Cookie from 'js-cookie';
import { useRouter } from 'next/navigation';
import LoginPage from '../login/page';

jest.mock('next/navigation', () => ({ useRouter: jest.fn() }));
jest.mock('axios', () => ({
  __esModule: true,
  default: { post: jest.fn(), defaults: { headers: { common: {} } } },
}));
jest.mock('js-cookie', () => ({ __esModule: true, default: { set: jest.fn() } }));
jest.mock('../../components/Header', () => () => <header>Site header</header>);
jest.mock('../../components/Footer', () => () => <footer>Site footer</footer>);

describe('Login page', () => {
  const router = { push: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    axios.defaults.headers.common = {};
    useRouter.mockReturnValue(router);
  });

  it('shows a validation message when submitted without credentials', () => {
    render(<LoginPage />);

    fireEvent.submit(screen.getByRole('button', { name: 'Sign in' }).closest('form'));

    expect(screen.getByText('Please enter email and password.')).toBeInTheDocument();
    expect(axios.post).not.toHaveBeenCalled();
  });

  it('stores the returned user and token, then redirects on success', async () => {
    axios.post.mockResolvedValue({
      status: 200,
      data: { id: 7, token: 'test-token' },
    });
    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'user@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'secret' } });
    fireEvent.submit(screen.getByRole('button', { name: 'Sign in' }).closest('form'));

    await waitFor(() => expect(router.push).toHaveBeenCalledWith('/editor'));
    expect(axios.post).toHaveBeenCalledWith('http://localhost:5000/api/auth/login', {
      email: 'user@example.com',
      password: 'secret',
    });
    expect(Cookie.set).toHaveBeenCalledWith('user', JSON.stringify({ id: 7, token: 'test-token' }), expect.any(Object));
    expect(Cookie.set).toHaveBeenCalledWith('token', 'test-token', expect.any(Object));
    expect(axios.defaults.headers.common.Authorization).toBe('Bearer test-token');
  });

  it('displays the authentication error returned by the API', async () => {
    axios.post.mockRejectedValue(new Error('Invalid credentials'));
    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'user@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'wrong' } });
    fireEvent.submit(screen.getByRole('button', { name: 'Sign in' }).closest('form'));

    expect(await screen.findByText('Invalid credentials')).toBeInTheDocument();
    expect(router.push).not.toHaveBeenCalled();
  });
});