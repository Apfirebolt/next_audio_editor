// app/vibe-search/VibeSearchClient.jsx
'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Loader from '@/components/Loader';
import httpClient from '@/lib/api';
import Link from 'next/link';
import { 
  SparklesIcon, 
  MagnifyingGlassIcon, 
  FilmIcon,
  EyeIcon,
  StarIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';

export default function VibeSearchClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const initialLimit = searchParams.get('limit') || '10';

  const [query, setQuery] = useState(initialQuery);
  const [limit, setLimit] = useState(initialLimit);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Trigger search when query or limit changes from URL
  useEffect(() => {
    if (initialQuery && initialQuery.trim()) {
      executeSearch(initialQuery, initialLimit);
    }
  }, [initialQuery, initialLimit]);

  const executeSearch = async (searchQuery, searchLimit) => {
    if (!searchQuery || !searchQuery.trim()) return;

    setLoading(true);
    setHasSearched(true);
    try {
      const response = await httpClient.get('anime/vibe-search', {
        params: {
          q: searchQuery.trim(),
          limit: Number(searchLimit) || 10,
        },
      });
      
      const apiData = response.data;
      setResults(Array.isArray(apiData.results) ? apiData.results : []);
    } catch (error) {
      console.error('Failed to perform vibe search:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleVibeSearch = (e) => {
    e.preventDefault();
    if (!query || !query.trim()) return;

    router.push(`/vibe-search?q=${encodeURIComponent(query.trim())}&limit=${limit}`);
    executeSearch(query, limit);
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-anime-dark dark:text-anime-light flex flex-col font-sans selection:bg-anime-sage selection:text-anime-dark transition-colors duration-200">
      <Header />

      <main className="flex-grow max-w-7xl mx-auto px-6 py-12 w-full space-y-12">
        
        {/* Vibe Search Hero Header & Input Box */}
        <div className="text-center max-w-3xl mx-auto space-y-6 pt-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-anime-sage/10 border border-anime-sage/20 text-anime-sage text-sm font-medium">
            <SparklesIcon className="h-4 w-4" />
            <span>AI Anime Search</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-bold font-heading tracking-tight">
            Search Anime by <span className="text-anime-sage">Vibe</span> or Plot
          </h1>

          <p className="text-sm sm:text-base text-gray-600 dark:text-anime-light/70 leading-relaxed">
            Describe a storyline, character dynamic, or atmosphere in your own words (e.g., <i>"A school boy with a notebook which kills people"</i> or <i>"Cozy slice of life with camping"</i>).
          </p>

          {/* Search Form */}
          <form onSubmit={handleVibeSearch} className="flex flex-col sm:flex-row gap-3 pt-2">
            <div className="relative flex-grow">
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-anime-light/40" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Type your anime vibe here..."
                className="w-full pl-12 pr-4 py-3.5 text-sm bg-gray-50 dark:bg-anime-dark/50 border border-gray-300 dark:border-anime-sage/30 rounded-2xl focus:outline-none focus:border-anime-sage text-gray-900 dark:text-anime-light placeholder-gray-400 dark:placeholder-anime-light/40 shadow-sm transition-all"
              />
            </div>

            {/* Limit Selector Dropdown */}
            <div className="relative flex items-center shrink-0">
              <div className="absolute left-3.5 pointer-events-none text-gray-400 dark:text-anime-light/40">
                <AdjustmentsHorizontalIcon className="h-4 w-4" />
              </div>
              <select
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
                className="pl-10 pr-6 py-3.5 text-sm bg-gray-50 dark:bg-anime-dark/50 border border-gray-300 dark:border-anime-sage/30 rounded-2xl focus:outline-none focus:border-anime-sage text-gray-900 dark:text-anime-light shadow-sm transition-all cursor-pointer"
                title="Number of results"
              >
                <option value={10}>10 items</option>
                <option value={20}>20 items</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="px-8 py-3.5 rounded-2xl bg-anime-sage text-anime-dark font-semibold font-heading hover:bg-anime-sage/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-anime-sage/10 flex items-center justify-center gap-2 shrink-0"
            >
              <span>{loading ? 'Searching...' : 'Vibe Search'}</span>
            </button>
          </form>
        </div>

        {/* Results Section */}
        {loading ? (
          <div className="flex items-center justify-center min-h-[30vh]">
            <Loader />
          </div>
        ) : hasSearched && results.length === 0 ? (
          <div className="text-center py-20 space-y-4">
            <FilmIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-anime-light/30" />
            <p className="text-gray-600 dark:text-anime-light/60 text-lg">No matching vibes found. Try refining your description!</p>
          </div>
        ) : results.length > 0 ? (
          <div className="space-y-6 pt-4">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-anime-sage/20 pb-4">
              <h2 className="text-xl font-bold font-heading">Semantic Matches</h2>
              <span className="text-xs font-mono text-gray-500 dark:text-anime-light/50">
                Found {results.length} results
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {results.map((anime) => (
                <div 
                  key={anime.mal_id} 
                  className="bg-white dark:bg-anime-dark/40 border border-gray-200 dark:border-anime-sage/20 rounded-2xl p-5 flex flex-col justify-between hover:border-anime-sage/50 transition-all shadow-sm group"
                >
                  <div className="flex items-start gap-4 flex-grow min-w-0">
                    
                    {/* Poster Thumbnail Image */}
                    <div className="relative w-20 h-28 shrink-0 rounded-xl overflow-hidden border border-gray-200 dark:border-anime-sage/20 bg-gray-100 dark:bg-anime-dark">
                      {anime.image_url ? (
                        <img 
                          src={anime.image_url} 
                          alt={anime.title_english || anime.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400 dark:text-anime-light/40 text-center">
                          No Image
                        </div>
                      )}
                    </div>

                    {/* Content Details */}
                    <div className="space-y-2 flex-grow min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-heading font-bold text-gray-900 dark:text-anime-light group-hover:text-anime-sage transition-colors line-clamp-1 text-base">
                          {anime.title_english || anime.title}
                        </h3>

                        {/* Match Percentage Badge */}
                        {anime.vibe_match_score && (
                          <span className="text-[11px] font-mono font-bold text-anime-coral px-2.5 py-1 rounded-full bg-anime-coral/10 shrink-0 border border-anime-coral/20">
                            {anime.vibe_match_score}% Match
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-gray-600 dark:text-anime-light/60 line-clamp-2 leading-relaxed">
                        {anime.synopsis || 'No synopsis available.'}
                      </p>

                      <div className="flex items-center gap-3 pt-1 text-[11px] text-gray-500 dark:text-anime-light/50 flex-wrap">
                        <span className="flex items-center gap-1 font-semibold text-anime-coral">
                          <StarIcon className="h-3 w-3" /> {anime.score || 'N/A'}
                        </span>
                        <span>•</span>
                        <span className="truncate max-w-[180px]">
                          {anime.genres ? anime.genres.replaceAll('|', ', ') : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Footer Action */}
                  <div className="pt-4 mt-4 border-t border-gray-100 dark:border-anime-sage/10 flex items-center justify-between">
                    <span className="text-xs text-gray-400 dark:text-anime-light/40 font-mono">
                      Type: {anime.type || 'TV'} ({anime.episodes || '?'} eps)
                    </span>
                    
                    <Link
                      href={`/anime/${anime.mal_id}`}
                      className="px-3.5 py-1.5 text-xs font-semibold font-heading rounded-lg bg-anime-sage/10 text-anime-sage hover:bg-anime-sage hover:text-anime-dark transition-all flex items-center gap-1.5 group/btn"
                    >
                      <EyeIcon className="h-3.5 w-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
                      <span>View Details</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

      </main>

      <Footer />
    </div>
  );
}