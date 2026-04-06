import React, { useState, useMemo, useEffect } from 'react';
import {
    ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Clock, MapPin,
    Users, X, Trash2, Edit2, Repeat, Star, Tag, CheckCircle2, Circle, Printer, Utensils,
    Coffee, Sun, Zap, Moon, Check
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import Menus from './Menus';
import { useUi } from '../ui/UiProvider';

// ─── Constants ───────────────────────────────────────────────────────────────

const formatDate = (date) => date.toISOString().split('T')[0];

const COMMON_ACTIVITIES = [
    "Petit déjeuner", "Déjeuner", "Dîner", "Goûter",
    "Réveil", "Toilette", "Temps calme", "Douches", "Coucher",
    "Rassemblement", "Veillée", "Grand jeu", "Atelier manuel", "Sport",
    "Baignade", "Randonnée", "Animation", "Temps libre"
];

const ACTIVITY_COLORS = [
    { label: 'Violet', value: 'oklch(62% 0.18 258)', bg: 'oklch(96% 0.02 258)' },
    { label: 'Bleu', value: 'oklch(62% 0.18 232)', bg: 'oklch(96% 0.02 232)' },
    { label: 'Vert', value: 'oklch(68% 0.16 145)', bg: 'oklch(97% 0.02 145)' },
    { label: 'Orange', value: 'oklch(71% 0.19 45)', bg: 'oklch(97% 0.03 45)' },
    { label: 'Rouge', value: 'oklch(62% 0.18 25)', bg: 'oklch(96% 0.02 25)' },
    { label: 'Rose', value: 'oklch(65% 0.18 340)', bg: 'oklch(96% 0.02 340)' },
    { label: 'Gris', value: 'oklch(55% 0.02 232)', bg: 'oklch(94% 0.02 232)' },
];

const DEFAULT_COLOR = ACTIVITY_COLORS[0];

// ─── Time helpers ─────────────────────────────────────────────────────────────

const getTimeSlotLabel = (startTime) => {
    if (!startTime) return null;
    const h = parseInt(startTime.split(':')[0], 10);
    if (h < 10) return { icon: <Coffee size={14} />, label: 'Matin' };
    if (h < 13) return { icon: <Sun size={14} />, label: 'Midi' };
    if (h < 18) return { icon: <Zap size={14} />, label: 'Après-midi' };
    return { icon: <Moon size={14} />, label: 'Soir' };
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

const ActivityCard = ({ activity, index, onEdit, onDelete, onToggleDone, isMobile, canEdit }) => {
    const color = activity.color || DEFAULT_COLOR.value;
    const timeSlot = getTimeSlotLabel(activity.startTime);
    const duration = getDuration(activity.startTime, activity.endTime);
    const isDone = activity.done;

    return (
        <div className="sc-activity-item animate-fade-in"
            draggable="true"
            onDragStart={(e) => {
                e.dataTransfer.setData('text/plain', activity.id);
                e.currentTarget.style.opacity = '0.4';
            }}
            onDragEnd={(e) => {
                e.currentTarget.style.opacity = isDone ? '0.6' : '1';
            }}
            style={{
                '--i': index,
                animationDelay: `calc(var(--i, 0) * 60ms)`,
                position: 'relative',
                display: 'flex',
                gap: isMobile ? '1rem' : '2rem',
                paddingBottom: isMobile ? '1.5rem' : '2.5rem',
                opacity: isDone ? 0.6 : 1,
                cursor: 'grab',
                transition: 'all 0.4s var(--ease-out-expo)'
            }}>
            
            {/* Timeline Vertical Line */}
            <div style={{
                position: 'absolute',
                left: isMobile ? '38px' : '46px',
                top: isMobile ? '44px' : '56px',
                bottom: 0,
                width: '3px',
                borderRadius: '10px',
                background: isDone ? 'var(--glass-border)' : `oklch(from ${color} 90% 0.05 h / 0.4)`,
                zIndex: 0
            }} />

            {/* Time Marker Side */}
            <div style={{
                width: isMobile ? '80px' : '94px',
                flexShrink: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                zIndex: 1,
                paddingTop: '6px'
            }}>
                <div style={{
                    minWidth: isMobile ? '60px' : '70px',
                    padding: isMobile ? '6px 8px' : '8px 12px',
                    borderRadius: isMobile ? '12px' : '16px',
                    background: isDone ? 'rgba(255,255,255,0.45)' : 'white',
                    border: '2px solid',
                    borderColor: isDone ? 'var(--glass-border)' : color,
                    color: isDone ? 'var(--text-muted)' : 'var(--text-main)',
                    fontWeight: '950',
                    fontFamily: 'Sora, sans-serif',
                    fontSize: isMobile ? '0.85rem' : '1rem',
                    lineHeight: 1,
                    textAlign: 'center',
                    boxShadow: isDone ? 'none' : `0 12px 30px oklch(from ${color} l c h / 0.15)`,
                    transition: 'all 0.3s'
                }}>
                    {activity.startTime || '—'}
                </div>
                {duration && !isDone && (
                    <div style={{
                        marginTop: '0.5rem',
                        fontSize: '9px',
                        fontWeight: '950',
                        color: 'oklch(50% 0.02 var(--brand-hue) / 0.6)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        background: 'oklch(0% 0 0 / 0.03)',
                        padding: '2px 8px',
                        borderRadius: '20px'
                    }}>
                        {duration}
                    </div>
                )}
            </div>

            {/* Content Display */}
            <div style={{ 
                flex: 1, 
                padding: '0.5rem 0',
                minWidth: 0,
                display: 'flex',
                gap: isMobile ? '0.75rem' : '1.5rem',
                flexDirection: isMobile ? 'column' : 'row',
                alignItems: isMobile ? 'stretch' : 'flex-start'
            }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{
                        margin: 0,
                        fontSize: isMobile ? '1.1rem' : '1.25rem',
                        fontWeight: '950',
                        fontFamily: 'Sora, sans-serif',
                        color: isDone ? 'var(--text-muted)' : 'var(--text-main)',
                        lineHeight: '1.2',
                        letterSpacing: '-0.04em',
                        textDecoration: isDone ? 'line-through' : 'none',
                    }}>
                        {activity.title}
                    </h3>
                    
                    <div style={{ 
                        display: 'flex', 
                        gap: isMobile ? '0.5rem' : '1.25rem', 
                        alignItems: 'center', 
                        marginTop: isMobile ? '0.5rem' : '0.75rem',
                        flexWrap: 'wrap'
                    }}>
                        {timeSlot && (
                            <span style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontWeight: '800' }}>
                                <div style={{ color: isDone ? 'inherit' : color, display: 'flex', padding: '3px', borderRadius: '6px', background: isDone ? 'transparent' : `oklch(from ${color} 98% calc(c / 8) h / 0.1)` }}>{timeSlot.icon}</div> {timeSlot.label}
                            </span>
                        )}
                        {activity.description && (
                            <span style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontWeight: '750' }}>
                                <MapPin size={12} strokeWidth={2.5} style={{ color: 'var(--accent-color)' }} /> {activity.description}
                            </span>
                        )}
                        {activity.participants && activity.participants.length > 0 && (
                            <span style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontWeight: '750' }}>
                                <Users size={12} strokeWidth={2.5} style={{ color: 'var(--secondary-color)' }} /> {activity.participants.length}
                            </span>
                        )}
                    </div>
                </div>

                {/* Inline Actions */}
                {canEdit && (
                    <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0, marginTop: isMobile ? '0.5rem' : 0, justifyContent: isMobile ? 'flex-end' : 'flex-start' }}>
                        <button
                            onClick={() => onToggleDone(activity.id)}
                            style={{ 
                                width: isMobile ? '38px' : '42px', height: isMobile ? '38px' : '42px', borderRadius: '12px', 
                                border: '2px solid',
                                borderColor: isDone ? 'var(--success-color)' : 'var(--glass-border)',
                                background: isDone ? 'var(--success-color)' : 'white',
                                color: isDone ? 'white' : 'var(--glass-border)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer', transition: 'all 0.3s var(--ease-out-expo)'
                            }}
                        >
                            {isDone ? <Check size={20} strokeWidth={3} /> : <Circle size={20} strokeWidth={3} />}
                        </button>
                        <button onClick={() => onEdit(activity)} className="btn-icon" style={{ width: isMobile ? '38px' : '42px', height: isMobile ? '38px' : '42px', background: 'white', border: '1.5px solid var(--glass-border)' }}>
                            <Edit2 size={16} strokeWidth={2.5} />
                        </button>
                        <button onClick={() => onDelete(activity.id)} className="btn-icon" style={{ width: isMobile ? '38px' : '42px', height: isMobile ? '38px' : '42px', background: 'white', border: '1.5px solid var(--glass-border)', color: 'var(--danger-color)' }}>
                            <Trash2 size={16} strokeWidth={2.5} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

