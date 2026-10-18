import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext'
import { LocationProvider } from './context/LocationContext'
import { CartProvider } from './context/CartContext'
import { ThemeProvider } from './context/ThemeContext'
import "maplibre-gl/dist/maplibre-gl.css"

// Initialize theme from localStorage on startup
(function initTheme() {
  try {
    const savedTheme = localStorage.getItem('tiffinlink_theme') || 'light';
    const root = document.documentElement;
    if (savedTheme === 'dark' || (savedTheme === 'system' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
    } else {
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
    }

    if (localStorage.getItem('tiffinlink_compact') === 'true') {
      root.classList.add('compact-density');
    }
    if (localStorage.getItem('tiffinlink_reduce_motion') === 'true') {
      root.classList.add('reduce-motion');
    }
    const savedLang = localStorage.getItem('tiffinlink_language');
    if (savedLang) {
      root.lang = savedLang === 'gu_IN' ? 'gu' : savedLang === 'hi_IN' ? 'hi' : 'en';
    }
  } catch (e) {}
})();

// Complete Cross-Platform Anti-Inspect Shield (Desktop, Laptop, Tablet, Mobile)
(function setupAntiInspect() {
  if (typeof window === 'undefined') return;

  const preventEvent = (e) => {
    e.preventDefault();
    e.stopPropagation();
    return false;
  };

  // 1. Disable Right-Click Context Menu & Mobile Hold Callouts
  window.addEventListener('contextmenu', preventEvent, { capture: true });
  document.addEventListener('contextmenu', preventEvent, { capture: true });

  // 2. Disable Keyboard Shortcuts (F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C, Ctrl+U, etc.)
  const handleKeydown = (e) => {
    // F12
    if (e.key === 'F12' || e.keyCode === 123) {
      return preventEvent(e);
    }

    const isCtrlOrCmd = e.ctrlKey || e.metaKey;

    // Ctrl/Cmd + Shift + (I, J, C, K, E, S)
    if (isCtrlOrCmd && e.shiftKey) {
      const k = (e.key || '').toUpperCase();
      const c = e.keyCode;
      if (['I', 'J', 'C', 'K', 'E', 'S'].includes(k) || [73, 74, 67, 75, 69, 83].includes(c)) {
        return preventEvent(e);
      }
    }

    // Ctrl/Cmd + (U = View Source, S = Save Page)
    if (isCtrlOrCmd && !e.shiftKey) {
      const k = (e.key || '').toUpperCase();
      const c = e.keyCode;
      if (['U', 'S'].includes(k) || [85, 83].includes(c)) {
        return preventEvent(e);
      }
    }

    // macOS Alt + Cmd + (I, J, C)
    if (e.altKey && (e.metaKey || e.ctrlKey)) {
      const k = (e.key || '').toUpperCase();
      const c = e.keyCode;
      if (['I', 'J', 'C'].includes(k) || [73, 74, 67].includes(c)) {
        return preventEvent(e);
      }
    }
  };

  window.addEventListener('keydown', handleKeydown, { capture: true });
  document.addEventListener('keydown', handleKeydown, { capture: true });

  // 3. Prevent dragging non-input content
  window.addEventListener('dragstart', (e) => {
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) {
      return true;
    }
    e.preventDefault();
    return false;
  }, { capture: true });
})();

// Global fetch interceptor to automatically attach JWT authorization headers and credentials to API calls
(function setupGlobalFetchInterceptor() {
  if (typeof window === 'undefined' || !window.fetch) return;
  const originalFetch = window.fetch.bind(window);
  window.fetch = async function (input, init = {}) {
    let url = typeof input === 'string' ? input : (input && input.url ? input.url : '');
    const isApiRequest = url.includes(':5000') || url.startsWith('/api') || url.includes('/api/');

    if (isApiRequest) {
      const token = localStorage.getItem('tiffinlink_access_token') || localStorage.getItem('tiffinlink_token') || localStorage.getItem('token');
      const customHeaders = init.headers ? new Headers(init.headers) : (input && input.headers ? new Headers(input.headers) : new Headers());

      if (token && !customHeaders.has('Authorization')) {
        customHeaders.set('Authorization', `Bearer ${token}`);
      }

      const newInit = {
        ...init,
        headers: customHeaders,
        credentials: init.credentials || 'include'
      };

      return originalFetch(input, newInit);
    }

    return originalFetch(input, init);
  };
})();


class RootErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Root App Error Boundary caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          backgroundColor: '#F4F7F5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            padding: '32px',
            maxWidth: '500px',
            width: '100%',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
            border: '2px solid #FCA5A5',
            textAlign: 'center'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: '#FEE2E2',
              color: '#DC2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
              margin: '0 auto 16px auto'
            }}>
              ⚠️
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#111827', margin: '0 0 10px 0' }}>
              We hit a temporary display hiccup
            </h2>
            <p style={{ fontSize: '14px', color: '#4B5563', margin: '0 0 24px 0', lineHeight: '1.6' }}>
              Your account, orders, and data are completely secure. A display issue interrupted this view. Click below to refresh or return to the home screen.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.reload();
                }}
                style={{
                  backgroundColor: '#1a1a1a',
                  color: '#ffffff',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '12px',
                  fontWeight: '700',
                  fontSize: '13px',
                  cursor: 'pointer',
                  letterSpacing: '0.5px',
                  textTransform: 'uppercase'
                }}
              >
                🔄 Refresh Page
              </button>
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.hash = '#home';
                  window.location.reload();
                }}
                style={{
                  backgroundColor: '#f5f3ef',
                  color: '#1a1a1a',
                  border: '1px solid #ded9d1',
                  padding: '12px 24px',
                  borderRadius: '12px',
                  fontWeight: '700',
                  fontSize: '13px',
                  cursor: 'pointer',
                  letterSpacing: '0.5px',
                  textTransform: 'uppercase'
                }}
              >
                🏠 Go to Home
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RootErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <LocationProvider>
            <CartProvider>
              <App />
            </CartProvider>
          </LocationProvider>
        </AuthProvider>
      </ThemeProvider>
    </RootErrorBoundary>
  </StrictMode>,
)
