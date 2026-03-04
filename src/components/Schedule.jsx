import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Clock, MapPin, Users, X, Trash2, Edit2, GripVertical, Copy, Repeat, ArrowRight } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { DndContext, useDraggable, useDroppable } from '@dnd-kit/core';

// Helper to format dates
const formatDate = (date) => {
    return date.toISOString().split('T')[0];
};

// Common activities suggestions
const COMMON_ACTIVITIES = [
    "Petit déjeuner", "Déjeuner", "Dîner", "Goûter",
    "Réveil", "Toilette", "Temps calme", "Douches", "Coucher",
    "Rassemblement", "Veillée", "Grand jeu", "Atelier manuel", "Sport"
];

// Activity Card Component (List View)
const ActivityCard = ({ activity, onEdit, onDelete }) => {
    return (
        <div 
            className="card animate-fade-in" 
            style={{ 
                marginBottom: '1rem', 
                padding: '0', 
                borderLeft: '4px solid var(--primary-color)',
                display: 'flex',
                flexDirection: 'row',
                overflow: 'hidden'
            }}
        >
            {/* Time Column */}
            <div style={{ 
                padding: '1.5rem 1rem', 
                background: '#f8fafc', 
                borderRight: '1px solid #e2e8f0',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: '130px'
            }}>
                <span style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#1e293b' }}>
                    {activity.startTime || activity.time}
                </span>
                <ArrowRight size={14} color="#94a3b8" style={{ margin: '4px 0' }} />
                <span style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#64748b' }}>
                    {activity.endTime || '??:??'}
                </span>
            </div>

            {/* Content Column */}
            <div style={{ flex: 1, padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 'bold', color: '#1e293b' }}>
                        {activity.title}
                    </h3>
                    <button 
                        onClick={() => onDelete(activity.id)}
                        className="btn-icon" 
                        style={{ color: '#ef4444', padding: '4px' }}
                        title="Supprimer"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>

                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', color: '#64748b', fontSize: '0.9rem', marginBottom: '0.75rem' }}>
                    {activity.description && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <MapPin size={16} />
                            <span>{activity.description}</span>
                        </div>
                    )}
                </div>

                {/* Tags / Participants */}
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                     {/* Placeholder for tags if we had them, e.g. groups */}
                     {activity.participants && activity.participants.length > 0 && (
                        <span style={{ 
                            background: '#e0f2fe', color: '#0369a1', 
                            padding: '4px 10px', borderRadius: '16px', 
                            fontSize: '0.8rem', fontWeight: '600',
                            display: 'flex', alignItems: 'center', gap: '4px'
                        }}>
                            <Users size={14} /> {activity.participants.length} participants
                        </span>
                     )}
                </div>
            </div>
            
            {/* Edit Button Area (Hover or explicit) */}
             <div 
                onClick={() => onEdit(activity)}
                style={{ 
                    width: '50px', 
                    cursor: 'pointer',
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    borderLeft: '1px solid #f1f5f9',
                    color: '#cbd5e1',
                    transition: 'all 0.2s'
                }}
                className="edit-zone"
            >
                <Edit2 size={20} />
            </div>
            <style>{`
                .edit-zone:hover { background: #f8fafc; color: var(--primary-color); }
            `}</style>
        </div>
    );
};

