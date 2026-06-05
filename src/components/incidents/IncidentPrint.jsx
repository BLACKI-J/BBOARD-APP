import React from 'react';
import { eventChecked, EVENT_TYPES } from './incidentUtils';

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


export default PrintContent;
