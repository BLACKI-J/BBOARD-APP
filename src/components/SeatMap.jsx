import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, Edit2, Check, X, AlertCircle, Calendar, Bus, Truck, Printer, Clock, Sun, Moon, Minus, Settings2, Users, Search, MoreVertical, LayoutGrid, List } from 'lucide-react';
import BusLayout from './seatmap/BusLayout';
import VanLayout from './seatmap/VanLayout';
import { useUi } from '../ui/UiProvider';

export default function SeatMap({ participants = [], placements = {}, setPlacements, savedViews = {}, setSavedViews, currentViewName = '', setCurrentViewName, groups = [], canEdit = true }) {
    const ui = useUi();
    const [mode, setMode] = useState('daily'); // 'daily' (Vans) or 'travel' (Bus)
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [timeOfDay, setTimeOfDay] = useState('morning');
    const [vanCount, setVanCount] = useState(2);
    const [vanNames, setVanNames] = useState({ van1: 'Minibus 1', van2: 'Minibus 2', van3: 'Minibus 3', van4: 'Minibus 4' });
    const [editingVanName, setEditingVanName] = useState(null);
    const [tempVanName, setTempVanName] = useState('');
    const [vanNotes, setVanNotes] = useState({});
    const [activeVan, setActiveVan] = useState(1);
    const [isEditingViewName, setIsEditingViewName] = useState(false);
    const [newViewName, setNewViewName] = useState('');
    const [quickAssignSeat, setQuickAssignSeat] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isControlsOpen, setIsControlsOpen] = useState(true);

    useEffect(() => {
        if (mode === 'daily') {
            const dateViewName = `Date: ${selectedDate} - ${timeOfDay}`;
            if (currentViewName !== dateViewName) {
                if (typeof setCurrentViewName === 'function') setCurrentViewName(dateViewName);
            }
        }
    }, [mode, selectedDate, timeOfDay, currentViewName, setCurrentViewName]);

    useEffect(() => {
        const saved = localStorage.getItem('colo-van-config');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                if (data.names) setVanNames(data.names);
                if (data.count) setVanCount(data.count);
            } catch (e) {}
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('colo-van-config', JSON.stringify({ names: vanNames, count: vanCount }));
    }, [vanNames, vanCount]);

    const handleDrop = (e, seatId, vehiclePrefix) => {
        e.preventDefault();
        if (!canEdit) return;
        const pId = e.dataTransfer.getData('participantId');
        if (!pId) return;
        const newPlacements = { ...placements };
        Object.keys(newPlacements).forEach(key => { if (newPlacements[key] === pId) delete newPlacements[key]; });
        newPlacements[`${vehiclePrefix}-${seatId}`] = pId;
        setPlacements(newPlacements);
    };

    const handleDragOver = (e) => e.preventDefault();
    const handleDragLeave = (e) => {};
    const handleSeatClick = (seatId, prefix) => {
        if (!canEdit) return;
        if (placements[`${prefix}-${seatId}`]) {
            const newPlacements = { ...placements };
            delete newPlacements[`${prefix}-${seatId}`];
            setPlacements(newPlacements);
        } else {
            setQuickAssignSeat({ id: seatId, prefix });
            setSearchTerm('');
        }
    };

    const assignQuick = (pId) => {
        if (!quickAssignSeat) return;
        const newPlacements = { ...placements };
        Object.keys(newPlacements).forEach(key => { if (newPlacements[key] === pId) delete newPlacements[key]; });
        newPlacements[`${quickAssignSeat.prefix}-${quickAssignSeat.id}`] = pId;
        setPlacements(newPlacements);
        setQuickAssignSeat(null);
        ui.toast('Placé !', { type: 'success' });
    };

    const clearVehicle = (prefix) => {
        const newPlacements = { ...placements };
        Object.keys(newPlacements).forEach(key => { if (key.startsWith(prefix)) delete newPlacements[key]; });
        setPlacements(newPlacements);
    };

    const addVan = () => { if (vanCount < 4) setVanCount(v => v + 1); };
    const removeVan = () => { if (vanCount > 1) setVanCount(v => v - 1); };

    const unplacedParticipants = useMemo(() => {
        const placedIds = new Set(Object.values(placements || {}));
        return (participants || []).filter(p => p && p.id && !placedIds.has(p.id))
            .sort((a, b) => (a.lastName || '').localeCompare(b.lastName || ''));
    }, [participants, placements]);

    const filteredUnplaced = unplacedParticipants.filter(p => 
        `${p.firstName || ''} ${p.lastName || ''}`.toLowerCase().includes((searchTerm || '').toLowerCase())
    );

    return (
        <div className="seat-map-container" style={{ position: 'relative', overflowX: 'hidden', overflowY: 'auto' }}>
            
            {/* Liquid Header: Floating Glass Panel */}
            <div className="glass-controls-panel no-print" style={{
                position: 'sticky', top: '16px', zIndex: 100, margin: '0 16px 24px',
                background: 'rgba(255, 255, 255, 0.65)', backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.4)', borderRadius: '20px',
                padding: '12px 20px', boxShadow: '0 8px 32px rgba(15, 23, 42, 0.08)',
                display: 'flex', flexDirection: 'column', gap: '12px'
            }}>
                {/* Row 1: Mode switcher + Date/Time */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <div className="mode-switcher" style={{ background: 'rgba(15, 23, 42, 0.05)', padding: '4px', borderRadius: '12px', display: 'flex', gap: '4px' }}>
                            <button className={`btn-mode ${mode === 'daily' ? 'active' : ''}`} onClick={() => setMode('daily')} style={{
                                padding: '6px 14px', borderRadius: '9px', border: 'none', fontSize: '12px', fontWeight: '800',
                                background: mode === 'daily' ? 'white' : 'transparent', color: mode === 'daily' ? 'var(--primary-color)' : 'var(--text-muted)',
                                boxShadow: mode === 'daily' ? '0 4px 10px rgba(0,0,0,0.05)' : 'none', transition: 'all 0.3s'
                            }}><Truck size={14} style={{ marginRight: '6px' }} /> Activités</button>
                            <button className={`btn-mode ${mode === 'travel' ? 'active' : ''}`} onClick={() => setMode('travel')} style={{
                                padding: '6px 14px', borderRadius: '9px', border: 'none', fontSize: '12px', fontWeight: '800',
                                background: mode === 'travel' ? 'white' : 'transparent', color: mode === 'travel' ? 'var(--primary-color)' : 'var(--text-muted)',
                                boxShadow: mode === 'travel' ? '0 4px 10px rgba(0,0,0,0.05)' : 'none', transition: 'all 0.3s'
                            }}><Bus size={14} style={{ marginRight: '6px' }} /> Voyage</button>
                        </div>

                        {mode === 'daily' ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                <div style={{ background: 'white', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Calendar size={14} color="var(--primary-color)" />
                                    <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} style={{ border: 'none', fontSize: '13px', fontWeight: '700', outline: 'none', maxWidth: '140px' }} />
                                </div>
                                <div style={{ background: 'white', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '3px', display: 'flex' }}>
                                    <button onClick={() => setTimeOfDay('morning')} style={{ 
                                        padding: '5px 10px', borderRadius: '7px', fontSize: '11px', fontWeight: '800',
                                        background: timeOfDay === 'morning' ? 'var(--primary-color)' : 'transparent', color: timeOfDay === 'morning' ? 'white' : 'var(--text-muted)',
                                        border: 'none'
                                    }}>Matin</button>
                                    <button onClick={() => setTimeOfDay('afternoon')} style={{ 
                                        padding: '5px 10px', borderRadius: '7px', fontSize: '11px', fontWeight: '800',
                                        background: timeOfDay === 'afternoon' ? 'var(--cta-color)' : 'transparent', color: timeOfDay === 'afternoon' ? 'white' : 'var(--text-muted)',
                                        border: 'none'
                                    }}>Après-midi</button>
                                </div>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <select className="input-field" value={currentViewName} onChange={e => setCurrentViewName(e.target.value)} style={{ padding: '6px 12px', borderRadius: '10px', fontSize: '13px', fontWeight: '800' }}>
                                    {Object.keys(savedViews).map(k => <option key={k} value={k}>{k}</option>)}
                                </select>
                            </div>
                        )}
                    </div>

                    <button className="btn btn-outline" onClick={() => window.print()} style={{ padding: '8px', borderRadius: '10px', flexShrink: 0 }}><Printer size={16} /></button>
                </div>

                {/* Row 2: Van counter — always visible when mode is daily */}
                {mode === 'daily' && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'rgba(15,23,42,0.04)', padding: '6px 12px', borderRadius: '14px', border: '1px solid rgba(15,23,42,0.04)' }}>
                        <button 
                            className="btn-icon-min" 
                            onClick={removeVan} 
                            disabled={vanCount <= 1}
                            title="Enlever un van"
                        >
                            <Minus size={14} strokeWidth={3} />
                        </button>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', userSelect: 'none' }}>
                            <span style={{ fontSize: '13px', fontWeight: '900', color: 'var(--primary-color)' }}>{vanCount}</span>
                            <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)' }}>Van{vanCount > 1 ? 's' : ''}</span>
                        </div>
                        <button 
                            className="btn-icon-min" 
                            onClick={addVan} 
                            disabled={vanCount >= 4}
                            title="Ajouter un van"
                        >
                            <Plus size={14} strokeWidth={3} />
                        </button>
                    </div>
                )}
            </div>

            {/* Quick Assign Modal */}
            {quickAssignSeat && (
                <div className="quick-assign-overlay" style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setQuickAssignSeat(null)}>
                    <div className="quick-assign-modal" style={{ width: '90%', maxWidth: '420px', background: 'white', borderRadius: '24px', padding: '24px', boxShadow: '0 25px 50px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '900' }}>Assigner un passager</h3>
                            <button onClick={() => setQuickAssignSeat(null)} className="btn-icon"><X size={20} /></button>
                        </div>
                        <div style={{ position: 'relative', marginBottom: '16px' }}>
                            <Search size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
                            <input autoFocus className="input-field" placeholder="Rechercher..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ paddingLeft: '40px' }} />
                        </div>
                        <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                            {filteredUnplaced.map(p => (
                                <div key={p.id} className="quick-p-item" onClick={() => assignQuick(p.id)} style={{
                                    padding: '10px', borderRadius: '12px', border: '1px solid var(--border-color)', cursor: 'pointer', transition: 'all 0.2s',
                                    fontSize: '13px', fontWeight: '700', textAlign: 'center'
                                }}>
                                    {p.firstName} {p.lastName.charAt(0)}.
                                </div>
                            ))}
                            {filteredUnplaced.length === 0 && <div style={{ gridColumn: 'span 2', textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>Aucun résultat</div>}
                        </div>
                    </div>
                </div>
            )}

            {/* Main Stage: The 3D World */}
            <div className="vehicle-container-3d">
                {mode === 'travel' ? (
                    <div className="vehicle-shell bus-shell" style={{ width: '480px', padding: '60px 25px 25px' }}>
                        <div className="vehicle-roof bus-roof" />
                        <BusLayout participants={participants} placements={placements} onDrop={handleDrop} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onRemove={handleSeatClick} onClear={() => clearVehicle('bus')} />
                    </div>
                ) : (
                    <div className="vans-grid" style={{ display: 'flex', flexWrap: 'wrap', gap: '80px', justifyContent: 'center' }}>
                        {Array.from({ length: vanCount }).map((_, i) => (
                            <div key={i} className="vehicle-shell van-shell" style={{ width: '380px', padding: '50px 20px 20px' }}>
                                <div className="vehicle-roof van-roof" />
                                <VanLayout 
                                    vanId={i+1} title={vanNames[`van${i+1}`]} participants={participants} placements={placements} 
                                    onDrop={handleDrop} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onRemove={handleSeatClick} onClear={() => clearVehicle(`van${i+1}`)}
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>


        </div>
    );
}
