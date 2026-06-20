import React from 'react';
import { ArrowLeft, Edit2 } from 'lucide-react';
import Avatar from '../common/Avatar';
import { GroupBadge } from '../common/Badges';
import { SECTIONS } from './infoVacSchema';
import MedicationEditor from './MedicationEditor';

// Champ texte « draft local + sauvegarde différée ». Sans ça, chaque frappe
// déclenchait un PATCH ; en frappe rapide les PATCH partaient en désordre et le
// refetch socket réécrivait l'input avec une valeur périmée → caractères effacés.
// Ici la frappe pilote un état LOCAL (jamais écrasé tant que le champ est focus),
// et on n'envoie qu'UN PATCH après 600 ms de pause (ou au blur).
const HEALTH_INPUT_STYLE = { width: '100%', fontSize: '0.85rem', fontWeight: '800', padding: '8px 10px', borderRadius: '10px', border: '1.5px solid var(--glass-border)', background: 'var(--bg-main)', outline: 'none', minHeight: '42px' };
const HealthTextField = ({ value, placeholder, onCommit }) => {
    const [draft, setDraft] = React.useState(value || '');
    const focusedRef = React.useRef(false);
    const timerRef = React.useRef(null);

    // Resync depuis le store UNIQUEMENT hors focus (sinon écrase la frappe en cours).
    React.useEffect(() => { if (!focusedRef.current) setDraft(value || ''); }, [value]);
    React.useEffect(() => () => clearTimeout(timerRef.current), []);

    const commit = (v) => { clearTimeout(timerRef.current); onCommit(v); };
    return (
        <input type="text" value={draft} placeholder={placeholder || '—'} style={HEALTH_INPUT_STYLE}
            onChange={(e) => {
                const v = e.target.value;
                setDraft(v);
                clearTimeout(timerRef.current);
                timerRef.current = setTimeout(() => onCommit(v), 600);
            }}
            onFocus={() => { focusedRef.current = true; }}
            onBlur={() => { focusedRef.current = false; commit(draft); }} />
    );
};

// ── Infos sub-tab: static reference fields ──
const InfosPanel = ({ child, updateParticipantHealth, canEdit }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {SECTIONS.map(sec => (
            <div key={sec.id} style={{ background: 'var(--surface-color)', borderRadius: '18px', border: '1.5px solid var(--glass-border)', overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', color: 'var(--text-main)', fontSize: '0.75rem', fontWeight: '950', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--glass-border)' }}>
                    {sec.icon} {sec.label}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.625rem', padding: '0.875rem 1rem' }}>
                    {sec.fields.map(f => {
                        const val = child[f.key] || '';
                        const isEmpty = !val;
                        return (
                            <div key={f.key}>
                                <div style={{ fontSize: '0.65rem', fontWeight: '950', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '3px' }}>{f.label}</div>
                                {canEdit ? (
                                    f.type === 'select' ? (
                                        <select value={val} onChange={e => updateParticipantHealth(child.id, f.key, e.target.value)}
                                            style={{ width: '100%', fontSize: '0.85rem', fontWeight: '800', padding: '8px 10px', borderRadius: '10px', border: '1.5px solid var(--glass-border)', background: 'var(--bg-main)', cursor: 'pointer', minHeight: '42px', color: val === 'OUI' ? 'oklch(55% 0.18 145)' : val === 'NON' ? 'var(--text-muted)' : 'var(--text-main)' }}>
                                            <option value="">—</option>
                                            {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                                        </select>
                                    ) : (
                                        <HealthTextField value={val} placeholder={f.placeholder}
                                            onCommit={(v) => updateParticipantHealth(child.id, f.key, v)} />
                                    )
                                ) : (
                                    <div style={{ fontSize: '0.88rem', fontWeight: isEmpty ? '600' : '800', color: isEmpty ? 'var(--text-softer)' : (val === 'OUI' ? 'oklch(55% 0.18 145)' : 'var(--text-main)'), fontStyle: isEmpty ? 'italic' : 'normal', padding: '7px 0' }}>
                                        {isEmpty ? 'Non renseigné' : val}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        ))}
        {canEdit && <div style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', paddingLeft: '0.25rem' }}><Edit2 size={12} /> Édition directe — sauvegarde automatique</div>}
    </div>
);

// ── Detail view ──
const ChildHealthDetail = ({ child, groups, onBack, updateParticipantHealth, canEdit }) => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <button onClick={onBack} style={{ width: '40px', height: '40px', borderRadius: '12px', border: '1.5px solid var(--glass-border)', background: 'var(--surface-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-main)', flexShrink: 0 }}>
                    <ArrowLeft size={18} strokeWidth={2} />
                </button>
                <Avatar participant={child} size={44} />
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: '800', fontSize: '1.05rem', color: 'var(--text-main)', letterSpacing: '-0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {child.firstName} {(child.lastName || "").toUpperCase()}
                    </div>
                    <div style={{ marginTop: '2px' }}><GroupBadge groupId={child.group} groups={groups} /></div>
                </div>
            </div>

            {/* Dossier sanitaire reçu (déplacé depuis le formulaire Annuaire) */}
            {canEdit ? (
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', padding: '1rem 1.25rem', background: child.healthDocProvided ? 'oklch(62% 0.18 145 / 0.08)' : 'var(--surface-color)', borderRadius: '16px', border: `1px solid ${child.healthDocProvided ? 'var(--success-color)' : 'var(--glass-border)'}`, cursor: 'pointer' }}>
                    <input type="checkbox" checked={!!child.healthDocProvided} onChange={e => updateParticipantHealth(child.id, 'healthDocProvided', e.target.checked)}
                        style={{ width: '24px', height: '24px', flexShrink: 0, accentColor: 'var(--success-color)', cursor: 'pointer' }} />
                    <div>
                        <div style={{ fontWeight: '800', fontSize: '0.95rem', color: child.healthDocProvided ? 'var(--success-color)' : 'var(--text-main)' }}>Dossier sanitaire reçu</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600', marginTop: '2px' }}>Cochez si la fiche médicale signée est en votre possession.</div>
                    </div>
                </label>
            ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '1rem 1.25rem', background: 'var(--surface-color)', borderRadius: '16px', border: '1px solid var(--glass-border)', fontWeight: '800', fontSize: '0.9rem', color: child.healthDocProvided ? 'var(--success-color)' : 'var(--text-muted)' }}>
                    {child.healthDocProvided ? '✓ Dossier sanitaire reçu' : 'Dossier sanitaire non reçu'}
                </div>
            )}

            {/* Traitement Médical (déplacé depuis le formulaire Annuaire) */}
            <MedicationEditor child={child} updateField={(k, v) => updateParticipantHealth(child.id, k, v)} canEdit={canEdit} />

            <InfosPanel child={child} updateParticipantHealth={updateParticipantHealth} canEdit={canEdit} />
        </div>
    );
};

export default ChildHealthDetail;
