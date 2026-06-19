import React from 'react';
import { ArrowLeft, Edit2 } from 'lucide-react';
import Avatar from '../common/Avatar';
import { GroupBadge } from '../common/Badges';
import { SECTIONS } from './infoVacSchema';

// ── Infos sub-tab: static reference fields ──
const InfosPanel = ({ child, updateParticipantHealth, canEdit }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {SECTIONS.map(sec => (
            <div key={sec.id} style={{ background: 'white', borderRadius: '18px', border: '1.5px solid var(--glass-border)', overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', color: sec.color, fontSize: '0.75rem', fontWeight: '950', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--glass-border)' }}>
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
                                        <input type="text" value={val} onChange={e => updateParticipantHealth(child.id, f.key, e.target.value)}
                                            placeholder={f.placeholder || '—'}
                                            style={{ width: '100%', fontSize: '0.85rem', fontWeight: '800', padding: '8px 10px', borderRadius: '10px', border: '1.5px solid var(--glass-border)', background: 'var(--bg-main)', outline: 'none', minHeight: '42px' }} />
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
                <button onClick={onBack} style={{ width: '40px', height: '40px', borderRadius: '12px', border: '1.5px solid var(--glass-border)', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-main)', flexShrink: 0 }}>
                    <ArrowLeft size={18} strokeWidth={2.5} />
                </button>
                <Avatar participant={child} size={44} />
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: '950', fontSize: '1.05rem', color: 'var(--text-main)', letterSpacing: '-0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {child.firstName} {(child.lastName || "").toUpperCase()}
                    </div>
                    <div style={{ marginTop: '2px' }}><GroupBadge groupId={child.group} groups={groups} /></div>
                </div>
            </div>

            <InfosPanel child={child} updateParticipantHealth={updateParticipantHealth} canEdit={canEdit} />
        </div>
    );
};

export default ChildHealthDetail;
