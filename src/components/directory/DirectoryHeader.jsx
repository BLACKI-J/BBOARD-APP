import React from 'react';
import { Users, User, Shield, Trash2, Plus, Download, Upload, Printer } from 'lucide-react';
import { StatBadge } from '../common/Badges';

const DirectoryHeader = ({ stats, selectedCount, handleBulkDelete, openGroupManager, openNewForm, handleExport, handleImport, isMobile, canEdit }) => {
    return (
        <div className="directory-header dh-wrap" style={{
            padding: isMobile ? '0.75rem 1rem' : '1.25rem 2.5rem', 
            background: 'var(--glass-bg)', 
            backdropFilter: 'blur(var(--glass-blur))', 
            borderBottom: '1.5px solid var(--glass-border)',
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            flexWrap: 'wrap', 
            gap: isMobile ? '0.75rem' : '1.25rem',
            zIndex: 30
        }}>
            {/* Left: Stats Section */}
            <div style={{ flex: isMobile ? '1' : 'none', minWidth: isMobile ? '0' : 'auto', width: isMobile ? '100%' : 'auto' }}>
                <div className="dh-stats no-scrollbar" style={{ 
                    display: 'flex', 
                    gap: '0.85rem', 
                    flexWrap: isMobile ? 'nowrap' : 'wrap',
                    overflowX: isMobile ? 'auto' : 'visible',
                }}>
                    <StatBadge icon={<Users size={16} strokeWidth={2.5} />} count={stats.total} label="TOTAL" />
                    <StatBadge icon={<User size={16} strokeWidth={2.5} />} count={stats.children} label="ENFANTS" color="blue" />
                    <StatBadge icon={<Shield size={16} strokeWidth={2.5} />} count={stats.animators + stats.direction} label="STAFF" color="green" />
                </div>
            </div>

            {/* Right: Actions Section */}
            <div className="dh-actions" style={{ 
                display: 'flex', 
                gap: '0.75rem', 
                alignItems: 'center',
                marginLeft: isMobile ? '0' : 'auto',
                width: isMobile ? '100%' : 'auto'
            }}>
                {selectedCount > 0 ? (
                    <button className="btn btn-danger animate-fade-in" onClick={handleBulkDelete} style={{ gap: '0.625rem', padding: '0.75rem 1.25rem', borderRadius: '14px', fontWeight: '950' }}>
                        <Trash2 size={18} strokeWidth={2.5} /> Supprimer ({selectedCount})
                    </button>
                ) : (
                    <>
                        {canEdit && !isMobile && (
                            <button className="btn btn-secondary" onClick={openGroupManager} style={{ padding: '0.75rem 1.25rem', borderRadius: '14px', fontWeight: '900', gap: '0.625rem' }}>
                                <Users size={18} strokeWidth={2.5} /> <span className="dh-label">Groupes</span>
                            </button>
                        )}
                        {canEdit && !isMobile && (
                            <button className="btn btn-primary" onClick={openNewForm} style={{ padding: '0.75rem 1.25rem', borderRadius: '14px', fontWeight: '950', gap: '0.625rem' }}>
                                <Plus size={20} strokeWidth={3} /> <span className="dh-label">Ajouter</span>
                            </button>
                        )}
                    </>
                )}
                
                {!isMobile && <div style={{ width: '1.5px', background: 'var(--glass-border)', height: '24px', margin: '0 0.5rem' }}></div>}
                
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn-icon-ref" onClick={() => window.print()} title="Imprimer Liste (PDF)">
                        <Printer size={18} strokeWidth={2.5} />
                    </button>
                    {canEdit && !isMobile && (
                        <>
                            <button className="btn-icon-ref" onClick={handleExport} title="Exporter les données (JSON)">
                                <Download size={18} strokeWidth={2.5} />
                            </button>
                            <label className="btn-icon-ref" title="Importer des données (JSON)">
                                <Upload size={18} strokeWidth={2.5} />
                                <input type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
                            </label>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DirectoryHeader;
