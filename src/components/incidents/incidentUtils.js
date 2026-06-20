import { todayISO } from '../../utils/dates';

export const ROLE_OPTIONS = [
    'Vacancier', 'Anim', 'AS', 'AP', 'Directeur.trice', 'PDS', 'Gestionnaire de maison', 'Autre/externe'
];

export const EVENT_TYPES = [
    'Faits extérieurs, antérieurs au séjour', 'Hétéro-agressivité', 'Auto-agressivité', 
    'Idées noires / tentatives de suicide', 'Dégâts matériels', 'Dégâts physiques', 
    'Déviances érotisées', 'Problématique médicale (joindre CR médical)'
];

export const createPerson = () => ({ firstName: '', lastName: '', role: 'Anim' });

export const defaultForm = () => ({
    stayName: '', directorName: '',
    eventDate: todayISO(),
    eventTime: '14:00',
    severity: 'white',
    eventTypes: [],
    otherEventType: '',
    reporters: [createPerson(), createPerson()],
    concerned: [createPerson(), createPerson()],
    notifiedInternal: {},
    notifiedExternal: {},
    externalOthers: '',
    externalNotifiedBy: '',
    externalNotifiedDate: todayISO(),
    details: '',
    signedOn: todayISO()
});

export const severityLabels = {
    white: 'Blanc - Evènement sans gravité',
    blue: 'Bleu - Problématique médicale',
    green: 'Vert - Problématique sexuelle',
    yellow: 'Jaune - Comportement à surveiller',
    red: 'Rouge - Violence / Dégradation'
};

export const severityColors = {
    white: 'var(--text-muted)',
    blue: 'oklch(62% 0.18 232)',
    green: 'oklch(62% 0.18 145)',
    yellow: 'oklch(71% 0.19 45)',
    red: 'oklch(62% 0.18 25)'
};

export const eventChecked = (data, label) => data.eventTypes?.includes(label);
