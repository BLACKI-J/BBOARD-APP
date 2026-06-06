import { useCallback, useRef, useState } from 'react';

// Returns a ref to attach to the scroll container + a boolean `isScrolled`
// that becomes true when scrollTop exceeds `threshold` px.
// Usage:
//   const { scrollRef, isScrolled, scrollToTop } = useScrollCollapse(80);
//   <main ref={scrollRef} onScroll={onScroll}>
export function useScrollCollapse(threshold = 80) {
    const scrollRef = useRef(null);
    const [isScrolled, setIsScrolled] = useState(false);

    const onScroll = useCallback(() => {
        const el = scrollRef.current;
        if (!el) return;
        setIsScrolled(el.scrollTop > threshold);
    }, [threshold]);

    const scrollToTop = useCallback(() => {
        scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);

    return { scrollRef, isScrolled, onScroll, scrollToTop };
}
