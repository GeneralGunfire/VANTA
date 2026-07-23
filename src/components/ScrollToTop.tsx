import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Scroll window and document body/documentElement to top
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.body.scrollTo({ top: 0, left: 0, behavior: 'instant' });

    // Also reset scroll on all scrollable container elements in the DOM
    const scrollableElements = document.querySelectorAll('.overflow-y-auto, .overflow-auto, [class*="overflow-y-auto"]');
    scrollableElements.forEach((el) => {
      el.scrollTop = 0;
    });
  }, [pathname]);

  return null;
}
