import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import Sidebar from './Sidebar';

// Mock the AuthContext
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { name: 'Test User', role: 'intern' },
    isAdmin: false,
    isSuperAdmin: false,
    isIntern: true,
    userTheme: 'intern',
    logout: vi.fn(),
    updateProfile: vi.fn(),
  }),
}));

describe('Sidebar Component', () => {
  it('renders correctly for intern role', () => {
    render(
      <BrowserRouter>
        <Sidebar mobileOpen={false} setMobileOpen={vi.fn()} />
      </BrowserRouter>
    );

    // Should show Dashboard
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    
    // Should show Intern-specific menus like "Daily Task" for interns
    expect(screen.getByText('Daily Task')).toBeInTheDocument();
    
    // Should NOT show admin menus
    expect(screen.queryByText('Approval Center')).not.toBeInTheDocument();
  });
});
