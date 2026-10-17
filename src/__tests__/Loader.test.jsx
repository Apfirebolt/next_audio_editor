import { render, screen } from '@testing-library/react';
import Loader from '@/components/Loader';

describe('Loader Component', () => {
  it('renders an accessible loading status with the spinner styles', () => {
    const { container } = render(<Loader />);

    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument();
    expect(container.firstChild).toHaveClass('min-h-[50vh]', 'w-full');
    expect(screen.getByRole('status')).toHaveClass('animate-spin', 'rounded-full');
  });
});