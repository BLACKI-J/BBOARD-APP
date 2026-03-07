import React from 'react';
import { Users, User, Shield, Trash2, Plus, Download, Upload } from 'lucide-react';
import { StatBadge } from '../common/Badges';

const DirectoryHeader = ({ stats, selectedCount, handleBulkDelete, openGroupManager, openNewForm, handleExport, handleImport }) => {
    return (
        <div className="directory-header dh-wrap" style={{
            padding: '1rem 1.5rem', background: 'white', borderBottom: '1px solid var(--border-color)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem'
        }}>
            {/* Left: Title + Stats */}
            <div>
                <h1 style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-color)', marginBottom: '0.4rem' }}>Annuaire</h1>
                <div className="dh-stats" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <StatBadge icon={<Users size={16} />} count={stats.total} label="Total" />
                    <StatBadge icon={<User size={16} />} count={stats.children} label="Enfants" color="blue" />
                    <StatBadge icon={<Shield size={16} />} count={stats.animators} label="Staff" color="green" />
                </div>
            </div>

            {/* Right: Actions */}
            <div className="dh-actions" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                {selectedCount > 0 ? (
                    <button className="btn btn-danger animate-fade-in" onClick={handleBulkDelete} style={{ boxShadow: 'var(--shadow-sm)' }}>
                        <Trash2 size={16} /> Supprimer ({selectedCount})
                    </button>
                ) : (
                    <>
                        <button className="btn btn-outline" onClick={openGroupManager} style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}>
                            <Users size={16} /> <span className="dh-label">Groupes</span>
                        </button>
                        <button className="btn btn-primary" onClick={openNewForm} style={{ boxShadow: 'var(--shadow-md)', fontSize: '0.875rem', padding: '0.5rem 1rem' }}>
                            <Plus size={16} /> <span className="dh-label">Nouveau</span>
                        </button>
                    </>
                )}
                <div style={{ width: '1px', background: 'var(--border-color)', height: '28px', margin: '0 0.1rem' }}></div>
                <button className="btn btn-icon-only" onClick={handleExport} title="Exporter JSON" style={{ padding: '0.5rem' }}>
                    <Download size={18} />
                </button>
                <label className="btn btn-icon-only" title="Importer JSON" style={{ padding: '0.5rem', cursor: 'pointer' }}>
                    <Upload size={18} />
                    <input type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
                </label>
            </div>

            <style>{`
                @media (max-width: 600px) {
                    .dh-actions { width: 100%; justify-content: flex-start; }
                }
            `}</style>
        </div>
    );
};

export default DirectoryHeader;
