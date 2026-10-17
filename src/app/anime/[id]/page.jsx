import httpClient from '@/lib/api';
import AnimeDetailClient from './AnimeDetailClient';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { FilmIcon } from '@heroicons/react/24/outline';

// Dynamic metadata generation based on fetched API data
export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const id = resolvedParams?.id;

  try {
    const response = await httpClient.get(`/anime/${id}`);
    const anime = response.data;
    const title = anime?.title_english || anime?.title || 'Anime Detail';

    return {
      title: `${title} | AnimeLounge`,
      description: anime?.synopsis ? anime.synopsis.slice(0, 160) + '...' : 'Explore anime details and recommendations.',
      openGraph: {
        title: `${title} | AnimeLounge`,
        description: anime?.synopsis ? anime.synopsis.slice(0, 160) + '...' : '',
        images: anime?.image_url ? [anime.image_url] : [],
        type: 'website',
      },
    };
  } catch (err) {
    return {
      title: 'Anime Not Found | AnimeLounge',
      description: 'The requested anime could not be found.',
    };
  }
}

export default async function AnimeDetailPage({ params }) {
  const resolvedParams = await params;
  const id = resolvedParams?.id;

  let anime = null;
  let error = false;

  try {
    const response = await httpClient.get(`/anime/${id}`);
    anime = response.data;
  } catch (err) {
    console.error('Failed to fetch anime details on server:', err);
    error = true;
  }

  if (error || !anime) {
    return (
      <div className="min-h-screen bg-white text-gray-900 dark:bg-anime-dark dark:text-anime-light flex flex-col font-sans transition-colors duration-200">
        <Header />
        <div className="flex-grow flex flex-col items-center justify-center space-y-4 px-6 text-center">
          <FilmIcon className="h-16 w-16 text-gray-400 dark:text-anime-light/30" />
          <h1 className="text-2xl font-bold font-heading">Anime Not Found</h1>
          <p className="text-gray-600 dark:text-anime-light/60 text-sm max-w-md">
            We couldn't retrieve the details for this title. It might not exist in the database or the server is unreachable.
          </p>
          <Link
            href="/anime"
            className="px-6 py-2.5 rounded-xl bg-anime-sage text-anime-dark font-semibold font-heading hover:bg-anime-sage/90 transition-colors shadow-sm"
          >
            Back to Catalog
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return <AnimeDetailClient anime={anime} />;
}