export default function Schedule({ activities, setActivities, participants, groups }) {
    const [currentDate, setCurrentDate] = useState(new Date()); 
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        date: formatDate(new Date()),
        startTime: '09:00',
        endTime: '10:00',
        title: '',
        description: '',
        participants: [],
        repeatType: 'none', // none, daily, custom
        repeatEndDate: formatDate(new Date(new Date().setDate(new Date().getDate() + 7))),
        customDays: [] // 0-6 for Sunday-Saturday
    });
    
    // Autocomplete state
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [suggestions, setSuggestions] = useState([]);

    // Calendar State
    const [calendarMonth, setCalendarMonth] = useState(new Date());

    const navigateDay = (direction) => {
        const newDate = new Date(currentDate);
        newDate.setDate(currentDate.getDate() + direction);
        setCurrentDate(newDate);
        // Sync calendar month if needed
        if (newDate.getMonth() !== calendarMonth.getMonth()) {
            setCalendarMonth(newDate);
        }
    };

    const goToToday = () => {
        const today = new Date();
        setCurrentDate(today);
        setCalendarMonth(today);
    };

    // Filter activities for the selected SINGLE day
    const dayActivities = activities
        .filter(a => a.date === formatDate(currentDate))
        .sort((a, b) => (a.startTime || a.time || '').localeCompare(b.startTime || b.time || ''));

    const handleEdit = (activity) => {
        setFormData({ 
            ...activity,
            startTime: activity.startTime || activity.time || '09:00',
            endTime: activity.endTime || '10:00',
            repeatType: 'none',
            repeatEndDate: formatDate(new Date(new Date().setDate(new Date().getDate() + 7))),
            customDays: []
        });
        setEditingId(activity.id);
        setIsFormOpen(true);
    };

    const handleDelete = (id) => {
        if (confirm("Supprimer cette activité ?")) {
            setActivities(activities.filter(a => a.id !== id));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        const baseActivity = {
            ...formData,
            time: formData.startTime,
            // Clean up temporary form fields
            repeatType: undefined,
            repeatEndDate: undefined,
            customDays: undefined
        };

        let newActivities = [];

        if (editingId) {
            // Edit mode: Update single activity
            setActivities(activities.map(a => a.id === editingId ? { ...baseActivity, id: editingId } : a));
        } else {
            // Create mode: Handle Repetition
            if (formData.repeatType === 'daily') {
                const startDate = new Date(formData.date);
                const endDate = new Date(formData.repeatEndDate);
                
                // Iterate from start to end date
                for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
                    newActivities.push({
                        ...baseActivity,
                        id: uuidv4(),
                        date: formatDate(d)
                    });
                }
            } else if (formData.repeatType === 'custom') {
                 const startDate = new Date(formData.date);
                 const endDate = new Date(formData.repeatEndDate);
                 
                 for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
                     if (formData.customDays.includes(d.getDay())) {
                        newActivities.push({
                            ...baseActivity,
                            id: uuidv4(),
                            date: formatDate(d)
                        });
                     }
                 }
            } else {
                // Single activity
                newActivities.push({ ...baseActivity, id: uuidv4() });
            }

            setActivities([...activities, ...newActivities]);
        }
        setIsFormOpen(false);
    };

    const toggleParticipant = (id) => {
        if (formData.participants.includes(id)) {
            setFormData({ ...formData, participants: formData.participants.filter(pId => pId !== id) });
        } else {
            setFormData({ ...formData, participants: [...formData.participants, id] });
        }
    };
    
    // Autocomplete Logic
    const handleTitleChange = (e) => {
        const value = e.target.value;
        setFormData({ ...formData, title: value });
        
        if (value.length > 0) {
            // Merge static common activities with existing activity titles from history
            const existingTitles = [...new Set(activities.map(a => a.title))];
            const allOptions = [...new Set([...COMMON_ACTIVITIES, ...existingTitles])];
            
            const filtered = allOptions.filter(option => 
                option.toLowerCase().includes(value.toLowerCase())
            );
            setSuggestions(filtered);
            setShowSuggestions(true);
        } else {
            setShowSuggestions(false);
        }
    };

    const selectSuggestion = (suggestion) => {
        setFormData({ ...formData, title: suggestion });
        setShowSuggestions(false);
    };

    // Calendar Helper
    const renderCalendar = () => {
        const year = calendarMonth.getFullYear();
        const month = calendarMonth.getMonth();
        
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        
        const daysInMonth = lastDay.getDate();
        const startDayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1; // Mon=0
        
        const days = [];
        // Empty slots
        for (let i = 0; i < startDayOfWeek; i++) {
            days.push(<div key={`empty-${i}`} style={{ height: '32px' }}></div>);
        }
        // Days
        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const isSelected = dateStr === formatDate(currentDate);
            const isToday = dateStr === formatDate(new Date());
            const hasActivity = activities.some(a => a.date === dateStr);

            days.push(
                <div 
                    key={d} 
                    onClick={() => setCurrentDate(new Date(dateStr))}
                    style={{ 
                        height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', borderRadius: '50%', fontSize: '0.9rem',
                        background: isSelected ? 'var(--primary-color)' : (isToday ? '#e0f2fe' : 'transparent'),
                        color: isSelected ? 'white' : (isToday ? 'var(--primary-color)' : 'inherit'),
                        fontWeight: isSelected || isToday ? 'bold' : 'normal',
                        position: 'relative'
                    }}
                >
                    {d}
                    {hasActivity && !isSelected && (
                        <div style={{ position: 'absolute', bottom: '2px', width: '4px', height: '4px', borderRadius: '50%', background: 'var(--primary-color)' }}></div>
                    )}
                </div>
            );
        }

        return days;
    };

    return (
        <div style={{ height: '100%', display: 'flex', gap: '2rem', maxWidth: '1200px', margin: '0 auto', width: '100%', padding: '0 1rem' }}>
            
            {/* LEFT COLUMN: Main Schedule List */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                {/* Header Controls */}
                <div style={{ padding: '2rem 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '0.25rem' }}>Planning</h1>
                        <div style={{ color: 'var(--text-muted)', fontSize: '1rem', textTransform: 'capitalize' }}>
                            {currentDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                        </div>
                    </div>

                    <button className="btn btn-primary" onClick={() => { 
                        setFormData({ 
                            date: formatDate(currentDate), 
                            startTime: '09:00', 
                            endTime: '10:00', 
                            title: '', 
                            description: '', 
                            participants: [],
                            repeatType: 'none',
                            repeatEndDate: formatDate(new Date(new Date().setDate(new Date().getDate() + 7))),
                            customDays: []
                        });
                        setEditingId(null);
                        setIsFormOpen(true); 
                    }}>
                        <Plus size={18} /> Activité
                    </button>
                </div>

                {/* List Content */}
                <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '2rem' }}>
                    {dayActivities.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '4rem 2rem', background: '#f8fafc', borderRadius: '16px', border: '2px dashed #e2e8f0' }}>
                            <div style={{ background: 'white', padding: '1rem', borderRadius: '50%', width: 'fit-content', margin: '0 auto 1rem auto', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                                <CalendarIcon size={32} color="#cbd5e1" />
                            </div>
                            <h3 style={{ color: '#64748b', marginBottom: '0.5rem' }}>Aucune activité</h3>
                            <p style={{ color: '#94a3b8', maxWidth: '400px', margin: '0 auto' }}>
                                Rien de prévu. Utilisez le calendrier à droite pour naviguer.
                            </p>
                        </div>
                    ) : (
                        dayActivities.map(activity => (
                            <ActivityCard 
                                key={activity.id} 
                                activity={activity} 
                                onEdit={handleEdit} 
                                onDelete={handleDelete}
                            />
                        ))
                    )}
                </div>
            </div>

            {/* RIGHT COLUMN: Calendar Widget */}
            <div style={{ width: '300px', padding: '2rem 0', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="card" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <span style={{ fontWeight: 'bold', textTransform: 'capitalize' }}>
                            {calendarMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                        </span>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button className="btn-icon" onClick={() => {
                                const d = new Date(calendarMonth);
                                d.setMonth(d.getMonth() - 1);
                                setCalendarMonth(d);
                            }}><ChevronLeft size={16} /></button>
                            <button className="btn-icon" onClick={() => {
                                const d = new Date(calendarMonth);
                                d.setMonth(d.getMonth() + 1);
                                setCalendarMonth(d);
                            }}><ChevronRight size={16} /></button>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.5rem' }}>
                        <div>L</div><div>M</div><div>M</div><div>J</div><div>V</div><div>S</div><div>D</div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
                        {renderCalendar()}
                    </div>

                    <button className="btn btn-outline" onClick={goToToday} style={{ width: '100%', marginTop: '1rem', justifyContent: 'center', fontSize: '0.9rem' }}>
                        Revenir à aujourd'hui
                    </button>
                </div>
                
                {/* Optional: Quick Stats or Legend */}
                <div className="card" style={{ padding: '1.5rem' }}>
                    <h4 style={{ fontSize: '0.9rem', marginBottom: '0.5rem', color: '#64748b' }}>Légende</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary-color)' }}></div>
                            <span>Jour sélectionné</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#e0f2fe' }}></div>
                            <span>Aujourd'hui</span>
                        </div>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--primary-color)', margin: '0 2px' }}></div>
                            <span>Activité prévue</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal Form */}
            {isFormOpen && (
                <div className="modal-overlay">
                    <div className="modal-content animate-scale-in" style={{ width: '500px' }}>
                        <div className="modal-header">
                            <h3>{editingId ? 'Modifier' : 'Nouvelle Activité'}</h3>
                            <button className="close-btn" onClick={() => setIsFormOpen(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            
                            <div className="input-group" style={{ position: 'relative' }}>
                                <label className="input-label">Titre de l'activité</label>
                                <input 
                                    type="text" 
                                    className="input-field" 
                                    required 
                                    value={formData.title} 
                                    onChange={handleTitleChange}
                                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                    onFocus={(e) => e.target.value && setShowSuggestions(true)}
                                    placeholder="Ex: Petit déjeuner, Football..." 
                                    autoFocus 
                                />
                                {showSuggestions && suggestions.length > 0 && (
                                    <div style={{ 
                                        position: 'absolute', top: '100%', left: 0, right: 0, 
                                        background: 'white', border: '1px solid #cbd5e1', borderRadius: '8px',
                                        zIndex: 1000, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                                        maxHeight: '200px', overflowY: 'auto'
                                    }}>
                                        {suggestions.map((s, i) => (
                                            <div 
                                                key={i} 
                                                onClick={() => selectSuggestion(s)}
                                                style={{ padding: '0.5rem 1rem', cursor: 'pointer', fontSize: '0.9rem' }}
                                                onMouseEnter={(e) => e.target.style.background = '#f1f5f9'}
                                                onMouseLeave={(e) => e.target.style.background = 'white'}
                                            >
                                                {s}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <div className="input-group" style={{ flex: 1 }}>
                                    <label className="input-label">Date</label>
                                    <input type="date" className="input-field" required value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} disabled={editingId} />
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <div className="input-group" style={{ flex: 1 }}>
                                    <label className="input-label">Heure de début</label>
                                    <input type="time" className="input-field" required value={formData.startTime} onChange={e => setFormData({ ...formData, startTime: e.target.value })} />
                                </div>
                                <div className="input-group" style={{ flex: 1 }}>
                                    <label className="input-label">Heure de fin</label>
                                    <input type="time" className="input-field" required value={formData.endTime} onChange={e => setFormData({ ...formData, endTime: e.target.value })} />
                                </div>
                            </div>

                            {/* REPEAT OPTIONS - Only for new events */}
                            {!editingId && (
                                <div className="input-group" style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                    <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                        <Repeat size={14} /> Répétition
                                    </label>
                                    
                                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', cursor: 'pointer' }}>
                                            <input type="radio" name="repeat" checked={formData.repeatType === 'none'} onChange={() => setFormData({...formData, repeatType: 'none'})} />
                                            Jamais
                                        </label>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', cursor: 'pointer' }}>
                                            <input type="radio" name="repeat" checked={formData.repeatType === 'daily'} onChange={() => setFormData({...formData, repeatType: 'daily'})} />
                                            Tous les jours
                                        </label>
                                        {/* Simplified: Custom days */}
                                    </div>

                                    {formData.repeatType !== 'none' && (
                                        <div className="animate-fade-in">
                                            <div className="input-group">
                                                <label className="input-label" style={{ fontSize: '0.85rem' }}>Jusqu'au</label>
                                                <input type="date" className="input-field" value={formData.repeatEndDate} onChange={e => setFormData({...formData, repeatEndDate: e.target.value})} />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="input-group">
                                <label className="input-label">Lieu / Description</label>
                                <div style={{ position: 'relative' }}>
                                    <MapPin size={16} style={{ position: 'absolute', top: '12px', left: '12px', color: '#94a3b8' }} />
                                    <input 
                                        type="text" 
                                        className="input-field" 
                                        style={{ paddingLeft: '2.5rem' }}
                                        value={formData.description} 
                                        onChange={e => setFormData({ ...formData, description: e.target.value })} 
                                        placeholder="Réfectoire, Terrain A..."
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                                <button type="button" className="btn btn-outline" onClick={() => setIsFormOpen(false)}>Annuler</button>
                                <button type="submit" className="btn btn-primary">Enregistrer</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
