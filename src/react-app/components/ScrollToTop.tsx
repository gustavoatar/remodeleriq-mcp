import { useEffect } from 'react';
import { useLocation } from 'react-router';

/**
 * ScrollToTop component - resets scroll position on route changes
 * Must be placed inside the Router component
 */
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Scroll to top on route change
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
