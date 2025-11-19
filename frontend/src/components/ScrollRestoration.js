import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * ScrollRestoration Component
 * Restores scroll position when navigating back to a page
 */
const ScrollRestoration = () => {
  const location = useLocation();

  useEffect(() => {
    // Save scroll position before leaving
    const saveScrollPosition = () => {
      const scrollPosition = {
        x: window.scrollX,
        y: window.scrollY,
        path: location.pathname
      };
      sessionStorage.setItem(`scroll_${location.pathname}`, JSON.stringify(scrollPosition));
    };

    // Restore scroll position when arriving
    const restoreScrollPosition = () => {
      const savedPosition = sessionStorage.getItem(`scroll_${location.pathname}`);
      
      if (savedPosition) {
        try {
          const { x, y } = JSON.parse(savedPosition);
          // Use setTimeout to ensure DOM is fully rendered
          setTimeout(() => {
            window.scrollTo(x, y);
          }, 100);
        } catch (e) {
          console.error('Error restoring scroll position:', e);
        }
      } else {
        // If no saved position, scroll to top
        window.scrollTo(0, 0);
      }
    };

    // Restore position on mount
    restoreScrollPosition();

    // Save position on scroll
    const handleScroll = () => {
      saveScrollPosition();
    };

    // Throttle scroll event for performance
    let scrollTimeout;
    const throttledHandleScroll = () => {
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
      scrollTimeout = setTimeout(handleScroll, 150);
    };

    window.addEventListener('scroll', throttledHandleScroll);
    
    // Save position before unmount
    return () => {
      window.removeEventListener('scroll', throttledHandleScroll);
      saveScrollPosition();
    };
  }, [location.pathname]);

  return null;
};

export default ScrollRestoration;
