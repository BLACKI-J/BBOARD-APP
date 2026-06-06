import React, { useState, useRef, useMemo } from 'react';
import { Check, Eye, Edit2, Trash2, ChevronUp, ChevronDown, ShieldAlert } from 'lucide-react';
import Avatar from '../common/Avatar';
import { RoleBadge, GroupBadge } from '../common/Badges';
import HealthIndicators from '../common/HealthIndicators';
import { getAge } from '../../utils/participantUtils';

// ── Swipeable mobile row: tap opens details, swipe-left reveals actions ──
const SwipeRow = ({ p, isSelected, toggleSelection, handleViewDetails, handleEdit, handleDelete, groups, canEdit }) => {
    const [offset, setOffset] = useState(0);
    const startX = useRef(null);
    const moved = useRef(false);
    const groupName = groups.find(g => g.id === p.group)?.name;
    const age = getAge(p.birthDate);
    const hasAlert = (p.allergies && p.allergies.trim()) || (p.constraints && p.constraints.trim());
    const ACTION_W = canEdit ? 112 : 0; // width of revealed actions

    const onTouchStart = (e) => { startX.current = e.touches[0].clientX; moved.current = false; };
    const onTouchMove = (e) => {
        if (startX.current == null || !canEdit) return;
        const dx = e.touches[0].clientX - startX.current;
        if (Math.abs(dx) > 6) moved.current = true;
        // allow left-swipe (negative) up to ACTION_W, and closing
        const base = offset <= -ACTION_W ? -ACTION_W : 0;
        const next = Math.min(0, Math.max(-ACTION_W, base + dx));
        setOffset(next);
    };
    const onTouchEnd = () => {
        if (startX.current == null) return;
        setOffset(offset < -ACTION_W / 2 ? -ACTION_W : 0);
        startX.current = null;
    };
    const onRowClick = () => { if (!moved.current) { if (offset !== 0) setOffset(0); else handleViewDetails(p); } };

    return (
        <div style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden' }}>
            {/* Action layer behind */}
            {canEdit && (
                <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'stretch' }}>
                    <button onClick={() => { setOffset(0); handleEdit(p); }} style={{ width: '56px', border: 'none', background: 'oklch(58% 0.12 235)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Edit2 size={18} strokeWidth={2.5} /></button>
                    <button onClick={() => { setOffset(0); handleDelete(p.id); }} style={{ width: '56px', border: 'none', background: 'var(--danger-color)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Trash2 size={18} strokeWidth={2.5} /></button>
                </div>
            )}
            {/* Foreground row */}
            <div
                onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
                onClick={onRowClick}
                style={{
                    position: 'relative', display: 'flex', alignItems: 'center', gap: '0.75rem',
                    padding: '0.625rem 0.75rem',
                    background: isSelected ? 'var(--primary-light)' : 'white',
                    border: `1.5px solid ${isSelected ? 'var(--primary-color)' : 'var(--glass-border)'}`,
                    borderRadius: '16px', boxShadow: 'var(--shadow-sm)', cursor: 'pointer',
                    transform: `translateX(${offset}px)`, transition: startX.current == null ? 'transform 0.25s var(--ease-out-expo)' : 'none',
                }}>
                {canEdit && (
                    <div onClick={(e) => { e.stopPropagation(); toggleSelection(p.id); }}
                        style={{ flexShrink: 0, width: '24px', height: '24px', borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: isSelected ? 'var(--primary-color)' : 'white', border: '1.5px solid var(--glass-border)', color: 'white' }}>
                        {isSelected && <Check size={15} strokeWidth={3} />}
                    </div>
                )}
                <Avatar participant={p} size={42} />
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: '900', fontSize: '0.92rem', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {p.firstName} <span style={{ textTransform: 'uppercase' }}>{p.lastName}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '2px', fontSize: '0.72rem', fontWeight: '700', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                        {groupName || 'Sans groupe'}{age ? ` · ${age}` : ''}
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
                    {hasAlert && <span title="Alerte santé" style={{ display: 'flex', color: 'var(--danger-color)' }}><ShieldAlert size={16} strokeWidth={2.5} /></span>}
                    <RoleBadge role={p.role} />
                </div>
            </div>
        </div>
    );
};

const ParticipantTable = ({ participants, selectedParticipants, toggleSelection, toggleSelectAll, sortConfig, requestSort, handleViewDetails, handleEdit, handleDelete, groups, canEdit, isMobile }) => {
    // Group participants by group for mobile section headers
    const sections = useMemo(() => {
        if (!isMobile) return [];
        const byGroup = new Map();
        participants.forEach(p => {
            const key = p.group || '__none__';
            if (!byGroup.has(key)) byGroup.set(key, []);
            byGroup.get(key).push(p);
        });
        // Order: defined groups first (in groups order), then "Sans groupe"
        const ordered = [];
        groups.forEach(g => { if (byGroup.has(g.id)) ordered.push({ id: g.id, name: g.name, items: byGroup.get(g.id) }); });
        if (byGroup.has('__none__')) ordered.push({ id: '__none__', name: 'Sans groupe', items: byGroup.get('__none__') });
        return ordered;
    }, [participants, groups, isMobile]);

    // ── Mobile: sectioned, swipeable stacked list ──
    if (isMobile) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {sections.map(sec => (
                    <div key={sec.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0 0.25rem' }}>
                            <span style={{ fontSize: '0.72rem', fontWeight: '950', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{sec.name}</span>
                            <span style={{ fontSize: '0.68rem', fontWeight: '900', color: 'var(--text-softer)', background: 'var(--bg-secondary)', padding: '1px 8px', borderRadius: '100px' }}>{sec.items.length}</span>
                            <div style={{ flex: 1, height: '1px', background: 'var(--glass-border)' }} />
                        </div>
                        {sec.items.map(p => (
                            <SwipeRow key={p.id} p={p}
                                isSelected={selectedParticipants.includes(p.id)}
                                toggleSelection={toggleSelection}
                                handleViewDetails={handleViewDetails}
                                handleEdit={handleEdit} handleDelete={handleDelete}
                                groups={groups} canEdit={canEdit} />
                        ))}
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div style={{ width: '100%', overflowX: 'auto', borderRadius: '24px', border: '1.5px solid var(--glass-border)', background: 'rgba(255,255,255,0.4)', backdropFilter: 'blur(10px)' }} className="no-scrollbar">
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, minWidth: '900px' }}>
                <thead>
                    <tr>
                        <th style={{ width: '64px', padding: '1.25rem' }}>
                            <div
                                onClick={toggleSelectAll}
                                style={{ 
                                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    width: '28px', height: '28px', borderRadius: '8px',
                                    background: selectedParticipants.length > 0 && selectedParticipants.length === participants.length ? 'var(--primary-color)' : 'white',
                                    border: '1.5px solid var(--glass-border)',
                                    color: 'white', transition: 'all 0.2s'
                                }}
                            >
                                {selectedParticipants.length > 0 && selectedParticipants.length === participants.length && <Check size={18} strokeWidth={3} />}
                            </div>
                        </th>
                        <th onClick={() => requestSort('firstName')} className="th-sortable">
                            NOM ET PRÉNOM {sortConfig.key === 'firstName' && (sortConfig.direction === 'ascending' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                        </th>
                        <th onClick={() => requestSort('role')} className="th-sortable">RÔLE</th>
                        <th onClick={() => requestSort('group')} className="th-sortable">GROUPE</th>
                        <th onClick={() => requestSort('birthDate')} className="th-sortable">ÂGE</th>
                        <th>SANTÉ / INFO</th>
                        <th style={{ textAlign: 'right', paddingRight: '2.5rem' }}>ACTIONS</th>
                    </tr>
                </thead>
                <tbody style={{ background: 'rgba(255,255,255,0.3)' }}>
                    {participants.map((p, idx) => {
                        const isSelected = selectedParticipants.includes(p.id);
                        return (
                            <tr key={p.id} className={`table-row-hover animate-fade-in ${isSelected ? 'row-selected' : ''}`} style={{ '--i': idx, animationDelay: `calc(var(--i) * 20ms)` }}>
                                <td style={{ padding: '1.25rem' }}>
                                    <div
                                        onClick={(e) => { e.stopPropagation(); toggleSelection(p.id); }}
                                        style={{ 
                                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            width: '28px', height: '28px', borderRadius: '8px',
                                            background: isSelected ? 'var(--primary-color)' : 'white',
                                            border: '1.5px solid var(--glass-border)',
                                            color: 'white', transition: 'all 0.2s'
                                        }}
                                    >
                                        {isSelected && <Check size={18} strokeWidth={3} />}
                                    </div>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer' }} onClick={() => handleViewDetails(p)}>
                                        <Avatar participant={p} size={42} />
                                        <div>
                                            <div style={{ fontWeight: '950', color: 'var(--text-main)', fontSize: '0.95rem', letterSpacing: '-0.01em' }}>
                                                {p.firstName} <span style={{ textTransform: 'uppercase' }}>{p.lastName}</span>
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td><RoleBadge role={p.role} /></td>
                                <td><GroupBadge groupId={p.group} groups={groups} /></td>
                                <td style={{ color: 'var(--text-muted)', fontWeight: '850', fontSize: '0.85rem' }}>{getAge(p.birthDate)}</td>
                                <td><HealthIndicators participant={p} /></td>
                                <td style={{ textAlign: 'right', paddingRight: '2.5rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                        <button onClick={() => handleViewDetails(p)} className="btn-icon-ref" title="Voir détails"><Eye size={16} strokeWidth={2.5} /></button>
                                        {canEdit && (
                                            <>
                                                <button onClick={() => handleEdit(p)} className="btn-icon-ref" title="Éditer"><Edit2 size={16} strokeWidth={2.5} /></button>
                                                <button onClick={() => handleDelete(p.id)} className="btn-icon-ref danger" title="Supprimer"><Trash2 size={16} strokeWidth={2.5} /></button>
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
            
            <style>{`
                thead th {
                    text-align: left; padding: 1.25rem; color: var(--text-muted); font-weight: 950; font-size: 11px;
                    letter-spacing: 0.12em; text-transform: uppercase; border-bottom: 1.5px solid var(--glass-border);
                    position: sticky; top: 0; background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(12px); z-index: 10;
                }
                .th-sortable { cursor: pointer; transition: color 0.2s; }
                .th-sortable:hover { color: var(--primary-color); }
                
                .table-row-hover { transition: all 0.3s var(--ease-out-expo); }
                .table-row-hover:hover { background: white !important; transform: scale(1.002); }
                .row-selected { background: oklch(58% 0.2 var(--brand-hue) / 0.05) !important; }
                
                td { padding: 1.25rem; vertical-align: middle; border-bottom: 1.5px solid var(--glass-border); }
            `}</style>
        </div>
    );
};

export default ParticipantTable;
