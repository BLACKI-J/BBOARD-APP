import React from 'react';
import { Check, Square, Eye, Edit2, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import Avatar from '../common/Avatar';
import { RoleBadge, GroupBadge } from '../common/Badges';
import HealthIndicators from '../common/HealthIndicators';
import { getAge } from '../../utils/participantUtils';

const ParticipantTable = ({ participants, selectedParticipants, toggleSelection, toggleSelectAll, sortConfig, requestSort, handleViewDetails, handleEdit, handleDelete, groups, canEdit }) => {
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
