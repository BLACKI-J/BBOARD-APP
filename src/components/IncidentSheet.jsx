import React, { useEffect, useState } from 'react';
import { AlertTriangle, Save, Printer, Trash2, Eye, ArrowLeft, Plus, History, Sparkles, CheckCircle2, ShieldAlert, FileText, ChevronRight, Users, MapPin, User, Calendar, Clock, Check } from 'lucide-react';
import { useUi } from '../ui/UiProvider';

const ROLE_OPTIONS = [
    'Vacancier', 'Anim', 'AS', 'AP', 'Directeur.trice', 'PDS', 'Gestionnaire de maison', 'Autre/externe'
];

const EVENT_TYPES = [
    'Faits extérieurs, antérieurs au séjour', 'Hétéro-agressivité', 'Auto-agressivité', 
    'Idées noires / tentatives de suicide', 'Dégâts matériels', 'Dégâts physiques', 
    'Déviances érotisées', 'Problématique médicale (joindre CR médical)'
];

const INTERNAL_NOTIFIED = ['Directeur.trice', 'Adjoint.e pédagogique', 'Adjoints.es sanitaires', 'Animateurs.trices'];
const EXTERNAL_NOTIFIED = ['Parent(s) ou tuteur vacancier', 'Structure du vacancier', 'CEC 1000&&UN Loisirs'];

const createPerson = () => ({ firstName: '', lastName: '', role: 'Anim' });

