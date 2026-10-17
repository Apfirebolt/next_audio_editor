// app/layout.jsx
import "./globals.css";
import './main.css';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export const metadata = {
  title: "Beats Lounge | AI-Powered Music & Audio Editing",
  description: "Edit and create music effortlessly with AI-powered tools at Beats Lounge.",
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