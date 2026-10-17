// components/Loader.jsx
'use client';

const Loader = () => {
  return (
    <div className="flex items-center justify-center min-h-[50vh] w-full bg-white dark:bg-gray-950 transition-colors">
      <div
        role="status"
        aria-label="Loading"
        className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-600 rounded-full animate-spin"
      ></div>
    </div>
  );
};

export default Loader;