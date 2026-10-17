import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Footer from '@/components/Footer';

// Mock Next.js Link component to render as a standard HTML anchor tag for testing
jest.mock('next/link', () => {
  return ({ children, href }) => <a href={href}>{children}</a>;
});

describe('Footer Component', () => {
  
  it('renders the brand title and description', () => {
    render(<Footer />);
    
    expect(screen.getByRole('link', { name: /Anime\s*Lounge/i })).toHaveAttribute('href', '/');
    expect(screen.getByText(/A modern multi-domain recommendation platform/i)).toBeInTheDocument();
  });

  it('renders all discovery links with correct paths', () => {
    render(<Footer />);
    
    expect(screen.getByRole('link', { name: /^Anime$/i })).toHaveAttribute('href', '/anime');
    expect(screen.getByRole('link', { name: /^Manga$/i })).toHaveAttribute('href', '/manga');
    expect(screen.getByRole('link', { name: /^Compare$/i })).toHaveAttribute('href', '/compare');
  });

  it('renders system and algorithm links correctly', () => {
    render(<Footer />);
    
    expect(screen.getByRole('link', { name: /Similarity Engine/i })).toHaveAttribute('href', '/algorithm');
    
    const githubLink = screen.getByRole('link', { name: /GitHub Repository/i });
    expect(githubLink).toHaveAttribute('href', 'https://github.com');
    expect(githubLink).toHaveAttribute('target', '_blank');
  });

  it('renders the newsletter input form and submit button', () => {
    render(<Footer />);
    
    const emailInput = screen.getByPlaceholderText(/Enter your email/i);
    const joinButton = screen.getByRole('button', { name: /Join/i });

    expect(emailInput).toBeInTheDocument();
    expect(emailInput).toHaveAttribute('type', 'email');
    expect(joinButton).toBeInTheDocument();
    expect(joinButton).toHaveAttribute('type', 'submit');
  });

  it('renders dynamic copyright year and legal policy links', () => {
    render(<Footer />);
    
    const currentYear = new Date().getFullYear().toString();
    expect(screen.getByText(new RegExp(currentYear, 'i'))).toBeInTheDocument();
    
    expect(screen.getByRole('link', { name: /Privacy Policy/i })).toHaveAttribute('href', '/privacy');
    expect(screen.getByRole('link', { name: /Terms of Service/i })).toHaveAttribute('href', '/terms');
  });

});