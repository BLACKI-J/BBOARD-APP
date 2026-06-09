import React, { useState } from 'react';
import { ShieldAlert, ChevronRight } from 'lucide-react';
import Avatar from '../common/Avatar';
import { GroupBadge } from '../common/Badges';
import { getSummaryRows, getAlertCount } from './infoVacSchema';
import ChildHealthDetail from './ChildHealthDetail';

// ── Child summary card (tap → full detail) ──
const ChildCard = ({ child, groups, onOpen }) => {
    const summary = getSummaryRows(child);
    const alerts = getAlertCount(child);
    const hasMeds = ['ivMedMatin','ivMedMidi','ivMedGouter','ivMedSoir','ivMedCoucher'].some(k => child[k]);

    return (
        <button type="button" onClick={() => onOpen(child.id)}
            style={{ width: '100%', textAlign: 'left', background: 'white', borderRadius: '20px', border: '1.5px solid var(--glass-border)', boxShadow: 'var(--shadow-sm)', cursor: 'pointer', overflow: 'hidden', padding: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', padding: '0.875rem 1rem' }}>
                <Avatar participant={child} size={44} />
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: '950', fontSize: '0.95rem', color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
                        {child.firstName} {(child.lastName || "").toUpperCase()}
                    </div>
                    <div style={{ display: 'flex', gap: '0.375rem', marginTop: '3px', flexWrap: 'wrap' }}>
                        <GroupBadge groupId={child.group} groups={groups} />
                        {hasMeds && <span style={{ fontSize: '0.65rem', fontWeight: '950', background: 'oklch(96% 0.06 145)', color: 'oklch(52% 0.18 145)', padding: '2px 7px', borderRadius: '6px' }}>Traitement</span>}
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
            {summary.length > 0 && (
                <div style={{ borderTop: '1px solid var(--glass-border)', padding: '0.625rem 1rem', display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                    {summary.slice(0, 4).map((row, i) => (
                        <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.72rem', fontWeight: '800', padding: '3px 10px', borderRadius: '100px', background: `${row.color}12`, color: row.color, border: `1px solid ${row.color}25` }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: row.color, flexShrink: 0 }} />
                            {(row.value === 'OUI' || row.value === 'Oui') ? row.label : `${row.label}: ${row.value}`}
                        </span>
                    ))}
                    {summary.length > 4 && <span style={{ fontSize: '0.68rem', fontWeight: '700', color: 'var(--text-muted)', padding: '3px 9px', background: 'var(--bg-secondary)', borderRadius: '100px' }}>+{summary.length - 4}</span>}
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
    const filledCount = filtered.filter(c => getSummaryRows(c).length > 0).length;

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

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(360px, 1fr))', gap: '0.875rem' }}>
                {filtered.map(child => (
                    <ChildCard key={child.id} child={child} groups={groups} onOpen={setSelectedId} />
                ))}
            </div>
        </div>
    );
};

export default InfoVacSection;
