import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Check, X, AlertCircle, Calendar, Bus, Truck, Printer, Clock, Sun, Moon, Minus, Settings2 } from 'lucide-react';
import BusLayout from './seatmap/BusLayout';
import VanLayout from './seatmap/VanLayout';

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
    const [editingVanName, setEditingVanName] = useState(null);
    const [tempVanName, setTempVanName] = useState('');
    const [vanNotes, setVanNotes] = useState({});
    const [activeVan, setActiveVan] = useState(1); // Mobile van tab (1-based)

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
    const [isControlsOpen, setIsControlsOpen] = useState(false);

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
            <div className={`seat-map-controls no-print ${!isControlsOpen ? 'controls-collapsed' : ''}`}>

                {/* Mobile Toggle Button (Langette) */}
                <button
                    className="mobile-controls-toggle mobile-only"
                    onClick={() => setIsControlsOpen(!isControlsOpen)}
                >
                    <Settings2 size={16} />
                    <span>{isControlsOpen ? 'Masquer les options' : 'Afficher les options'}</span>
                </button>

                <div className="controls-content">

                    {/* Mode Selector */}
                    <div className="mode-switcher" style={{ background: 'var(--bg-main)', border: '1px solid var(--border-color)', padding: '4px', borderRadius: '12px' }}>
                        <button
                            className={`mode-btn ${mode === 'daily' ? 'active' : ''}`}
                            onClick={() => setMode('daily')}
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '8px' }}
                        >
                            <Truck size={18} />
                            <span>Activités</span>
                        </button>
                        <button
                            className={`mode-btn ${mode === 'travel' ? 'active' : ''}`}
                            onClick={() => setMode('travel')}
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '8px' }}
                        >
                            <Bus size={18} />
                            <span>Voyage</span>
                        </button>
                    </div>

                    {/* Contextual Controls */}
                    {mode === 'daily' ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                            {/* Date Picker */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'white', padding: '0.5rem 1rem', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
                                <Calendar size={18} color="var(--primary-color)" />
                                <input
                                    type="date"
                                    className="input-field"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    style={{ padding: '0', border: 'none', background: 'transparent', width: 'auto', fontWeight: 'bold' }}
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
                </div> {/* End of controls-content */}
            </div> {/* End of seat-map-controls */}

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


            {/* ── Mobile Van Tabs (only in daily mode) ── */}
            {mode === 'daily' && (
                <div className="van-tabs no-print">
                    {Array.from({ length: vanCount }).map((_, i) => {
                        const vanKey = `van${i + 1}`;
                        const occ = Object.keys(placements).filter(k => k.startsWith(`${vanKey}-`)).length;
                        const isActive = activeVan === i + 1;
                        return (
                            <button
                                key={vanKey}
                                onClick={() => setActiveVan(i + 1)}
                                style={{
                                    flex: 1, padding: '0.625rem 0.5rem',
                                    background: isActive ? '#6366f1' : 'white',
                                    color: isActive ? 'white' : '#64748b',
                                    border: 'none', borderRadius: '10px',
                                    fontWeight: isActive ? '700' : '500',
                                    fontSize: '0.82rem', cursor: 'pointer',
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
                                    transition: 'all 0.2s',
                                    boxShadow: isActive ? '0 2px 8px rgba(99,102,241,0.3)' : 'none'
                                }}
                            >
                                <span>{vanNames[vanKey]}</span>
                                <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>{occ}/8</span>
                            </button>
                        );
                    })}
                </div>
            )}

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
                                <div key={vanKey} className={`vehicle-wrapper van-tab-item van-tab-${i + 1} ${activeVan !== i + 1 ? 'van-tab-hidden' : ''}`}>
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

