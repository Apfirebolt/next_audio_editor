import { render, screen } from '@testing-library/react';
import Home from '../page';
import NotFound from '../not-found';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }) => <a href={href} {...props}>{children}</a>,
}));

jest.mock('../../components/Header', () => () => <header>Site header</header>);
jest.mock('../../components/Footer', () => () => <footer>Site footer</footer>);

describe('App pages', () => {
  it('renders the home discovery calls to action', () => {
    render(<Home />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Discover Your Next Favorite Anime Instantly.');
    expect(screen.getByRole('link', { name: 'Browse Anime' })).toHaveAttribute('href', '/anime');
    expect(screen.getByRole('link', { name: 'Browse Manga' })).toHaveAttribute('href', '/manga');
    expect(screen.getByRole('heading', { name: 'Engineered for Performance' })).toBeInTheDocument();
  });

  it('renders the 404 message with working recovery links', () => {
    render(<NotFound />);

    expect(screen.getByRole('heading', { name: 'Page Not Found' })).toBeInTheDocument();
    expect(screen.getByText('Error 404')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to Home' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: 'Browse Catalog' })).toHaveAttribute('href', '/anime');
  });
});