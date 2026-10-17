import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useRouter, useSearchParams } from 'next/navigation';
import httpClient from '@/lib/api';
import VibeSearchClient from '@/app/vibe-search/VibeSearchClient';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));
jest.mock('@/lib/api', () => ({
  __esModule: true,
  default: { get: jest.fn() },
}));
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }) => <a href={href} {...props}>{children}</a>,
}));
jest.mock('@/components/Header', () => () => <header>Site header</header>);
jest.mock('@/components/Footer', () => () => <footer>Site footer</footer>);
jest.mock('@/components/Loader', () => () => <div role="status" aria-label="Loading">Loading</div>);

describe('Anime vibe search page', () => {
  const router = { push: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    useRouter.mockReturnValue(router);
    useSearchParams.mockReturnValue(new URLSearchParams());
  });

  it('submits a trimmed query with the chosen limit and displays the matches', async () => {
    httpClient.get.mockResolvedValue({
      data: {
        results: [{
          mal_id: 101,
          title: 'Campfire Stories',
          title_english: 'Campfire Stories',
          synopsis: 'Friends find quiet adventures in the mountains.',
          vibe_match_score: 87,
          score: 8.4,
          genres: 'Adventure|Slice of Life',
          type: 'TV',
          episodes: 12,
          image_url: 'https://example.com/campfire.jpg',
        }],
      },
    });
    render(<VibeSearchClient />);

    const queryInput = screen.getByPlaceholderText('Type your anime vibe here...');
    const form = queryInput.closest('form');
    expect(screen.getByRole('button', { name: 'Vibe Search' })).toBeDisabled();

    fireEvent.change(queryInput, { target: { value: '  cozy camping  ' } });
    fireEvent.change(screen.getByTitle('Number of results'), { target: { value: '20' } });
    fireEvent.submit(form);

    await waitFor(() => expect(screen.getByRole('heading', { name: 'Semantic Matches' })).toBeInTheDocument());

    expect(router.push).toHaveBeenCalledWith('/vibe-search?q=cozy%20camping&limit=20');
    expect(httpClient.get).toHaveBeenCalledWith('anime/vibe-search', {
      params: { q: 'cozy camping', limit: 20 },
    });
    expect(screen.getByRole('heading', { name: 'Campfire Stories' })).toBeInTheDocument();
    expect(screen.getByText('87% Match')).toBeInTheDocument();
    expect(screen.getByText('Friends find quiet adventures in the mountains.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'View Details' })).toHaveAttribute('href', '/anime/101');
    expect(screen.getByText('Found 1 results')).toBeInTheDocument();
  });

  it('runs a search from URL parameters and shows the empty state', async () => {
    useSearchParams.mockReturnValue(new URLSearchParams('q=space%20opera&limit=20'));
    httpClient.get.mockResolvedValue({ data: { results: [] } });

    render(<VibeSearchClient />);

    expect(screen.getByPlaceholderText('Type your anime vibe here...')).toHaveValue('space opera');
    await waitFor(() => {
      expect(httpClient.get).toHaveBeenCalledWith('anime/vibe-search', {
        params: { q: 'space opera', limit: 20 },
      });
    });
    expect(await screen.findByText('No matching vibes found. Try refining your description!')).toBeInTheDocument();
  });

  it('shows the empty state when the search request fails', async () => {
    const error = new Error('Service unavailable');
    httpClient.get.mockRejectedValue(error);
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    useSearchParams.mockReturnValue(new URLSearchParams('q=cozy%20camping'));

    render(<VibeSearchClient />);

    expect(await screen.findByText('No matching vibes found. Try refining your description!')).toBeInTheDocument();
    expect(consoleError).toHaveBeenCalledWith('Failed to perform vibe search:', error);
  });
});