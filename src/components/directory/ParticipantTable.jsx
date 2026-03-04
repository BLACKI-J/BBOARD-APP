import React from 'react';
import { CheckSquare, Square, Eye, Edit2, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import Avatar from '../common/Avatar';
import { RoleBadge, GroupBadge } from '../common/Badges';
import HealthIndicators from '../common/HealthIndicators';
import { getAge } from '../../utils/participantUtils';

const ParticipantTable = ({ participants, selectedParticipants, toggleSelection, toggleSelectAll, sortConfig, requestSort, handleViewDetails, handleEdit, handleDelete, groups }) => {
    return (
        <table className="data-table" style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
            <thead>
                <tr>
                    <th style={{ width: '50px', padding: '0 1rem' }}>
                        <div 
                            onClick={toggleSelectAll} 
                            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                            {selectedParticipants.length > 0 && selectedParticipants.length === participants.length ? 
                                <CheckSquare size={20} color="var(--primary-color)" /> : 
                                <Square size={20} color="#cbd5e1" />
                            }
                        </div>
                    </th>
                    <th onClick={() => requestSort('firstName')}>Nom {sortConfig.key === 'firstName' && (sortConfig.direction === 'ascending' ? <ChevronUp size={14}/> : <ChevronDown size={14}/>)}</th>
                    <th onClick={() => requestSort('role')}>Rôle</th>
                    <th onClick={() => requestSort('group')}>Groupe</th>
                    <th onClick={() => requestSort('birthDate')}>Âge</th>
                    <th>Santé / Info</th>
                    <th style={{ textAlign: 'right', paddingRight: '2rem' }}>Actions</th>
                </tr>
            </thead>
            <tbody>
                {participants.map(p => (
                    <tr key={p.id} className={selectedParticipants.includes(p.id) ? 'selected' : ''}>
                        <td style={{ padding: '0 1rem' }}>
                            <div 
                                onClick={() => toggleSelection(p.id)} 
                                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                                {selectedParticipants.includes(p.id) ? 
                                    <CheckSquare size={20} color="var(--primary-color)" /> : 
                                    <Square size={20} color="#e2e8f0" />
                                }
                            </div>
                        </td>
                        <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <Avatar participant={p} size={36} />
                                <div>
                                    <div style={{ fontWeight: '600', color: '#1e293b' }}>{p.firstName} {p.lastName}</div>
                                </div>
                            </div>
                        </td>
                        <td><RoleBadge role={p.role} /></td>
                        <td><GroupBadge groupId={p.group} groups={groups} /></td>
                        <td style={{ color: '#64748b', fontWeight: '500' }}>{getAge(p.birthDate)}</td>
                        <td><HealthIndicators participant={p} /></td>
                        <td style={{ textAlign: 'right', paddingRight: '2rem' }}>
                            <div className="action-buttons">
                                <button onClick={() => handleViewDetails(p)} title="Voir détails"><Eye size={16} /></button>
                                <div className="divider"></div>
                                <button onClick={() => handleEdit(p)} title="Éditer" className="edit"><Edit2 size={16} /></button>
                                <button onClick={() => handleDelete(p.id)} title="Supprimer" className="delete"><Trash2 size={16} /></button>
                            </div>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
};

export default ParticipantTable;
