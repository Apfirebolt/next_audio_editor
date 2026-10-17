import { act, fireEvent, render, screen, within } from '@testing-library/react';
import httpClient from '@/lib/api';
import AnimeCatalogClient from '../anime/AnimeCatalogClient';
import MangaCatalogClient from '../manga/MangaCatalogClient';

jest.mock('@/lib/api', () => ({
  __esModule: true,
  default: { get: jest.fn() },
}));
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }) => <a href={href} {...props}>{children}</a>,
}));
jest.mock('../../components/Header', () => () => <header>Site header</header>);
jest.mock('../../components/Footer', () => () => <footer>Site footer</footer>);
jest.mock('../../components/Loader', () => () => <div role="status" aria-label="Loading">Loading</div>);

async function finishCatalogLoad() {
  await act(async () => {
    jest.advanceTimersByTime(300);
    await Promise.resolve();
  });
}

describe('Anime catalog page', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    httpClient.get.mockReset();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('loads anime titles and requests the first page with default filters', async () => {
    httpClient.get.mockResolvedValue({
      data: {
        items: [{
          mal_id: 1,
          title: 'Cowboy Bebop',
          title_english: 'Cowboy Bebop',
          type: 'TV',
          synopsis: 'A crew of bounty hunters travels through space.',
          genres: 'Action| Drama | Sci-Fi | Crime',
          score: 8.75,
          episodes: 26,
        }],
        pages: 1,
      },
    });
    render(<AnimeCatalogClient />);

    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument();
    await finishCatalogLoad();

    expect(httpClient.get).toHaveBeenCalledWith('/anime', {
      params: {
        search: undefined,
        genre: undefined,
        sort_by: 'popularity',
        aired_after: undefined,
        aired_before: undefined,
        page: 1,
        size: 12,
      },
    });
    expect(screen.getByRole('heading', { name: 'Cowboy Bebop' })).toBeInTheDocument();
    expect(screen.getByText('A crew of bounty hunters travels through space.')).toBeInTheDocument();
    expect(screen.getByText('Score: 8.75 | Eps: 26')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'View' })).toHaveAttribute('href', '/anime/1');
    const animeCard = screen.getByRole('heading', { name: 'Cowboy Bebop' }).closest('.group');
    expect(within(animeCard).getByText('Action')).toBeInTheDocument();
    expect(within(animeCard).getByText('Sci-Fi')).toBeInTheDocument();
    expect(within(animeCard).queryByText('Crime')).not.toBeInTheDocument();
  });

  it('updates search and genre filters and resets pagination to page one', async () => {
    httpClient.get.mockResolvedValue({ data: { items: [], pages: 3 } });
    render(<AnimeCatalogClient />);
    await finishCatalogLoad();

    fireEvent.click(screen.getAllByRole('button')[1]);
    await finishCatalogLoad();
    expect(screen.getByText('Page 2 of 3')).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('Search by title, studio...'), {
      target: { value: '  Cowboy  ' },
    });
    fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: 'Action' } });
    await finishCatalogLoad();

    expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
    expect(httpClient.get).toHaveBeenLastCalledWith('/anime', {
      params: expect.objectContaining({ search: 'Cowboy', genre: 'Action', page: 1 }),
    });
  });
});

describe('Manga catalog page', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    httpClient.get.mockReset();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('loads manga titles and renders their catalog details', async () => {
    httpClient.get.mockResolvedValue({
      data: {
        items: [{
          mal_id: 42,
          title: 'Fullmetal Alchemist',
          title_english: 'Fullmetal Alchemist',
          type: 'Manga',
          synopsis: 'Two brothers search for the Philosopher Stone.',
          genres: 'Action|Adventure',
          score: 9.0,
          chapters: 116,
        }],
        pages: 1,
      },
    });
    render(<MangaCatalogClient />);

    await finishCatalogLoad();

    expect(httpClient.get).toHaveBeenCalledWith('/manga', {
      params: {
        search: undefined,
        genre: undefined,
        sort_by: 'popularity',
        published_after: undefined,
        published_before: undefined,
        page: 1,
        size: 12,
      },
    });
    expect(screen.getByRole('heading', { name: 'Fullmetal Alchemist' })).toBeInTheDocument();
    expect(screen.getByText('Two brothers search for the Philosopher Stone.')).toBeInTheDocument();
    expect(screen.getByText('Score: 9 | Ch: 116')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'View' })).toHaveAttribute('href', '/manga/42');
  });

  it('sends manga-specific filters and shows the empty state when loading fails', async () => {
    const error = new Error('Request failed');
    httpClient.get.mockRejectedValue(error);
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    render(<MangaCatalogClient />);

    fireEvent.change(screen.getByPlaceholderText('Search by title, author...'), {
      target: { value: '  Alchemist  ' },
    });
    fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: 'Adventure' } });
    await finishCatalogLoad();

    expect(httpClient.get).toHaveBeenLastCalledWith('/manga', {
      params: expect.objectContaining({
        search: 'Alchemist',
        genre: 'Adventure',
        published_after: undefined,
        published_before: undefined,
        page: 1,
      }),
    });
    expect(await screen.findByText('No manga found matching your filter criteria.')).toBeInTheDocument();
    expect(consoleError).toHaveBeenCalledWith('Failed to fetch manga catalog:', error);
    expect(screen.queryByRole('status', { name: 'Loading' })).not.toBeInTheDocument();
  });
});