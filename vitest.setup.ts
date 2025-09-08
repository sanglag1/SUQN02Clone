// @ts-nocheck
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock next/navigation
vi.mock('next/navigation', () => {
  return {
    useRouter: () => ({
      push: vi.fn(),
      replace: vi.fn(),
      prefetch: vi.fn(),
    }),
  };
});

// Mock Clerk hooks minimally
vi.mock('@clerk/nextjs', () => {
  return {
    useUser: () => ({ user: null, isSignedIn: false, isLoaded: true }),
    useSignIn: () => ({ signIn: { create: vi.fn(), authenticateWithRedirect: vi.fn() }, setActive: vi.fn(), isLoaded: true }),
    useSignUp: () => ({ signUp: { create: vi.fn(), prepareEmailAddressVerification: vi.fn(), attemptEmailAddressVerification: vi.fn(), authenticateWithRedirect: vi.fn() }, setActive: vi.fn(), isLoaded: true }),
    useAuth: () => ({ signOut: vi.fn() }),
    ClerkProvider: ({ children }: { children: React.ReactNode }) => children,
    UserButton: () => null,
  };
});


