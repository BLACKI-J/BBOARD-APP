import React, { useState, useMemo } from 'react';
import {
    ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Clock, MapPin,
    Users, X, Trash2, Edit2, Repeat, ArrowRight, Zap, Coffee, Moon, Sun,
    Star, Tag, CheckCircle2, Circle
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

// ─── Constants ───────────────────────────────────────────────────────────────

const formatDate = (date) => date.toISOString().split('T')[0];

const COMMON_ACTIVITIES = [
    "Petit déjeuner", "Déjeuner", "Dîner", "Goûter",
    "Réveil", "Toilette", "Temps calme", "Douches", "Coucher",
    "Rassemblement", "Veillée", "Grand jeu", "Atelier manuel", "Sport",
    "Baignade", "Randonnée", "Animation", "Temps libre"
];

const ACTIVITY_COLORS = [
    { label: 'Violet', value: '#6366f1', bg: '#eef2ff' },
    { label: 'Bleu', value: '#3b82f6', bg: '#eff6ff' },
    { label: 'Vert', value: '#10b981', bg: '#ecfdf5' },
    { label: 'Orange', value: '#f59e0b', bg: '#fffbeb' },
    { label: 'Rouge', value: '#ef4444', bg: '#fef2f2' },
    { label: 'Rose', value: '#ec4899', bg: '#fdf2f8' },
    { label: 'Gris', value: '#64748b', bg: '#f8fafc' },
];

const DEFAULT_COLOR = ACTIVITY_COLORS[0];

// ─── Time helpers ─────────────────────────────────────────────────────────────

const getTimeSlotLabel = (startTime) => {
    if (!startTime) return null;
    const h = parseInt(startTime.split(':')[0], 10);
    if (h < 10) return { icon: <Coffee size={12} />, label: 'Matin' };
    if (h < 13) return { icon: <Sun size={12} />, label: 'Midi' };
    if (h < 18) return { icon: <Zap size={12} />, label: 'Après-midi' };
    return { icon: <Moon size={12} />, label: 'Soir' };
};

const getDuration = (start, end) => {
    if (!start || !end) return null;
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    const minutes = (eh * 60 + em) - (sh * 60 + sm);
    if (minutes <= 0) return null;
    if (minutes < 60) return `${minutes} min`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, '0')}`;
};

// ─── ActivityCard ─────────────────────────────────────────────────────────────

const ActivityCard = ({ activity, onEdit, onDelete, onToggleDone }) => {
    const color = activity.color || DEFAULT_COLOR.value;
    const bg = (ACTIVITY_COLORS.find(c => c.value === color) || DEFAULT_COLOR).bg;
    const timeSlot = getTimeSlotLabel(activity.startTime);
    const duration = getDuration(activity.startTime, activity.endTime);
    const isDone = activity.done;

    return (
        <div className="sc-activity-card" style={{
            background: 'white', borderRadius: '14px', marginBottom: '0.875rem',
            border: `1px solid ${isDone ? '#e2e8f0' : color + '40'}`,
            boxShadow: isDone ? 'none' : `0 2px 12px ${color}18`,
            display: 'flex', overflow: 'hidden', transition: 'all 0.2s',
            opacity: isDone ? 0.6 : 1
        }}>
            {/* Color bar */}
            <div style={{ width: '5px', background: isDone ? '#cbd5e1' : color, flexShrink: 0 }} />

            {/* Time column */}
            <div style={{
                padding: '1.1rem 0.875rem', background: isDone ? '#f8fafc' : bg,
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', minWidth: '90px', gap: '2px', flexShrink: 0
            }}>
                <span style={{ fontWeight: '800', fontSize: '1rem', color: isDone ? '#94a3b8' : '#1e293b', lineHeight: 1 }}>
                    {activity.startTime || activity.time || '—'}
                </span>
                <ArrowRight size={12} color="#94a3b8" style={{ margin: '2px 0' }} />
                <span style={{ fontWeight: '600', fontSize: '0.85rem', color: '#64748b' }}>
                    {activity.endTime || '??:??'}
                </span>
                {duration && (
                    <span style={{ fontSize: '0.68rem', color: isDone ? '#cbd5e1' : color, fontWeight: '700', marginTop: '3px', background: isDone ? '#f1f5f9' : bg, padding: '1px 5px', borderRadius: '8px' }}>
                        {duration}
                    </span>
                )}
            </div>

            {/* Content */}
            <div style={{ flex: 1, padding: '1rem 1.1rem', minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <h3 style={{
                        margin: 0, fontSize: '1rem', fontWeight: '700',
                        color: isDone ? '#94a3b8' : '#1e293b', lineHeight: '1.3',
                        textDecoration: isDone ? 'line-through' : 'none', flex: 1, minWidth: 0,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                    }}>
                        {activity.title}
                    </h3>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginTop: '0.4rem', flexWrap: 'wrap', rowGap: '0.25rem' }}>
                    {timeSlot && (
                        <span style={{ fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '3px', color: '#94a3b8' }}>
                            {timeSlot.icon} {timeSlot.label}
                        </span>
                    )}
                    {activity.description && (
                        <span style={{ fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px', color: '#64748b' }}>
                            <MapPin size={11} /> {activity.description}
                        </span>
                    )}
                    {activity.participants && activity.participants.length > 0 && (
                        <span style={{ fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '4px', color: '#64748b' }}>
                            <Users size={11} /> {activity.participants.length}
                        </span>
                    )}
                </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', borderLeft: '1px solid #f1f5f9', flexShrink: 0 }}>
                <button
                    onClick={() => onToggleDone(activity.id)}
                    title={isDone ? 'Marquer non fait' : 'Marquer fait'}
                    style={{ flex: 1, border: 'none', background: 'none', cursor: 'pointer', padding: '0 0.9rem', color: isDone ? '#10b981' : '#cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'color 0.2s' }}
                >
                    {isDone ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                </button>
                <div style={{ height: '1px', background: '#f1f5f9' }} />
                <button
                    onClick={() => onEdit(activity)}
                    title="Modifier"
                    style={{ flex: 1, border: 'none', background: 'none', cursor: 'pointer', padding: '0 0.9rem', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'color 0.2s' }}
                    className="sc-edit-btn"
                >
                    <Edit2 size={16} />
                </button>
                <div style={{ height: '1px', background: '#f1f5f9' }} />
                <button
                    onClick={() => onDelete(activity.id)}
                    title="Supprimer"
                    style={{ flex: 1, border: 'none', background: 'none', cursor: 'pointer', padding: '0 0.9rem', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'color 0.2s' }}
                    className="sc-delete-btn"
                >
                    <Trash2 size={16} />
                </button>
            </div>
        </div>
    );
};

// ─── Main Component ────────────────────────────────────────────────────────────

export default function Schedule({ activities, setActivities, participants, groups }) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        date: formatDate(new Date()),
        startTime: '09:00', endTime: '10:00',
        title: '', description: '', participants: [],
        color: DEFAULT_COLOR.value,
        repeatType: 'none',
        repeatEndDate: formatDate(new Date(new Date().setDate(new Date().getDate() + 7))),
        customDays: []
    });

    const [showSuggestions, setShowSuggestions] = useState(false);
    const [suggestions, setSuggestions] = useState([]);
    const [calendarMonth, setCalendarMonth] = useState(new Date());

    // Navigation
    const navigateDay = (dir) => {
        const d = new Date(currentDate);
        d.setDate(d.getDate() + dir);
        setCurrentDate(d);
        if (d.getMonth() !== calendarMonth.getMonth()) setCalendarMonth(d);
    };

    const goToToday = () => { const t = new Date(); setCurrentDate(t); setCalendarMonth(t); };

    // Activities for current day
    const dayActivities = useMemo(() =>
        activities
            .filter(a => a.date === formatDate(currentDate))
            .sort((a, b) => (a.startTime || a.time || '').localeCompare(b.startTime || b.time || '')),
        [activities, currentDate]
    );

    const doneCount = dayActivities.filter(a => a.done).length;
    const progress = dayActivities.length > 0 ? (doneCount / dayActivities.length) * 100 : 0;

    // Stats for the full schedule
    const totalActivities = activities.length;
    const activitiesThisMonth = useMemo(() => {
        const m = currentDate.getMonth(), y = currentDate.getFullYear();
        return activities.filter(a => {
            const d = new Date(a.date);
            return d.getMonth() === m && d.getFullYear() === y;
        }).length;
    }, [activities, currentDate]);

    // Handlers
    const handleEdit = (activity) => {
        setFormData({
            ...activity,
            startTime: activity.startTime || activity.time || '09:00',
            endTime: activity.endTime || '10:00',
            color: activity.color || DEFAULT_COLOR.value,
            repeatType: 'none',
            repeatEndDate: formatDate(new Date(new Date().setDate(new Date().getDate() + 7))),
            customDays: []
        });
        setEditingId(activity.id);
        setIsFormOpen(true);
    };

    const handleDelete = (id) => {
        if (confirm("Supprimer cette activité ?"))
            setActivities(activities.filter(a => a.id !== id));
    };

    const handleToggleDone = (id) => {
        setActivities(activities.map(a => a.id === id ? { ...a, done: !a.done } : a));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const baseActivity = {
            ...formData,
            time: formData.startTime,
            repeatType: undefined,
            repeatEndDate: undefined,
            customDays: undefined
        };

        if (editingId) {
            setActivities(activities.map(a => a.id === editingId ? { ...baseActivity, id: editingId } : a));
        } else {
            let newActivities = [];
            if (formData.repeatType === 'daily') {
                for (let d = new Date(formData.date); d <= new Date(formData.repeatEndDate); d.setDate(d.getDate() + 1))
                    newActivities.push({ ...baseActivity, id: uuidv4(), date: formatDate(d) });
            } else {
                newActivities.push({ ...baseActivity, id: uuidv4() });
            }
            setActivities([...activities, ...newActivities]);
        }
        setIsFormOpen(false);
    };

    // Autocomplete
    const handleTitleChange = (e) => {
        const value = e.target.value;
        setFormData({ ...formData, title: value });
        if (value.length > 0) {
            const existingTitles = [...new Set(activities.map(a => a.title))];
            const all = [...new Set([...COMMON_ACTIVITIES, ...existingTitles])];
            setSuggestions(all.filter(s => s.toLowerCase().includes(value.toLowerCase())));
            setShowSuggestions(true);
        } else setShowSuggestions(false);
    };

    // Calendar
    const renderCalendar = () => {
        const y = calendarMonth.getFullYear(), m = calendarMonth.getMonth();
        const daysInMonth = new Date(y, m + 1, 0).getDate();
        const startDow = new Date(y, m, 1).getDay();
        const offset = startDow === 0 ? 6 : startDow - 1;
        const todayStr = formatDate(new Date());
        const selectedStr = formatDate(currentDate);

        const cells = [];
        for (let i = 0; i < offset; i++) cells.push(<div key={`e-${i}`} />);
        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const isSel = dateStr === selectedStr;
            const isToday = dateStr === todayStr;
            const count = activities.filter(a => a.date === dateStr).length;
            cells.push(
                <button key={d} onClick={() => setCurrentDate(new Date(dateStr))}
                    style={{
                        aspectRatio: '1', border: 'none', cursor: 'pointer', borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
                        background: isSel ? '#6366f1' : isToday ? '#eef2ff' : 'transparent',
                        color: isSel ? 'white' : isToday ? '#6366f1' : '#334155',
                        fontWeight: (isSel || isToday) ? '700' : '400',
                        fontSize: '0.85rem', transition: 'all 0.15s'
                    }}>
                    {d}
                    {count > 0 && !isSel && (
                        <div style={{ position: 'absolute', bottom: '3px', width: '4px', height: '4px', borderRadius: '50%', background: '#6366f1' }} />
                    )}
                </button>
            );
        }
        return cells;
    };

    const openNewForm = () => {
        setFormData({
            date: formatDate(currentDate),
            startTime: '09:00', endTime: '10:00',
            title: '', description: '', participants: [],
            color: DEFAULT_COLOR.value,
            repeatType: 'none',
            repeatEndDate: formatDate(new Date(new Date().setDate(new Date().getDate() + 7))),
            customDays: []
        });
        setEditingId(null);
        setIsFormOpen(true);
    };

    const currentDateLabel = currentDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    return (
        <div className="schedule-container" style={{ height: '100%', overflow: 'hidden', background: 'linear-gradient(160deg, #f8faff 0%, #f0f4ff 100%)' }}>
            <div className="sc-inner" style={{ height: '100%', display: 'flex', gap: '1.5rem', maxWidth: '1200px', margin: '0 auto', width: '100%', padding: '1.5rem', boxSizing: 'border-box', overflow: 'hidden' }}>

                {/* ─── LEFT: Schedule ────────────────────────────────────────── */}
                <div className="sc-main" style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>

                    {/* Header */}
                    <div className="sc-header" style={{
                        background: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)',
                        borderRadius: '16px', padding: '1.25rem 1.5rem', marginBottom: '1.25rem',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        boxShadow: '0 6px 20px rgba(99,102,241,0.3)', flexWrap: 'wrap', gap: '0.75rem'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '10px', padding: '0.625rem', display: 'flex' }}>
                                <CalendarIcon size={22} color="white" />
                            </div>
                            <div>
                                <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', color: 'white', lineHeight: 1 }}>Planning</h1>
                                <p style={{ margin: '3px 0 0', fontSize: '0.8rem', color: 'rgba(255,255,255,0.75)', textTransform: 'capitalize' }}>{currentDateLabel}</p>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <button onClick={() => navigateDay(-1)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '8px', padding: '0.5rem', cursor: 'pointer', color: 'white', display: 'flex' }}>
                                <ChevronLeft size={18} />
                            </button>
                            <button onClick={goToToday} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '8px', padding: '0.5rem 1rem', cursor: 'pointer', color: 'white', fontWeight: '600', fontSize: '0.8rem' }}>
                                Aujourd'hui
                            </button>
                            <button onClick={() => navigateDay(1)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '8px', padding: '0.5rem', cursor: 'pointer', color: 'white', display: 'flex' }}>
                                <ChevronRight size={18} />
                            </button>
                            <button onClick={openNewForm} style={{
                                background: 'white', border: 'none', borderRadius: '8px', padding: '0.5rem 1rem',
                                cursor: 'pointer', color: '#6366f1', fontWeight: '700', fontSize: '0.85rem',
                                display: 'flex', alignItems: 'center', gap: '0.4rem', boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                            }}>
                                <Plus size={16} /> Activité
                            </button>
                        </div>
                    </div>

                    {/* Progress bar + stats */}
                    {dayActivities.length > 0 && (
                        <div style={{
                            background: 'white', borderRadius: '12px', padding: '0.875rem 1.25rem',
                            marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '1rem',
                            border: '1px solid #e2e8f0', flexWrap: 'wrap', rowGap: '0.5rem'
                        }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#64748b', flexShrink: 0 }}>
                                {doneCount}/{dayActivities.length} fait{doneCount !== 1 && 's'}
                            </span>
                            <div style={{ flex: 1, height: '6px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden', minWidth: '60px' }}>
                                <div style={{ width: `${progress}%`, height: '100%', background: '#6366f1', borderRadius: '3px', transition: 'width 0.4s ease' }} />
                            </div>
                            <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#6366f1', flexShrink: 0 }}>{Math.round(progress)}%</span>
                        </div>
                    )}

                    {/* Activity List */}
                    <div style={{ flex: 1, overflowY: 'auto', paddingRight: '2px' }}>
                        {dayActivities.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '3rem 2rem', background: 'white', borderRadius: '16px', border: '2px dashed #e2e8f0' }}>
                                <div style={{ background: '#eef2ff', padding: '1rem', borderRadius: '50%', width: 'fit-content', margin: '0 auto 1rem', display: 'flex' }}>
                                    <CalendarIcon size={32} color="#6366f1" />
                                </div>
                                <h3 style={{ color: '#475569', marginBottom: '0.5rem', fontWeight: '700' }}>Journée libre !</h3>
                                <p style={{ color: '#94a3b8', maxWidth: '300px', margin: '0 auto 1.25rem', fontSize: '0.9rem' }}>
                                    Aucune activité prévue. Ajoutez des activités avec le bouton ci-dessus.
                                </p>
                                <button onClick={openNewForm} style={{
                                    background: '#6366f1', color: 'white', border: 'none', borderRadius: '10px',
                                    padding: '0.625rem 1.25rem', cursor: 'pointer', fontWeight: '700', fontSize: '0.9rem',
                                    display: 'inline-flex', alignItems: 'center', gap: '0.5rem'
                                }}>
                                    <Plus size={16} /> Ajouter une activité
                                </button>
                            </div>
                        ) : (
                            dayActivities.map(activity => (
                                <ActivityCard key={activity.id} activity={activity}
                                    onEdit={handleEdit} onDelete={handleDelete} onToggleDone={handleToggleDone} />
                            ))
                        )}
                    </div>
                </div>

                {/* ─── RIGHT: Calendar Sidebar ─────────────────────────────── */}
                <div className="sc-sidebar" style={{ width: '290px', display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto', flexShrink: 0 }}>

                    {/* Calendar */}
                    <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '1.25rem', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <span style={{ fontWeight: '700', color: '#1e293b', textTransform: 'capitalize', fontSize: '0.95rem' }}>
                                {calendarMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                            </span>
                            <div style={{ display: 'flex', gap: '0.25rem' }}>
                                <button onClick={() => { const d = new Date(calendarMonth); d.setMonth(d.getMonth() - 1); setCalendarMonth(d); }}
                                    style={{ background: '#f1f5f9', border: 'none', borderRadius: '7px', padding: '5px 8px', cursor: 'pointer', display: 'flex' }}>
                                    <ChevronLeft size={15} color="#64748b" />
                                </button>
                                <button onClick={() => { const d = new Date(calendarMonth); d.setMonth(d.getMonth() + 1); setCalendarMonth(d); }}
                                    style={{ background: '#f1f5f9', border: 'none', borderRadius: '7px', padding: '5px 8px', cursor: 'pointer', display: 'flex' }}>
                                    <ChevronRight size={15} color="#64748b" />
                                </button>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '3px', textAlign: 'center', marginBottom: '0.5rem' }}>
                            {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => (
                                <div key={i} style={{ color: '#94a3b8', fontWeight: '600', fontSize: '0.72rem', paddingBottom: '0.35rem' }}>{d}</div>
                            ))}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '3px' }}>
                            {renderCalendar()}
                        </div>

                        <button onClick={goToToday} style={{
                            width: '100%', marginTop: '1rem', padding: '0.6rem', background: '#eef2ff', color: '#6366f1',
                            border: 'none', borderRadius: '9px', fontWeight: '700', cursor: 'pointer', fontSize: '0.85rem'
                        }}>
                            Aujourd'hui
                        </button>
                    </div>


                </div>
            </div>

            {/* ─── Modal Form ──────────────────────────────────────────────── */}
            {isFormOpen && (
                <div onClick={(e) => e.target === e.currentTarget && setIsFormOpen(false)}
                    style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '1rem' }}>
                    <div style={{ background: 'white', borderRadius: '20px', width: '100%', maxWidth: '500px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px rgba(0,0,0,0.2)' }}>

                        {/* Modal header */}
                        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{ background: '#eef2ff', borderRadius: '10px', padding: '0.5rem', display: 'flex' }}>
                                    <CalendarIcon size={18} color="#6366f1" />
                                </div>
                                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', color: '#1e293b' }}>
                                    {editingId ? 'Modifier l\'activité' : 'Nouvelle Activité'}
                                </h3>
                            </div>
                            <button onClick={() => setIsFormOpen(false)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '8px', padding: '0.5rem', cursor: 'pointer', display: 'flex' }}>
                                <X size={18} color="#64748b" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                            {/* Title */}
                            <div style={{ position: 'relative' }}>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#475569', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Titre *</label>
                                <input type="text" required value={formData.title} onChange={handleTitleChange}
                                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                    placeholder="Ex: Petit déjeuner, Football..."
                                    style={{ width: '100%', padding: '0.7rem 1rem', borderRadius: '10px', border: '1.5px solid #e2e8f0', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                                    onFocus={e => { e.target.style.borderColor = '#6366f1'; formData.title && setShowSuggestions(true); }}
                                    autoFocus
                                />
                                {showSuggestions && suggestions.length > 0 && (
                                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid #e2e8f0', borderRadius: '10px', zIndex: 100, boxShadow: '0 8px 20px rgba(0,0,0,0.12)', maxHeight: '180px', overflowY: 'auto', marginTop: '4px' }}>
                                        {suggestions.slice(0, 8).map((s, i) => (
                                            <div key={i} onClick={() => { setFormData({ ...formData, title: s }); setShowSuggestions(false); }}
                                                style={{ padding: '0.6rem 1rem', cursor: 'pointer', fontSize: '0.9rem', color: '#334155', borderBottom: '1px solid #f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                                onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                                                onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                                                <Star size={12} color="#6366f1" /> {s}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Date */}
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#475569', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Date *</label>
                                <input type="date" required value={formData.date} disabled={!!editingId}
                                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                                    style={{ width: '100%', padding: '0.7rem 1rem', borderRadius: '10px', border: '1.5px solid #e2e8f0', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box', background: editingId ? '#f8fafc' : 'white' }}
                                />
                            </div>

                            {/* Time */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                {[['startTime', 'Début *'], ['endTime', 'Fin *']].map(([key, label]) => (
                                    <div key={key}>
                                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#475569', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{label}</label>
                                        <input type="time" required value={formData[key]}
                                            onChange={e => setFormData({ ...formData, [key]: e.target.value })}
                                            style={{ width: '100%', padding: '0.7rem 1rem', borderRadius: '10px', border: '1.5px solid #e2e8f0', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }}
                                        />
                                    </div>
                                ))}
                            </div>

                            {/* Color picker */}
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#475569', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                                    <Tag size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} /> Couleur
                                </label>
                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                    {ACTIVITY_COLORS.map(c => (
                                        <button key={c.value} type="button" onClick={() => setFormData({ ...formData, color: c.value })}
                                            style={{
                                                width: '28px', height: '28px', borderRadius: '50%', background: c.value,
                                                border: formData.color === c.value ? `3px solid #1e293b` : '3px solid transparent',
                                                cursor: 'pointer', outline: formData.color === c.value ? `2px solid ${c.value}` : 'none',
                                                outlineOffset: '2px', transition: 'all 0.15s'
                                            }} title={c.label} />
                                    ))}
                                </div>
                            </div>

                            {/* Location */}
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#475569', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Lieu / Description</label>
                                <div style={{ position: 'relative' }}>
                                    <MapPin size={15} style={{ position: 'absolute', top: '11px', left: '12px', color: '#94a3b8' }} />
                                    <input type="text" value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Réfectoire, Terrain A..."
                                        style={{ width: '100%', padding: '0.7rem 1rem 0.7rem 2.25rem', borderRadius: '10px', border: '1.5px solid #e2e8f0', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }}
                                    />
                                </div>
                            </div>

                            {/* Repeat */}
                            {!editingId && (
                                <div style={{ background: '#f8faff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1rem' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', fontWeight: '700', color: '#475569', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                                        <Repeat size={13} /> Répétition
                                    </label>
                                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                                        {[['none', 'Jamais'], ['daily', 'Tous les jours']].map(([val, lbl]) => (
                                            <label key={val} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.875rem', cursor: 'pointer', color: formData.repeatType === val ? '#6366f1' : '#475569', fontWeight: formData.repeatType === val ? '700' : '400' }}>
                                                <input type="radio" name="repeat" checked={formData.repeatType === val} onChange={() => setFormData({ ...formData, repeatType: val })} style={{ accentColor: '#6366f1' }} />
                                                {lbl}
                                            </label>
                                        ))}
                                    </div>
                                    {formData.repeatType !== 'none' && (
                                        <div style={{ marginTop: '0.75rem' }}>
                                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#64748b', marginBottom: '0.3rem' }}>Jusqu'au</label>
                                            <input type="date" value={formData.repeatEndDate}
                                                onChange={e => setFormData({ ...formData, repeatEndDate: e.target.value })}
                                                style={{ padding: '0.6rem 0.875rem', borderRadius: '9px', border: '1.5px solid #e2e8f0', fontSize: '0.9rem', outline: 'none' }}
                                            />
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Footer */}
                            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                                <button type="button" onClick={() => setIsFormOpen(false)}
                                    style={{ flex: 1, padding: '0.75rem', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', fontSize: '0.9rem' }}>
                                    Annuler
                                </button>
                                <button type="submit"
                                    style={{ flex: 2, padding: '0.75rem', background: formData.color || '#6366f1', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', fontSize: '0.9rem', boxShadow: `0 4px 12px ${formData.color || '#6366f1'}40` }}>
                                    {editingId ? '✔ Enregistrer' : '+ Ajouter'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ─── Styles ───────────────────────────────────────────────────── */}
            <style>{`
                .sc-activity-card:hover { box-shadow: 0 6px 20px rgba(0,0,0,0.1) !important; transform: translateY(-1px); }
                .sc-edit-btn:hover { color: #6366f1 !important; }
                .sc-delete-btn:hover { color: #ef4444 !important; }

                @media (max-width: 900px) {
                    .sc-inner {
                        flex-direction: column !important;
                        overflow-y: auto !important;
                        overflow-x: hidden !important;
                        padding: 1rem !important;
                    }
                    .sc-sidebar {
                        width: 100% !important;
                        order: -1;
                        display: grid !important;
                        grid-template-columns: 1fr 1fr !important;
                        gap: 1rem !important;
                        overflow: visible !important;
                    }
                    /* Calendar takes full width */
                    .sc-sidebar > div:first-child {
                        grid-column: 1 / -1;
                    }
                    .sc-main {
                        overflow: visible !important;
                    }
                    .sc-header { padding: 1rem !important; }
                }

                @media (max-width: 540px) {
                    .sc-sidebar {
                        grid-template-columns: 1fr !important;
                    }
                    .sc-header {
                        flex-direction: column !important;
                        align-items: flex-start !important;
                    }
                    .sc-header > div:last-child {
                        width: 100% !important;
                        justify-content: space-between !important;
                    }
                    .schedule-container {
                        overflow-y: auto !important;
                    }
                }
            `}</style>
        </div>
    );
}
