import React from 'react';
import { Trash2 } from 'lucide-react';
import Seat from './Seat';

export default function BusLayout({ participants, placements, onDrop, onDragOver, onDragLeave, onRemove, onClear }) {
    const rows = 12; // 12 rows of 4 seats
    return (
        <div className="vehicle-card bus-layout">
            <button onClick={onClear} className="btn-icon no-print" style={{ position: 'absolute', top: '1rem', right: '1rem', color: 'var(--danger-color)' }} title="Vider le car">
                <Trash2 size={16} />
            </button>

            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: '800' }}>Grand Car</h3>
                <div style={{ background: 'var(--primary-light)', color: 'var(--primary-color)', padding: '4px 12px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold', border: '1px solid var(--primary-color)' }}>
                    {Object.keys(placements).filter(k => k.startsWith('bus-')).length} / 53 Places
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
