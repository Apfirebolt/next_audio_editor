// lib/api.js
import axios from 'axios';

// Use environment variable for production, fallback to localhost for development
const baseURL = process.env.NEXT_PUBLIC_API_URL || 'https://recommendation.softgenie.org/api/';

const httpClient = axios.create({
  baseURL,
  timeout: 10000, // 10-second timeout so requests don't hang indefinitely if FastAPI is down
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response Interceptor (Crucial for global error catching)
httpClient.interceptors.response.use(
  (response) => {
    // Return successful responses directly
    return response;
  },
  (error) => {
    // Handle backend down or server error states globally
    if (!error.response) {
      console.error('[Network Error] Unable to connect to the FastAPI backend.');
    } else {
      const { status } = error.response;
      if (status >= 500) {
        console.error(`[Server Error] Status ${status}: Internal server issue.`);
      }
    }
    return Promise.reject(error);
  }
);

export default httpClient;