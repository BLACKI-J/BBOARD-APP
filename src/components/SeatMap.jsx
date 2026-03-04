import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Check, X, AlertCircle, Calendar, Bus, Truck, Printer, Clock, Sun, Moon, Minus } from 'lucide-react';

export default function SeatMap({ participants, placements, setPlacements, savedViews, setSavedViews, currentViewName, setCurrentViewName, groups }) {
    const [mode, setMode] = useState('daily'); // 'daily' (2 Vans) or 'travel' (Bus)
    
    // Date state for daily mode
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    // Time of day state for daily mode: 'morning' | 'afternoon'
    const [timeOfDay, setTimeOfDay] = useState('morning'); 
    
    // Custom names for vans & Van count
    const [vanCount, setVanCount] = useState(2);
    const [vanNames, setVanNames] = useState({
        van1: 'Minibus 1',
        van2: 'Minibus 2',
        van3: 'Minibus 3',
        van4: 'Minibus 4'
    });
    const [editingVanName, setEditingVanName] = useState(null); // 'van1' or 'van2' or null
    const [tempVanName, setTempVanName] = useState('');
    const [vanNotes, setVanNotes] = useState({});

    // View management for travel mode
    const [isEditingViewName, setIsEditingViewName] = useState(false);
    const [newViewName, setNewViewName] = useState('');

    // Update current view name when date/time changes in daily mode
    useEffect(() => {
        if (mode === 'daily') {
            const dateViewName = `Date: ${selectedDate} - ${timeOfDay}`;
            if (currentViewName !== dateViewName) {
                setCurrentViewName(dateViewName);
            }
        }
    }, [mode, selectedDate, timeOfDay, currentViewName, setCurrentViewName]);

    // Save van config to local storage
    useEffect(() => {
        const saved = localStorage.getItem('colo-van-config');
        if (saved) {
            const data = JSON.parse(saved);
            if (data.names) setVanNames(data.names);
            if (data.count) setVanCount(data.count);
        }
        
        const savedNotes = localStorage.getItem('colo-van-notes');
        if (savedNotes) setVanNotes(JSON.parse(savedNotes));
    }, []);

    useEffect(() => {
        localStorage.setItem('colo-van-config', JSON.stringify({ names: vanNames, count: vanCount }));
    }, [vanNames, vanCount]);

    useEffect(() => {
        localStorage.setItem('colo-van-notes', JSON.stringify(vanNotes));
    }, [vanNotes]);


    const handleDrop = (e, seatId, vehiclePrefix) => {
        e.preventDefault();
        const participantId = e.dataTransfer.getData('participantId');
        if (!participantId) return;

        // Check for animator constraint on driver seat
        if (seatId === 'Driver' && vehiclePrefix.startsWith('van')) {
             const participant = participants.find(p => p.id === participantId);
             if (participant?.role === 'child') {
                 alert("Seul un animateur ou un membre de la direction peut être au volant !");
                 return;
             }
        }

        const fullSeatId = `${vehiclePrefix}-${seatId}`;
        const newPlacements = { ...placements };
        
        // Remove participant from any previous seat IN THIS VEHICLE context
        Object.keys(newPlacements).forEach(key => {
            if (newPlacements[key] === participantId) {
                if (mode === 'daily') {
                    if (key.startsWith('van')) {
                        delete newPlacements[key];
                    }
                } else {
                    if (key.startsWith('bus-')) {
                        delete newPlacements[key];
                    }
                }
            }
        });

        // Assign to new seat
        newPlacements[fullSeatId] = participantId;
        setPlacements(newPlacements);
        e.currentTarget.classList.remove('drag-over');
    };

    const handleDragOver = (e) => {
        e.preventDefault(); // allow drop
        e.currentTarget.classList.add('drag-over');
    };

    const handleDragLeave = (e) => {
        e.currentTarget.classList.remove('drag-over');
    };

    const removePlacement = (seatId, vehiclePrefix) => {
        const fullSeatId = `${vehiclePrefix}-${seatId}`;
        const newPlacements = { ...placements };
        delete newPlacements[fullSeatId];
        setPlacements(newPlacements);
    };

    const clearVehicle = (vehiclePrefix) => {
        if (confirm(`Vider ce véhicule ?`)) {
            const newPlacements = { ...placements };
            Object.keys(newPlacements).forEach(key => {
                if (key.startsWith(`${vehiclePrefix}-`)) {
                    delete newPlacements[key];
                }
            });
            setPlacements(newPlacements);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    // Van Management
    const addVan = () => {
        if (vanCount < 4) setVanCount(vanCount + 1);
    };

    const removeVan = () => {
        if (vanCount > 1) {
            // Confirm if van has passengers
            const vanPrefix = `van${vanCount}`;
            const hasPassengers = Object.keys(placements).some(key => key.startsWith(vanPrefix));
            
            if (hasPassengers) {
                if (!confirm(`Le Minibus ${vanCount} contient des passagers. Voulez-vous vraiment le supprimer ?`)) {
                    return;
                }
                // Clear placements for this van
                const newPlacements = { ...placements };
                Object.keys(newPlacements).forEach(key => {
                    if (key.startsWith(vanPrefix)) delete newPlacements[key];
                });
                setPlacements(newPlacements);
            }
            setVanCount(vanCount - 1);
        }
    };

    const startRenamingVan = (vanKey) => {
        setTempVanName(vanNames[vanKey]);
        setEditingVanName(vanKey);
    };

    const saveVanName = () => {
        if (tempVanName.trim()) {
            setVanNames({ ...vanNames, [editingVanName]: tempVanName.trim() });
        }
        setEditingVanName(null);
    };

    // --- Travel Mode View Management ---
    const createNewView = () => {
        const name = prompt("Nom de la nouvelle vue (ex: Trajet Retour) :");
        if (name && !savedViews[name]) {
            setSavedViews({ ...savedViews, [name]: {} });
            setCurrentViewName(name);
        } else if (savedViews[name]) {
            alert("Une vue avec ce nom existe déjà.");
        }
    };

    const deleteView = () => {
        if (Object.keys(savedViews).length <= 1) {
            alert("Impossible de supprimer la dernière vue.");
            return;
        }
        if (confirm(`Supprimer la vue "${currentViewName}" ?`)) {
            const newSavedViews = { ...savedViews };
            delete newSavedViews[currentViewName];
            setSavedViews(newSavedViews);
            setCurrentViewName(Object.keys(newSavedViews)[0]);
        }
    };

    const startRenaming = () => {
        setNewViewName(currentViewName);
        setIsEditingViewName(true);
    };

    const saveRenaming = () => {
        if (newViewName && newViewName !== currentViewName) {
            if (savedViews[newViewName]) {
                alert("Une vue avec ce nom existe déjà.");
                return;
            }
            const newSavedViews = { ...savedViews };
            newSavedViews[newViewName] = newSavedViews[currentViewName];
            delete newSavedViews[currentViewName];
            setSavedViews(newSavedViews);
            setCurrentViewName(newViewName);
        }
        setIsEditingViewName(false);
    };

    return (
        <div className="seat-map-container">
            {/* Top Bar: Mode Switcher & Controls */}
            <div className="seat-map-controls no-print">
                
                {/* Mode Selector */}
                <div className="mode-switcher">
                    <button 
                        className={`mode-btn ${mode === 'daily' ? 'active' : ''}`}
                        onClick={() => setMode('daily')}
                    >
                        <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                            <Truck size={18} /> Activités (Vans)
                        </div>
                    </button>
                    <button 
                        className={`mode-btn ${mode === 'travel' ? 'active' : ''}`}
                        onClick={() => setMode('travel')}
                    >
                        <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                            <Bus size={18} /> Voyage (Grand Car)
                        </div>
                    </button>
                </div>

                {/* Contextual Controls */}
                {mode === 'daily' ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                        {/* Date Picker */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-secondary)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)' }}>
                            <Calendar size={18} color="var(--primary-color)" />
                            <span style={{ fontWeight: '600', color: 'var(--text-muted)' }}>Date :</span>
                            <input 
                                type="date" 
                                className="input-field"
                                value={selectedDate} 
                                onChange={(e) => setSelectedDate(e.target.value)}
                                style={{ padding: '0.25rem 0.5rem', border: 'none', background: 'transparent', width: 'auto' }}
                            />
                        </div>

                        {/* Morning / Afternoon Toggle */}
                        <div style={{ display: 'flex', background: '#e2e8f0', borderRadius: '8px', padding: '4px' }}>
                            <button 
                                onClick={() => setTimeOfDay('morning')}
                                style={{ 
                                    display: 'flex', alignItems: 'center', gap: '6px',
                                    padding: '6px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                                    background: timeOfDay === 'morning' ? 'white' : 'transparent',
                                    color: timeOfDay === 'morning' ? 'var(--primary-color)' : '#64748b',
                                    fontWeight: timeOfDay === 'morning' ? 'bold' : 'normal',
                                    boxShadow: timeOfDay === 'morning' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <Sun size={16} /> Matin
                            </button>
                            <button 
                                onClick={() => setTimeOfDay('afternoon')}
                                style={{ 
                                    display: 'flex', alignItems: 'center', gap: '6px',
                                    padding: '6px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                                    background: timeOfDay === 'afternoon' ? 'white' : 'transparent',
                                    color: timeOfDay === 'afternoon' ? '#f97316' : '#64748b',
                                    fontWeight: timeOfDay === 'afternoon' ? 'bold' : 'normal',
                                    boxShadow: timeOfDay === 'afternoon' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <Moon size={16} /> Après-midi
                            </button>
                        </div>

                         {/* Van Count Controls */}
                         <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#f1f5f9', padding: '0.25rem 0.5rem', borderRadius: '8px' }}>
                            <button 
                                onClick={removeVan} 
                                disabled={vanCount <= 1}
                                className="btn-icon"
                                style={{ opacity: vanCount <= 1 ? 0.3 : 1 }}
                            >
                                <Minus size={16} />
                            </button>
                            <span style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#475569' }}>{vanCount} Vans</span>
                            <button 
                                onClick={addVan} 
                                disabled={vanCount >= 4}
                                className="btn-icon"
                                style={{ opacity: vanCount >= 4 ? 0.3 : 1 }}
                            >
                                <Plus size={16} />
                            </button>
                        </div>
                    </div>
                ) : (
                    /* Travel View Management */
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span style={{ fontWeight: '500', color: 'var(--text-muted)' }}>Vue :</span>
                        
                        {isEditingViewName ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <input 
                                    type="text" 
                                    className="input-field" 
                                    value={newViewName} 
                                    onChange={(e) => setNewViewName(e.target.value)}
                                    style={{ padding: '0.25rem 0.5rem', width: '150px' }}
                                    autoFocus
                                />
                                <button className="btn-icon" onClick={saveRenaming} style={{ color: 'var(--primary-color)' }}><Check size={18} /></button>
                                <button className="btn-icon" onClick={() => setIsEditingViewName(false)}><X size={18} /></button>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <select 
                                    className="input-field" 
                                    value={currentViewName} 
                                    onChange={(e) => setCurrentViewName(e.target.value)}
                                    style={{ padding: '0.5rem', width: 'auto', minWidth: '150px', fontWeight: '600', background: 'var(--bg-secondary)', border: 'none' }}
                                >
                                    {Object.keys(savedViews).filter(k => !k.startsWith('Date:')).map(name => (
                                        <option key={name} value={name}>{name}</option>
                                    ))}
                                    {!Object.keys(savedViews).filter(k => !k.startsWith('Date:')).includes(currentViewName) && currentViewName.startsWith('Date:') === false && (
                                        <option value={currentViewName}>{currentViewName}</option>
                                    )}
                                </select>
                                <button className="btn-icon" onClick={startRenaming} title="Renommer"><Edit2 size={16} /></button>
                                <button className="btn-icon" onClick={deleteView} title="Supprimer" style={{ color: 'var(--danger-color)' }}><Trash2 size={16} /></button>
                            </div>
                        )}

                        <button className="btn btn-primary" onClick={createNewView} style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                            <Plus size={16} /> Nouvelle Vue
                        </button>
                    </div>
                )}

                {/* Print Button */}
                <div style={{ marginLeft: 'auto' }}>
                    <button 
                        className="btn btn-outline" 
                        onClick={handlePrint}
                        title="Imprimer le plan"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                        <Printer size={18} /> <span className="hide-mobile">Imprimer</span>
                    </button>
                </div>
            </div>

            {/* Print Header (Visible only when printing) */}
            <div className="print-header" style={{ display: 'none', marginBottom: '2rem', textAlign: 'center' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Plan de Transport</h1>
                <p style={{ fontSize: '1.1rem', color: '#64748b' }}>
                    {mode === 'daily' 
                        ? `${new Date(selectedDate).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} - ${timeOfDay === 'morning' ? 'Matin' : 'Après-midi'}`
                        : currentViewName
                    }
                </p>
            </div>
            <style>{`
                @media print {
                    @page {
                        size: A4 landscape;
                        margin: 0.5cm;
                    }
                    
                    /* Hide non-print elements globally */
                    body * {
                        visibility: hidden;
                    }
                    
                    /* Reset visibility for print content */
                    .seat-map-container,
                    .seat-map-container * {
                        visibility: visible;
                    }

                    /* Specific hides */
                    .no-print, 
                    .sidebar, 
                    .sidebar-overlay,
                    .content-header,
                    .seat-map-controls,
                    button { 
                        display: none !important; 
                    }

                    /* Layout Resets */
                    html, body, #root, .app-container, .main-content, .workspace-area {
                        background: white !important;
                        height: auto !important;
                        width: 100% !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        overflow: visible !important;
                        display: block !important;
                    }

                    /* Main Container */
                    .seat-map-container {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100% !important;
                        padding: 1cm !important;
                    }

                    /* Header */
                    .print-header { 
                        display: block !important; 
                        margin-bottom: 2rem;
                        text-align: center;
                        width: 100%;
                    }

                    /* Grid Layout for Vans - Modified for 2 per page */
                    .vehicle-area {
                        display: block !important;
                        text-align: center !important;
                        width: 100% !important;
                    }

                    /* Individual Van Scaling */
                    .vehicle-wrapper {
                        display: inline-block !important;
                        width: 45% !important;
                        margin: 0 2% 2rem 2% !important;
                        vertical-align: top !important;
                        break-inside: avoid !important;
                        page-break-inside: avoid !important;
                        transform: scale(0.85); /* Slightly smaller to fit */
                        transform-origin: top center;
                    }
                    
                    /* Force page break after every 2nd van */
                    .vehicle-wrapper:nth-child(2n) {
                        break-after: page !important;
                        page-break-after: always !important;
                    }

                    /* Avoid break after the last element if it's even */
                    .vehicle-wrapper:last-child {
                        break-after: auto !important;
                        page-break-after: auto !important;
                    }

                    /* Ensure background colors print */
                    * {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }

                    /* Print-only notes */
                    .print-notes {
                        display: block !important;
                    }
                    .edit-notes {
                        display: none !important;
                    }
                }
            `}</style>

            {/* Vehicle Area Container */}
            <div className="vehicle-area">
                {mode === 'travel' ? (
                    <div className="vehicle-wrapper">
                        <BusLayout 
                            participants={participants} 
                            placements={placements} 
                            onDrop={(e, id) => handleDrop(e, id, 'bus')} 
                            onDragOver={handleDragOver} 
                            onDragLeave={handleDragLeave} 
                            onRemove={(id) => removePlacement(id, 'bus')} 
                            onClear={() => clearVehicle('bus')}
                        />
                    </div>
                ) : (
                    <>
                        {Array.from({ length: vanCount }).map((_, i) => {
                            const vanKey = `van${i + 1}`;
                            return (
                                <div key={vanKey} className="vehicle-wrapper">
                                    <VanLayout 
                                        vanId={i + 1}
                                        title={vanNames[vanKey]}
                                        participants={participants} 
                                        placements={placements} 
                                        onDrop={(e, id) => handleDrop(e, id, vanKey)} 
                                        onDragOver={handleDragOver} 
                                        onDragLeave={handleDragLeave} 
                                        onRemove={(id) => removePlacement(id, vanKey)} 
                                        onClear={() => clearVehicle(vanKey)}
                                        isEditing={editingVanName === vanKey}
                                        tempName={tempVanName}
                                        setTempName={setTempVanName}
                                        onStartEdit={() => startRenamingVan(vanKey)}
                                        onSaveEdit={saveVanName}
                                        onCancelEdit={() => setEditingVanName(null)}
                                        note={vanNotes[vanKey] || ''}
                                        onNoteChange={(text) => setVanNotes({ ...vanNotes, [vanKey]: text })}
                                    />
                                </div>
                            );
                        })}
                    </>
                )}
            </div>
        </div>
    );
}

function BusLayout({ participants, placements, onDrop, onDragOver, onDragLeave, onRemove, onClear }) {
    const rows = 12; // 12 rows of 4 seats
    return (
        <div className="vehicle-card bus-layout">
            <button onClick={onClear} className="btn-icon no-print" style={{ position: 'absolute', top: '1rem', right: '1rem', color: 'var(--danger-color)' }} title="Vider le car">
                <Trash2 size={16} />
            </button>

            <h3 style={{textAlign: 'center', marginBottom: '2rem', color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 'bold'}}>Grand Car (53 Places)</h3>

            {/* Driver area */}
            <div style={{ height: '80px', borderBottom: '2px dashed #cbd5e1', marginBottom: '2rem', display: 'flex', justifyContent: 'flex-end', paddingRight: '1rem' }}>
                <Seat id="Driver" label="Chauffeur" vehiclePrefix="bus" placements={placements} participants={participants} onDrop={onDrop} onDragOver={onDragOver} onDragLeave={onDragLeave} onRemove={onRemove} isDriverSeat={true} />
            </div>

            {/* Rows */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {Array.from({ length: rows }).map((_, rowIndex) => {
                    const rowNumber = rowIndex + 1;
                    return (
                        <div key={rowNumber} className="seat-row" style={{marginBottom: 0}}>
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

function VanLayout({ vanId, title, participants, placements, onDrop, onDragOver, onDragLeave, onRemove, onClear, isEditing, tempName, setTempName, onStartEdit, onSaveEdit, onCancelEdit, note, onNoteChange }) {
    const prefix = `van${vanId}`;
    
    // Clean Flat Design Van Visual
    return (
        <div className="van-wrapper" style={{ position: 'relative', padding: '0 1rem' }}>
            
            {/* Wheels (Simplified) */}
            <div style={{ position: 'absolute', top: '80px', left: -4, width: '8px', height: '40px', background: '#475569', borderRadius: '4px', zIndex: 0 }}></div>
            <div style={{ position: 'absolute', top: '80px', right: -4, width: '8px', height: '40px', background: '#475569', borderRadius: '4px', zIndex: 0 }}></div>
            <div style={{ position: 'absolute', bottom: '80px', left: -4, width: '8px', height: '40px', background: '#475569', borderRadius: '4px', zIndex: 0 }}></div>
            <div style={{ position: 'absolute', bottom: '80px', right: -4, width: '8px', height: '40px', background: '#475569', borderRadius: '4px', zIndex: 0 }}></div>

            <div className="vehicle-card van-layout" style={{ 
                background: 'white', 
                borderRadius: '32px 32px 12px 12px', // Rounded front, slightly squared back
                border: '3px solid #475569',
                maxWidth: '320px',
                margin: '0 auto',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}>
                
                {/* Windshield Area */}
                <div style={{ 
                    background: '#e2e8f0', 
                    padding: '1.5rem 1rem 0.5rem 1rem',
                    borderBottom: '3px solid #cbd5e1',
                    position: 'relative'
                }}>
                    {/* Windshield Shape */}
                    <div style={{ 
                        height: '50px', 
                        background: '#cbd5e1', 
                        borderRadius: '16px 16px 4px 4px',
                        marginBottom: '1rem',
                        border: '1px solid #94a3b8',
                        opacity: 0.5
                    }}></div>

                    <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end', position: 'absolute', top: '0.5rem', right: '0.5rem' }}>
                         <button onClick={onClear} className="btn-icon no-print" style={{ color: 'var(--danger-color)' }} title="Vider le van">
                            <Trash2 size={16} />
                        </button>
                    </div>

                    {/* Title */}
                    <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
                        {isEditing ? (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                <input 
                                    type="text" 
                                    value={tempName} 
                                    onChange={(e) => setTempName(e.target.value)}
                                    style={{ 
                                        fontSize: '1rem', fontWeight: 'bold', padding: '0.25rem 0.5rem', 
                                        border: '1px solid var(--primary-color)', borderRadius: '6px',
                                        width: '140px', textAlign: 'center'
                                    }}
                                    autoFocus
                                />
                                <button onClick={onSaveEdit} className="btn-icon" style={{ color: 'var(--primary-color)' }}><Check size={18} /></button>
                                <button onClick={onCancelEdit} className="btn-icon"><X size={18} /></button>
                            </div>
                        ) : (
                            <h3 
                                onClick={onStartEdit}
                                style={{ 
                                    margin: 0, fontSize: '1.2rem', fontWeight: '800', color: '#1e293b', 
                                    cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.5rem'
                                }}
                                title="Cliquer pour renommer"
                            >
                                {title}
                                <Edit2 size={14} className="no-print" style={{ opacity: 0.3 }} />
                            </h3>
                        )}
                    </div>
                </div>

                {/* Interior Cabin */}
                <div style={{ padding: '1.5rem', background: '#f8fafc' }}>
                    
                    {/* Front Row (Driver + 2) */}
                    <div className="seat-row" style={{ marginBottom: '1.5rem' }}>
                        <Seat id="Driver" label="Chauffeur" vehiclePrefix={prefix} placements={placements} participants={participants} onDrop={onDrop} onDragOver={onDragOver} onDragLeave={onDragLeave} onRemove={onRemove} isDriverSeat={true} />
                        
                        <div className="seat-group" style={{ gap: '0.5rem' }}>
                            <Seat id="F1" vehiclePrefix={prefix} placements={placements} participants={participants} onDrop={onDrop} onDragOver={onDragOver} onDragLeave={onDragLeave} onRemove={onRemove} />
                            <Seat id="F2" vehiclePrefix={prefix} placements={placements} participants={participants} onDrop={onDrop} onDragOver={onDragOver} onDragLeave={onDragLeave} onRemove={onRemove} />
                        </div>
                    </div>

                    {/* Middle Row (3 seats) */}
                    <div className="seat-row" style={{ justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                        <Seat id="M1" vehiclePrefix={prefix} placements={placements} participants={participants} onDrop={onDrop} onDragOver={onDragOver} onDragLeave={onDragLeave} onRemove={onRemove} />
                        <Seat id="M2" vehiclePrefix={prefix} placements={placements} participants={participants} onDrop={onDrop} onDragOver={onDragOver} onDragLeave={onDragLeave} onRemove={onRemove} />
                        <Seat id="M3" vehiclePrefix={prefix} placements={placements} participants={participants} onDrop={onDrop} onDragOver={onDragOver} onDragLeave={onDragLeave} onRemove={onRemove} />
                    </div>

                    {/* Back Row (3 seats) */}
                    <div className="seat-row" style={{ justifyContent: 'space-between' }}>
                        <Seat id="B1" vehiclePrefix={prefix} placements={placements} participants={participants} onDrop={onDrop} onDragOver={onDragOver} onDragLeave={onDragLeave} onRemove={onRemove} />
                        <Seat id="B2" vehiclePrefix={prefix} placements={placements} participants={participants} onDrop={onDrop} onDragOver={onDragOver} onDragLeave={onDragLeave} onRemove={onRemove} />
                        <Seat id="B3" vehiclePrefix={prefix} placements={placements} participants={participants} onDrop={onDrop} onDragOver={onDragOver} onDragLeave={onDragLeave} onRemove={onRemove} />
                    </div>
                </div>
                
                {/* Trunk / Rear Area */}
                <div className="trunk-area" style={{ 
                    background: '#e2e8f0', 
                    padding: '1rem 1rem', 
                    textAlign: 'center',
                    borderTop: '3px solid #cbd5e1'
                }}>
                    {/* Editable Note Area (Hidden on Print) */}
                    <div className="edit-notes">
                        <textarea 
                            value={note || ''}
                            onChange={(e) => onNoteChange && onNoteChange(e.target.value)}
                            placeholder="Notes, bagages, instructions..."
                            style={{
                                width: '100%',
                                minHeight: '60px',
                                padding: '0.5rem',
                                borderRadius: '6px',
                                border: '1px solid #94a3b8',
                                fontSize: '0.85rem',
                                fontFamily: 'inherit',
                                resize: 'vertical',
                                background: 'white'
                            }}
                        />
                    </div>
                    
                    {/* Static Text for Print (Hidden on Screen) */}
                    <div className="print-notes" style={{ 
                        display: 'none', 
                        textAlign: 'left', 
                        whiteSpace: 'pre-wrap', 
                        fontSize: '0.8rem', 
                        border: '1px solid #94a3b8',
                        borderRadius: '6px',
                        padding: '0.5rem',
                        background: 'white',
                        minHeight: '60px'
                    }}>
                        <strong>Notes :</strong><br/>
                        {note || 'Aucune note.'}
                    </div>
                </div>
            </div>
        </div>
    );
}

function Seat({ id, label, vehiclePrefix, placements, participants, onDrop, onDragOver, onDragLeave, onRemove, isDriverSeat = false }) {
    const fullSeatId = `${vehiclePrefix}-${id}`;
    const pId = placements[fullSeatId];
    const participant = pId ? participants.find(p => p.id === pId) : null;
    const isAnimator = participant?.role === 'animator';
    const isDirection = participant?.role === 'direction';
    const hasHealthIssue = participant && (participant.allergies || participant.constraints);

    // Determine background color
    let bgColor = '';
    if (participant) {
        if (isAnimator) bgColor = 'var(--secondary-color)';
        else if (isDirection) bgColor = '#8b5cf6'; // Violet
        else bgColor = 'var(--primary-color)';
    }

    return (
        <div
            className={`seat ${participant ? 'occupied' : 'empty'} ${isDriverSeat ? 'driver' : ''}`}
            style={{
                backgroundColor: bgColor || undefined,
                border: hasHealthIssue ? '2px solid var(--danger-color)' : undefined,
                cursor: participant ? 'pointer' : 'default',
            }}
            onDrop={(e) => {
                onDragLeave(e);
                onDrop(e, id);
            }}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onClick={() => participant && onRemove(id)}
            title={participant ? `${participant.firstName} ${participant.lastName}${hasHealthIssue ? `\n⚠️ ${participant.allergies || ''} ${participant.constraints || ''}` : ''}` : (isDriverSeat ? "Place Chauffeur" : `Siège ${id}`)}
        >
            {hasHealthIssue && (
                <div style={{ position: 'absolute', top: '-6px', right: '-6px', background: 'white', borderRadius: '50%', padding: '2px', zIndex: 10, border: '1px solid var(--danger-color)', display: 'flex', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                    <AlertCircle size={12} color="var(--danger-color)" />
                </div>
            )}

            {/* Back rest visualization */}
            {!isDriverSeat && <div className="seat-back" style={{ backgroundColor: participant ? 'rgba(0,0,0,0.2)' : undefined }}></div>}

            {participant ? (
                <>
                    <span className="seat-label">
                        {participant.firstName}
                    </span>
                    <span className="seat-sublabel">
                        {participant.lastName.slice(0, 1)}.
                    </span>
                </>
            ) : (
                <span style={{ fontSize: '0.7rem', opacity: 0.5, zIndex: 1, textAlign: 'center', lineHeight: '1.1' }}>
                    {label || id}
                </span>
            )}
        </div>
    );
}
