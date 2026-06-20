// Helpers de date LOCALE. À utiliser au lieu de toISOString()/new Date('YYYY-MM-DD')
// qui interprètent en UTC → décalage d'un jour près de minuit en fuseau positif
// (la saison colo = été = UTC+2, donc bug réel entre 00 h et 02 h).

const p = (n) => String(n).padStart(2, '0');

// Date du jour au format YYYY-MM-DD, en heure locale.
export const todayISO = () => {
    const d = new Date();
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

// Parse une chaîne YYYY-MM-DD en Date locale (minuit local), pas UTC.
export const parseISO = (s) => new Date(`${s}T00:00:00`);