const defaultForm = () => ({
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

const severityLabels = {
    white: 'Blanc - Evènement sans gravité',
    blue: 'Bleu - Problématique médicale',
    green: 'Vert - Problématique sexuelle',
    yellow: 'Jaune - Comportement à surveiller',
    red: 'Rouge - Violence / Dégradation'
};

const severityColors = {
    white: 'var(--text-muted)',
    blue: 'oklch(62% 0.18 232)',
    green: 'oklch(62% 0.18 145)',
    yellow: 'oklch(71% 0.19 45)',
    red: 'oklch(62% 0.18 25)'
};

const roleChecklist = (selectedRole, options) => (
    options.map((role) => `${selectedRole === role ? '[x]' : '[ ]'} ${role}`).join('  ')
);

const eventChecked = (data, label) => data.eventTypes?.includes(label);

const legendItems = [
    { key: 'white', short: 'Blanc', label: 'Evenement sans gravite', color: '#ffffff' },
    { key: 'blue', short: 'Bleu', label: 'Problematique medicale (joindre CR medical)', color: '#2563eb' },
    { key: 'green', short: 'Vert', label: 'Problematique sexuelle a surveiller', color: '#16a34a' },
    { key: 'yellow', short: 'Jaune', label: 'Comportement a surveiller (fugue, etc...)', color: '#eab308' },
    { key: 'red', short: 'Rouge', label: 'Probleme de violence et/ou degradation intentionnelle', color: '#dc2626' }
];

const PrintContent = ({ data }) => {
    const RoleCheckboxesStaff = ({ selected }) => (
        <div style={{ lineHeight: '1.5', textAlign: 'center' }}>
            <div>{selected === 'Anim'?'☒':'☐'} Anim {selected === 'AS'?'☒':'☐'} AS {selected === 'AP'?'☒':'☐'} AP {selected === 'Directeur.trice'?'☒':'☐'} Directeur.trice</div>
            <div>{selected === 'PDS'?'☒':'☐'} PDS {selected === 'Gestionnaire de maison'?'☒':'☐'} Gestionnaire de maison {selected === 'Autre/externe'?'☒':'☐'} Autre/externe</div>
        </div>
    );
    const RoleCheckboxesAll = ({ selected }) => (
        <div style={{ lineHeight: '1.5', textAlign: 'center' }}>
            <div>{selected === 'Vacancier'?'☒':'☐'} Vacancier {selected === 'Anim'?'☒':'☐'} Anim {selected === 'AS'?'☒':'☐'} AS {selected === 'AP'?'☒':'☐'} AP {selected === 'Directeur.trice'?'☒':'☐'} Directeur.trice</div>
            <div>{selected === 'PDS'?'☒':'☐'} PDS {selected === 'Gestionnaire de maison'?'☒':'☐'} Gestionnaire de maison {selected === 'Autre/externe'?'☒':'☐'} Autre/externe</div>
        </div>
    );

    return (
        <div style={{ fontFamily: 'Arial, sans-serif', color: 'black', fontSize: '12px', lineHeight: 1.25 }}>
            <style dangerouslySetInnerHTML={{__html: "@import url('https://fonts.googleapis.com/css2?family=Yanone+Kaffeesatz:wght@400;500&display=swap');"}} />
            
            {/* --- PAGE 1 --- */}
            <div className="fei-page" style={{ position: 'relative', width: '210mm', height: '297mm', padding: '10mm', boxSizing: 'border-box', background: 'white', pageBreakAfter: 'always' }}>
                
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' }}>
                    <div style={{ position: 'absolute', left: '10mm', top: '10mm' }}>
                        <img src="/logo/logo.png" alt="" style={{ height: '55px', objectFit: 'contain' }} />
                    </div>
                    <h1 style={{ fontFamily: '"Yanone Kaffeesatz", sans-serif', fontSize: '42px', color: '#1e3a8a', margin: '20px 0 0 0', fontWeight: 400, letterSpacing: '2px', textTransform: 'uppercase' }}>
                        FEUILLE D'ÉVÉNEMENT INDÉSIRABLE
                    </h1>
                </div>
                
                <div style={{ borderTop: '2.5px solid #1e3a8a', marginBottom: '15px' }}></div>

                <table style={{ width: '100%', borderCollapse: 'collapse', border: '1.5px solid #1e3a8a', marginBottom: '15px' }}>
                    <thead>
                        <tr>
                            <td colSpan={4} style={{ borderBottom: '1.5px solid #1e3a8a', textAlign: 'center', fontWeight: 'bold', padding: '4px', fontSize: '12px', color: '#1e3a8a' }}>
                                COCHER LA PASTILLE ADÉQUATE
                            </td>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style={{ borderRight: '1.5px solid #1e3a8a', padding: '4px 8px', verticalAlign: 'middle', width: '30%' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                    <div style={{ width: '26px', height: '18px', borderRadius: '12px', border: '1.5px solid black', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 'bold', flexShrink: 0 }}>
                                        {data.severity === 'white' ? '☒' : 'Blanc'}
                                    </div>
                                    <div style={{ fontSize: '10px', fontWeight: 'bold' }}>Évènement sans gravité</div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div style={{ width: '26px', height: '18px', borderRadius: '12px', border: '1.5px solid black', background: '#3b82f6', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 'bold', flexShrink: 0 }}>
                                        {data.severity === 'blue' ? '☒' : 'Bleu'}
                                    </div>
                                    <div style={{ fontSize: '10px', fontWeight: 'bold' }}>Problématique médicale<br/>(joindre CR médical)</div>
                                </div>
                            </td>
                            <td style={{ borderRight: '1.5px solid #1e3a8a', padding: '8px', verticalAlign: 'middle', width: '24%' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div style={{ width: '26px', height: '18px', borderRadius: '12px', border: '1.5px solid black', background: '#22c55e', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 'bold', flexShrink: 0 }}>
                                        {data.severity === 'green' ? '☒' : 'Vert'}
                                    </div>
                                    <div style={{ fontSize: '10px', fontWeight: 'bold' }}>Problématique<br/>sexuelle à surveiller</div>
                                </div>
                            </td>
                            <td style={{ borderRight: '1.5px solid #1e3a8a', padding: '8px', verticalAlign: 'middle', width: '23%' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div style={{ width: '26px', height: '18px', borderRadius: '12px', border: '1.5px solid black', background: '#eab308', color: 'black', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 'bold', flexShrink: 0 }}>
                                        {data.severity === 'yellow' ? '☒' : 'Jaune'}
                                    </div>
                                    <div style={{ fontSize: '10px', fontWeight: 'bold' }}>Comportement à<br/>surveiller (fugue, etc...)</div>
                                </div>
                            </td>
                            <td style={{ padding: '8px', verticalAlign: 'middle', width: '23%' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div style={{ width: '26px', height: '18px', borderRadius: '12px', border: '1.5px solid black', background: '#ef4444', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 'bold', flexShrink: 0 }}>
                                        {data.severity === 'red' ? '☒' : 'Rouge'}
                                    </div>
                                    <div style={{ fontSize: '10px', fontWeight: 'bold' }}>Problème de<br/>violence et/ou dégradation<br/>intentionnelle</div>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
                
                <div style={{ borderBottom: '2.5px solid #1e3a8a', marginBottom: '15px' }}></div>

                <table style={{ width: '100%', borderCollapse: 'collapse', border: '1.5px solid black', marginBottom: '10px' }}>
                    <tbody>
                        <tr>
                            <td style={{ borderRight: '1.5px solid black', padding: '4px 6px', width: '50%', fontSize: '12px' }}>
                                Séjour de : <span style={{ marginLeft: '10px' }}>{data.stayName}</span>
                            </td>
                            <td style={{ padding: '4px 6px', width: '50%', fontSize: '12px' }}>
                                Directeur-trice : <span style={{ marginLeft: '10px' }}>{data.directorName}</span>
                            </td>
                        </tr>
                    </tbody>
                </table>

                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '15px', fontSize: '11px' }}>
                    <thead>
                        <tr style={{ background: 'black', color: 'white' }}>
                            <th style={{ border: '1.5px solid black', width: '20%' }}></th>
                            <th style={{ border: '1.5px solid black', padding: '4px', width: '20%' }}>NOM</th>
                            <th style={{ border: '1.5px solid black', padding: '4px', width: '20%' }}>PRENOM</th>
                            <th style={{ border: '1.5px solid black', padding: '4px', width: '40%' }}>FONCTION | QUALITÉ</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.reporters.map((person, i) => (
                            <tr key={`rep-${i}`}>
                                {i === 0 && <td rowSpan={data.reporters.length} style={{ border: '1.5px solid black', textAlign: 'center', fontWeight: 'bold', padding: '4px' }}>Personnes<br/>déclarantes</td>}
                                <td style={{ border: '1.5px solid black', padding: '4px' }}>{person.lastName}</td>
                                <td style={{ border: '1.5px solid black', padding: '4px' }}>{person.firstName}</td>
                                <td style={{ border: '1.5px solid black', padding: '2px 4px', fontSize: '9px' }}>
                                    <RoleCheckboxesStaff selected={person.role} />
                                </td>
                            </tr>
                        ))}
                        {data.concerned.map((person, i) => (
                            <tr key={`con-${i}`}>
                                {i === 0 && <td rowSpan={data.concerned.length} style={{ border: '1.5px solid black', textAlign: 'center', fontWeight: 'bold', padding: '4px' }}>Personnes<br/>concernées par<br/>l'événement</td>}
                                <td style={{ border: '1.5px solid black', padding: '4px' }}>{person.lastName}</td>
                                <td style={{ border: '1.5px solid black', padding: '4px' }}>{person.firstName}</td>
                                <td style={{ border: '1.5px solid black', padding: '2px 4px', fontSize: '9px' }}>
                                    <RoleCheckboxesAll selected={person.role} />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '12px', padding: '0 5px', marginBottom: '5px' }}>
                    <div>Date de l'événement : &nbsp;&nbsp;&nbsp;{data.eventDate ? new Date(data.eventDate).toLocaleDateString('fr-FR') : ' / / '}</div>
                    <div>Heure de l'événement : &nbsp;&nbsp;&nbsp;{data.eventTime ? data.eventTime : ''} H</div>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', border: '1.5px solid black', marginBottom: '15px', fontSize: '11px' }}>
                    <tbody>
                        <tr>
                            <td style={{ borderRight: '1px solid black', padding: '8px', width: '33%', verticalAlign: 'top' }}>
                                <div style={{ marginBottom: '12px' }}>{eventChecked(data, EVENT_TYPES[0]) ? '●' : '•'} Faits extérieurs, antérieurs au<br/>&nbsp;&nbsp;&nbsp;&nbsp;séjour.</div>
                                <div style={{ marginBottom: '12px' }}>{eventChecked(data, EVENT_TYPES[3]) ? '●' : '•'} Idées noires / tentatives de<br/>&nbsp;&nbsp;&nbsp;&nbsp;suicide</div>
                                <div>{eventChecked(data, EVENT_TYPES[6]) ? '●' : '•'} Déviances érotisées</div>
                            </td>
                            <td style={{ borderRight: '1px solid black', padding: '8px', width: '33%', verticalAlign: 'top' }}>
                                <div style={{ marginBottom: '22px' }}>{eventChecked(data, EVENT_TYPES[1]) ? '●' : '•'} Hétéro-agressivité</div>
                                <div style={{ marginBottom: '22px' }}>{eventChecked(data, EVENT_TYPES[4]) ? '●' : '•'} Dégâts matériels</div>
                                <div>{eventChecked(data, EVENT_TYPES[7]) ? '●' : '•'} Problématique médicale<br/>&nbsp;&nbsp;&nbsp;&nbsp;(joindre CR médical)</div>
                            </td>
                            <td style={{ padding: '8px', width: '34%', verticalAlign: 'top' }}>
                                <div style={{ marginBottom: '22px' }}>{eventChecked(data, EVENT_TYPES[2]) ? '●' : '•'} Auto-agressivité</div>
                                <div style={{ marginBottom: '22px' }}>{eventChecked(data, EVENT_TYPES[5]) ? '●' : '•'} Dégâts physiques</div>
                                <div>{data.otherEventType ? '●' : '•'} Autre : <span style={{ marginLeft: '5px' }}>{data.otherEventType}</span></div>
                            </td>
                        </tr>
                    </tbody>
                </table>

                <table style={{ width: '100%', borderCollapse: 'collapse', border: '1.5px solid black', fontSize: '11px' }}>
                    <thead>
                        <tr><td colSpan={4} style={{ background: 'black', color: 'white', border: '1.5px solid black', textAlign: 'center', fontWeight: 'bold', padding: '5px' }}>Personnes prévenues</td></tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td rowSpan={5} style={{ border: '1px solid black', padding: '4px', textAlign: 'center', fontWeight: 'bold', width: '20%' }}>ENCADRANT<br/>DU SÉJOUR</td>
                            <td style={{ border: '1px solid black', padding: '4px', width: '30%' }}>{data.notifiedInternal?.['Directeur.trice'] ? '☒' : '☐'} Directeur.trice</td>
                            <td rowSpan={5} style={{ border: '1px solid black', padding: '4px', textAlign: 'center', fontWeight: 'bold', width: '20%' }}>EXTÉRIEUR<br/>AU SÉJOUR</td>
                            <td style={{ border: '1px solid black', padding: '4px', width: '30%' }}>{data.notifiedExternal?.['Parent(s) ou tuteur vacancier'] ? '☒' : '☐'} Parent(s) ou tuteur vacancier</td>
                        </tr>
                        <tr>
                            <td style={{ border: '1px solid black', padding: '4px' }}>{data.notifiedInternal?.['Adjoint.e pédagogique'] ? '☒' : '☐'} Adjoint.e pédagogique</td>
                            <td style={{ border: '1px solid black', padding: '4px' }}>{data.notifiedExternal?.['Structure du vacancier'] ? '☒' : '☐'} Structure du vacancier</td>
                        </tr>
                        <tr>
                            <td style={{ border: '1px solid black', padding: '4px' }}>{data.notifiedInternal?.['Adjoints.es sanitaires'] ? '☒' : '☐'} Adjoints.es sanitaires</td>
                            <td style={{ border: '1px solid black', padding: '4px' }}>{data.notifiedExternal?.['CEC 1000&&UN Loisirs'] ? '☒' : '☐'} CEC 1000&&UN Loisirs</td>
                        </tr>
                        <tr>
                            <td style={{ border: '1px solid black', padding: '4px' }}>{data.notifiedInternal?.['Animateurs.trices'] ? '☒' : '☐'} Animateurs.trices</td>
                            <td rowSpan={2} style={{ border: '1px solid black', padding: '4px', verticalAlign: 'top' }}>
                                {data.externalOthers ? '☒' : '☐'} Autres : <br/><span style={{ marginTop: '5px', display: 'block' }}>{data.externalOthers}</span>
                            </td>
                        </tr>
                        <tr>
                            <td style={{ border: '1px solid black', padding: '4px' }}></td>
                        </tr>
                        <tr>
                            <td colSpan={4} style={{ border: '1px solid black', padding: '6px' }}>
                                Personnes extérieures prévenues par : <span style={{ padding: '0 50px 0 10px' }}>{data.externalNotifiedBy}</span>
                                <span style={{ float: 'right', marginRight: '50px' }}>Le : {data.externalNotifiedDate ? new Date(data.externalNotifiedDate).toLocaleDateString('fr-FR') : ''}</span>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* --- PAGE 2 --- */}
            <div className="fei-page" style={{ position: 'relative', width: '210mm', height: '297mm', padding: '10mm', boxSizing: 'border-box', background: 'white' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                    <img src="/logo/logo.png" alt="" style={{ height: '60px', objectFit: 'contain', marginLeft: '10px' }} />
                    <div style={{ marginRight: '20px', marginTop: '10px' }}>
                        <svg width="60" height="60" viewBox="0 0 100 100" style={{ transform: 'rotate(5deg)' }}>
                            <path d="M50 10 C75 10 95 25 95 45 C95 65 75 80 50 80 C36 80 23 75 14 66 L5 85 L20 73 C12 65 5 56 5 45 C5 25 25 10 50 10 Z" fill="white" stroke="black" strokeWidth="3" />
                            <circle cx="50" cy="62" r="5" fill="#f97316" />
                            <rect x="46" y="24" width="8" height="26" rx="4" fill="#f97316" />
                            <circle cx="50" cy="62" r="4.5" fill="black" />
                            <rect x="46.5" y="24.5" width="7" height="25" rx="3.5" fill="black" />
                        </svg>
                    </div>
                </div>

                <div style={{ marginBottom: '25px', padding: '0 10px' }}>
                    <p style={{ margin: '0 0 12px 0', fontSize: '13px', fontWeight: 'bold', color: 'black', textAlign: 'justify', lineHeight: '1.4' }}>
                        Il est important de prévenir la famille et/ou la structure d’accueil du vacancier en cas d’altération de l’intégrité physique (morsures, coups, blessures…) ou de problèmes médicaux et de remplir la fiche constatation des lésions.
                    </p>
                    <p style={{ margin: 0, fontSize: '13px', fontWeight: 'bold', color: '#dc2626', textAlign: 'center', lineHeight: '1.4' }}>
                        Si une personne extérieure en lien avec le vacancier est prévenue<br/>
                        = obligatoirement prévenir en simultanée la CEC.
                    </p>
                </div>

                <div style={{ border: '1.5px solid black', height: '185mm', display: 'flex', flexDirection: 'column', marginBottom: '20px', margin: '0 10px' }}>
                    <div style={{ padding: '10px', textAlign: 'center', fontWeight: 'bold', fontSize: '12px' }}>
                        <span style={{ textDecoration: 'underline' }}>LIEU | CIRCONSTANCES DÉTAILLÉES ++ DE L’ÉVÈNEMENT (JOINDRE PHOTOS SI NÉCESSAIRE)</span>
                    </div>
                    <div style={{ padding: '0 15px', flex: 1, fontSize: '12px', whiteSpace: 'pre-wrap' }}>
                        {data.details}
                    </div>
                </div>

                <div style={{ padding: '0 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', fontSize: '12px', fontWeight: 'bold' }}>
                    <div style={{ width: '30%' }}>À : <span style={{ marginLeft: '10px', fontWeight: 'normal' }}>{data.stayName}</span></div>
                    <div style={{ width: '30%', textAlign: 'left' }}>LE : <span style={{ marginLeft: '10px', fontWeight: 'normal' }}>{data.signedOn ? new Date(data.signedOn).toLocaleDateString('fr-FR') : ''}</span></div>
                    <div style={{ width: '40%', textAlign: 'right' }}>SIGNATURE(S) DU/DES DÉCLARANT-E-S :</div>
                </div>
            </div>
        </div>
    );
};

export default function IncidentSheet({ defaultRewriteMode = 'detaille', canEdit = true, actorHeaders = { 'Content-Type': 'application/json' }, activeUser, incidentSheets = [], participants = [], onRefresh, isMobile }) {
    const ui = useUi();
    const [form, setForm] = useState(defaultForm());
    const history = incidentSheets;
    const [saveStatus, setSaveStatus] = useState(null);
    const [showPreview, setShowPreview] = useState(false);
    const [rewriteMode, setRewriteMode] = useState(defaultRewriteMode);
    const [aiDraft, setAiDraft] = useState('');
    const [isRewriting, setIsRewriting] = useState(false);
    const [rewriteError, setRewriteError] = useState('');
    const [originalDetails, setOriginalDetails] = useState('');
    const [activeTab, setActiveTab] = useState('infos');
    const [autocomplete, setAutocomplete] = useState({ section: null, index: null, results: [] });

    const handleSearch = (section, index, query) => {
        if (!query || query.length < 2) {
            setAutocomplete({ section: null, index: null, results: [] });
            return;
        }

        const filtered = (participants || []).filter(p => {
            const fullName = `${p.firstName} ${p.lastName}`.toLowerCase();
            const search = query.toLowerCase();
            
            // Only show staff for reporters
            if (section === 'reporters' && p.role !== 'animator' && p.role !== 'direction') return false;
            
            return fullName.includes(search);
        }).slice(0, 5);

        setAutocomplete({ section, index, results: filtered });
    };

    const selectParticipant = (section, index, p) => {
        setForm(prev => {
            const copy = [...prev[section]];
            copy[index] = { 
                ...copy[index], 
                firstName: p.firstName, 
                lastName: p.lastName, 
                role: p.role === 'animator' ? 'Anim' : (p.role === 'direction' ? 'Directeur.trice' : 'Vacancier')
            };
            return { ...prev, [section]: copy };
        });
        setAutocomplete({ section: null, index: null, results: [] });
    };

    // Les données sont maintenant gérées par App.jsx et synchronisées via Socket.io
    // fetchHistory et useEffect locaux ont été supprimés.

    const updatePerson = (section, index, key, value) => {
        setForm(prev => {
            const copy = [...prev[section]];
            copy[index] = { ...copy[index], [key]: value };
            return { ...prev, [section]: copy };
        });
    };

    const addPerson = (section) => {
        setForm(prev => ({
            ...prev,
            [section]: [...prev[section], createPerson()]
        }));
    };

    const removePerson = (section, index) => {
        setForm(prev => ({
            ...prev,
            [section]: prev[section].filter((_, i) => i !== index)
        }));
    };

    const toggleArrayFlag = (section, label) => {
        setForm(prev => ({
            ...prev,
            [section]: { ...(prev[section] || {}), [label]: !prev[section]?.[label] }
        }));
    };

    const toggleEventType = (type) => {
        setForm(prev => ({
            ...prev,
            eventTypes: prev.eventTypes.includes(type) ? prev.eventTypes.filter(t => t !== type) : [...prev.eventTypes, type]
        }));
    };

    const saveIncident = async (silent = false) => {
        if (!canEdit && !silent) return;
        if (!silent) setSaveStatus('saving');
        const id = form.id || `incident_${Date.now()}`;
        const payload = { ...form, id, timestamp: new Date().toISOString() };
        try {
            const res = await fetch('/api/incident-sheets', { method: 'POST', headers: actorHeaders, body: JSON.stringify(payload) });
            if (!res.ok) throw new Error('Save failed');
            setForm(prev => ({ ...prev, id }));
            if (onRefresh) onRefresh();
            if (!silent) {
                setSaveStatus('saved');
                ui.toast('FEI archivée avec succès.', { type: 'success' });
                setTimeout(() => setSaveStatus(null), 2500);
            }
        } catch (err) {
            if (!silent) { setSaveStatus('error'); ui.toast('Échec de l\'archivage.', { type: 'error' }); }
        }
    };

    const handlePrint = async () => {
        if (!canEdit) return;
        await saveIncident(true);
        window.print();
    };

    const requestRewrite = async (sourceText) => {
        if (!canEdit) return;
        const text = (sourceText || '').trim();
        if (!text) { setRewriteError('Veuillez saisir un texte à reformuler.'); return; }
        setIsRewriting(true); setRewriteError('');
        try {
            const res = await fetch('/api/ai/rewrite-fei', { method: 'POST', headers: actorHeaders, body: JSON.stringify({ text, mode: rewriteMode }) });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.error || 'Échec reformulation.');
            setAiDraft(data.rewrittenText || '');
        } catch (err) { setRewriteError(err.message); }
        finally { setIsRewriting(false); }
    };

    const deleteIncident = async (e, id) => {
        if (!canEdit) return;
        e.stopPropagation();
        const ok = await ui.confirm({
            title: 'Supprimer la fiche',
            message: 'Supprimer définitivement cette FEI ?',
            confirmText: 'Supprimer',
            danger: true
        });
        if (!ok) return;
        try {
            const res = await fetch(`/api/incident-sheets/${id}`, { method: 'DELETE', headers: actorHeaders });
            if (res.ok) {
                if (onRefresh) onRefresh();
                ui.toast('FEI supprimée.', { type: 'success' });
            }
        } catch (err) { console.error(err); }
    };

    const resetForm = () => {
        setForm(defaultForm());
        setAiDraft('');
        setRewriteError('');
        setOriginalDetails('');
    };

    return (
        <div style={{ width: '100%', maxWidth: '100vw', overflowX: 'hidden', position: 'relative', background: 'transparent' }}>
            {!showPreview ? (
                <div style={{ flex: 1, overflowY: 'auto' }} className="no-scrollbar">
                    <div className="fei-responsive-grid" style={{ maxWidth: '1440px', margin: '0 auto', padding: 'clamp(0.5rem, 3vw, 2rem)', display: 'flex', flexWrap: 'wrap', gap: 'clamp(1rem, 4vw, 2rem)', alignItems: 'flex-start' }}>
                        
                        {/* Main Editor */}
                        <div style={{ flex: '1 1 100%', display: 'flex', flexDirection: 'column', gap: 'clamp(1rem, 4vw, 2rem)' }}>
                            <div className="card-glass fei-header-card" style={{
                                padding: isMobile ? '1rem' : '1.5rem 2rem',
                                display: 'flex',
                                flexDirection: isMobile ? 'column' : 'row',
                                alignItems: isMobile ? 'flex-start' : 'center',
                                justifyContent: 'space-between',
                                gap: '1.25rem'
                            }}>
                                <div className="fei-header-title-block" style={{ display: 'flex', alignItems: 'center', gap: '1rem', width: '100%' }}>
                                    <div style={{ background: 'var(--primary-gradient)', borderRadius: '14px', padding: isMobile ? '0.75rem' : '1rem', display: 'flex', color: 'white', flexShrink: 0 }}>
                                        <AlertTriangle size={isMobile ? 24 : 32} strokeWidth={2.5} />
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <h1 style={{ margin: 0, fontSize: isMobile ? '1.2rem' : '1.8rem', fontWeight: '950', fontFamily: 'Sora, sans-serif', letterSpacing: '-0.03em', lineHeight: '1.2', overflowWrap: 'break-word', wordBreak: 'break-word' }}>Feuille d'Événement Indésirable</h1>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: isMobile ? '0.8rem' : '0.95rem', fontWeight: '800', marginTop: '0.25rem' }}>
                                            <FileText size={isMobile ? 14 : 16} /> Questionaire FEI
                                        </div>
                                    </div>
                                </div>
                                <div className="fei-header-actions-block" style={{ display: 'flex', gap: '0.75rem', width: isMobile ? '100%' : 'auto', flexWrap: 'wrap' }}>
                                    <button className="btn btn-secondary flex-center" onClick={() => saveIncident(false)} disabled={!canEdit} style={{ flex: isMobile ? 1 : 'none', padding: '0.75rem 1rem', fontWeight: '900', color: saveStatus === 'saved' ? 'var(--success-color)' : 'var(--text-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', borderRadius: '12px', background: 'var(--bg-secondary)', border: 'none', fontSize: '0.85rem' }}>
                                        {saveStatus === 'saved' ? <CheckCircle2 size={16} strokeWidth={2.5} /> : <Save size={16} strokeWidth={2.5} />} 
                                        {saveStatus === 'saved' ? 'Enregistré' : 'Enregistrer'}
                                    </button>
                                    <button className="btn btn-secondary flex-center" onClick={() => setShowPreview(true)} style={{ flex: isMobile ? 1 : 'none', padding: '0.75rem 1rem', fontWeight: '900', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', borderRadius: '12px', background: 'var(--bg-secondary)', border: 'none', fontSize: '0.85rem' }}><Eye size={16} strokeWidth={2.5} /> Aperçu</button>
                                    
                                    {activeUser?.role === 'direction' && (
                                        <button className="btn btn-primary flex-center" onClick={handlePrint} style={{ width: isMobile ? '100%' : 'auto', padding: '0.75rem 1.25rem', fontWeight: '950', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', borderRadius: '12px', background: 'var(--primary-color)', color: 'white', border: 'none', boxShadow: '0 8px 24px var(--primary-light)', fontSize: '0.85rem' }}><Printer size={16} strokeWidth={2.5} /> Imprimer</button>
                                    )}
                                </div>
                            </div>

                            <div className="card-glass fei-form-card" style={{ background: 'white' }}>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: isMobile ? '1rem' : '1.5rem', marginBottom: isMobile ? '1.5rem' : '2.5rem' }}>
                                    <div style={{ flex: isMobile ? '1 1 100%' : '1', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                                        <label className="fei-label">Nom du Séjour</label>
                                        <div style={{ position: 'relative' }}>
                                            <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}><MapPin size={16} /></div>
                                            <input className="glass-input fei-input" style={{ width: '100%', paddingLeft: '2.5rem', fontSize: '0.95rem' }} placeholder="Ex: Colo d'été..." value={form.stayName} onChange={e => setForm(prev => ({ ...prev, stayName: e.target.value }))} />
                                        </div>
                                    </div>
                                    <div style={{ flex: isMobile ? '1 1 100%' : '1', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                                        <label className="fei-label">Directeur(trice)</label>
                                        <div style={{ position: 'relative' }}>
                                            <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}><User size={16} /></div>
                                            <input className="glass-input fei-input" style={{ width: '100%', paddingLeft: '2.5rem', fontSize: '0.95rem' }} placeholder="Prénom Nom" value={form.directorName} onChange={e => setForm(prev => ({ ...prev, directorName: e.target.value }))} />
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '2.5rem' }}>
                                    <div style={{ flex: '1 1 100%', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                        <label className="fei-label">Date de l'événement</label>
                                        <div style={{ position: 'relative' }}>
                                            <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}><Calendar size={18} /></div>
                                            <input type="date" className="glass-input fei-input" style={{ width: '100%', paddingLeft: '2.75rem', fontSize: '1rem' }} value={form.eventDate} onChange={e => setForm(prev => ({ ...prev, eventDate: e.target.value }))} />
                                        </div>
                                    </div>
                                    <div style={{ flex: '1 1 100%', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                        <label className="fei-label">Heure</label>
                                        <div style={{ position: 'relative' }}>
                                            <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}><Clock size={18} /></div>
                                            <input type="time" className="glass-input fei-input" style={{ width: '100%', paddingLeft: '2.75rem', fontSize: '1rem' }} value={form.eventTime} onChange={e => setForm(prev => ({ ...prev, eventTime: e.target.value }))} />
                                        </div>
                                    </div>
                                </div>

                                <div style={{ marginBottom: '2.5rem' }}>
                                    <label className="fei-label" style={{ marginBottom: '1.25rem', display: 'block' }}>Niveau de gravité</label>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                                        {Object.entries(severityLabels).map(([key, label]) => {
                                            const isActive = form.severity === key;
                                            return (
                                                <button
                                                    key={key} type="button" onClick={() => setForm(prev => ({ ...prev, severity: key }))}
                                                    className={`severity-btn ${isActive ? 'active' : ''}`}
                                                    style={{
                                                        flex: '1 1 90px',
                                                        padding: 'clamp(0.75rem, 3vw, 1.25rem) 0.5rem', borderRadius: '18px', 
                                                        border: '2px solid', 
                                                        borderColor: isActive ? severityColors[key] : 'var(--glass-border)',
                                                        background: isActive ? `oklch(from ${severityColors[key]} l c h / 0.1)` : 'var(--bg-secondary)', 
                                                        boxShadow: isActive ? `0 8px 25px oklch(from ${severityColors[key]} l c h / 0.25)` : 'none',
                                                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.85rem', cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                                        transform: isActive ? 'translateY(-4px)' : 'none'
                                                    }}>
                                                    <div style={{ 
                                                        width: '28px', height: '28px', background: severityColors[key], 
                                                        borderRadius: '50%', border: '3px solid white', 
                                                        boxShadow: isActive ? `0 0 15px ${severityColors[key]}` : '0 2px 8px oklch(0% 0 0 / 0.1)',
                                                        transition: 'all 0.3s'
                                                    }} />
                                                    <div style={{ 
                                                        fontSize: '11px', fontWeight: '950', 
                                                        color: isActive ? 'var(--text-main)' : 'var(--text-muted)', 
                                                        textTransform: 'uppercase', letterSpacing: '0.05em' 
                                                    }}>{label.split(' - ')[0]}</div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div style={{ marginBottom: '2.5rem' }}>
                                    <label className="fei-label" style={{ marginBottom: '1.25rem', display: 'block' }}>Type d'incident</label>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' }}>
                                        {EVENT_TYPES.map(type => {
                                            const isSelected = form.eventTypes.includes(type);
                                            return (
                                                <label key={type} onClick={() => toggleEventType(type)}
                                                    className="event-type-card"
                                                    style={{ 
                                                        display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '1rem 1.5rem', borderRadius: '16px', cursor: 'pointer',
                                                        background: isSelected ? 'oklch(58% 0.2 var(--brand-hue) / 0.08)' : 'var(--bg-secondary)',
                                                        border: '2px solid', borderColor: isSelected ? 'var(--primary-color)' : 'transparent', 
                                                        transition: 'all 0.25s',
                                                        boxShadow: isSelected ? '0 4px 15px oklch(58% 0.2 var(--brand-hue) / 0.15)' : 'none'
                                                    }}>
                                                    <div style={{ 
                                                        width: '24px', height: '24px', borderRadius: '8px', 
                                                        border: isSelected ? 'none' : '2px solid var(--glass-border)', 
                                                        background: isSelected ? 'var(--primary-color)' : 'white', 
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        transition: 'all 0.2s', color: 'white'
                                                    }}>
                                                        {isSelected && <Check size={16} strokeWidth={3} />}
                                                    </div>
                                                    <span style={{ fontSize: '0.9rem', fontWeight: isSelected ? '800' : '700', color: isSelected ? 'var(--primary-color)' : 'var(--text-main)' }}>{type}</span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2.5rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: '950', fontSize: '1rem', color: 'var(--text-main)' }}>
                                        <Users size={20} /> Membres Impliqués
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? '1rem' : '1.5rem' }}>
                                        <div style={{ background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '20px', border: '1px solid var(--glass-border)' }}>
                                            <div className="fei-label" style={{ marginBottom: '1.25rem', fontSize: '11px', color: 'var(--text-main)' }}>Déclarants (Staff)</div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                                {form.reporters.map((row, i) => (
                                                    <div key={`rep-${i}`} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', position: 'relative' }}>
                                                        <div style={{ display: 'flex', gap: '0.5rem', background: 'white', padding: '0.5rem', borderRadius: '14px', border: '1px solid var(--glass-border)', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                                                            <input className="glass-input" 
                                                                style={{ flex: 1, padding: '0.5rem 0.75rem', borderRadius: '10px', fontSize: '0.85rem', border: 'none', background: 'transparent' }} 
                                                                placeholder="Prénom Nom" 
                                                                value={`${row.firstName} ${row.lastName}`.trim()} 
                                                                onChange={e => {
                                                                    const val = e.target.value;
                                                                    const parts = val.split(' ');
                                                                    updatePerson('reporters', i, 'firstName', parts[0] || '');
                                                                    updatePerson('reporters', i, 'lastName', parts.slice(1).join(' ') || '');
                                                                    handleSearch('reporters', i, val);
                                                                }}
                                                                onBlur={() => setTimeout(() => setAutocomplete({ section: null, index: null, results: [] }), 200)}
                                                            />
                                                            <select className="glass-input" style={{ width: '130px', padding: '0.5rem', borderRadius: '10px', fontSize: '0.8rem', background: 'var(--bg-secondary)', border: 'none', fontWeight: '800' }} value={row.role} onChange={e => updatePerson('reporters', i, 'role', e.target.value)}>
                                                                {ROLE_OPTIONS.filter(r => r !== 'Vacancier').map(role => <option key={role} value={role}>{role}</option>)}
                                                            </select>
                                                            <button onClick={() => removePerson('reporters', i)} style={{ background: 'transparent', border: 'none', color: 'var(--danger-color)', cursor: 'pointer', padding: '0.5rem', display: 'flex', alignItems: 'center', opacity: 0.6, transition: 'opacity 0.2s' }} onMouseEnter={e => e.currentTarget.style.opacity = '1'} onMouseLeave={e => e.currentTarget.style.opacity = '0.6'}>
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                        {autocomplete.section === 'reporters' && autocomplete.index === i && autocomplete.results.length > 0 && (
                                                            <div className="card-glass animate-scale-in" style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, background: 'white', marginTop: '4px', padding: '0.5rem', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', border: '1px solid var(--glass-border)' }}>
                                                                {autocomplete.results.map(p => (
                                                                    <div key={p.id} onClick={() => selectParticipant('reporters', i, p)} style={{ padding: '0.6rem 0.75rem', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} className="autocomplete-item">
                                                                        <span style={{ fontSize: '0.85rem', fontWeight: '800' }}>{p.firstName} {p.lastName}</span>
                                                                        <span style={{ fontSize: '10px', opacity: 0.5, textTransform: 'uppercase' }}>{p.role}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                                <button onClick={() => addPerson('reporters')} style={{ width: '100%', padding: '0.6rem', background: 'white', border: '1.5px dashed var(--glass-border)', borderRadius: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', transition: 'all 0.2s', fontSize: '0.85rem', fontWeight: '800' }}>
                                                    <Plus size={16} /> Ajouter un déclarant
                                                </button>
                                            </div>
                                        </div>
                                        <div style={{ background: 'oklch(58% 0.2 var(--brand-hue) / 0.03)', padding: '1.5rem', borderRadius: '20px', border: '1px solid oklch(58% 0.2 var(--brand-hue) / 0.1)' }}>
                                            <div className="fei-label" style={{ marginBottom: '1.25rem', fontSize: '11px', color: 'var(--primary-color)' }}>Personnes concernées</div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                                {form.concerned.map((row, i) => (
                                                    <div key={`con-${i}`} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', position: 'relative' }}>
                                                        <div style={{ display: 'flex', gap: '0.5rem', background: 'white', padding: '0.5rem', borderRadius: '14px', border: '1px solid oklch(58% 0.2 var(--brand-hue) / 0.1)', boxShadow: '0 2px 8px oklch(58% 0.2 var(--brand-hue) / 0.05)' }}>
                                                            <input className="glass-input" 
                                                                style={{ flex: 1, padding: '0.5rem 0.75rem', borderRadius: '10px', fontSize: '0.85rem', border: 'none', background: 'transparent' }} 
                                                                placeholder="Prénom Nom" 
                                                                value={`${row.firstName} ${row.lastName}`.trim()} 
                                                                onChange={e => {
                                                                    const val = e.target.value;
                                                                    const parts = val.split(' ');
                                                                    updatePerson('concerned', i, 'firstName', parts[0] || '');
                                                                    updatePerson('concerned', i, 'lastName', parts.slice(1).join(' ') || '');
                                                                    handleSearch('concerned', i, val);
                                                                }}
                                                                onBlur={() => setTimeout(() => setAutocomplete({ section: null, index: null, results: [] }), 200)}
                                                            />
                                                            <select className="glass-input" style={{ width: '130px', padding: '0.5rem', borderRadius: '10px', fontSize: '0.8rem', background: 'oklch(58% 0.2 var(--brand-hue) / 0.05)', border: 'none', fontWeight: '800', color: 'var(--primary-color)' }} value={row.role} onChange={e => updatePerson('concerned', i, 'role', e.target.value)}>
                                                                {ROLE_OPTIONS.map(role => <option key={role} value={role}>{role}</option>)}
                                                            </select>
                                                            <button onClick={() => removePerson('concerned', i)} style={{ background: 'transparent', border: 'none', color: 'var(--danger-color)', cursor: 'pointer', padding: '0.5rem', display: 'flex', alignItems: 'center', opacity: 0.6, transition: 'opacity 0.2s' }} onMouseEnter={e => e.currentTarget.style.opacity = '1'} onMouseLeave={e => e.currentTarget.style.opacity = '0.6'}>
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                        {autocomplete.section === 'concerned' && autocomplete.index === i && autocomplete.results.length > 0 && (
                                                            <div className="card-glass animate-scale-in" style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, background: 'white', marginTop: '4px', padding: '0.5rem', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', border: '1px solid var(--glass-border)' }}>
                                                                {autocomplete.results.map(p => (
                                                                    <div key={p.id} onClick={() => selectParticipant('concerned', i, p)} style={{ padding: '0.6rem 0.75rem', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} className="autocomplete-item">
                                                                        <span style={{ fontSize: '0.85rem', fontWeight: '800' }}>{p.firstName} {p.lastName}</span>
                                                                        <span style={{ fontSize: '10px', opacity: 0.5, textTransform: 'uppercase' }}>{p.role}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                                <button onClick={() => addPerson('concerned')} style={{ width: '100%', padding: '0.6rem', background: 'oklch(58% 0.2 var(--brand-hue) / 0.02)', border: '1.5px dashed oklch(58% 0.2 var(--brand-hue) / 0.15)', borderRadius: '12px', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', transition: 'all 0.2s', fontSize: '0.85rem', fontWeight: '800', opacity: 0.8 }}>
                                                    <Plus size={16} /> Ajouter une personne
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                    <label className="fei-label">Détails de l'événement & Actions entreprises</label>
                                    <div style={{ position: 'relative' }}>
                                        <textarea className="glass-input custom-textarea" rows={12} value={form.details} onChange={e => setForm(prev => ({ ...prev, details: e.target.value }))} 
                                            placeholder="Ex: L'enfant a fait une crise lors du repas... Nous avons isolé l'enfant au calme..." 
                                            style={{ width: '100%', padding: '1.5rem', borderRadius: '24px', background: 'var(--bg-secondary)', resize: 'vertical', border: '2px solid var(--glass-border)', fontSize: '1rem', color: 'var(--text-main)', transition: 'border-color 0.2s' }} />
                                        
                                        <div style={{ position: 'absolute', bottom: '1.5rem', right: '1.5rem', display: 'flex', gap: '0.75rem' }}>
                                            <div style={{ display: 'flex', background: 'white', padding: '6px', borderRadius: '14px', border: '1px solid var(--glass-border)', boxShadow: '0 8px 30px oklch(0% 0 0 / 0.1)' }}>
                                                <button type="button" onClick={() => requestRewrite(form.details)} disabled={isRewriting}
                                                    className="btn-magic"
                                                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.2rem', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '950', fontSize: '0.85rem', cursor: 'pointer', opacity: isRewriting ? 0.7 : 1 }}>
                                                    <Sparkles size={16} /> {isRewriting ? 'Reformulation...' : 'Ajuster le ton pour le Cerfa'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Sidebar - History & Tools */}
                        <div className="fei-sidebar" style={{ flex: '1 1 380px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div className="card-glass" style={{ padding: '2rem', background: 'white', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: '950', fontSize: '1rem', color: 'var(--text-main)' }}>
                                    <History size={20} /> Archives
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '600px', overflowY: 'auto' }} className="no-scrollbar">
                                    {history.length === 0 ? (
                                        <div style={{ textAlign: 'center', padding: '3rem 1rem', background: 'var(--bg-secondary)', borderRadius: '20px', border: '1.5px dashed var(--glass-border)', color: 'var(--text-muted)' }}>
                                            Aucune fiche archivée.
                                        </div>
                                    ) : (
                                        history.map((incident, idx) => (
                                            <div key={incident.id || idx} onClick={() => { setForm({ ...defaultForm(), ...incident }); setShowPreview(true); }}
                                                style={{ padding: '1rem', borderRadius: '16px', background: 'white', border: '1.5px solid var(--glass-border)', cursor: 'pointer', transition: 'all 0.2s', position: 'relative' }}
                                                className="fei-history-item"
                                            >
                                                <div style={{ position: 'absolute', left: 0, top: '20%', bottom: '20%', width: '4px', background: severityColors[incident.severity], borderRadius: '0 4px 4px 0' }} />
                                                <div style={{ fontSize: '11px', fontWeight: '950', color: 'var(--text-muted)', marginBottom: '4px' }}>{incident.eventDate}</div>
                                                <div style={{ fontWeight: '950', color: 'var(--text-main)', fontSize: '0.9rem', marginBottom: '6px' }}>{incident.stayName || 'Sans titre'}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{incident.details}</div>
                                                <button onClick={(e) => { e.stopPropagation(); deleteIncident(e, incident.id); }} style={{ position: 'absolute', top: '10px', right: '10px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><Trash2 size={14} /></button>
                                            </div>
                                        ))
                                    )}
                                </div>
                                <button className="btn btn-secondary" onClick={resetForm} style={{ width: '100%', padding: '0.85rem', fontWeight: '950', borderRadius: '14px' }}>
                                    <Plus size={18} /> Nouvelle Fiche
                                </button>
                            </div>

                        </div>
                    </div>
                </div>
            ) : (
                <div className="no-print" style={{ flex: 1, overflowY: 'auto', background: 'oklch(20% 0.05 240)', padding: '2.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ maxWidth: '920px', width: '100%', background: 'white', borderRadius: '24px', padding: '1rem 2rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 20px 40px oklch(0% 0 0 / 0.2)' }}>
                        <button onClick={() => setShowPreview(false)} className="btn btn-secondary" style={{ padding: '0.625rem 1rem' }}><ArrowLeft size={18} /> Retour Édition</button>
                        <div style={{ fontWeight: '950', fontSize: '1rem', color: 'oklch(20% 0.05 240)' }}>Aperçu du Cerfa FEI</div>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button onClick={handlePrint} className="btn btn-primary" style={{ padding: '0.625rem 1.5rem' }}><Printer size={18} strokeWidth={2.5} /> Imprimer Maintenant</button>
                        </div>
                    </div>
                    <div className="fei-a4-holder">
                        <PrintContent data={form} />
                    </div>
                </div>
            )}

            <style>{`
                .no-print .fei-page { margin-bottom: 3rem; box-shadow: 0 20px 50px oklch(0% 0 0 / 0.25); border-radius: 4px; border: 1px solid var(--glass-border); }
                .fei-label { font-size: 11px; font-weight: 950; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.12em; margin-bottom: 0.5rem; display: block; }
                .fei-input:focus { border-color: var(--primary-color) !important; background: white !important; box-shadow: 0 0 0 3px oklch(58% 0.2 var(--brand-hue) / 0.15) !important; }
                .custom-textarea:focus { border-color: var(--primary-color) !important; background: white !important; box-shadow: 0 0 0 3px oklch(58% 0.2 var(--brand-hue) / 0.15) !important; outline: none; }
                
                .severity-btn:hover { border-color: var(--text-muted) !important; }
                .severity-btn.active:hover { border-color: currentColor !important; }
                
                .event-type-card:hover { border-color: var(--primary-color) !important; transform: translateY(-2px); }

                .btn-magic {
                    background: linear-gradient(135deg, oklch(58% 0.2 270), oklch(62% 0.18 310), oklch(58% 0.2 270));
                    background-size: 200% auto;
                    transition: all 0.5s ease;
                }
                .btn-magic:hover:not(:disabled) {
                    background-position: right center;
                    transform: scale(1.02);
                }
                
                @media (max-width: 1200px) {
                    .fei-responsive-grid { padding: 1.5rem !important; }
                    .fei-sidebar { flex: 1 1 100% !important; order: 2; }
                }
                @media (max-width: 900px) {
                    .fei-header-card { flex-direction: column !important; align-items: stretch !important; gap: 1.5rem !important; }
                    .fei-header-title-block, .fei-header-actions-block { width: 100% !important; flex: 1 1 100% !important; }
                    .fei-header-actions-block { justify-content: space-between !important; }
                }
                @media (max-width: 600px) {
                    .fei-responsive-grid { padding: 0.75rem !important; }
                    .fei-header-actions-block { flex-direction: column !important; }
                    .fei-header-actions-block > button { width: 100% !important; justify-content: center; }
                }
                @media (max-width: 500px) {
                    .fei-header-title-block { flex-direction: column !important; align-items: center !important; gap: 0.5rem !important; text-align: center; }
                    .fei-header-title-block > div:first-child { align-self: center !important; }
                    .fei-header-title-block > div:last-child { word-break: break-word; white-space: normal; }
                    .fei-form-card { padding: 1rem !important; }
                    .severity-btn { flex: 1 1 90px !important; padding: 0.75rem 0.25rem !important; gap: 0.5rem !important; }
                    .severity-btn > div:first-child { width: 22px !important; height: 22px !important; border-width: 2px !important; }
                }

                .fei-form-card {
                    padding: clamp(1rem, 5vw, 2.5rem);
                    transition: padding 0.3s;
                }

                .fei-header-card {
                    padding: clamp(1rem, 4vw, 2rem);
                    display: flex;
                    flex-wrap: wrap;
                    gap: 1.5rem;
                    justify-content: space-between;
                    align-items: center;
                    background: white;
                    border-left: 8px solid var(--primary-color);
                    min-width: 0;
                    width: 100% !important;
                }
                .fei-header-title-block {
                    display: flex;
                    align-items: center;
                    gap: clamp(1rem, 3vw, 1.5rem);
                    flex: 1 1 320px;
                    min-width: 0;
                }
                .fei-header-actions-block {
                    display: flex;
                    gap: 0.75rem;
                    flex-wrap: wrap;
                    flex: 0 1 auto;
                }

                .autocomplete-item:hover { background: var(--bg-secondary); }
                                .fei-history-item:hover { transform: translateX(5px); border-color: var(--primary-color) !important; box-shadow: var(--shadow-md) !important; }
                .fei-a4-holder { transform-origin: top center; transition: transform 0.3s; }
                
                .print-view { display: none; }

                @media print {
                    .no-print { display: none !important; }
                    .print-view { display: block !important; position: absolute; left: 0; top: 0; width: 100%; }
                    body { background: white !important; }
                    body * { visibility: hidden; }
                    .print-view, .print-view * { visibility: visible; }
                    @page { size: A4 portrait; margin: 10mm; }
                }
            `}</style>

            <div className="print-view">
                <PrintContent data={form} />
            </div>
        </div>
    );
}
