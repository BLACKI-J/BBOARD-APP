import React, { useState } from 'react';
import { Sunrise, Sun, Apple, Moon, Plus, Check, Trash2, ArrowDownToLine } from 'lucide-react';
import { getMedicationsList } from '../../utils/meds';

const SLOTS = [
    { id: 'Matin', label: 'Matin', icon: <Sunrise size={18} /> },
    { id: 'Midi', label: 'Midi', icon: <Sun size={18} /> },
    { id: 'Goûter', label: 'Goûter', icon: <Apple size={18} /> },
    { id: 'Soir', label: 'Soir', icon: <Moon size={18} /> },
    { id: 'Coucher', label: 'Coucher', icon: <Moon size={18} /> },
    { id: 'Si besoin', label: 'Si besoin', icon: <Plus size={18} /> },
];

// Anciens champs « Traitements » de la fiche (1 texte libre par créneau), retirés
// du schéma. Filet de récupération : si des données y traînent encore, on propose
// de les convertir vers le format medications[] sans rien perdre.
const LEGACY_IV_SLOTS = [
    ['ivMedMatin', 'Matin'], ['ivMedMidi', 'Midi'], ['ivMedGouter', 'Goûter'],
    ['ivMedSoir', 'Soir'], ['ivMedCoucher', 'Coucher'],
];

