import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Header from '@/components/Header';
import { usePathname } from 'next/navigation';

// Mock Next.js navigation hooks and Link component
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}));

jest.mock('next/link', () => {
  return ({ children, href, className, onClick }) => (
    <a href={href} className={className} onClick={onClick}>
      {children}
    </a>
  );
});

describe('Header Component', () => {
  const mockUsePathname = usePathname;

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    document.documentElement.className = '';
  });

  it('renders the brand logo and navigation items correctly', () => {
    mockUsePathname.mockReturnValue('/');
    render(<Header />);

    expect(screen.getByRole('link', { name: /Anime\s*Lounge/i })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: 'Anime' })).toHaveAttribute('href', '/anime');
    expect(screen.getByRole('link', { name: 'Manga' })).toHaveAttribute('href', '/manga');
    expect(screen.getByRole('link', { name: 'Compare' })).toHaveAttribute('href', '/compare');
  });

  it('highlights the active route based on pathname', () => {
    mockUsePathname.mockReturnValue('/anime');
    render(<Header />);

    const animeLink = screen.getByRole('link', { name: 'Anime' });
    // Active class checks for background highlight
    expect(animeLink).toHaveClass('bg-anime-sage');
  });

  it('toggles theme between dark and light mode', () => {
    mockUsePathname.mockReturnValue('/');
    render(<Header />);

    const themeButton = screen.getByRole('button', { name: /Toggle theme/i });
    
    // Initial mount defaults to dark mode
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    // Click to switch to light mode
    fireEvent.click(themeButton);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(localStorage.getItem('theme')).toBe('light');

    // Click to switch back to dark mode
    fireEvent.click(themeButton);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(localStorage.getItem('theme')).toBe('dark');
  });

  it('opens and closes the mobile menu when clicking the toggle button', () => {
    mockUsePathname.mockReturnValue('/');
    render(<Header />);

    // Mobile menu should be hidden initially
    const mobileMenuButton = screen.getByRole('button', { name: /Toggle mobile menu/i });
    
    // Open mobile menu
    fireEvent.click(mobileMenuButton);
    
    // Check if mobile dropdown links are visible
    const mobileLinks = screen.getAllByRole('link', { name: /Home/i });
    expect(mobileLinks.length).toBeGreaterThan(1); // One for desktop, one for mobile dropdown

    // Close the mobile menu by toggling it again.
    fireEvent.click(mobileMenuButton);
    expect(screen.getAllByRole('link', { name: 'Home' })).toHaveLength(1);
  });

  it('closes the mobile menu when the route changes', () => {
    mockUsePathname.mockReturnValue('/');
    const { rerender } = render(<Header />);

    fireEvent.click(screen.getByRole('button', { name: /Toggle mobile menu/i }));
    expect(screen.getAllByRole('link', { name: 'Home' })).toHaveLength(2);

    mockUsePathname.mockReturnValue('/anime');
    rerender(<Header />);

    expect(screen.getAllByRole('link', { name: 'Home' })).toHaveLength(1);
  });

  it('initializes the theme from the saved preference', () => {
    localStorage.setItem('theme', 'light');
    mockUsePathname.mockReturnValue('/');

    render(<Header />);

    expect(document.documentElement).not.toHaveClass('dark');
  });
});