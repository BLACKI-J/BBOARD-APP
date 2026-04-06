import React from 'react';
import { Search, LayoutGrid, LayoutList, X, Filter, Users } from 'lucide-react';

const DirectoryFilters = ({ searchTerm, setSearchTerm, filterRole, setFilterRole, filterGroup, setFilterGroup, viewMode, setViewMode, groups, isMobile }) => {
    return (
        <div className="directory-filters df-wrap no-scrollbar" style={{
            padding: isMobile ? '0.75rem 1rem' : '1rem 2.5rem', 
            display: 'flex', 
            gap: isMobile ? '0.75rem' : '1rem',
            alignItems: 'center', 
            background: 'var(--glass-bg)', 
            backdropFilter: 'blur(var(--glass-blur))',
            borderBottom: '1.5px solid var(--glass-border)',
            flexWrap: isMobile ? 'nowrap' : 'wrap',
            overflowX: isMobile ? 'auto' : 'visible',
            zIndex: 25
        }}>
            {/* Search */}
            <div className="df-search" style={{ flex: isMobile ? '0 0 180px' : '1 1 300px', minWidth: isMobile ? '180px' : '200px', position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                    type="text"
                    placeholder={isMobile ? "Rechercher..." : "Rechercher un membre par nom, prénom ou rôle..."}
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    style={{ 
                        width: '100%', 
                        padding: '0.75rem 3rem 0.75rem 3rem', 
                        borderRadius: '16px', 
                        border: '1.5px solid var(--glass-border)', 
                        fontSize: '0.9rem', 
                        fontWeight: '600',
                        boxSizing: 'border-box',
                        background: 'rgba(255, 255, 255, 0.5)',
                        transition: 'all 0.3s var(--ease-out-expo)',
                        outline: 'none'
                    }}
                    className="glass-input"
                />
                {searchTerm && (
                    <button
                        onClick={() => setSearchTerm('')}
                        style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.05)', border: 'none', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)' }}
                    >
                        <X size={14} strokeWidth={3} />
                    </button>
                )}
            </div>

            {/* Filters + Toggle */}
            <div className="df-selects" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'nowrap', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                    <div style={{ color: 'var(--text-muted)', display: 'flex' }}><Filter size={16} /></div>
                    <select className="select-filter" value={filterRole} onChange={e => setFilterRole(e.target.value)}
                        style={{ background: 'white', border: '1.5px solid var(--glass-border)', borderRadius: '12px', padding: '0.5rem 1rem', fontWeight: '800', fontSize: '0.8rem', outline: 'none', cursor: 'pointer' }}>
                        <option value="all">Tous Rôles</option>
                        <option value="child">Enfants</option>
                        <option value="animator">Animateurs</option>
                        <option value="direction">Direction</option>
                    </select>

                    <select className="select-filter" value={filterGroup} onChange={e => setFilterGroup(e.target.value)}
                        style={{ background: 'white', border: '1.5px solid var(--glass-border)', borderRadius: '12px', padding: '0.5rem 1rem', fontWeight: '800', fontSize: '0.8rem', outline: 'none', cursor: 'pointer' }}>
                        <option value="all">Tous Groupes</option>
                        <option value="none">Sans Groupe</option>
                        {groups.map(g => (
                            <option key={g.id} value={g.id}>{g.name}</option>
                        ))}
                    </select>
                </div>

                <div style={{ height: '20px', width: '1.5px', background: 'var(--glass-border)', margin: '0 0.25rem' }} />

                {/* View toggle */}
                <div style={{ background: 'oklch(0% 0 0 / 0.05)', padding: '4px', borderRadius: '14px', display: 'flex', flexShrink: 0, backdropFilter: 'blur(10px)' }}>
                    <button 
                        style={{ width: '36px', height: '36px', borderRadius: '10px', background: viewMode === 'table' ? 'white' : 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: viewMode === 'table' ? 'var(--shadow-sm)' : 'none', transition: 'all 0.3s' }}
                        onClick={() => setViewMode('table')} title="Vue Liste">
                        <LayoutList size={18} color={viewMode === 'table' ? 'var(--primary-color)' : 'var(--text-muted)'} strokeWidth={viewMode === 'table' ? 2.5 : 2} />
                    </button>
                    <button 
                        style={{ width: '36px', height: '36px', borderRadius: '10px', background: viewMode === 'grid' ? 'white' : 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: viewMode === 'grid' ? 'var(--shadow-sm)' : 'none', transition: 'all 0.3s' }}
                        onClick={() => setViewMode('grid')} title="Vue Cartes">
                        <LayoutGrid size={18} color={viewMode === 'grid' ? 'var(--primary-color)' : 'var(--text-muted)'} strokeWidth={viewMode === 'grid' ? 2.5 : 2} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DirectoryFilters;
