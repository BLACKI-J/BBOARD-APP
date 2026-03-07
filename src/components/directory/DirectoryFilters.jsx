import React from 'react';
import { Search, Grid, List, X } from 'lucide-react';

const DirectoryFilters = ({ searchTerm, setSearchTerm, filterRole, setFilterRole, filterGroup, setFilterGroup, viewMode, setViewMode, groups }) => {
    return (
        <div className="directory-filters df-wrap" style={{
            padding: '0.75rem 1.5rem', display: 'flex', gap: '0.625rem',
            alignItems: 'center', background: '#f8fafc', borderBottom: '1px solid var(--border-color)',
            flexWrap: 'wrap'
        }}>
            {/* Search */}
            <div className="df-search" style={{ flex: '1 1 180px', minWidth: '140px', position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                    type="text"
                    placeholder="Rechercher..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    style={{ width: '100%', padding: '0.55rem 2rem 0.55rem 2.1rem', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.9rem', boxSizing: 'border-box' }}
                />
                {searchTerm && (
                    <button
                        onClick={() => setSearchTerm('')}
                        style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0, display: 'flex' }}
                    >
                        <X size={14} />
                    </button>
                )}
            </div>

            {/* Filters + Toggle */}
            <div className="df-selects" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <select className="select-filter" value={filterRole} onChange={e => setFilterRole(e.target.value)}
                    style={{ fontSize: '0.85rem', padding: '0.5rem 1.5rem 0.5rem 0.75rem' }}>
                    <option value="all">Tous les rôles</option>
                    <option value="child">Enfants</option>
                    <option value="animator">Animateurs</option>
                    <option value="direction">Direction</option>
                </select>
                <select className="select-filter" value={filterGroup} onChange={e => setFilterGroup(e.target.value)}
                    style={{ fontSize: '0.85rem', padding: '0.5rem 1.5rem 0.5rem 0.75rem' }}>
                    <option value="all">Tous les groupes</option>
                    <option value="none">Sans groupe</option>
                    {groups.map(g => (
                        <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                </select>

                {/* View toggle */}
                <div style={{ background: 'white', padding: '0.2rem', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', flexShrink: 0 }}>
                    <button className={`view-toggle ${viewMode === 'table' ? 'active' : ''}`} onClick={() => setViewMode('table')} title="Vue liste">
                        <List size={17} />
                    </button>
                    <button className={`view-toggle ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')} title="Vue cartes">
                        <Grid size={17} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DirectoryFilters;
