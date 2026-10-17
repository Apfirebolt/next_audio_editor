import { Suspense } from 'react';
import VibeSearchClient from './VibeSearchClient';
import Loader from '@/components/Loader';

export async function generateMetadata({ searchParams }) {
  const resolvedParams = await searchParams;
  const query = resolvedParams?.q;

  if (query) {
    return {
      title: `Anime Vibe Search: "${query}" | AnimeLounge`,
      description: `Explore AI-recommended anime matching the vibe: "${query}" using semantic similarity vectors.`,
      openGraph: {
        title: `Anime Vibe Search: "${query}" | AnimeLounge`,
        description: `Explore AI-recommended anime matching the vibe: "${query}"`,
        type: 'website',
      },
    };
  }

  return {
    title: 'AI Anime Vibe Search - Describe & Discover Anime | AnimeLounge',
    description: 'Use our AI semantic vector search engine to find anime matching any plot, mood, or character trope you describe in plain English.',
    openGraph: {
      title: 'AI Anime Vibe Search | AnimeLounge',
      description: 'Discover anime matching your custom descriptions using sentence embeddings and cosine similarity.',
      type: 'website',
    },
  };
}

export default function VibeSearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white dark:bg-anime-dark flex items-center justify-center">
        <Loader />
      </div>
    }>
      <VibeSearchClient />
    </Suspense>
  );
}