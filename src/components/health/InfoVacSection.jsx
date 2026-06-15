import React, { useState } from 'react';
import { ShieldAlert, ChevronRight } from 'lucide-react';
import Avatar from '../common/Avatar';
import { GroupBadge } from '../common/Badges';
import { getSummaryBySection, getAlertCount } from './infoVacSchema';
import ChildHealthDetail from './ChildHealthDetail';

// ── Child card : TOUT le détail visible, regroupé par section (tap → édition) ──
const ChildCard = ({ child, groups, onOpen }) => {
    const sections = getSummaryBySection(child);
    const alerts = getAlertCount(child);
    const hasMeds = ['ivMedMatin','ivMedMidi','ivMedGouter','ivMedSoir','ivMedCoucher'].some(k => child[k]);

    // Teintes dérivées de la couleur de section (oklch → color-mix pour l'alpha).
    const tint = (c, pct) => `color-mix(in oklch, ${c} ${pct}%, white)`;

    return (
        <button type="button" onClick={() => onOpen(child.id)} className="iv-card"
            style={{ width: '100%', textAlign: 'left', background: 'white', borderRadius: '22px', border: '1.5px solid var(--glass-border)', boxShadow: 'var(--shadow-sm)', cursor: 'pointer', overflow: 'hidden', padding: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', padding: '1rem 1rem 0.875rem' }}>
                <Avatar participant={child} size={46} />
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: '950', fontSize: '0.98rem', color: 'var(--text-main)', letterSpacing: '-0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {child.firstName} {(child.lastName || "").toUpperCase()}
                    </div>
                    <div style={{ display: 'flex', gap: '0.375rem', marginTop: '4px', flexWrap: 'wrap' }}>
                        <GroupBadge groupId={child.group} groups={groups} />
                        {hasMeds && <span style={{ fontSize: '0.65rem', fontWeight: '950', background: 'oklch(96% 0.06 145)', color: 'oklch(52% 0.18 145)', padding: '2px 8px', borderRadius: '7px' }}>Traitement</span>}
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                    {alerts > 0 && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '3px', background: 'oklch(96% 0.05 28)', color: 'var(--danger-color)', fontSize: '0.7rem', fontWeight: '950', padding: '3px 8px', borderRadius: '8px' }}>
                            <ShieldAlert size={12} strokeWidth={3} /> {alerts}
                        </span>
                    )}
                    <ChevronRight size={18} strokeWidth={2.5} style={{ color: 'var(--text-muted)', opacity: 0.5 }} />
                </div>
            </div>
            {sections.length > 0 ? (
                <div style={{ padding: '0 0.875rem 0.875rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {sections.map(sec => (
                        <div key={sec.id} style={{ background: tint(sec.color, 7), border: `1px solid ${tint(sec.color, 26)}`, borderRadius: '14px', padding: '0.625rem 0.75rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '7px' }}>
                                <span style={{ width: '24px', height: '24px', borderRadius: '8px', background: sec.color, color: 'white', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    {React.cloneElement(sec.icon, { size: 14 })}
                                </span>
                                <span style={{ fontSize: '0.62rem', fontWeight: '950', letterSpacing: '0.06em', textTransform: 'uppercase', color: `color-mix(in oklch, ${sec.color} 80%, black)` }}>
                                    {sec.label}
                                </span>
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                                {sec.rows.map((row, i) => (
                                    <span key={i} style={{ display: 'inline-flex', alignItems: 'center', fontSize: '0.72rem', fontWeight: '800', padding: '3px 10px', borderRadius: '100px', background: 'white', color: `color-mix(in oklch, ${sec.color} 78%, black)`, border: `1px solid ${tint(sec.color, 32)}`, boxShadow: '0 1px 1px rgba(0,0,0,0.03)' }}>
                                        {(row.value === 'OUI' || row.value === 'Oui') ? row.label : `${row.label}: ${row.value}`}
                                    </span>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div style={{ margin: '0 0.875rem 0.875rem', padding: '0.75rem', borderRadius: '14px', border: '1.5px dashed var(--glass-border)', textAlign: 'center', fontSize: '0.72rem', fontWeight: '800', color: 'var(--text-muted)', opacity: 0.6 }}>
                    Fiche à compléter
                </div>
            )}
        </button>
    );
};

// ── Main: card list ⇄ child detail ──
const InfoVacSection = ({ children, groups, updateParticipantHealth, addHealthLog, canEdit, isMobile }) => {
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
                addHealthLog={addHealthLog}
                canEdit={canEdit}
                isMobile={isMobile}
            />
        );
    }

    const filtered = children.filter(c =>
        `${c.firstName} ${c.lastName}`.toLowerCase().includes(search.toLowerCase())
    );
    const filledCount = filtered.filter(c => getSummaryBySection(c).length > 0).length;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <style>{`
                .iv-card { transition: transform 0.18s var(--ease-out-expo), box-shadow 0.18s, border-color 0.18s; }
                .iv-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-lg); border-color: var(--primary-light); }
                .iv-card:active { transform: translateY(-1px); }
            `}</style>
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
