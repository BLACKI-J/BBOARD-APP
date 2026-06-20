import { useCallback, useRef, useState } from 'react';

// Renvoie un ref à poser sur le conteneur scrollable + un booléen `isScrolled`
// qui passe true au-delà de `threshold` px de défilement.
//
// Deux garde-fous contre l'oscillation infinie (l'en-tête repliable est au-dessus
// du flux : le replier réduit la zone scrollable → `scrollTop` se clampe sous le
// seuil → re-déplie → re-replie, surtout quand le contenu est pile à la frontière) :
//   1. HYSTÉRÉSIS (espace) : replie à `threshold`, ne déplie qu'en repassant sous
//      `expandThreshold` (~40 % du seuil) → zone morte.
//   2. COOLDOWN (temps) : après une bascule, ignore tout changement pendant 350 ms.
//      Le clamp parasite arrive en <50 ms → il est absorbé ; un vrai défilement
//      utilisateur (continu) reprend la main ensuite.
//
// Usage :
//   const { scrollRef, isScrolled, onScroll, scrollToTop } = useScrollCollapse(80);
//   <main ref={scrollRef} onScroll={onScroll}>
export function useScrollCollapse(threshold = 80, expandThreshold) {
    const scrollRef = useRef(null);
    const [isScrolled, setIsScrolled] = useState(false);
    const scrolledRef = useRef(false);  // état courant lu sans recréer le callback
    const lockUntil = useRef(0);        // timestamp avant lequel on ignore les changements
    const lowBound = expandThreshold ?? Math.round(threshold * 0.4);

    const onScroll = useCallback(() => {
        const el = scrollRef.current;
        if (!el) return;
        if (Date.now() < lockUntil.current) return; // anti-rebond après une bascule
        const y = el.scrollTop;
        if (!scrolledRef.current && y > threshold) {
            scrolledRef.current = true;
            lockUntil.current = Date.now() + 350;
            setIsScrolled(true);
        } else if (scrolledRef.current && y < lowBound) {
            scrolledRef.current = false;
            lockUntil.current = Date.now() + 350;
            setIsScrolled(false);
        }
    }, [threshold, lowBound]);

    const scrollToTop = useCallback(() => {
        scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);

    return { scrollRef, isScrolled, onScroll, scrollToTop };
}