// ─── Main Component ────────────────────────────────────────────────────────────

export default function Schedule({ activities, setActivities, participants, groups, canEdit = true }) {
    const ui = useUi();
    const [viewMode, setViewMode] = useState('activities');
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
    const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
    
    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const isMobile = windowWidth < 1024;

    const navigateDay = (dir) => {
        const d = new Date(currentDate);
        d.setDate(d.getDate() + dir);
        setCurrentDate(d);
        if (d.getMonth() !== calendarMonth.getMonth()) setCalendarMonth(d);
    };

    const goToToday = () => { const t = new Date(); setCurrentDate(t); setCalendarMonth(t); };

    const dayActivities = useMemo(() =>
        activities
            .filter(a => a.date === formatDate(currentDate))
            .sort((a, b) => (a.startTime || a.time || '').localeCompare(b.startTime || b.time || '')),
        [activities, currentDate]
    );

    const doneCount = dayActivities.filter(a => a.done).length;
    const progress = dayActivities.length > 0 ? (doneCount / dayActivities.length) * 100 : 0;

    const handleEdit = (activity) => {
        if (!canEdit) {
            ui.toast('Edition non autorisée.', { type: 'error' });
            return;
        }
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

    const handleDelete = async (id) => {
        if (!canEdit) return;
        const ok = await ui.confirm({
            title: 'Supprimer l\'activité',
            message: 'Êtes-vous sûr de vouloir supprimer cette activité ?',
            confirmText: 'Supprimer',
            danger: true
        });
        if (ok) setActivities(activities.filter(a => a.id !== id));
    };

    const handleToggleDone = (id) => {
        if (!canEdit) return;
        setActivities(activities.map(a => a.id === id ? { ...a, done: !a.done } : a));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!canEdit) return;
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

    const handleMoveActivity = (activityId, newDateStr) => {
        if (!canEdit) return;
        setActivities(activities.map(a => a.id === activityId ? { ...a, date: newDateStr } : a));
    };

    const handleTitleChange = (e) => {
        const value = e.target.value;
        setFormData({ ...formData, title: value });
        if (value.length > 0) {
            const existingTitles = [...new Set(activities.map(a => a.title))];
            const all = [...new Set([...COMMON_ACTIVITIES, ...existingTitles])];
            setSuggestions(all.filter(s => s.toLowerCase().includes(value.toLowerCase())));
            setShowSuggestions(true);
        } else setShowSuggestions(false);

        const lower = value.toLowerCase();
        let autoColor = formData.color;
        if (lower.includes('sport') || lower.includes('foot') || lower.includes('basket') || lower.includes('jeu') || lower.includes('olympiade')) autoColor = 'oklch(62% 0.18 25)';
        else if (lower.includes('repas') || lower.includes('déjeuner') || lower.includes('dîner') || lower.includes('goûter') || lower.includes('petit déj')) autoColor = 'oklch(71% 0.19 45)';
        else if (lower.includes('veillée') || lower.includes('réveil') || lower.includes('coucher') || lower.includes('nuit') || lower.includes('calme') || lower.includes('film')) autoColor = 'oklch(62% 0.18 258)';
        else if (lower.includes('baignade') || lower.includes('piscine') || lower.includes('mer') || lower.includes('douche') || lower.includes('eau')) autoColor = 'oklch(62% 0.18 232)';
        else if (lower.includes('randonnée') || lower.includes('nature') || lower.includes('forêt') || lower.includes('balade') || lower.includes('marche')) autoColor = 'oklch(68% 0.16 145)';

        if (autoColor !== formData.color) setFormData(prev => ({ ...prev, color: autoColor }));
    };

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
                    onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.transform = 'scale(1.2)'; e.currentTarget.style.zIndex = '10'; }}
                    onDragLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.zIndex = '1'; }}
                    onDrop={(e) => {
                        e.preventDefault();
                        e.currentTarget.style.transform = 'none';
                        e.currentTarget.style.zIndex = '1';
                        const activityId = e.dataTransfer.getData('text/plain');
                        if (activityId) handleMoveActivity(activityId, dateStr);
                    }}
                    style={{
                        aspectRatio: '1', cursor: 'pointer', borderRadius: '12px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
                        background: isSel ? 'var(--primary-color)' : isToday ? 'oklch(58% 0.2 var(--brand-hue) / 0.1)' : 'transparent',
                        color: isSel ? 'white' : isToday ? 'var(--primary-color)' : 'var(--text-main)',
                        fontWeight: (isSel || isToday) ? '950' : '650',
                        fontSize: '0.8rem', transition: 'all 0.2s',
                        border: isSel ? 'none' : '1px solid transparent'
                    }}>
                    {d}
                    {count > 0 && !isSel && (
                        <div style={{ position: 'absolute', bottom: '4px', width: '4px', height: '4px', borderRadius: '50%', background: 'oklch(58% 0.18 var(--brand-hue))' }} />
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
        <div style={{ height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative' }}>

            {/* View Toggle Bar */}
            <div style={{ 
                padding: '1.25rem 2.5rem', 
                background: 'var(--glass-bg)', 
                backdropFilter: 'blur(var(--glass-blur))', 
                borderBottom: '1.5px solid var(--glass-border)', 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center',
                zIndex: 20 
            }}>
                <div style={{ display: 'flex', background: 'oklch(0% 0 0 / 0.05)', padding: '5px', borderRadius: '16px', backdropFilter: 'blur(10px)' }}>
                     <button
                        onClick={() => setViewMode('activities')}
                        style={{ 
                            padding: '0.625rem 1.25rem', borderRadius: '12px', gap: '0.5rem', display: 'flex', alignItems: 'center',
                            background: viewMode === 'activities' ? 'white' : 'transparent',
                            color: viewMode === 'activities' ? 'var(--primary-color)' : 'var(--text-muted)',
                            fontWeight: '950', fontSize: '0.85rem', transition: 'all 0.3s',
                            boxShadow: viewMode === 'activities' ? 'var(--shadow-sm)' : 'none'
                        }}>
                        <CalendarIcon size={18} strokeWidth={2.5} /> Activités
                    </button>
                    <button
                        onClick={() => setViewMode('menus')}
                        style={{ 
                            padding: '0.625rem 1.25rem', borderRadius: '12px', gap: '0.5rem', display: 'flex', alignItems: 'center',
                            background: viewMode === 'menus' ? 'white' : 'transparent',
                            color: viewMode === 'menus' ? 'var(--cta-color)' : 'var(--text-muted)',
                            fontWeight: '950', fontSize: '0.85rem', transition: 'all 0.3s',
                            boxShadow: viewMode === 'menus' ? 'var(--shadow-sm)' : 'none'
                        }}>
                        <Utensils size={18} strokeWidth={2.5} /> Menus
                    </button>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: isMobile ? 'center' : 'flex-end', flexWrap: 'wrap' }}>
                    <button onClick={goToToday} className="btn-icon" style={{ width: isMobile ? '38px' : '44px', height: isMobile ? '38px' : '44px', background: 'white', border: '1.5px solid var(--glass-border)' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary-color)' }} />
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', background: 'white', borderRadius: '14px', border: '1.5px solid var(--glass-border)', overflow: 'hidden' }}>
                        <button onClick={() => navigateDay(-1)} style={{ padding: isMobile ? '0.55rem' : '0.75rem', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex' }}><ChevronLeft size={isMobile ? 16 : 18} /></button>
                        <div style={{ width: '1px', height: isMobile ? '16px' : '20px', background: 'var(--glass-border)' }} />
                        <button onClick={() => navigateDay(1)} style={{ padding: isMobile ? '0.55rem' : '0.75rem', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex' }}><ChevronRight size={isMobile ? 16 : 18} /></button>
                    </div>
                </div>
            </div>

            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, padding: isMobile ? '1.25rem' : '2.5rem', background: 'rgba(0,0,0,0.015)', overflowY: 'auto' }} className="no-scrollbar">
                    
                    {viewMode === 'activities' ? (
                        <div style={{ maxWidth: '1000px', width: '100%', margin: '0 auto' }}>
                            {/* Date Header Card */}
                            <div className="card-glass" style={{
                                padding: isMobile ? '1rem' : '1.5rem 2rem', marginBottom: isMobile ? '1.5rem' : '3rem', borderLeft: '8px solid var(--primary-color)',
                                background: 'white', display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'center',
                                gap: isMobile ? '1.25rem' : '1rem',
                                boxShadow: '0 15px 40px oklch(0% 0 0 / 0.05)'
                            }}>
                                <div>
                                    <h2 style={{ margin: 0, fontSize: isMobile ? '1.3rem' : '1.75rem', fontWeight: '950', fontFamily: 'Sora, sans-serif', letterSpacing: '-0.05em', color: 'var(--text-main)', textTransform: 'capitalize' }}>
                                        {currentDateLabel}
                                    </h2>
                                    {dayActivities.length > 0 && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
                                            <div style={{ height: '6px', width: isMobile ? '100px' : '180px', background: 'var(--bg-secondary)', borderRadius: '10px', overflow: 'hidden' }}>
                                                <div style={{ width: `${progress}%`, height: '100%', background: 'var(--primary-color)', borderRadius: '10px', transition: 'width 1s' }} />
                                            </div>
                                            <span style={{ fontSize: '10px', fontWeight: '950', color: 'var(--primary-color)' }}>{doneCount} / {dayActivities.length} FAITS</span>
                                        </div>
                                    )}
                                </div>
                                {canEdit && (
                                    <button onClick={openNewForm} className="btn btn-primary" style={{ padding: isMobile ? '0.75rem' : '0.85rem 1.5rem', fontWeight: '950', gap: '0.75rem', borderRadius: '14px', fontSize: isMobile ? '0.85rem' : '0.9rem' }}>
                                        <Plus size={isMobile ? 18 : 20} strokeWidth={3} /> Nouvelle Activité
                                    </button>
                                )}
                            </div>

                            {/* Timeline */}
                            {dayActivities.length === 0 ? (
                                <div className="card-glass" style={{ textAlign: 'center', padding: '6rem 2rem', border: '2.5px dashed var(--glass-border)' }}>
                                    <div style={{ width: '90px', height: '90px', background: 'var(--bg-secondary)', borderRadius: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2.5rem', opacity: 0.5 }}>
                                        <CalendarIcon size={44} />
                                    </div>
                                    <h3 style={{ fontSize: '1.5rem', fontWeight: '950', color: 'var(--text-main)', letterSpacing: '-0.03em' }}>Journée Libre</h3>
                                    <p style={{ color: 'var(--text-muted)', fontWeight: '700', marginTop: '0.5rem' }}>Profitez-en pour vous reposer ou préparer la suite.</p>
                                </div>
                            ) : (
                                <div style={{ paddingLeft: '20px' }}>
                                    {dayActivities.map((activity, idx) => (
                                        <ActivityCard key={activity.id} activity={activity} index={idx}
                                            onEdit={handleEdit} onDelete={handleDelete} onToggleDone={handleToggleDone} isMobile={isMobile} canEdit={canEdit} />
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                         <div style={{ maxWidth: '1000px', width: '100%', margin: '0 auto' }}>
                           <Menus participants={participants} currentDate={currentDate} isMobile={isMobile} />
                         </div>
                    )}
                </div>

                {/* Sidebar Calendar */}
                {!isMobile && (
                    <div style={{ 
                        width: '320px', 
                        borderLeft: '1.5px solid var(--glass-border)', 
                        background: 'rgba(255, 255, 255, 0.45)', 
                        backdropFilter: 'blur(10px)',
                        display: 'flex', flexDirection: 'column', 
                        overflowY: 'auto' 
                    }} className="no-scrollbar">
                        <div style={{ padding: '2.5rem 1.5rem' }}>
                            <div className="card-glass" style={{ background: 'white', padding: '1.5rem', boxShadow: '0 10px 30px oklch(0% 0 0 / 0.04)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                    <h4 style={{ margin: 0, fontWeight: '950', fontSize: '1rem', textTransform: 'capitalize', letterSpacing: '-0.02em' }}>
                                        {calendarMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                                    </h4>
                                    <div style={{ display: 'flex', gap: '4px' }}>
                                        <button onClick={() => { const d = new Date(calendarMonth); d.setMonth(d.getMonth() - 1); setCalendarMonth(d); }} className="btn-icon" style={{ width: '32px', height: '32px' }}><ChevronLeft size={14} /></button>
                                        <button onClick={() => { const d = new Date(calendarMonth); d.setMonth(d.getMonth() + 1); setCalendarMonth(d); }} className="btn-icon" style={{ width: '32px', height: '32px' }}><ChevronRight size={14} /></button>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center', marginBottom: '1rem' }}>
                                    {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => (
                                        <div key={i} style={{ color: 'var(--text-muted)', fontWeight: '950', fontSize: '10px', opacity: 0.5 }}>{d}</div>
                                    ))}
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
                                    {renderCalendar()}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal Form */}
            {isFormOpen && (
                <div className="modal-overlay animate-fade-in" onClick={(e) => e.target === e.currentTarget && setIsFormOpen(false)} style={{ zIndex: 1000, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)' }}>
                    <div className="modal-content animate-scale-in" style={{ width: '100%', maxWidth: '560px', borderRadius: '32px', padding: '0', overflow: 'hidden' }}>
                        <div style={{ padding: '1.5rem 2rem', background: 'var(--primary-gradient)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ width: '42px', height: '42px', background: 'rgba(255,255,255,0.2)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Plus size={24} />
                                </div>
                                <h3 style={{ margin: 0, fontWeight: '950', fontSize: '1.25rem', letterSpacing: '-0.02em' }}>
                                    {editingId ? 'Modifier l\'activité' : 'Nouvelle Activité'}
                                </h3>
                            </div>
                            <button onClick={() => setIsFormOpen(false)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '12px', padding: '0.5rem', cursor: 'pointer', color: 'white' }}>
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', maxHeight: '80vh', overflowY: 'auto' }} className="no-scrollbar">
                            <div>
                                <label className="form-label">Titre de l'activité</label>
                                <div style={{ position: 'relative' }}>
                                    <input type="text" required value={formData.title} onChange={handleTitleChange}
                                        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                        placeholder="Ex: Petit déjeuner, Football..."
                                        style={{ width: '100%', padding: '0.85rem 1.25rem', borderRadius: '16px', border: '1.5px solid var(--glass-border)', fontSize: '0.95rem', fontWeight: '700', outline: 'none', background: 'var(--bg-secondary)' }}
                                        autoFocus
                                    />
                                    {showSuggestions && suggestions.length > 0 && (
                                        <div className="card-glass" style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 200, marginTop: '8px', padding: '8px', background: 'white', border: '1.5px solid var(--glass-border)', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
                                            {suggestions.slice(0, 8).map((s, i) => (
                                                <div key={i} onClick={() => { setFormData({ ...formData, title: s }); setShowSuggestions(false); }}
                                                    style={{ padding: '0.75rem 1rem', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '800', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '0.75rem', transition: 'all 0.2s' }}
                                                    onMouseEnter={e => e.currentTarget.style.background = 'oklch(0% 0 0 / 0.05)'}
                                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                                    <Star size={14} style={{ color: 'var(--primary-color)' }} /> {s}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.5fr 1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label className="form-label">Date</label>
                                    <input type="date" required value={formData.date} disabled={!!editingId}
                                        onChange={e => setFormData({ ...formData, date: e.target.value })}
                                        style={{ width: '100%', padding: '0.85rem', borderRadius: '16px', border: '1.5px solid var(--glass-border)', fontWeight: '700', background: editingId ? 'var(--bg-secondary)' : 'white' }}
                                    />
                                </div>
                                <div>
                                    <label className="form-label">Début</label>
                                    <input type="time" required value={formData.startTime}
                                        onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                                        style={{ width: '100%', padding: '0.85rem', borderRadius: '16px', border: '1.5px solid var(--glass-border)', fontWeight: '700' }}
                                    />
                                </div>
                                <div>
                                    <label className="form-label">Fin</label>
                                    <input type="time" required value={formData.endTime}
                                        onChange={e => setFormData({ ...formData, endTime: e.target.value })}
                                        style={{ width: '100%', padding: '0.85rem', borderRadius: '16px', border: '1.5px solid var(--glass-border)', fontWeight: '700' }}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="form-label">Couleur & Catégorie</label>
                                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', padding: '10px', background: 'var(--bg-secondary)', borderRadius: '18px' }}>
                                    {ACTIVITY_COLORS.map(c => (
                                        <button key={c.value} type="button" onClick={() => setFormData({ ...formData, color: c.value })}
                                            style={{
                                                width: '32px', height: '32px', borderRadius: '50%', background: c.value,
                                                border: '3px solid white',
                                                boxShadow: formData.color === c.value ? `0 0 0 3px ${c.value}` : 'none',
                                                cursor: 'pointer', transition: 'all 0.2s', transform: formData.color === c.value ? 'scale(1.1)' : 'none'
                                            }} />
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="form-label">Lieu / Description</label>
                                <div style={{ position: 'relative' }}>
                                    <MapPin size={18} style={{ position: 'absolute', top: '15px', left: '15px', color: 'var(--text-muted)' }} />
                                    <input type="text" value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Réfectoire, Piscine, Salle commune..."
                                        style={{ width: '100%', padding: '0.85rem 1rem 0.85rem 2.8rem', borderRadius: '16px', border: '1.5px solid var(--glass-border)', fontWeight: '700' }}
                                    />
                                </div>
                            </div>

                            <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
                                <button type="button" onClick={() => setIsFormOpen(false)} className="btn btn-secondary" style={{ flex: 1, padding: '1rem' }}>Annuler</button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 2, padding: '1rem', fontWeight: '950' }}>{editingId ? 'Enregistrer les modifications' : 'Créer l\'activité'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style>{`
                .sc-activity-item:hover {
                    transform: translateX(10px);
                }
                .form-label {
                    display: block;
                    font-size: 11px;
                    font-weight: 950;
                    color: var(--text-muted);
                    text-transform: uppercase;
                    letter-spacing: 0.12em;
                    margin-bottom: 0.75rem;
                }
            `}</style>
        </div>
    );
}
