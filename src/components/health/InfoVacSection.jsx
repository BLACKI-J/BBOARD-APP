import React, { useState } from 'react';
import { ShieldAlert, ChevronRight } from 'lucide-react';
import Avatar from '../common/Avatar';
import { GroupBadge } from '../common/Badges';
import { getSummaryBySection, getAlertCount } from './infoVacSchema';
import { getMedicationsList } from '../../utils/meds';
import ChildHealthDetail from './ChildHealthDetail';

// ── Child card : TOUT le détail visible, regroupé par section (tap → édition) ──
// Liquid Glass : la carte porte le seul flou ; pastilles, puces et badges
// internes jouent la profondeur par gloss + inset (texte net, perf maîtrisée).
const ChildCard = ({ child, groups, onOpen }) => {
    const sections = getSummaryBySection(child);
    const alerts = getAlertCount(child);
    const hasMeds = getMedicationsList(child).length > 0; // vrai système médicaments (plus les ivMed*)

    return (
        <button type="button" onClick={() => onOpen(child.id)} className="glass-card"
            style={{ width: '100%', textAlign: 'left', cursor: 'pointer', overflow: 'hidden', padding: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', padding: '1rem 1rem 0.875rem' }}>
                <span style={{ display: 'inline-flex', borderRadius: '50%', flexShrink: 0, boxShadow: '0 0 0 2px rgba(255,255,255,0.85), 0 4px 12px oklch(40% 0 0 / 0.18)' }}>
                    <Avatar participant={child} size={46} />
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: '800', fontSize: '0.98rem', color: 'var(--text-main)', letterSpacing: '-0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {child.firstName} {(child.lastName || "").toUpperCase()}
                    </div>
                    <div style={{ display: 'flex', gap: '0.375rem', marginTop: '4px', flexWrap: 'wrap' }}>
                        <GroupBadge groupId={child.group} groups={groups} />
                        {hasMeds && <span style={{ fontSize: '0.65rem', fontWeight: '950', background: 'linear-gradient(180deg, rgba(255,255,255,0.55), transparent), oklch(94% 0.07 145)', color: 'oklch(48% 0.18 145)', padding: '2px 8px', borderRadius: '8px', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.7)' }}>Traitement</span>}
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                    {alerts > 0 && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '3px', background: 'linear-gradient(180deg, rgba(255,255,255,0.45), transparent), oklch(95% 0.05 28)', color: 'var(--danger-color)', fontSize: '0.7rem', fontWeight: '950', padding: '3px 8px', borderRadius: '8px', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.7)' }}>
                            <ShieldAlert size={12} strokeWidth={2} /> {alerts}
                        </span>
                    )}
                    <ChevronRight size={18} strokeWidth={2} style={{ color: 'var(--text-muted)', opacity: 0.5 }} />
                </div>
            </div>
            {sections.length > 0 ? (
                <div style={{ padding: '0 0.875rem 0.875rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {sections.map(sec => (
                        <div key={sec.id} style={{ position: 'relative', background: 'linear-gradient(180deg, rgba(255,255,255,0.5), rgba(255,255,255,0.05) 60%), var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '0.625rem 0.75rem', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.85)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '7px' }}>
                                <span style={{ width: '24px', height: '24px', borderRadius: '9px', background: 'var(--primary-color)', color: 'white', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.5), 0 2px 6px var(--shadow-color)' }}>
                                    {React.cloneElement(sec.icon, { size: 14 })}
                                </span>
                                <span style={{ fontSize: '0.62rem', fontWeight: '950', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-main)' }}>
                                    {sec.label}
                                </span>
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                                {sec.rows.map((row, i) => (
                                    <span key={i} style={{ display: 'inline-flex', alignItems: 'center', fontSize: '0.72rem', fontWeight: '800', padding: '3px 10px', borderRadius: '100px', background: 'linear-gradient(180deg, rgba(255,255,255,0.95), rgba(255,255,255,0.72))', color: 'var(--text-main)', border: '1px solid var(--border-color)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.9), 0 1px 2px rgba(20,20,20,0.05)' }}>
                                        {(row.value === 'OUI' || row.value === 'Oui') ? row.label : `${row.label}: ${row.value}`}
                                    </span>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div style={{ margin: '0 0.875rem 0.875rem', padding: '0.75rem', borderRadius: '16px', border: '1.5px dashed var(--glass-border)', background: 'rgba(255,255,255,0.35)', textAlign: 'center', fontSize: '0.72rem', fontWeight: '800', color: 'var(--text-muted)', opacity: 0.7 }}>
                    Fiche à compléter
                </div>
            )}
        </button>
    );
};

// ── Main: card list ⇄ child detail ──
const InfoVacSection = ({ children, groups, updateParticipantHealth, canEdit }) => {
    const [selectedId, setSelectedId] = useState(null);
    const [search, setSearch] = useState('');

    const selectedChild = children.find(c => c.id === selectedId);
    if (selectedChild) {
        return (
            <ChildHealthDetail
                child={selectedChild}
                groups={groups}
                onBack={() => setSelectedId(null)}
                updateParticipantHealth={updateParticipantHealth}
                canEdit={canEdit}
            />
        );
    }

    const filtered = children.filter(c =>
        `${c.firstName} ${c.lastName || ''}`.toLowerCase().includes(search.toLowerCase())
    );
    const filledCount = filtered.filter(c => getSummaryBySection(c).length > 0).length;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Rechercher un enfant…" className="glass-input"
                    style={{ flex: 1, height: '44px', borderRadius: '14px', paddingLeft: '1rem' }} />
                <span style={{ fontSize: '0.75rem', fontWeight: '900', color: 'var(--text-muted)', flexShrink: 0, whiteSpace: 'nowrap' }}>
                    {filledCount}/{filtered.length} remplie{filledCount > 1 ? 's' : ''}
                </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(280px, 100%), 1fr))', gap: '0.875rem', alignItems: 'start' }}>
                {filtered.map(child => (
                    <ChildCard key={child.id} child={child} groups={groups} onOpen={setSelectedId} />
                ))}
            </div>
        </div>
    );
};

export default InfoVacSection;
