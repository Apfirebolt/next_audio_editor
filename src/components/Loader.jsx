'use client';

const Loader = () => {
  return (
    <div className="flex items-center justify-center min-h-[50vh] w-full bg-white dark:bg-anime-dark transition-colors">
      <div
        role="status"
        aria-label="Loading"
        className="w-16 h-16 border-4 border-anime-sage/20 border-t-anime-sage rounded-full animate-spin"
      ></div>
    </div>
  );
};

export default Loader;