// app/anime/page.jsx
import AnimeCatalogClient from './AnimeCatalogClient';

export const metadata = {
  title: 'Anime Catalog & Recommendation Engine | AnimeLounge',
  description: 'Explore thousands of anime titles indexed with advanced multi-criteria filters, genres, ratings, and similarity vectors.',
  openGraph: {
    title: 'Anime Catalog | AnimeLounge',
    description: 'Explore titles indexed by our similarity engine with advanced multi-criteria filters.',
    type: 'website',
  },
};

export default function AnimeCatalogPage() {
  return <AnimeCatalogClient />;
}