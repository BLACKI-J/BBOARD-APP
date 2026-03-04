import React from 'react';
import { Search, Grid, List } from 'lucide-react';

const DirectoryFilters = ({ searchTerm, setSearchTerm, filterRole, setFilterRole, filterGroup, setFilterGroup, viewMode, setViewMode, groups }) => {
    return (
        <div className="directory-filters" style={{ padding: '1rem 2rem', display: 'flex', gap: '1rem', alignItems: 'center', background: '#f8fafc', borderBottom: '1px solid var(--border-color)' }}>
            <div className="search-box" style={{ flex: 1, maxWidth: '400px', position: 'relative' }}>
                <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                    type="text" 
                    placeholder="Rechercher..." 
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem 1rem 0.6rem 2.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.95rem' }}
                />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
                <select className="select-filter" value={filterRole} onChange={e => setFilterRole(e.target.value)}>
                    <option value="all">Tous les rôles</option>
                    <option value="child">Enfants</option>
                    <option value="animator">Animateurs</option>
                    <option value="direction">Direction</option>
                </select>
                <select className="select-filter" value={filterGroup} onChange={e => setFilterGroup(e.target.value)}>
                    <option value="all">Tous les groupes</option>
                    <option value="none">Sans groupe</option>
                    {groups.map(g => (
                        <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                </select>
            </div>

            <div style={{ marginLeft: 'auto', background: 'white', padding: '0.25rem', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex' }}>
                <button 
                    className={`view-toggle ${viewMode === 'table' ? 'active' : ''}`}
                    onClick={() => setViewMode('table')}
                >
                    <List size={18} />
                </button>
                <button 
                    className={`view-toggle ${viewMode === 'grid' ? 'active' : ''}`}
                    onClick={() => setViewMode('grid')}
                >
                    <Grid size={18} />
                </button>
            </div>
        </div>
    );
};

export default DirectoryFilters;
