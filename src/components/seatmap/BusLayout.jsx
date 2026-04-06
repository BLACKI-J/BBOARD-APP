import React from 'react';
import { Trash2 } from 'lucide-react';
import Seat from './Seat';

export default function BusLayout({ participants, placements, onDrop, onDragOver, onDragLeave, onRemove, onClear }) {
    const rows = 12; // 12 rows of 4 seats
    return (
        <div className="vehicle-card bus-layout" style={{
            background: 'rgba(255, 255, 255, 0.45)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.5)',
            borderRadius: '28px',
            overflow: 'hidden',
            boxShadow: 'inset 0 0 1px rgba(255,255,255,0.8), 0 15px 45px rgba(15, 23, 42, 0.1)',
            maxWidth: '480px',
            margin: '0 auto',
            position: 'relative'
        }}>
            <button onClick={onClear} className="btn-icon no-print" style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', color: '#ef4444', opacity: 0.6 }} title="Vider le car">
                <Trash2 size={16} />
            </button>

            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', padding: '1.5rem 1.5rem 0', marginBottom: '2.5rem' }}>
                <h3 style={{ margin: 0, color: '#1e293b', fontSize: '1.1rem', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: '900' }}>Grand Voyageur</h3>
                <div style={{ background: 'oklch(65% 0.22 260 / 0.1)', color: 'oklch(65% 0.22 260)', padding: '5px 14px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: '800', border: '1.5px solid oklch(65% 0.22 260 / 0.2)' }}>
                    {Object.keys(placements).filter(k => k.startsWith('bus-')).length} / 53
                </div>
            </div>

            {/* Driver area */}
            <div style={{ height: '80px', borderBottom: '2px dashed #cbd5e1', marginBottom: '2rem', display: 'flex', justifyContent: 'flex-end', paddingRight: '1rem' }}>
                <Seat id="Driver" label="Chauffeur" vehiclePrefix="bus" placements={placements} participants={participants} onDrop={onDrop} onDragOver={onDragOver} onDragLeave={onDragLeave} onRemove={onRemove} isDriverSeat={true} />
            </div>

            {/* Rows */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {Array.from({ length: rows }).map((_, rowIndex) => {
                    const rowNumber = rowIndex + 1;
                    return (
                        <div key={rowNumber} className="seat-row" style={{ marginBottom: 0 }}>
                            <div className="seat-group">
                                <Seat id={`${rowNumber}A`} vehiclePrefix="bus" placements={placements} participants={participants} onDrop={onDrop} onDragOver={onDragOver} onDragLeave={onDragLeave} onRemove={onRemove} />
                                <Seat id={`${rowNumber}B`} vehiclePrefix="bus" placements={placements} participants={participants} onDrop={onDrop} onDragOver={onDragOver} onDragLeave={onDragLeave} onRemove={onRemove} />
                            </div>
                            <div style={{ width: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1', fontSize: '0.8rem', fontWeight: 'bold' }}>{rowNumber}</div>
                            <div className="seat-group">
                                <Seat id={`${rowNumber}C`} vehiclePrefix="bus" placements={placements} participants={participants} onDrop={onDrop} onDragOver={onDragOver} onDragLeave={onDragLeave} onRemove={onRemove} />
                                <Seat id={`${rowNumber}D`} vehiclePrefix="bus" placements={placements} participants={participants} onDrop={onDrop} onDragOver={onDragOver} onDragLeave={onDragLeave} onRemove={onRemove} />
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Back seat contiguous */}
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.25rem', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '2px dashed #cbd5e1' }}>
                {['13A', '13B', '13C', '13D', '13E'].map(id => (
                    <Seat key={id} id={id} vehiclePrefix="bus" placements={placements} participants={participants} onDrop={onDrop} onDragOver={onDragOver} onDragLeave={onDragLeave} onRemove={onRemove} />
                ))}
            </div>
        </div>
    );
}
