import React from 'react';
import { Users, User, Shield, Trash2, Plus, Download, Upload, Printer, FileSpreadsheet } from 'lucide-react';
import { StatBadge } from '../common/Badges';
import SectionHeader from '../common/SectionHeader';

const DirectoryHeader = ({ stats, selectedCount, handleBulkDelete, openGroupManager, openNewForm, handleExport, handleExportCsv, handleImport, handleImportCsv, openTrombiModal, hasSelection, isMobile, canEdit }) => {
    return (
        <div className="directory-header dh-wrap" style={{
            padding: isMobile ? '0.75rem 1rem' : '2.5rem 2.5rem 1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: isMobile ? '0.5rem' : '2rem',
            zIndex: 30,
            background: 'transparent'
        }}>
            {/* Left: Section Title & Stats */}
            <div style={{ flex: isMobile ? '1' : 'none', minWidth: isMobile ? '0' : 'auto' }}>
                {!isMobile && (
                    <div style={{ marginBottom: '1.25rem' }}>
                        <SectionHeader hue="var(--sec-annuaire)" icon={Users} title="Annuaire" />
                    </div>
                )}
                <div className="dh-stats no-scrollbar" style={{
                    display: 'flex',
                    gap: isMobile ? '0.5rem' : '0.85rem',
                    flexWrap: 'nowrap',
                    overflowX: 'auto',
                }}>
                    <StatBadge icon={<Users size={isMobile ? 14 : 16} strokeWidth={2.5} />} count={stats.total} label={isMobile ? '' : 'TOTAL'} />
                    <StatBadge icon={<User size={isMobile ? 14 : 16} strokeWidth={2.5} />} count={stats.children} label={isMobile ? '' : 'ENFANTS'} color="blue" />
                    <StatBadge icon={<Shield size={isMobile ? 14 : 16} strokeWidth={2.5} />} count={stats.animators + stats.direction} label={isMobile ? '' : 'STAFF'} color="green" />
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
                        {canEdit && (
                            <button className="btn btn-primary" onClick={openNewForm} style={{ padding: isMobile ? '0.5rem 0.875rem' : '0.75rem 1.25rem', borderRadius: '14px', fontWeight: '950', gap: '0.5rem', minHeight: '44px' }}>
                                <Plus size={isMobile ? 18 : 20} strokeWidth={3} /> {!isMobile && <span className="dh-label">Ajouter</span>}
                            </button>
                        )}
                    </>
                )}
                
                {!isMobile && <div style={{ width: '1.5px', background: 'var(--glass-border)', height: '24px', margin: '0 0.5rem' }}></div>}
                
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn-icon-ref" style={{ background: 'white', width: '44px', height: '44px' }} onClick={() => window.print()} title="Imprimer Liste (PDF)">
                        <Printer size={18} strokeWidth={2.5} />
                    </button>
                    <button
                        className="btn-icon-ref"
                        onClick={openTrombiModal}
                        title="Trombinoscope 🤠"
                        style={{ background: 'white', width: '44px', height: '44px', fontSize: '20px' }}
                    >
                        🤠
                    </button>
                    {canEdit && !isMobile && (
                        <>
                            <button className="btn-icon-ref" style={{ background: 'white', width: '44px', height: '44px' }} onClick={handleExportCsv} title="Exporter en CSV (Excel)">
                                <FileSpreadsheet size={18} strokeWidth={2.5} />
                            </button>
                            <button className="btn-icon-ref" style={{ background: 'white', width: '44px', height: '44px' }} onClick={handleExport} title="Exporter les données (JSON)">
                                <Download size={18} strokeWidth={2.5} />
                            </button>
                            <label className="btn-icon-ref" style={{ background: 'white', width: '44px', height: '44px', cursor: 'pointer' }} title="Importer depuis CSV">
                                <FileSpreadsheet size={16} strokeWidth={2.5} style={{ color: 'var(--success-color)' }} />
                                <input type="file" accept=".csv,.txt" onChange={handleImportCsv} style={{ display: 'none' }} />
                            </label>
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
