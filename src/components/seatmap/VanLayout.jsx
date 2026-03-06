import React from 'react';
import { Trash2, Edit2, Check, X } from 'lucide-react';
import Seat from './Seat';

export default function VanLayout({ vanId, title, participants, placements, onDrop, onDragOver, onDragLeave, onRemove, onClear, isEditing, tempName, setTempName, onStartEdit, onSaveEdit, onCancelEdit, note, onNoteChange }) {
    const prefix = `van${vanId}`;

    return (
        <div className="van-wrapper" style={{ position: 'relative', padding: '0 1rem' }}>
            {/* Wheels */}
            <div style={{ position: 'absolute', top: '80px', left: -4, width: '8px', height: '40px', background: '#475569', borderRadius: '4px', zIndex: 0 }}></div>
            <div style={{ position: 'absolute', top: '80px', right: -4, width: '8px', height: '40px', background: '#475569', borderRadius: '4px', zIndex: 0 }}></div>
            <div style={{ position: 'absolute', bottom: '80px', left: -4, width: '8px', height: '40px', background: '#475569', borderRadius: '4px', zIndex: 0 }}></div>
            <div style={{ position: 'absolute', bottom: '80px', right: -4, width: '8px', height: '40px', background: '#475569', borderRadius: '4px', zIndex: 0 }}></div>

            <div className="vehicle-card van-layout" style={{
                background: 'white', borderRadius: '32px 32px 12px 12px', border: '3px solid #475569',
                maxWidth: '320px', margin: '0 auto', position: 'relative', overflow: 'hidden',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}>
                {/* Windshield Area */}
                <div style={{ background: '#e2e8f0', padding: '1.5rem 1rem 0.5rem 1rem', borderBottom: '3px solid #cbd5e1', position: 'relative' }}>
                    <div style={{ height: '50px', background: '#cbd5e1', borderRadius: '16px 16px 4px 4px', marginBottom: '1rem', border: '1px solid #94a3b8', opacity: 0.5 }}></div>
                    <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end', position: 'absolute', top: '0.5rem', right: '0.5rem' }}>
                        <button onClick={onClear} className="btn-icon no-print" style={{ color: 'var(--danger-color)' }} title="Vider le van">
                            <Trash2 size={16} />
                        </button>
                    </div>
                    <div style={{ textAlign: 'center', position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                        {isEditing ? (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                <input type="text" value={tempName} onChange={(e) => setTempName(e.target.value)} style={{ fontSize: '1rem', fontWeight: 'bold', padding: '0.25rem 0.5rem', border: '1px solid var(--primary-color)', borderRadius: '6px', width: '140px', textAlign: 'center' }} autoFocus />
                                <button onClick={onSaveEdit} className="btn-icon" style={{ color: 'var(--primary-color)' }}><Check size={18} /></button>
                                <button onClick={onCancelEdit} className="btn-icon"><X size={18} /></button>
                            </div>
                        ) : (
                            <h3 onClick={onStartEdit} style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800', color: '#1e293b', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }} title="Cliquer pour renommer">
                                {title} <Edit2 size={14} className="no-print" style={{ opacity: 0.3 }} />
                            </h3>
                        )}
                        <div style={{ background: 'white', color: 'var(--text-muted)', padding: '2px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
                            {Object.keys(placements).filter(k => k.startsWith(`van${vanId}-`)).length} / 8 Places
                        </div>
                    </div>
                </div>

                {/* Interior Cabin */}
                <div style={{ padding: '1.5rem', background: '#f8fafc' }}>
                    <div className="seat-row" style={{ marginBottom: '1.5rem' }}>
                        <Seat id="Driver" label="Chauffeur" vehiclePrefix={prefix} placements={placements} participants={participants} onDrop={onDrop} onDragOver={onDragOver} onDragLeave={onDragLeave} onRemove={onRemove} isDriverSeat={true} />
                        <div className="seat-group" style={{ gap: '0.5rem' }}>
                            <Seat id="F1" vehiclePrefix={prefix} placements={placements} participants={participants} onDrop={onDrop} onDragOver={onDragOver} onDragLeave={onDragLeave} onRemove={onRemove} />
                            <Seat id="F2" vehiclePrefix={prefix} placements={placements} participants={participants} onDrop={onDrop} onDragOver={onDragOver} onDragLeave={onDragLeave} onRemove={onRemove} />
                        </div>
                    </div>
                    <div className="seat-row" style={{ justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                        <Seat id="M1" vehiclePrefix={prefix} placements={placements} participants={participants} onDrop={onDrop} onDragOver={onDragOver} onDragLeave={onDragLeave} onRemove={onRemove} />
                        <Seat id="M2" vehiclePrefix={prefix} placements={placements} participants={participants} onDrop={onDrop} onDragOver={onDragOver} onDragLeave={onDragLeave} onRemove={onRemove} />
                        <Seat id="M3" vehiclePrefix={prefix} placements={placements} participants={participants} onDrop={onDrop} onDragOver={onDragOver} onDragLeave={onDragLeave} onRemove={onRemove} />
                    </div>
                    <div className="seat-row" style={{ justifyContent: 'space-between' }}>
                        <Seat id="B1" vehiclePrefix={prefix} placements={placements} participants={participants} onDrop={onDrop} onDragOver={onDragOver} onDragLeave={onDragLeave} onRemove={onRemove} />
                        <Seat id="B2" vehiclePrefix={prefix} placements={placements} participants={participants} onDrop={onDrop} onDragOver={onDragOver} onDragLeave={onDragLeave} onRemove={onRemove} />
                        <Seat id="B3" vehiclePrefix={prefix} placements={placements} participants={participants} onDrop={onDrop} onDragOver={onDragOver} onDragLeave={onDragLeave} onRemove={onRemove} />
                    </div>
                </div>

                {/* Trunk Area */}
                <div className="trunk-area" style={{ background: '#e2e8f0', padding: '1rem 1rem', textAlign: 'center', borderTop: '3px solid #cbd5e1' }}>
                    <div className="edit-notes">
                        <textarea value={note || ''} onChange={(e) => onNoteChange && onNoteChange(e.target.value)} placeholder="Notes, bagages, instructions..." style={{ width: '100%', minHeight: '60px', padding: '0.5rem', borderRadius: '6px', border: '1px solid #94a3b8', fontSize: '0.85rem', fontFamily: 'inherit', resize: 'vertical', background: 'white' }} />
                    </div>
                    <div className="print-notes" style={{ display: 'none', textAlign: 'left', whiteSpace: 'pre-wrap', fontSize: '0.8rem', border: '1px solid #94a3b8', borderRadius: '6px', padding: '0.5rem', background: 'white', minHeight: '60px' }}>
                        <strong>Notes :</strong><br />{note || 'Aucune note.'}
                    </div>
                </div>
            </div>
        </div>
    );
}
