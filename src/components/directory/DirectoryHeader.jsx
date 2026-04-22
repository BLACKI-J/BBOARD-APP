import React from 'react';
import { Users, User, Shield, Trash2, Plus, Download, Upload, Printer } from 'lucide-react';
import { StatBadge } from '../common/Badges';

const DirectoryHeader = ({ stats, selectedCount, handleBulkDelete, openGroupManager, openNewForm, handleExport, handleImport, isMobile, canEdit }) => {
    return (
        <div className="directory-header dh-wrap" style={{
            padding: isMobile ? '1.5rem 1rem' : '2.5rem 2.5rem 1.5rem', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'flex-end', 
            flexWrap: 'wrap', 
            gap: isMobile ? '1rem' : '2rem',
            zIndex: 30,
            background: 'transparent'
        }}>
            {/* Left: Section Title & Stats */}
            <div style={{ flex: isMobile ? '1' : 'none', minWidth: isMobile ? '0' : 'auto' }}>
                <h2 style={{ fontSize: isMobile ? '1.8rem' : '2.5rem', fontWeight: '950', marginBottom: '1.25rem', letterSpacing: '-0.05em' }}>Annuaire</h2>
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
                marginBottom: '4px'
            }}>
                {selectedCount > 0 ? (
                    <button className="btn btn-danger animate-fade-in" onClick={handleBulkDelete} style={{ gap: '0.625rem', padding: '0.75rem 1.25rem', borderRadius: '16px', fontWeight: '950', boxShadow: '0 12px 24px oklch(60% 0.2 28 / 0.25)' }}>
                        <Trash2 size={18} strokeWidth={2.5} /> Supprimer ({selectedCount})
                    </button>
                ) : (
                    <>
                        {canEdit && !isMobile && (
                            <button className="btn btn-secondary" onClick={openGroupManager} style={{ padding: '0.75rem 1.25rem', borderRadius: '16px', fontWeight: '900', gap: '0.625rem', background: 'white' }}>
                                <Users size={18} strokeWidth={2.5} /> <span className="dh-label">Groupes</span>
                            </button>
                        )}
                        {canEdit && !isMobile && (
                            <button className="btn btn-primary" onClick={openNewForm} style={{ padding: '0.75rem 1.25rem', borderRadius: '16px', fontWeight: '950', gap: '0.625rem' }}>
                                <Plus size={20} strokeWidth={3} /> <span className="dh-label">Ajouter</span>
                            </button>
                        )}
                    </>
                )}
                
                {!isMobile && <div style={{ width: '1.5px', background: 'var(--glass-border)', height: '24px', margin: '0 0.5rem' }}></div>}
                
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn-icon-ref" style={{ background: 'white', width: '44px', height: '44px' }} onClick={() => window.print()} title="Imprimer Liste (PDF)">
                        <Printer size={18} strokeWidth={2.5} />
                    </button>
                    {canEdit && !isMobile && (
                        <>
                            <button className="btn-icon-ref" style={{ background: 'white', width: '44px', height: '44px' }} onClick={handleExport} title="Exporter les données (JSON)">
                                <Download size={18} strokeWidth={2.5} />
                            </button>
                            <label className="btn-icon-ref" style={{ background: 'white', width: '44px', height: '44px', cursor: 'pointer' }} title="Importer des données (JSON)">
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
