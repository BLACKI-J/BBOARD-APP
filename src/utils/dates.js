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

// Une activité est « passée » quand son heure de fin (à défaut, de début) est
// antérieure à maintenant → sert à griser automatiquement le passé (Planning, accueil).
export const isActivityPast = (activity, nowMs = Date.now()) => {
    const t = activity?.endTime || activity?.startTime;
    if (!activity?.date || !t) return false;
    const end = new Date(`${activity.date}T${t}`).getTime();
    return Number.isFinite(end) && end < nowMs;
};
