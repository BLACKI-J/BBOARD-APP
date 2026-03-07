import React, { useState } from 'react';
import { AlertCircle, Users } from 'lucide-react';

export default function Sidebar({ participants, setParticipants, groups }) {
    // Filters state
    const [filterAllergies, setFilterAllergies] = useState(false);
    const [filterAge, setFilterAge] = useState('all'); // 'all', '6-8', '9-11', '12+'
    const [filterGroup, setFilterGroup] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Handle Drag Start
    const handleDragStart = (e, participant) => {
        e.dataTransfer.setData('participantId', participant.id);
        e.dataTransfer.effectAllowed = 'move';
        // Optional: set custom drag image
        e.currentTarget.style.opacity = '0.5';
    };

    const handleDragEnd = (e) => {
        e.currentTarget.style.opacity = '1';
    };

    const getGroupColor = (groupId) => {
        const group = groups.find(g => g.id === groupId);
        return group ? group.color : '#e5e7eb';
    };

    const getGroupStyle = (groupId) => {
        const group = groups.find(g => g.id === groupId);
        if (!group) return { background: '#e5e7eb', color: '#374151' };

        // Convert hex to rgba for background
        const hex = group.color.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);

        return {
            background: `rgba(${r}, ${g}, ${b}, 0.2)`,
            color: group.color, // Darker text for contrast could be better, but using main color for now
            border: `1px solid ${group.color}`
        };
    };

    const renderParticipantCard = (participant) => (
        <div
            key={participant.id}
            className="card sidebar-card"
            style={{
                padding: '0.75rem',
                display: 'flex',
                flexDirection: 'row', // Explicitly set row to avoid conflicts
                alignItems: 'center',
                gap: '0.75rem',
                cursor: 'grab',
                borderLeft: participant.role === 'animator' ? '4px solid var(--secondary-color)' :
                    (participant.role === 'direction' ? '4px solid #8b5cf6' : '4px solid var(--primary-color)'),
                position: 'relative',
                background: 'white',
                marginBottom: '0.5rem',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                borderLeftWidth: '4px' // Ensure left border is handled correctly
            }}
            draggable="true"
            onDragStart={(e) => handleDragStart(e, participant)}
            onDragEnd={handleDragEnd}
        >
            {/* Tooltip on Hover */}
            <div className="participant-tooltip" style={{
                position: 'absolute',
                left: '105%',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'white',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '1rem',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                zIndex: 100,
                width: '200px',
                pointerEvents: 'none',
                opacity: 0,
                transition: 'opacity 0.2s',
                visibility: 'hidden'
            }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.25rem' }}>
                        {participant.firstName} {participant.lastName}
                    </div>

                    {participant.photo && (
                        <div style={{ width: '100%', height: '120px', backgroundImage: `url(${participant.photo})`, backgroundSize: 'cover', backgroundPosition: 'center', borderRadius: '4px' }}></div>
                    )}

                    <div style={{ fontSize: '0.85rem' }}>
                        <strong>Âge:</strong> {participant.birthDate ? `${new Date().getFullYear() - new Date(participant.birthDate).getFullYear()} ans` : 'N/A'}
                    </div>

                    {participant.role === 'child' && (
                        <div style={{ fontSize: '0.85rem' }}>
                            <strong>Groupe:</strong> {groups.find(g => g.id === participant.group)?.name || participant.group || 'Aucun'}
                        </div>
                    )}

                    {(participant.allergies || participant.constraints) && (
                        <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px dashed var(--border-color)' }}>
                            {participant.allergies && (
                                <div style={{ color: 'var(--danger-color)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <AlertCircle size={12} /> <strong>Allergies:</strong> {participant.allergies}
                                </div>
                            )}
                            {participant.constraints && (
                                <div style={{ color: 'var(--warning-color)', fontSize: '0.8rem', marginTop: '2px' }}>
                                    <strong>Contraintes:</strong> {participant.constraints}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                .sidebar-card:hover .participant-tooltip {
                    opacity: 1;
                    visibility: visible;
                }
                .sidebar-card:hover {
                    background: #f8fafc !important;
                }
            `}</style>

            {/* Avatar */}
            <div style={{
                width: '40px', height: '40px', borderRadius: '50%',
                backgroundColor: participant.role === 'animator' ? 'var(--secondary-color)' :
                    (participant.role === 'direction' ? '#8b5cf6' : 'var(--primary-color)'),
                color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0,
                backgroundImage: participant.photo ? `url(${participant.photo})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center',
                fontSize: '0.9rem', fontWeight: 'bold'
            }}>
                {!participant.photo && participant.firstName.charAt(0).toUpperCase()}
            </div>

            {/* Infos */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <h4 style={{ margin: 0, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: '600', color: '#1e293b' }}>
                        {participant.firstName} {participant.lastName}
                    </h4>
                    {participant.group && (
                        <span style={{
                            fontSize: '0.65rem', padding: '0.1rem 0.3rem', borderRadius: '4px', fontWeight: 'bold',
                            ...getGroupStyle(participant.group)
                        }}>
                            {groups.find(g => g.id === participant.group)?.name || participant.group}
                        </span>
                    )}
                    {(participant.allergies || participant.constraints) && (
                        <AlertCircle size={14} style={{ color: 'var(--danger-color)' }} title="Allergies / Contraintes" />
                    )}
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {participant.role === 'animator' ? 'Animateur' :
                        (participant.role === 'direction' ? 'Direction' :
                            (participant.birthDate && new Date().getFullYear() - new Date(participant.birthDate).getFullYear() + " ans"))}
                </p>
            </div>
        </div>
    );

    const getAge = (birthDate) => {
        if (!birthDate) return null;
        const diff = Date.now() - new Date(birthDate).getTime();
        return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
    };

    const direction = participants.filter(p => p.role === 'direction');
    const animators = participants.filter(p => p.role === 'animator');
    const allChildren = participants.filter(p => !p.role || p.role === 'child');

    const filteredChildren = allChildren.filter(child => {
        // Search filter
        if (searchQuery && !(`${child.firstName} ${child.lastName}`).toLowerCase().includes(searchQuery.toLowerCase())) return false;

        // Allergy/Constraint filter
        if (filterAllergies && !child.allergies && !child.constraints) return false;

        // Group filter
        if (filterGroup !== 'all' && child.group !== filterGroup) return false;

        // Age filter
        if (filterAge !== 'all') {
            const age = getAge(child.birthDate);
            if (age === null) return false; // Skip if no birthdate
            if (filterAge === '6-8' && (age < 6 || age > 8)) return false;
            if (filterAge === '9-11' && (age < 9 || age > 11)) return false;
            if (filterAge === '12+' && age < 12) return false;
        }

        return true;
    });

    const filteredAnimators = animators.filter(p => {
        if (searchQuery && !(`${p.firstName} ${p.lastName}`).toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
    });

    const filteredDirection = direction.filter(p => {
        if (searchQuery && !(`${p.firstName} ${p.lastName}`).toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
    });

    return (
        <aside className="sidebar glass-surface animate-slide-in">
            {/* Mobile handle */}
            <div className="sidebar-handle no-print" style={{
                width: '40px', height: '4px', background: '#cbd5e1',
                borderRadius: '2px', margin: '10px auto 4px', flexShrink: 0
            }} />
            <div className="p-4" style={{ padding: '1.25rem 1.5rem 1rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.25rem' }}>
                        <Users className="text-primary" style={{ color: 'var(--primary-color)' }} size={24} />
                        Participants
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                        {participants.length} participant{participants.length > 1 ? 's' : ''}
                    </p>
                </div>
            </div>

            {/* Search & Filters Section */}
            <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <input
                    type="text"
                    placeholder="Rechercher un nom..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                        width: '100%',
                        padding: '0.625rem 1rem',
                        borderRadius: '10px',
                        border: '1px solid var(--border-color)',
                        fontSize: '0.9rem',
                        background: 'var(--bg-main)'
                    }}
                />

                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <button
                        onClick={() => setFilterAllergies(!filterAllergies)}
                        title="Afficher seulement les allergies/contraintes"
                        style={{
                            padding: '0.4rem 0.75rem',
                            borderRadius: '8px',
                            border: filterAllergies ? '1.5px solid var(--danger-color)' : '1px solid var(--border-color)',
                            background: filterAllergies ? 'rgba(239, 68, 68, 0.1)' : 'white',
                            color: filterAllergies ? 'var(--danger-color)' : 'var(--text-main)',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            transition: 'all 0.2s'
                        }}
                    >
                        <AlertCircle size={14} /> Santé
                    </button>

                    <select
                        value={filterGroup}
                        onChange={e => setFilterGroup(e.target.value)}
                        style={{ padding: '0.4rem', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.75rem', background: 'white', fontWeight: '500' }}
                    >
                        <option value="all">Tous Groupes</option>
                        {groups.map(g => (
                            <option key={g.id} value={g.id}>{g.name}</option>
                        ))}
                    </select>

                    <select
                        value={filterAge}
                        onChange={e => setFilterAge(e.target.value)}
                        style={{ padding: '0.4rem', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.75rem', background: 'white', fontWeight: '500' }}
                    >
                        <option value="all">Tout âge</option>
                        <option value="6-8">6-8 ans</option>
                        <option value="9-11">9-11 ans</option>
                        <option value="12+">12+ ans</option>
                    </select>
                </div>
            </div>

            <div className="no-scrollbar" style={{ padding: '1rem', flex: 1, overflowY: 'auto', overflowX: 'hidden', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {participants.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
                        <p>Aucun participant.</p>
                        <p style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>Ajoutez-les depuis l'Annuaire.</p>
                    </div>
                )}

                {filteredDirection.length > 0 && (
                    <div style={{ marginBottom: '1rem' }}>
                        <h3 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.625rem', paddingLeft: '0.25rem' }}>
                            Direction ({filteredDirection.length})
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                            {filteredDirection.map(renderParticipantCard)}
                        </div>
                    </div>
                )}

                {filteredAnimators.length > 0 && (
                    <div style={{ marginBottom: '1rem' }}>
                        <h3 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.625rem', paddingLeft: '0.25rem' }}>
                            Animateurs ({filteredAnimators.length})
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                            {filteredAnimators.map(renderParticipantCard)}
                        </div>
                    </div>
                )}

                {filteredChildren.length > 0 && (
                    <div>
                        <h3 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.625rem', paddingLeft: '0.25rem' }}>
                            Enfants ({filteredChildren.length})
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                            {filteredChildren.map(renderParticipantCard)}
                        </div>
                    </div>
                )}
            </div>
        </aside>
    );
}