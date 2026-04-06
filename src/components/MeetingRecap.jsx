import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    CalendarIcon,
    CheckSquare,
    Square,
    Plus,
    Trash2,
    MessageSquare,
    ClipboardList,
    ChevronLeft,
    ChevronRight,
    Save,
    Circle,
    TrendingUp,
    Star,
    Zap,
    ChevronDown,
    FileText,
    Users,
    CheckCircle2,
    Sparkles,
    LayoutDashboard,
    Clock,
    Target
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { useUi } from '../ui/UiProvider';

const PRIORITY_CONFIG = {
    normal: { label: 'Normal', color: 'oklch(65% 0.1 var(--brand-hue))', bg: 'oklch(65% 0.1 var(--brand-hue) / 0.1)', icon: <Circle size={14} /> },
    important: { label: 'Important', color: 'oklch(75% 0.15 60)', bg: 'oklch(75% 0.15 60 / 0.1)', icon: <Star size={14} /> },
    urgent: { label: 'Urgent', color: 'oklch(60% 0.2 25)', bg: 'oklch(60% 0.2 25 / 0.1)', icon: <Zap size={14} /> },
};

export default function MeetingRecap({ participants, canEdit = true, meetingRecaps = [], setMeetingRecaps, isMobile }) {
    const ui = useUi();
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const todos = useMemo(() => meetingRecaps.filter(p => p.type === 'todo'), [meetingRecaps]);
    const notes = useMemo(() => {
        const map = {};
        meetingRecaps.filter(p => p.type === 'note').forEach(n => { map[n.date] = n.content; });
        return map;
    }, [meetingRecaps]);

    const [newTodo, setNewTodo] = useState('');
    const [newPriority, setNewPriority] = useState('normal');
    const [newAssignee, setNewAssignee] = useState('');

    const [isSaving, setIsSaving] = useState(false);

    const handleAddTodo = (e) => {
        e.preventDefault();
        if (!canEdit) return;
        if (newTodo.trim()) {
            const item = { 
                id: uuidv4(), 
                type: 'todo',
                text: newTodo, 
                completed: false, 
                date: selectedDate, 
                priority: newPriority, 
                assignee: newAssignee 
            };
            setMeetingRecaps([...meetingRecaps, item]);
            setNewTodo('');
            setNewPriority('normal');
            setNewAssignee('');
            ui.toast('Tâche ajoutée.', { type: 'success' });
        }
    };

    const toggleTodo = (id) => {
        if (!canEdit) return;
        setMeetingRecaps(meetingRecaps.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
    };

    const deleteTodo = (id) => {
        if (!canEdit) return;
        setMeetingRecaps(meetingRecaps.filter(t => t.id !== id));
    };

    const handleNoteChange = (e) => {
        if (!canEdit) return;
        const content = e.target.value;
        const noteId = `note_${selectedDate}`;
        const existing = meetingRecaps.find(p => p.id === noteId);
        
        if (existing) {
            setMeetingRecaps(meetingRecaps.map(p => p.id === noteId ? { ...p, content } : p));
        } else {
            setMeetingRecaps([...meetingRecaps, { id: noteId, type: 'note', date: selectedDate, content }]);
        }
    };

    const handleNoteSave = () => {
        if (!canEdit) return;
        setIsSaving(true);
        setTimeout(() => {
            setIsSaving(false);
            ui.toast('Compte-rendu synchronisé (Cloud).', { type: 'success' });
        }, 600);
    };

    const getDaysInMonth = (date) => {
        const y = date.getFullYear(), m = date.getMonth();
        const days = new Date(y, m + 1, 0).getDate();
        const first = new Date(y, m, 1).getDay();
        return { days, firstDay: first === 0 ? 6 : first - 1 };
    };

    const changeMonth = (offset) => {
        const d = new Date(currentMonth);
        d.setMonth(d.getMonth() + offset);
        setCurrentMonth(d);
    };

    const isoDate = (y, m, d) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const todayStr = isoDate(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());

    const { days: daysInMonth, firstDay } = getDaysInMonth(currentMonth);
    const monthName = currentMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

    const filteredTodos = todos.filter(t => t.date === selectedDate);
    const sortedTodos = [...filteredTodos].sort((a, b) => {
        const order = { urgent: 0, important: 1, normal: 2 };
        return (a.completed ? 10 : 0) - (b.completed ? 10 : 0) || order[a.priority] - order[b.priority];
    });
    const completedCount = filteredTodos.filter(t => t.completed).length;
    const progress = filteredTodos.length > 0 ? (completedCount / filteredTodos.length) * 100 : 0;
    const currentNote = notes[selectedDate] || '';

    const selectedDateLabel = new Date(selectedDate + 'T00:00').toLocaleDateString('fr-FR', {
        weekday: 'long', day: 'numeric', month: 'long'
    });

    return (
        <div style={{ padding: '0', height: '100%', overflowY: 'auto', background: 'transparent' }} className="no-scrollbar">
            <div style={{ maxWidth: '1600px', width: isMobile ? '100%' : '96%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: isMobile ? '0.75rem' : '2rem', padding: isMobile ? '0.75rem' : '1.5rem' }}>

                {/* Header */}
                <header className="card-glass" style={{
                    padding: isMobile ? '1.25rem 1.5rem' : '2rem 2.5rem', display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'center',
                    background: 'white', border: '1.5px solid var(--glass-border)', borderRadius: isMobile ? '24px' : '32px', gap: '1.5rem'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <div style={{ background: 'var(--primary-gradient)', borderRadius: '16px', padding: '0.85rem', color: 'white', display: 'flex' }}>
                            <ClipboardList size={28} strokeWidth={2.5} />
                        </div>
                        <div style={{ minWidth: 0 }}>
                            <h1 style={{ margin: 0, fontSize: isMobile ? '1.3rem' : '1.75rem', fontWeight: '950', fontFamily: 'Sora, sans-serif', color: 'var(--text-main)', letterSpacing: '-0.04em', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                Coordination
                            </h1>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '850', marginTop: '2px' }}>
                                <CalendarIcon size={14} strokeWidth={3} /> {selectedDateLabel}
                            </div>
                        </div>
                    </div>
                    
                    <div style={{ display: 'flex', gap: isMobile ? '1rem' : '1.5rem', justifyContent: isMobile ? 'space-between' : 'flex-end', width: isMobile ? '100%' : 'auto', paddingTop: isMobile ? '1rem' : 0, borderTop: isMobile ? '1.5px solid var(--bg-secondary)' : 'none' }}>
                        {[
                            { label: 'Tâches', value: todos.length, color: 'var(--primary-color)' },
                            { label: 'Global', value: `${Math.round((todos.filter(t => t.completed).length / (todos.length || 1)) * 100)}%`, color: 'var(--success-color)' },
                        ].map(s => (
                            <div key={s.label} style={{ textAlign: isMobile ? 'left' : 'right', flex: isMobile ? 1 : 'none' }}>
                                <div style={{ fontSize: isMobile ? '1.1rem' : '1.25rem', fontWeight: '950', color: s.color, letterSpacing: '-0.02em' }}>{s.value}</div>
                                <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '950', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.label}</div>
                            </div>
                        ))}
                    </div>
                </header>

                {/* Main Content Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'minmax(0, 1fr) 360px', gap: isMobile ? '1.5rem' : '2.5rem', alignItems: 'start' }}>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                        
                        {/* Notes Section */}
                        <section style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <div style={{ background: 'var(--bg-secondary)', padding: '8px', borderRadius: '10px', color: 'var(--text-main)', display: 'flex' }}>
                                        <FileText size={20} strokeWidth={2.5} />
                                    </div>
                                    <h2 style={{ fontSize: '1.25rem', fontWeight: '950', color: 'var(--text-main)', margin: 0, fontFamily: 'Sora, sans-serif' }}>Compte-rendu</h2>
                                </div>
                                <button onClick={handleNoteSave} className="btn btn-primary" style={{ padding: isMobile ? '0.75rem' : '0.75rem 1.5rem', borderRadius: '14px', fontWeight: '950', flexShrink: 0 }}>
                                    {isSaving ? <Sparkles size={18} className="animate-spin" /> : <Save size={18} strokeWidth={2.5} />}
                                    {!isMobile && <span style={{ marginLeft: '8px' }}>Enregistrer</span>}
                                </button>
                            </div>
                            
                            <div className="card-glass" style={{ 
                                background: 'white', border: '1.5px solid var(--glass-border)', borderRadius: '28px', padding: isMobile ? '1.5rem' : '2.5rem',
                                transition: 'all 0.3s var(--ease-out-expo)'
                            }}>
                                <textarea
                                    value={currentNote}
                                    onChange={handleNoteChange}
                                    placeholder="Libre expression sur le déroulement de la journée..."
                                    style={{
                                        width: '100%', height: isMobile ? '280px' : '360px', border: 'none', background: 'transparent',
                                        resize: 'none', outline: 'none', fontSize: isMobile ? '0.85rem' : '1.05rem', lineHeight: '1.6',
                                        color: 'var(--text-main)', fontWeight: '750', fontStyle: 'normal'
                                    }}
                                />
                                <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1.5px solid var(--bg-secondary)', display: 'flex', justifyContent: 'space-between', fontSize: isMobile ? '9px' : '11px', color: 'var(--text-muted)', fontWeight: '950', textTransform: 'uppercase', letterSpacing: '0.06em', flexWrap: 'wrap', gap: '1rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Sparkles size={12} /> {currentNote.trim().length} CARACTÈRES</div>
                                    <div style={{ opacity: 0.8 }}>SYCHRO : {isSaving ? 'EN COURS...' : 'OK CLOUD'}</div>
                                </div>
                            </div>
                        </section>

                        {/* Todo Section */}
                        <section style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <div style={{ background: 'var(--bg-secondary)', padding: '8px', borderRadius: '10px', color: 'var(--text-main)', display: 'flex' }}>
                                        <CheckSquare size={20} strokeWidth={2.5} />
                                    </div>
                                    <h2 style={{ fontSize: '1.25rem', fontWeight: '950', color: 'var(--text-main)', margin: 0, fontFamily: 'Sora, sans-serif' }}>Actions & Logistique</h2>
                                </div>
                                <div style={{ fontSize: isMobile ? '9px' : '11px', fontWeight: '950', color: 'var(--primary-color)', background: 'var(--primary-light)', padding: '6px 12px', borderRadius: '100px', display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                                    <CheckCircle2 size={12} strokeWidth={3} /> {completedCount}/{filteredTodos.length} {isMobile ? 'VALIDÉES' : 'ACTIONS VALIDÉES'}
                                </div>
                            </div>

                            <form onSubmit={handleAddTodo} className="card-glass" style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '1rem', background: 'rgba(255,255,255,0.7)', padding: isMobile ? '1.25rem' : '1rem 1.5rem', borderRadius: '20px', border: '1.5px solid var(--glass-border)', alignItems: isMobile ? 'stretch' : 'center' }}>
                                <div style={{ display: 'flex', gap: '1rem', flex: 1 }}>
                                    <select 
                                        value={newPriority}
                                        onChange={e => setNewPriority(e.target.value)}
                                        style={{ background: 'var(--bg-secondary)', border: 'none', fontWeight: '950', color: PRIORITY_CONFIG[newPriority].color, outline: 'none', cursor: 'pointer', padding: '0.5rem 0.75rem', borderRadius: '12px', fontSize: '10px', textTransform: 'uppercase', flexShrink: 0 }}
                                    >
                                        {Object.entries(PRIORITY_CONFIG).map(([key, cfg]) => <option key={key} value={key}>{cfg.label}</option>)}
                                    </select>
                                    <input
                                        type="text"
                                        placeholder={isMobile ? "Nouvelle tâche..." : "Nouvelle tâche coordination..."}
                                        value={newTodo}
                                        onChange={e => setNewTodo(e.target.value)}
                                        style={{ flex: 1, background: 'transparent', border: 'none', padding: '0.5rem', fontSize: isMobile ? '0.85rem' : '1rem', outline: 'none', fontWeight: '800', minWidth: 0 }}
                                    />
                                </div>
                                <button type="submit" className="btn btn-primary" style={{ height: '44px', width: isMobile ? '100%' : '44px', padding: 0, borderRadius: '12px', flexShrink: 0 }}>
                                    {isMobile ? <span style={{ fontWeight: '950', fontSize: '0.9rem' }}>Ajouter la tâche</span> : <Plus size={24} strokeWidth={3} />}
                                </button>
                            </form>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {sortedTodos.map((todo, idx) => {
                                    const prio = PRIORITY_CONFIG[todo.priority || 'normal'];
                                    return (
                                        <div key={todo.id} className="card-glass animate-fade-in" style={{
                                            '--i': idx,
                                            animationDelay: `calc(var(--i) * 30ms)`,
                                            background: todo.completed ? 'rgba(255,255,255,0.3)' : 'white',
                                            borderRadius: '20px', padding: isMobile ? '1rem' : '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: isMobile ? '0.875rem' : '1.25rem',
                                            border: '1.5px solid var(--glass-border)', transition: 'all 0.3s var(--ease-out-expo)',
                                            opacity: todo.completed ? 0.6 : 1, boxShadow: todo.completed ? 'none' : 'var(--shadow-sm)'
                                        }}>
                                            <button 
                                                onClick={() => toggleTodo(todo.id)}
                                                className="btn-icon-ref"
                                                style={{ color: todo.completed ? 'var(--success-color)' : 'var(--text-muted)' }}
                                            >
                                                {todo.completed ? <CheckCircle2 size={24} strokeWidth={2.5} /> : <Circle size={24} strokeWidth={2.5} />}
                                            </button>
                                            
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: '1rem', fontWeight: '850', color: 'var(--text-main)', textDecoration: todo.completed ? 'line-through' : 'none', letterSpacing: '-0.01em' }}>
                                                    {todo.text}
                                                </div>
                                                <div style={{ display: 'flex', gap: '1rem', marginTop: '6px', alignItems: 'center' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '9px', fontWeight: '950', color: prio.color, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                                        {prio.icon} {prio.label}
                                                    </div>
                                                </div>
                                            </div>

                                            <button onClick={() => deleteTodo(todo.id)} className="btn-icon-ref danger" style={{ opacity: 0.3 }}>
                                                <Trash2 size={18} strokeWidth={2.5} />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    </div>

                    {/* Sidebar */}
                    <aside style={{ display: 'flex', flexDirection: isMobile ? 'column-reverse' : 'column', gap: '2rem', position: isMobile ? 'static' : 'sticky', top: '1.5rem' }}>
                        
                        {/* Calendar Card */}
                        <div className="card-glass" style={{ background: 'white', borderRadius: '28px', padding: '1.75rem', border: '1.5px solid var(--glass-border)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: '950', color: 'var(--text-main)', margin: 0, textTransform: 'capitalize', fontFamily: 'Sora, sans-serif' }}>
                                    {monthName}
                                </h3>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button onClick={() => changeMonth(-1)} className="btn-icon-ref" style={{ width: '32px', height: '32px' }}><ChevronLeft size={18} strokeWidth={2.5} /></button>
                                    <button onClick={() => changeMonth(1)} className="btn-icon-ref" style={{ width: '32px', height: '32px' }}><ChevronRight size={18} strokeWidth={2.5} /></button>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px', textAlign: 'center' }}>
                                {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => (
                                    <div key={i} style={{ color: 'var(--text-muted)', fontWeight: '950', fontSize: '10px', paddingBottom: '8px' }}>{d}</div>
                                ))}
                                {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
                                {Array.from({ length: daysInMonth }).map((_, i) => {
                                    const day = i + 1;
                                    const dateStr = isoDate(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                                    const isSel = dateStr === selectedDate;
                                    const isToday = dateStr === todayStr;
                                    const hasData = todos.some(t => t.date === dateStr) || notes[dateStr];
                                    
                                    return (
                                        <button 
                                            key={day} 
                                            onClick={() => setSelectedDate(dateStr)}
                                            style={{
                                                aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                borderRadius: '12px', border: 'none', position: 'relative',
                                                background: isSel ? 'var(--primary-color)' : isToday ? 'var(--primary-light)' : 'transparent',
                                                color: isSel ? 'white' : isToday ? 'var(--primary-color)' : 'var(--text-main)',
                                                fontWeight: '950', cursor: 'pointer', fontSize: '11px', transition: 'all 0.2s',
                                                boxShadow: isSel ? '0 8px 16px var(--shadow-color)' : 'none'
                                            }}
                                        >
                                            {day}
                                            {hasData && !isSel && (
                                                <div style={{ position: 'absolute', bottom: '4px', width: '3px', height: '3px', borderRadius: '50%', background: 'var(--primary-color)', opacity: 0.6 }} />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Progress Tracker */}
                        <div style={{ 
                            background: 'var(--primary-gradient)', borderRadius: '28px', padding: '2rem', color: 'white',
                            boxShadow: '0 20px 40px oklch(from var(--primary-color) l c h / 0.25)', position: 'relative', overflow: 'hidden'
                        }}>
                             <div style={{ position: 'absolute', top: '-10px', right: '-10px', opacity: 0.1 }}>
                                <Target size={120} strokeWidth={2} />
                            </div>
                            
                            <div style={{ position: 'relative', zIndex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                                    <div>
                                        <div style={{ fontSize: '10px', fontWeight: '950', textTransform: 'uppercase', opacity: 0.8, letterSpacing: '0.1em' }}>Taux de réalisation</div>
                                        <div style={{ fontSize: isMobile ? '1.75rem' : '2.5rem', fontWeight: '950', lineHeight: 1, marginTop: '4px', fontFamily: 'Sora, sans-serif' }}>{Math.round(progress)}%</div>
                                    </div>
                                    <div style={{ background: 'rgba(255,255,255,0.2)', padding: '0.75rem', borderRadius: '16px', backdropFilter: 'blur(10px)' }}>
                                        <TrendingUp size={24} strokeWidth={2.5} />
                                    </div>
                                </div>
                                
                                <div style={{ height: '10px', background: 'rgba(255,255,255,0.2)', borderRadius: '100px', overflow: 'hidden', marginBottom: '1rem' }}>
                                    <div style={{ width: `${progress}%`, height: '100%', background: 'white', borderRadius: '100px', transition: 'width 1s cubic-bezier(0.34, 1.56, 0.64, 1)' }} />
                                </div>
                                
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: '900' }}>
                                    <CheckCircle2 size={16} strokeWidth={2.5} /> {completedCount} objectifs validés aujourd'hui
                                </div>
                            </div>
                        </div>

                        {/* Quick Tips */}
                        <div className="card-glass" style={{ background: 'rgba(255,255,255,0.4)', borderRadius: '24px', padding: '1.5rem', border: '1.5px solid var(--glass-border)' }}>
                             <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                                <div style={{ background: 'white', padding: '6px', borderRadius: '8px', color: 'var(--primary-color)' }}>
                                    <LayoutDashboard size={16} strokeWidth={2.5} />
                                </div>
                                <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: '950', color: 'var(--text-main)' }}>Coordination</h4>
                            </div>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.6', fontWeight: '750' }}>
                                Assurez-vous d'avoir validé les repas et les transferts avant d'enregistrer le compte-rendu final.
                            </p>
                        </div>
                    </aside>
                </div>
            </div>

            <style>{`
                .btn-icon-ref {
                    background: var(--bg-secondary);
                    border: none;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: var(--text-muted);
                    transition: all 0.2s;
                }
                .btn-icon-ref:hover {
                    color: var(--primary-color);
                    background: white;
                    transform: translateY(-2px);
                }
                .btn-icon-ref.danger:hover {
                    color: var(--danger-color);
                    background: oklch(62% 0.18 20 / 0.1);
                }
            `}</style>
        </div>
    );
}
