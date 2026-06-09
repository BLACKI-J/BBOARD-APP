import { useState, useEffect } from 'react';

// Renvoie true si la largeur de fenêtre est sous le breakpoint (1024 par défaut).
// Écoute le resize. Centralise la logique dupliquée (Directory, Schedule, …).
export default function useIsMobile(breakpoint = 1024) {
    const [isMobile, setIsMobile] = useState(
        typeof window !== 'undefined' ? window.innerWidth < breakpoint : false
    );
    useEffect(() => {
        const onResize = () => setIsMobile(window.innerWidth < breakpoint);
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, [breakpoint]);
    return isMobile;
}
