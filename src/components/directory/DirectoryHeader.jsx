import React from 'react';
import { Users, User, Shield, Trash2, Plus, MoreHorizontal, Download, Upload } from 'lucide-react';
import { StatBadge } from '../common/Badges';

const DirectoryHeader = ({ stats, selectedCount, handleBulkDelete, openGroupManager, openNewForm, handleExport, handleImport }) => {
    return (
        <div className="directory-header" style={{ padding: '1.5rem 2rem', background: 'white', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-color)', marginBottom: '0.5rem' }}>Annuaire</h1>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <StatBadge icon={<Users size={16}/>} count={stats.total} label="Total" />
                    <StatBadge icon={<User size={16}/>} count={stats.children} label="Enfants" color="blue" />
                    <StatBadge icon={<Shield size={16}/>} count={stats.animators} label="Staff" color="green" />
                </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
                {selectedCount > 0 ? (
                    <button className="btn btn-danger animate-fade-in" onClick={handleBulkDelete} style={{ boxShadow: 'var(--shadow-sm)' }}>
                        <Trash2 size={18} /> Supprimer ({selectedCount})
                    </button>
                ) : (
                    <>
                         <button className="btn btn-outline" onClick={openGroupManager}>
                            <Users size={18} /> Groupes
                        </button>
                        <button className="btn btn-primary" onClick={openNewForm} style={{ boxShadow: 'var(--shadow-md)' }}>
                            <Plus size={18} /> Nouveau
                        </button>
                    </>
                )}
                
                <div style={{ width: '1px', background: 'var(--border-color)', margin: '0 0.5rem' }}></div>
                
                <div className="dropdown-wrapper">
                     <button className="btn btn-icon-only" title="Options">
                        <MoreHorizontal size={20} />
                    </button>
                </div>
                <button className="btn btn-icon-only" onClick={handleExport} title="Exporter">
                    <Download size={20} />
                </button>
                <label className="btn btn-icon-only" title="Importer">
                    <Upload size={20} />
                    <input type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
                </label>
            </div>
        </div>
    );
};

export default DirectoryHeader;
