"use client";

import { useEffect } from "react";
import AOS from "aos";
import "aos/dist/aos.css";
import "./globals.css";
import './main.css';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function RootLayout({ children }) {
  useEffect(() => {
    AOS.init({
      duration: 800,
      once: true,
      easing: "ease-out-cubic",
    });
  }, []);

  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body className="bg-light dark:bg-dark text-dark dark:text-light font-sans selection:bg-primary selection:text-white transition-colors">
        <ToastContainer position="bottom-right" theme="dark" />
        {children}
      </body>
    </html>
  );
}