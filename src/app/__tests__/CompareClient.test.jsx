import { act, fireEvent, render, screen } from '@testing-library/react';
import httpClient from '@/lib/api';
import CompareClient from '@/app/compare/CompareClient';

jest.mock('@/lib/api', () => ({
  __esModule: true,
  default: { get: jest.fn() },
}));
jest.mock('@/components/Header', () => () => <header>Site header</header>);
jest.mock('@/components/Footer', () => () => <footer>Site footer</footer>);
jest.mock('react-chartjs-2', () => ({
  Radar: () => <div data-testid="radar-chart" />,
  Bar: () => <div data-testid="bar-chart" />,
}));

async function finishSearch() {
  await act(async () => {
    jest.advanceTimersByTime(300);
    await Promise.resolve();
  });
}

describe('Compare page', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    httpClient.get.mockReset();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('searches anime, selects two titles, and renders charts and the scorecard', async () => {
    const titles = {
      Alpha: {
        mal_id: 1,
        title: 'Alpha Show',
        score: 8.2,
        rank: 20,
        popularity: 100,
        members: 10000,
        episodes: 12,
        genres: 'Action|Drama',
      },
      Beta: {
        mal_id: 2,
        title: 'Beta Show',
        score: 9.1,
        rank: 10,
        popularity: 50,
        members: 20000,
        episodes: 24,
        genres: 'Comedy|Sci-Fi',
      },
    };
    httpClient.get.mockImplementation((_endpoint, { params }) => Promise.resolve({
      data: { items: [titles[params.search]] },
    }));
    render(<CompareClient />);

    fireEvent.click(screen.getByRole('button', { name: /Compare Anime/i }));
    const searchFields = screen.getAllByPlaceholderText('Search anime...');

    fireEvent.change(searchFields[0], { target: { value: 'Alpha' } });
    await finishSearch();
    expect(httpClient.get).toHaveBeenLastCalledWith('/anime', {
      params: { search: 'Alpha', size: 5 },
    });
    fireEvent.click(screen.getByRole('button', { name: /Alpha Show/ }));

    fireEvent.change(screen.getAllByPlaceholderText('Search anime...')[0], {
      target: { value: 'Beta' },
    });
    await finishSearch();
    expect(httpClient.get).toHaveBeenLastCalledWith('/anime', {
      params: { search: 'Beta', size: 5 },
    });
    fireEvent.click(screen.getByRole('button', { name: /Beta Show/ }));

    expect(screen.getByRole('heading', { name: 'Statistical Breakdown' })).toBeInTheDocument();
    expect(screen.getByTestId('radar-chart')).toBeInTheDocument();
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Alpha Show' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Beta Show' })).toBeInTheDocument();
    expect(screen.getByText('Score Rating')).toBeInTheDocument();
    expect(screen.getByText('Total Episodes')).toBeInTheDocument();
    expect(screen.getByText('Winner')).toBeInTheDocument();
  });

  it('uses the manga search endpoint and returns to category selection on switch', async () => {
    httpClient.get.mockResolvedValue({
      data: { items: [{ mal_id: 42, title: 'Manga Result', score: 7.5 }] },
    });
    render(<CompareClient />);

    fireEvent.click(screen.getByRole('button', { name: /Compare Manga/i }));
    fireEvent.change(screen.getAllByPlaceholderText('Search manga...')[0], {
      target: { value: 'Manga' },
    });
    await finishSearch();

    expect(httpClient.get).toHaveBeenCalledWith('/manga', {
      params: { search: 'Manga', size: 5 },
    });
    fireEvent.click(screen.getByRole('button', { name: /Manga Result/ }));
    expect(screen.getByText('Active Category:')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Manga Result' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Switch Category' }));

    expect(screen.getByRole('button', { name: /Compare Anime/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Compare Manga/i })).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Search manga...')).not.toBeInTheDocument();
  });
});