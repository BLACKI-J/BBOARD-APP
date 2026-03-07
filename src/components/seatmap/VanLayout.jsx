import React from 'react';
import { Trash2, Edit2, Check, X, Users } from 'lucide-react';
import Seat from './Seat';

// One accent color per van index
const ACCENTS = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b'];

export default function VanLayout({
    vanId, title, participants, placements, onDrop, onDragOver, onDragLeave,
    onRemove, onClear, isEditing, tempName, setTempName, onStartEdit, onSaveEdit, onCancelEdit,
    note, onNoteChange
}) {
    const prefix = `van${vanId}`;
    const totalSeats = 8;
    const occupiedCount = Object.keys(placements).filter(k => k.startsWith(`${prefix}-`)).length;
    const accent = ACCENTS[(vanId - 1) % ACCENTS.length];
    const fillPct = (occupiedCount / totalSeats) * 100;

    return (
        <div className="vehicle-card van-layout" style={{
            background: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
            maxWidth: '300px',
            margin: '0 auto',
        }}>
            {/* Header */}
            <div style={{
                padding: '1rem 1.25rem 0',
                borderBottom: `3px solid ${accent}`,
                background: `linear-gradient(135deg, ${accent}0d 0%, ${accent}04 100%)`,
            }}>
                {/* Top row: title + actions */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    {isEditing ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flex: 1 }}>
                            <input
                                type="text" value={tempName} onChange={e => setTempName(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && onSaveEdit()}
                                style={{
                                    fontSize: '0.95rem', fontWeight: '700', padding: '0.25rem 0.6rem',
                                    border: `1.5px solid ${accent}`, borderRadius: '7px', flex: 1,
                                    outline: 'none'
                                }}
                                autoFocus
                            />
                            <button onClick={onSaveEdit} style={{ background: accent, border: 'none', borderRadius: '6px', padding: '5px 8px', cursor: 'pointer', color: 'white', display: 'flex' }}>
                                <Check size={14} />
                            </button>
                            <button onClick={onCancelEdit} style={{ background: '#f1f5f9', border: 'none', borderRadius: '6px', padding: '5px 8px', cursor: 'pointer', display: 'flex' }}>
                                <X size={14} color="#64748b" />
                            </button>
                        </div>
                    ) : (
                        <h3
                            onClick={onStartEdit}
                            title="Cliquer pour renommer"
                            style={{ margin: 0, fontSize: '1rem', fontWeight: '800', color: '#1e293b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                        >
                            {title}
                            <Edit2 size={12} className="no-print" style={{ opacity: 0.3, marginTop: '1px' }} />
                        </h3>
                    )}

                    <button onClick={onClear} className="btn-icon no-print"
                        style={{ color: '#ef4444', opacity: 0.6, background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', borderRadius: '6px', marginLeft: '0.5rem' }}
                        title="Vider le van">
                        <Trash2 size={15} />
                    </button>
                </div>

                {/* Occupancy */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.875rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', fontWeight: '700', color: '#64748b' }}>
                        <Users size={13} color={accent} />
                        <span style={{ color: accent }}>{occupiedCount}</span>
                        <span style={{ opacity: 0.5 }}>/ {totalSeats}</span>
                    </div>
                    <div style={{ flex: 1, height: '5px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${fillPct}%`, height: '100%', background: accent, borderRadius: '3px', transition: 'width 0.35s ease' }} />
                    </div>
                </div>
            </div>

            {/* Seats area */}
            <div style={{ padding: '1.25rem', background: '#fafbff', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>

                {/* Row 1: Driver + Front passengers */}
                <div className="seat-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Seat id="Driver" label="🚗" vehiclePrefix={prefix} placements={placements} participants={participants}
                        onDrop={onDrop} onDragOver={onDragOver} onDragLeave={onDragLeave} onRemove={onRemove} isDriverSeat={true} />
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <Seat id="F1" vehiclePrefix={prefix} placements={placements} participants={participants}
                            onDrop={onDrop} onDragOver={onDragOver} onDragLeave={onDragLeave} onRemove={onRemove} />
                        <Seat id="F2" vehiclePrefix={prefix} placements={placements} participants={participants}
                            onDrop={onDrop} onDragOver={onDragOver} onDragLeave={onDragLeave} onRemove={onRemove} />
                    </div>
                </div>

                {/* Separator */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
                    <span style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: '600', letterSpacing: '0.4px' }}>RANGÉE ARRIÈRE</span>
                    <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
                </div>

                {/* Row 2: Middle */}
                <div className="seat-row" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    {['M1', 'M2', 'M3'].map(id => (
                        <Seat key={id} id={id} vehiclePrefix={prefix} placements={placements} participants={participants}
                            onDrop={onDrop} onDragOver={onDragOver} onDragLeave={onDragLeave} onRemove={onRemove} />
                    ))}
                </div>

                {/* Row 3: Back */}
                <div className="seat-row" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    {['B1', 'B2', 'B3'].map(id => (
                        <Seat key={id} id={id} vehiclePrefix={prefix} placements={placements} participants={participants}
                            onDrop={onDrop} onDragOver={onDragOver} onDragLeave={onDragLeave} onRemove={onRemove} />
                    ))}
                </div>
            </div>

            {/* Notes footer */}
            <div style={{ borderTop: '1px solid #f1f5f9', padding: '0.875rem 1.25rem', background: 'white' }}>
                <textarea
                    className="edit-notes"
                    value={note || ''}
                    onChange={e => onNoteChange && onNoteChange(e.target.value)}
                    placeholder="Notes..."
                    style={{
                        width: '100%', minHeight: '44px', padding: '0.5rem 0.75rem',
                        borderRadius: '8px', border: '1.5px solid #e2e8f0',
                        fontSize: '0.8rem', fontFamily: 'inherit', resize: 'vertical',
                        background: '#fafbff', outline: 'none', boxSizing: 'border-box',
                        color: '#475569', lineHeight: '1.5', transition: 'border-color 0.2s'
                    }}
                    onFocus={e => e.target.style.borderColor = accent}
                    onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                />
                <div className="print-notes" style={{ display: 'none', fontSize: '0.8rem', color: '#475569', whiteSpace: 'pre-wrap' }}>
                    {note || ''}
                </div>
            </div>
        </div>
    );
}
