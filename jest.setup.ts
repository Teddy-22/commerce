// jest-dom adds custom jest matchers for asserting on DOM nodes
import '@testing-library/jest-dom';

// MSW server setup
import { setupServer } from 'msw/node';
import { handlers } from './__mocks__/handlers';

// Create MSW server with handlers
export const server = setupServer(...handlers);

// Start server before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));

// Reset handlers after each test
afterEach(() => server.resetHandlers());

// Close server after all tests
afterAll(() => server.close());

// Global mock for ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock window.scrollTo
window.scrollTo = jest.fn();

// Set environment variables for testing
process.env.NEXT_PUBLIC_USE_MOCKS = 'true';
process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN = 'dummy';
process.env.SHOPIFY_STORE_DOMAIN = 'mock.myshopify.com';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    pathname: '/',
    query: {},
  })),
  usePathname: jest.fn(() => '/'),
  useSearchParams: jest.fn(() => new URLSearchParams()),
  useParams: jest.fn(() => ({})),
}));

// Mock Next.js image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line jsx-a11y/alt-text, @next/next/no-img-element
    return <img {...props} />;
  },
}));

// Mock Next.js headers
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({
    get: jest.fn(() => ({ value: 'mock-cart-id' })),
    set: jest.fn(),
  })),
  headers: jest.fn(() => ({
    get: jest.fn(() => null),
  })),
}));

// Mock Next.js cache
jest.mock('next/cache', () => ({
  revalidateTag: jest.fn(),
  unstable_cacheTag: jest.fn(),
  unstable_cacheLife: jest.fn(),
}));