// Éditeur de traitements (medications[] + créneaux + doses), identique à l'ancien
// bloc du formulaire Annuaire. La saisie en cours est en état LOCAL (jamais
// persistée sur le participant) ; chaque ajout/suppression est commité tout de
// suite via updateField (sauvegarde auto, comme le reste de la fiche).
const MedicationEditor = ({ child, updateField, canEdit }) => {
    const [newMed, setNewMed] = useState('');
    const [newMedSlots, setNewMedSlots] = useState([]);
    const [newMedDoses, setNewMedDoses] = useState({});

    // Si medications[] est vide mais des traitements legacy (dailyMeds) existent, on
    // part de la liste migrée → l'ajout/suppression ne fait plus disparaître le legacy.
    const rawMeds = (Array.isArray(child.medications) && child.medications.length > 0) ? child.medications : getMedicationsList(child);
    const displayMeds = getMedicationsList(child); // strippe 'Si besoin' pour les chips
    const legacyPrn = (child.sibesoin || '').split(/,|\n/).map(s => s.trim()).filter(Boolean);

    const addMed = () => {
        if (!newMed.trim()) return;
        updateField('medications', [...rawMeds, { name: newMed.trim(), slots: newMedSlots, doses: newMedDoses }]);
        setNewMed(''); setNewMedSlots([]); setNewMedDoses({});
    };
    const removeMed = (idx) => { const c = [...rawMeds]; c.splice(idx, 1); updateField('medications', c); };
    const removeLegacy = (idx) => { const l = [...legacyPrn]; l.splice(idx, 1); updateField('sibesoin', l.join('\n')); };
    const toggleSlot = (id) => setNewMedSlots(cur => cur.includes(id) ? cur.filter(s => s !== id) : [...cur, id]);

    // Anciens « Traitements » (ivMed*) encore renseignés sur cet enfant.
    const legacyIv = LEGACY_IV_SLOTS.filter(([key]) => (child[key] || '').trim());
    const migrateLegacyIv = () => {
        // Regroupe par texte → 1 entrée medications avec ses créneaux ; puis vide les
        // anciens champs. Tout passe dans UN seul PATCH (updateField accumule les champs).
        const byName = {};
        legacyIv.forEach(([key, slot]) => {
            const name = (child[key] || '').trim();
            if (!byName[name]) byName[name] = [];
            byName[name].push(slot);
        });
        const newEntries = Object.entries(byName).map(([name, slots]) => ({ name, slots, doses: {} }));
        updateField('medications', [...rawMeds, ...newEntries]);
        LEGACY_IV_SLOTS.forEach(([key]) => { if ((child[key] || '').trim()) updateField(key, ''); });
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '1.75rem', background: 'var(--bg-secondary)', borderRadius: '24px', border: '1.5px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-color)' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z" /><path d="m8.5 8.5 7 7" /></svg>
                </div>
                <div>
                    <div style={{ fontWeight: '800', fontSize: '0.9rem', color: 'var(--text-main)' }}>Traitement Médical</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700' }}>Renseignez le traitement et les horaires de prise</div>
                </div>
            </div>

            {/* Filet de récupération : anciens traitements (ivMed*) saisis avant la refonte */}
            {canEdit && legacyIv.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', padding: '1.25rem', borderRadius: '18px', background: 'oklch(96% 0.06 75)', border: '1.5px solid oklch(82% 0.12 75)' }}>
                    <div style={{ fontWeight: '900', fontSize: '0.85rem', color: 'oklch(45% 0.12 75)' }}>Anciens traitements détectés</div>
                    <div style={{ fontSize: '0.8rem', fontWeight: '650', color: 'var(--text-main)', lineHeight: 1.5 }}>
                        Des traitements ont été saisis dans l'ancien format. Récupérez-les dans le nouveau système (rien n'est perdu) :
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {legacyIv.map(([key, slot]) => (
                            <span key={key} style={{ display: 'inline-flex', gap: '5px', fontSize: '0.76rem', fontWeight: '800', padding: '4px 10px', borderRadius: '100px', background: 'var(--surface-color)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}>
                                <span style={{ color: 'var(--text-muted)' }}>{slot} ·</span> {child[key]}
                            </span>
                        ))}
                    </div>
                    <button type="button" onClick={migrateLegacyIv}
                        style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '0.6rem 1rem', borderRadius: '12px', border: 'none', cursor: 'pointer', fontWeight: '900', fontSize: '0.82rem', background: 'var(--primary-color)', color: 'white' }}>
                        <ArrowDownToLine size={15} strokeWidth={2.5} /> Récupérer ces traitements
                    </button>
                </div>
            )}

            {canEdit && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '0.5rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <label className="form-label">Nom du traitement</label>
                        <input type="text" placeholder="Ex: Ventoline 100μg, Spasfon..." value={newMed} onChange={e => setNewMed(e.target.value)}
                            className="glass-input" style={{ background: 'var(--surface-color)', border: '1.5px solid var(--glass-border)', padding: '0.85rem 1.25rem', borderRadius: '16px', fontWeight: '700' }} />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <label className="form-label">Créneaux de prise et Doses</label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '0.75rem' }}>
                            {SLOTS.map(slot => {
                                const isActive = newMedSlots.includes(slot.id);
                                return (
                                    <div key={slot.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        <button type="button" onClick={() => toggleSlot(slot.id)}
                                            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', padding: '0.85rem 0.5rem', borderRadius: '16px', border: '2px solid', cursor: 'pointer', transition: 'all 0.2s', fontWeight: '950', fontSize: '0.8rem', borderColor: isActive ? 'var(--primary-color)' : 'var(--glass-border)', background: isActive ? 'var(--primary-color)' : 'var(--surface-color)', color: isActive ? 'white' : 'var(--text-muted)', boxShadow: isActive ? 'var(--shadow-md)' : 'none', transform: isActive ? 'translateY(-2px)' : 'none', height: '100%' }}>
                                            <span style={{ fontSize: '1.25rem' }}>{slot.icon}</span>
                                            {slot.label}
                                            {isActive && <Check size={14} strokeWidth={2} />}
                                        </button>
                                        <input type="text" placeholder="Dose (ex: 4gtt)" value={newMedDoses[slot.id] || ''}
                                            onChange={e => setNewMedDoses(d => ({ ...d, [slot.id]: e.target.value }))}
                                            className="glass-input" style={{ background: 'var(--surface-color)', border: '1.5px solid var(--glass-border)', padding: '0.5rem 0.5rem', borderRadius: '10px', fontSize: '0.8rem', fontWeight: '800', textAlign: 'center', width: '100%', opacity: isActive || newMedDoses[slot.id] ? 1 : 0.4, transition: 'opacity 0.2s' }} />
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <button type="button" onClick={addMed}
                        style={{ background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '16px', padding: '1rem', fontWeight: '950', fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', boxShadow: 'var(--shadow-md)' }}>
                        <Plus size={20} strokeWidth={2} /> Ajouter ce traitement
                    </button>
                </div>
            )}

            {(displayMeds.length > 0 || legacyPrn.length > 0) && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '2px dashed var(--glass-border)' }}>
                    <label className="form-label">Traitements enregistrés pour ce séjour</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {displayMeds.map((med, idx) => (
                            <div key={idx} style={{ background: 'var(--surface-color)', padding: '1rem 1.25rem', borderRadius: '16px', border: '1.5px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ fontWeight: '900', fontSize: '1rem', color: 'var(--text-main)' }}>{med.name}</div>
                                    {canEdit && (
                                        <button type="button" onClick={() => removeMed(idx)}
                                            style={{ background: 'oklch(62% 0.2 28 / 0.1)', color: 'var(--danger-color)', border: 'none', borderRadius: '10px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                            <Trash2 size={16} strokeWidth={2} />
                                        </button>
                                    )}
                                </div>
                                {med.slots && med.slots.length > 0 && (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                        {med.slots.map(s => (
                                            <div key={s} style={{ background: 'var(--bg-secondary)', color: 'var(--text-muted)', padding: '0.4rem 0.75rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '800', border: '1px solid var(--border-color)' }}>
                                                {s}{med.doses?.[s] && <span style={{ opacity: 0.6, marginLeft: '4px' }}>• {med.doses[s]}</span>}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                        {legacyPrn.map((med, idx) => (
                            <div key={`legacy-${idx}`} style={{ background: 'var(--surface-color)', padding: '1rem 1.25rem', borderRadius: '16px', border: '1.5px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ fontWeight: '900', fontSize: '1rem', color: 'var(--text-main)' }}>{med}</div>
                                    {canEdit && (
                                        <button type="button" onClick={() => removeLegacy(idx)}
                                            style={{ background: 'oklch(62% 0.2 28 / 0.1)', color: 'var(--danger-color)', border: 'none', borderRadius: '10px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                            <Trash2 size={16} strokeWidth={2} />
                                        </button>
                                    )}
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                    <div style={{ background: 'var(--bg-secondary)', color: 'var(--text-muted)', padding: '0.4rem 0.75rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '800', border: '1px solid var(--border-color)' }}>Si besoin</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default MedicationEditor;
