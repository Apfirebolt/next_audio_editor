// app/layout.jsx
import "./globals.css";
import './main.css';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export const metadata = {
  title: "AnimeLounge | AI-Powered Anime & Manga Recommendations",
  description: "A modern multi-domain recommendation platform for anime powered by intelligent similarity vectors.",
};

const MainLayout = ({ children }) => {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-sand">
        <ToastContainer />
        {children}
      </body>
    </html>
  );
};

export default MainLayout;