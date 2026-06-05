export const ROLE_OPTIONS = [
    'Vacancier', 'Anim', 'AS', 'AP', 'Directeur.trice', 'PDS', 'Gestionnaire de maison', 'Autre/externe'
];

export const EVENT_TYPES = [
    'Faits extérieurs, antérieurs au séjour', 'Hétéro-agressivité', 'Auto-agressivité', 
    'Idées noires / tentatives de suicide', 'Dégâts matériels', 'Dégâts physiques', 
    'Déviances érotisées', 'Problématique médicale (joindre CR médical)'
];

export const INTERNAL_NOTIFIED = ['Directeur.trice', 'Adjoint.e pédagogique', 'Adjoints.es sanitaires', 'Animateurs.trices'];
export const EXTERNAL_NOTIFIED = ['Parent(s) ou tuteur vacancier', 'Structure du vacancier', 'CEC 1000&&UN Loisirs'];

export const createPerson = () => ({ firstName: '', lastName: '', role: 'Anim' });

export const defaultForm = () => ({
    stayName: '', directorName: '',
    eventDate: new Date().toISOString().split('T')[0],
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
    externalNotifiedDate: new Date().toISOString().split('T')[0],
    details: '',
    signedAt: '',
    signedOn: new Date().toISOString().split('T')[0],
    signatures: ''
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

export const roleChecklist = (selectedRole, options) => (
    options.map((role) => `${selectedRole === role ? '[x]' : '[ ]'} ${role}`).join('  ')
);

export const eventChecked = (data, label) => data.eventTypes?.includes(label);

export const legendItems = [
    { key: 'white', short: 'Blanc', label: 'Evenement sans gravite', color: '#ffffff' },
    { key: 'blue', short: 'Bleu', label: 'Problematique medicale (joindre CR medical)', color: '#2563eb' },
    { key: 'green', short: 'Vert', label: 'Problematique sexuelle a surveiller', color: '#16a34a' },
    { key: 'yellow', short: 'Jaune', label: 'Comportement a surveiller (fugue, etc...)', color: '#eab308' },
    { key: 'red', short: 'Rouge', label: 'Probleme de violence et/ou degradation intentionnelle', color: '#dc2626' }
];
