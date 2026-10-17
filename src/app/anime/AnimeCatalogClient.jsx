'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Loader from '@/components/Loader';
import httpClient from '@/lib/api';
import Link from 'next/link';
import { 
  MagnifyingGlassIcon, 
  ChevronLeftIcon, 
  ChevronRightIcon, 
  FilmIcon,
  ArrowRightIcon,
  EyeIcon,
  SparklesIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';

export default function AnimeCatalogClient() {
  const [animeList, setAnimeList] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filter & Pagination States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [sortBy, setSortBy] = useState('popularity');
  const [airedAfter, setAiredAfter] = useState('');
  const [airedBefore, setAiredBefore] = useState('');
  
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Common anime genres for quick selection dropdown
  const genresList = ['Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Romance', 'Sci-Fi', 'Slice of Life', 'Suspense'];

  // Fetch anime list with all filter parameters
  const fetchAnime = useCallback(async () => {
    setLoading(true);
    try {
      const response = await httpClient.get('/anime', {
        params: {
          search: searchQuery.trim() || undefined,
          genre: selectedGenre || undefined,
          sort_by: sortBy || undefined,
          aired_after: airedAfter || undefined,
          aired_before: airedBefore || undefined,
          page: page,
          size: 12,
        },
      });

      const result = response.data;
      setAnimeList(Array.isArray(result.items) ? result.items : []);
      
      if (typeof result.pages === 'number') {
        setTotalPages(result.pages);
      }
    } catch (error) {
      console.error('Failed to fetch anime catalog:', error);
      setAnimeList([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedGenre, sortBy, airedAfter, airedBefore, page]);

  // Debounced trigger when any filter or page changes
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAnime();
    }, 300);

    return () => clearTimeout(timer);
  }, [fetchAnime]);

  // Reset page to 1 whenever any filter criteria changes
  const handleFilterChange = (setter) => (e) => {
    setter(e.target.value);
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-anime-dark dark:text-anime-light flex flex-col font-sans selection:bg-anime-sage selection:text-anime-dark transition-colors duration-200">
      <Header />

      <main className="flex-grow max-w-7xl mx-auto px-6 py-12 w-full space-y-10">

         {/* Vibe Search Banner Callout */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-anime-sage/15 via-anime-sage/5 to-transparent border border-anime-sage/30 p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-lg shadow-anime-sage/5">
          <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-anime-sage/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="space-y-2 relative z-10 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-anime-sage/20 text-anime-sage text-xs font-semibold">
              <SparklesIcon className="h-3.5 w-3.5" />
              <span>AI Anime Discovery</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-heading">
              Looking for a specific vibe or storyline for an anime?
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-anime-light/70 max-w-xl">
              Don't know what to watch next? Describe your ideal plot twist, character dynamic, or atmosphere in natural language and let our AI model find your match.
            </p>
          </div>

          <div className="shrink-0 relative z-10">
            <Link
              href="/vibe-search"
              className="px-6 py-3 rounded-xl bg-anime-sage text-anime-dark font-semibold font-heading hover:bg-anime-sage/90 transition-all shadow-md flex items-center gap-2 group text-sm"
            >
              <span>Try Vibe Search</span>
              <ArrowRightIcon className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
        
        {/* Page Title & Controls Section */}
        <div className="flex flex-col gap-6 border-b border-gray-200 dark:border-anime-sage/20 pb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold font-heading">Anime Catalog</h1>
              <p className="text-sm text-gray-600 dark:text-anime-light/60 mt-1">
                Explore titles indexed by our similarity engine with advanced multi-criteria filters.
              </p>
            </div>

            {/* Search Bar */}
            <div className="relative w-full md:w-80">
              <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-anime-light/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={handleFilterChange(setSearchQuery)}
                placeholder="Search by title, studio..."
                className="w-full pl-11 pr-4 py-2.5 text-sm bg-gray-50 dark:bg-anime-dark/50 border border-gray-300 dark:border-anime-sage/30 rounded-xl focus:outline-none focus:border-anime-sage text-gray-900 dark:text-anime-light placeholder-gray-400 dark:placeholder-anime-light/40 shadow-sm"
              />
            </div>
          </div>

          {/* Advanced Filter Bar (Genre, Sort, Date Ranges) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-anime-dark/40 border border-gray-200 dark:border-anime-sage/20 shadow-sm">
            
            {/* Genre Dropdown */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 dark:text-anime-light/60">Genre</label>
              <select
                value={selectedGenre}
                onChange={handleFilterChange(setSelectedGenre)}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-anime-dark border border-gray-300 dark:border-anime-sage/30 rounded-xl focus:outline-none focus:border-anime-sage text-gray-900 dark:text-anime-light"
              >
                <option value="">All Genres</option>
                {genresList.map((genre) => (
                  <option key={genre} value={genre}>{genre}</option>
                ))}
              </select>
            </div>

            {/* Sort Dropdown */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 dark:text-anime-light/60">Sort By</label>
              <select
                value={sortBy}
                onChange={handleFilterChange(setSortBy)}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-anime-dark border border-gray-300 dark:border-anime-sage/30 rounded-xl focus:outline-none focus:border-anime-sage text-gray-900 dark:text-anime-light"
              >
                <option value="popularity">Popularity (Default)</option>
                <option value="highest_voted">Highest Voted / Score</option>
                <option value="most_episodes">Most Episodes</option>
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="favorites">Most Favorites</option>
                <option value="rank">MAL Rank</option>
              </select>
            </div>

            {/* Aired After Date */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 dark:text-anime-light/60">Aired After</label>
              <input
                type="date"
                value={airedAfter}
                onChange={handleFilterChange(setAiredAfter)}
                className="w-full px-3 py-1.5 text-sm bg-white dark:bg-anime-dark border border-gray-300 dark:border-anime-sage/30 rounded-xl focus:outline-none focus:border-anime-sage text-gray-900 dark:text-anime-light"
              />
            </div>

            {/* Aired Before Date */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 dark:text-anime-light/60">Aired Before</label>
              <input
                type="date"
                value={airedBefore}
                onChange={handleFilterChange(setAiredBefore)}
                className="w-full px-3 py-1.5 text-sm bg-white dark:bg-anime-dark border border-gray-300 dark:border-anime-sage/30 rounded-xl focus:outline-none focus:border-anime-sage text-gray-900 dark:text-anime-light"
              />
            </div>

          </div>
        </div>

        {/* Content Section: Grid or Loader */}
        {loading ? (
          <div className="flex items-center justify-center min-h-[40vh]">
            <Loader />
          </div>
        ) : animeList.length === 0 ? (
          <div className="text-center py-24 space-y-4">
            <FilmIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-anime-light/30" />
            <p className="text-gray-600 dark:text-anime-light/60 text-lg">No anime found matching your filter criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {animeList.map((anime) => (
              <div 
                key={anime.mal_id || anime.id} 
                className="bg-white dark:bg-anime-dark/40 border border-gray-200 dark:border-anime-sage/20 rounded-2xl p-5 flex flex-col justify-between hover:border-anime-sage/50 transition-all shadow-sm group"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-heading font-bold text-lg text-gray-900 dark:text-anime-light group-hover:text-anime-sage transition-colors line-clamp-1">
                      {anime.title_english || anime.title}
                    </h3>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-anime-sage/10 text-anime-sage font-medium whitespace-nowrap border border-anime-sage/20">
                      {anime.type || 'TV'}
                    </span>
                  </div>

                  <p className="text-xs text-gray-600 dark:text-anime-light/60 line-clamp-3 leading-relaxed">
                    {anime.synopsis || 'No synopsis available for this title.'}
                  </p>

                  <div className="flex flex-wrap gap-1 pt-2">
                    {anime.genres && typeof anime.genres === 'string' && 
                      anime.genres.split('|').slice(0, 3).map((genre, idx) => (
                        <span key={idx} className="text-[10px] px-2 py-0.5 rounded bg-gray-100 dark:bg-anime-dark border border-gray-200 dark:border-anime-sage/20 text-gray-700 dark:text-anime-light/70">
                          {genre.trim()}
                        </span>
                      ))
                    }
                  </div>
                </div>

                {/* Action Trigger -> Direct Link to Detail Page */}
                <div className="pt-6 mt-4 border-t border-gray-100 dark:border-anime-sage/10 flex items-center justify-between">
                  <span className="text-xs text-gray-500 dark:text-anime-light/50 font-mono">
                    Score: {anime.score || 'N/A'} | Eps: {anime.episodes || '?'}
                  </span>
                  
                  <Link
                    href={`/anime/${anime.mal_id}`}
                    className="px-3.5 py-2 text-xs font-semibold font-heading rounded-lg bg-anime-sage/10 text-anime-sage hover:bg-anime-sage hover:text-anime-dark transition-all flex items-center gap-1.5 group/btn"
                  >
                    <EyeIcon className="h-3.5 w-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
                    <span>View</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination Controls */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 pt-8">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1}
              className="p-2 rounded-xl bg-white dark:bg-anime-dark/50 border border-gray-200 dark:border-anime-sage/20 text-gray-800 dark:text-anime-light disabled:opacity-30 disabled:cursor-not-allowed hover:bg-anime-sage/10 transition-colors shadow-sm"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            <span className="text-sm font-medium text-gray-700 dark:text-anime-light/80">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page === totalPages}
              className="p-2 rounded-xl bg-white dark:bg-anime-dark/50 border border-gray-200 dark:border-anime-sage/20 text-gray-800 dark:text-anime-light disabled:opacity-30 disabled:cursor-not-allowed hover:bg-anime-sage/10 transition-colors shadow-sm"
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}