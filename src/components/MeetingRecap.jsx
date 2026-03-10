import React, { useState, useEffect } from 'react';
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
    AlertCircle,
    ChevronDown
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

const PRIORITY_CONFIG = {
    normal: { label: 'Normal', color: '#64748b', bg: '#f1f5f9', icon: <Circle size={13} /> },
    important: { label: 'Important', color: '#f59e0b', bg: '#fffbeb', icon: <Star size={13} /> },
    urgent: { label: 'Urgent', color: '#ef4444', bg: '#fef2f2', icon: <Zap size={13} /> },
};

export default function MeetingRecap({ participants }) {
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const [todos, setTodos] = useState(() => {
        const saved = localStorage.getItem('colo-recap-todos');
        return saved ? JSON.parse(saved) : [];
    });
    const [newTodo, setNewTodo] = useState('');
    const [newPriority, setNewPriority] = useState('normal');
    const [newAssignee, setNewAssignee] = useState('');
    const [showPriorityPicker, setShowPriorityPicker] = useState(false);

    const [notes, setNotes] = useState(() => {
        const saved = localStorage.getItem('colo-recap-notes');
        return saved ? JSON.parse(saved) : {};
    });

    const [noteSaved, setNoteSaved] = useState(false);

    // List of animators/direction for task assignment
    const animators = participants ? participants.filter(p => p.role === 'animator' || p.role === 'direction') : [];

    useEffect(() => { localStorage.setItem('colo-recap-todos', JSON.stringify(todos)); }, [todos]);
    useEffect(() => { localStorage.setItem('colo-recap-notes', JSON.stringify(notes)); }, [notes]);

    // Handlers
    const handleAddTodo = (e) => {
        e.preventDefault();
        if (newTodo.trim()) {
            setTodos([...todos, { id: uuidv4(), text: newTodo, completed: false, date: selectedDate, priority: newPriority, assignee: newAssignee }]);
            setNewTodo('');
            setNewPriority('normal');
            setNewAssignee('');
        }
    };

    const toggleTodo = (id) => setTodos(todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
    const deleteTodo = (id) => setTodos(todos.filter(t => t.id !== id));

    const handleNoteChange = (e) => {
        setNotes({ ...notes, [selectedDate]: e.target.value });
        setNoteSaved(false);
    };

    const handleNoteSave = () => setNoteSaved(true);

    // Calendar
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

    // All-time stats
    const totalTodos = todos.length;
    const totalDone = todos.filter(t => t.completed).length;
    const daysWithData = new Set([...todos.map(t => t.date), ...Object.keys(notes).filter(k => notes[k])]).size;

    const accentColor = '#6366f1';
    const selectedDateLabel = new Date(selectedDate + 'T00:00').toLocaleDateString('fr-FR', {
        weekday: 'long', day: 'numeric', month: 'long'
    });

    const cardStyle = {
        background: 'white', borderRadius: '16px',
        border: '1px solid #e2e8f0', boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        overflow: 'hidden'
    };

    return (
        <div className="recap-container" style={{ padding: '1.5rem', height: '100%', overflowY: 'auto', background: 'linear-gradient(160deg, #f8faff 0%, #f0f4ff 100%)' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

                {/* ─── HEADER ─── */}
                <div className="rc-header" style={{
                    background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                    borderRadius: '20px', padding: '1.5rem 2rem', marginBottom: '1.5rem',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    boxShadow: '0 8px 32px rgba(99,102,241,0.3)', flexWrap: 'wrap', gap: '1rem'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '12px', padding: '0.75rem', display: 'flex', backdropFilter: 'blur(8px)' }}>
                            <ClipboardList size={26} color="white" />
                        </div>
                        <div>
                            <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'white', margin: 0 }}>Récapitulatif & Planning</h1>
                            <p style={{ color: 'rgba(255,255,255,0.75)', margin: 0, fontSize: '0.875rem', marginTop: '2px', textTransform: 'capitalize' }}>
                                📅 {selectedDateLabel}
                            </p>
                        </div>
                    </div>
                    {/* Mini global stats */}
                    <div className="rc-global-stats" style={{ display: 'flex', gap: '1rem' }}>
                        {[
                            { icon: '📋', label: 'Tâches totales', value: totalTodos },
                            { icon: '✅', label: 'Complétées', value: totalDone },
                            { icon: '📆', label: 'Jours actifs', value: daysWithData },
                        ].map(s => (
                            <div key={s.label} style={{
                                background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)',
                                borderRadius: '12px', padding: '0.6rem 1rem', textAlign: 'center',
                                border: '1px solid rgba(255,255,255,0.2)'
                            }}>
                                <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'white', lineHeight: 1 }}>{s.value}</div>
                                <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.75)', marginTop: '2px', whiteSpace: 'nowrap' }}>{s.icon} {s.label}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ─── MAIN GRID ─── */}
                <div className="rc-main-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem', alignItems: 'start' }}>

                    {/* LEFT */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                        {/* Notes */}
                        <div style={cardStyle}>
                            <div style={{ background: '#fafbff', padding: '1rem 1.5rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h2 style={{ fontSize: '1rem', fontWeight: '700', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                                    <MessageSquare size={17} color={accentColor} /> Compte-rendu de réunion
                                </h2>
                                <button
                                    onClick={handleNoteSave}
                                    style={{
                                        background: noteSaved ? '#ecfdf5' : '#f0f4ff', color: noteSaved ? '#059669' : accentColor,
                                        border: 'none', borderRadius: '8px', padding: '0.35rem 0.9rem',
                                        fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', gap: '0.4rem', transition: 'all 0.2s'
                                    }}
                                >
                                    <Save size={14} /> {noteSaved ? 'Enregistré ✓' : 'Enregistrer'}
                                </button>
                            </div>
                            <div style={{ padding: '1.25rem 1.5rem' }}>
                                <textarea
                                    value={currentNote}
                                    onChange={handleNoteChange}
                                    placeholder={`Notes pour ${selectedDateLabel}...\n\nPoints importants, décisions prises, actions à mener...`}
                                    style={{
                                        width: '100%', minHeight: '180px', resize: 'vertical',
                                        lineHeight: '1.7', fontSize: '0.95rem',
                                        border: '1px solid #e2e8f0', borderRadius: '10px',
                                        padding: '1rem', background: '#fafbff', color: '#334155',
                                        fontFamily: 'inherit', outline: 'none', transition: 'border-color 0.2s',
                                        boxSizing: 'border-box'
                                    }}
                                    onFocus={e => e.target.style.borderColor = accentColor}
                                    onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                                />
                            </div>
                        </div>

                        {/* Todos */}
                        <div style={cardStyle}>
                            {/* Header */}
                            <div style={{ background: '#fafbff', padding: '1rem 1.5rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h2 style={{ fontSize: '1rem', fontWeight: '700', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                                    <CheckSquare size={17} color={accentColor} /> Tâches du jour
                                    <span style={{ background: accentColor, color: 'white', borderRadius: '999px', padding: '1px 8px', fontSize: '0.72rem', fontWeight: '700' }}>
                                        {completedCount}/{filteredTodos.length}
                                    </span>
                                </h2>
                                {filteredTodos.length > 0 && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <div style={{ width: '80px', height: '6px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                                            <div style={{ width: `${progress}%`, height: '100%', background: accentColor, borderRadius: '3px', transition: 'width 0.4s ease' }}></div>
                                        </div>
                                        <span style={{ fontSize: '0.8rem', fontWeight: '700', color: accentColor }}>{Math.round(progress)}%</span>
                                    </div>
                                )}
                            </div>

                            {/* Add form */}
                            <div style={{ padding: '0.875rem 1.25rem', background: 'white', borderBottom: '1px solid #f8fafc' }}>
                                <form onSubmit={handleAddTodo}>
                                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                        {/* Priority picker */}
                                        <div style={{ position: 'relative', flexShrink: 0 }}>
                                            <button
                                                type="button"
                                                onClick={() => setShowPriorityPicker(p => !p)}
                                                style={{
                                                    background: PRIORITY_CONFIG[newPriority].bg,
                                                    color: PRIORITY_CONFIG[newPriority].color,
                                                    border: `1px solid ${PRIORITY_CONFIG[newPriority].color}40`,
                                                    borderRadius: '8px', padding: '0.55rem 0.75rem',
                                                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem',
                                                    fontWeight: '600', fontSize: '0.8rem'
                                                }}
                                            >
                                                {PRIORITY_CONFIG[newPriority].icon}
                                                <ChevronDown size={12} />
                                            </button>
                                            {showPriorityPicker && (
                                                <div style={{
                                                    position: 'absolute', bottom: '110%', left: 0, background: 'white',
                                                    border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.35rem',
                                                    boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 10, minWidth: '140px'
                                                }}>
                                                    {Object.entries(PRIORITY_CONFIG).map(([key, cfg]) => (
                                                        <button type="button" key={key}
                                                            onClick={() => { setNewPriority(key); setShowPriorityPicker(false); }}
                                                            style={{
                                                                display: 'flex', alignItems: 'center', gap: '0.5rem',
                                                                width: '100%', padding: '0.5rem 0.75rem', border: 'none',
                                                                borderRadius: '7px', background: newPriority === key ? cfg.bg : 'transparent',
                                                                color: cfg.color, cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem'
                                                            }}>
                                                            {cfg.icon} {cfg.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        <select
                                            value={newAssignee}
                                            onChange={e => setNewAssignee(e.target.value)}
                                            style={{
                                                padding: '0.55rem', borderRadius: '8px', border: '1px solid #e2e8f0',
                                                fontSize: '0.85rem', outline: 'none', background: 'white', color: '#475569', minWidth: '130px'
                                            }}
                                        >
                                            <option value="">À faire par...</option>
                                            {animators.map(a => <option key={a.id} value={a.id}>{a.firstName} {a.lastName}</option>)}
                                        </select>

                                        <input
                                            type="text" className="input-field"
                                            placeholder="Ajouter une tâche..."
                                            value={newTodo}
                                            onChange={e => setNewTodo(e.target.value)}
                                            style={{ flex: 1, minWidth: '150px', padding: '0.55rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.9rem', outline: 'none' }}
                                            onFocus={e => e.target.style.borderColor = accentColor}
                                            onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                                        />
                                        <button type="submit" style={{
                                            background: accentColor, color: 'white', border: 'none',
                                            borderRadius: '8px', padding: '0.55rem 0.9rem', cursor: 'pointer',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            flexShrink: 0
                                        }}>
                                            <Plus size={20} />
                                        </button>
                                    </div>
                                </form>
                            </div>

                            {/* Todo list */}
                            <div style={{ maxHeight: '380px', overflowY: 'auto', padding: '0.625rem' }}>
                                {sortedTodos.length === 0 ? (
                                    <div style={{ padding: '2.5rem', textAlign: 'center', color: '#94a3b8' }}>
                                        <CheckSquare size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.3 }} />
                                        <p style={{ margin: 0, fontSize: '0.9rem' }}>Aucune tâche pour ce jour.</p>
                                        <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', opacity: 0.7 }}>Ajoutez une tâche ci-dessus !</p>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                        {sortedTodos.map(todo => {
                                            const pCfg = PRIORITY_CONFIG[todo.priority || 'normal'];
                                            return (
                                                <div key={todo.id} className="todo-item rc-todo"
                                                    style={{
                                                        display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
                                                        padding: '0.75rem 1rem', borderRadius: '10px',
                                                        background: todo.completed ? '#f8fafc' : 'white',
                                                        border: `1px solid ${todo.completed ? '#f1f5f9' : pCfg.color + '30'}`,
                                                        transition: 'all 0.2s', opacity: todo.completed ? 0.65 : 1
                                                    }}>
                                                    {/* Priority dot */}
                                                    <div style={{ width: '3px', height: '32px', borderRadius: '2px', background: pCfg.color, flexShrink: 0, alignSelf: 'center' }}></div>

                                                    <button onClick={() => toggleTodo(todo.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: todo.completed ? '#6366f1' : '#cbd5e1', padding: 0, marginTop: '1px', flexShrink: 0 }}>
                                                        {todo.completed ? <CheckSquare size={20} /> : <Square size={20} />}
                                                    </button>

                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <span style={{
                                                            fontSize: '0.9rem', color: todo.completed ? '#94a3b8' : '#334155',
                                                            textDecoration: todo.completed ? 'line-through' : 'none', lineHeight: '1.4',
                                                            display: 'block', wordBreak: 'break-word'
                                                        }}>
                                                            {todo.text}
                                                        </span>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '4px', flexWrap: 'wrap' }}>
                                                            <span style={{ fontSize: '0.72rem', color: pCfg.color, fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                                {pCfg.icon} {pCfg.label}
                                                            </span>
                                                            {todo.assignee && (() => {
                                                                const assignedAnim = animators.find(a => a.id === todo.assignee);
                                                                if (!assignedAnim) return null;
                                                                return (
                                                                    <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.25rem', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>
                                                                        👤 {assignedAnim.firstName} {assignedAnim.lastName.charAt(0)}.
                                                                    </span>
                                                                );
                                                            })()}
                                                        </div>
                                                    </div>

                                                    <button onClick={() => deleteTodo(todo.id)} className="delete-btn"
                                                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px', opacity: 0, transition: 'opacity 0.2s', flexShrink: 0 }}>
                                                        <Trash2 size={15} />
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT */}
                    <div className="rc-right-col" style={{ position: 'sticky', top: '1rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                        {/* Calendar */}
                        <div style={{ ...cardStyle, padding: '1.25rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                                <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#1e293b', margin: 0, textTransform: 'capitalize' }}>
                                    {monthName}
                                </h3>
                                <div style={{ display: 'flex', gap: '0.25rem' }}>
                                    <button onClick={() => changeMonth(-1)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '7px', padding: '5px 8px', cursor: 'pointer', display: 'flex' }}>
                                        <ChevronLeft size={16} color="#64748b" />
                                    </button>
                                    <button onClick={() => changeMonth(1)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '7px', padding: '5px 8px', cursor: 'pointer', display: 'flex' }}>
                                        <ChevronRight size={16} color="#64748b" />
                                    </button>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '3px', textAlign: 'center' }}>
                                {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => (
                                    <div key={i} style={{ color: '#94a3b8', fontWeight: '600', fontSize: '0.75rem', paddingBottom: '0.5rem' }}>{d}</div>
                                ))}
                                {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
                                {Array.from({ length: daysInMonth }).map((_, i) => {
                                    const day = i + 1;
                                    const dateStr = isoDate(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                                    const isSel = dateStr === selectedDate;
                                    const isToday = dateStr === todayStr;
                                    const hasData = todos.some(t => t.date === dateStr) || notes[dateStr];
                                    return (
                                        <button key={day} onClick={() => setSelectedDate(dateStr)}
                                            style={{
                                                aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                borderRadius: '50%', border: 'none', position: 'relative',
                                                background: isSel ? accentColor : isToday ? '#eef2ff' : 'transparent',
                                                color: isSel ? 'white' : isToday ? accentColor : '#334155',
                                                fontWeight: (isSel || isToday) ? '700' : '400',
                                                cursor: 'pointer', fontSize: '0.85rem', transition: 'all 0.15s'
                                            }}>
                                            {day}
                                            {hasData && !isSel && (
                                                <div style={{ position: 'absolute', bottom: '3px', width: '4px', height: '4px', borderRadius: '50%', background: accentColor }} />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>

                            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
                                <button onClick={() => { const t = new Date(); setSelectedDate(todayStr); setCurrentMonth(t); }}
                                    style={{
                                        width: '100%', padding: '0.65rem', background: '#eef2ff', color: accentColor,
                                        border: 'none', borderRadius: '9px', fontWeight: '600', cursor: 'pointer', fontSize: '0.875rem'
                                    }}>
                                    Aujourd'hui
                                </button>
                            </div>
                        </div>

                        {/* Progress card */}
                        <div style={{
                            background: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)',
                            borderRadius: '16px', padding: '1.25rem', color: 'white',
                            boxShadow: '0 8px 24px rgba(99,102,241,0.35)'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                <div>
                                    <div style={{ fontSize: '0.8rem', opacity: 0.8, marginBottom: '0.25rem' }}>Progression — aujourd'hui</div>
                                    <div style={{ fontSize: '2.5rem', fontWeight: '800', lineHeight: 1 }}>{Math.round(progress)}%</div>
                                </div>
                                <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '12px', padding: '0.6rem', display: 'flex' }}>
                                    <TrendingUp size={22} />
                                </div>
                            </div>
                            <div style={{ height: '8px', background: 'rgba(255,255,255,0.2)', borderRadius: '4px', overflow: 'hidden', marginBottom: '0.75rem' }}>
                                <div style={{ width: `${progress}%`, height: '100%', background: 'white', borderRadius: '4px', transition: 'width 0.5s ease' }}></div>
                            </div>
                            <div style={{ fontSize: '0.8rem', opacity: 0.85 }}>{completedCount} tâche{completedCount !== 1 && 's'} sur {filteredTodos.length} complétée{completedCount !== 1 && 's'}</div>
                        </div>

                        {/* Priority legend */}
                        <div style={{ ...cardStyle, padding: '1.1rem 1.25rem' }}>
                            <h3 style={{ fontSize: '0.85rem', fontWeight: '700', color: '#64748b', margin: '0 0 0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Priorités</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {Object.entries(PRIORITY_CONFIG).map(([key, cfg]) => {
                                    const count = filteredTodos.filter(t => (t.priority || 'normal') === key).length;
                                    return (
                                        <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: cfg.color, fontSize: '0.875rem', fontWeight: '600' }}>
                                                {cfg.icon} {cfg.label}
                                            </div>
                                            <span style={{ background: cfg.bg, color: cfg.color, borderRadius: '999px', padding: '1px 9px', fontWeight: '700', fontSize: '0.78rem' }}>
                                                {count}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                /* Hover state for todo items */
                .rc-todo:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.07); transform: translateY(-1px); }
                .rc-todo:hover .delete-btn { opacity: 1 !important; }

                /* Mobile responsive */
                @media (max-width: 768px) {
                    .rc-header {
                        padding: 1.25rem !important;
                    }
                    .rc-global-stats {
                        width: 100% !important;
                        justify-content: space-between !important;
                    }
                    .rc-global-stats > div {
                        flex: 1 !important;
                        min-width: 0 !important;
                    }
                    .rc-main-grid {
                        grid-template-columns: 1fr !important;
                    }
                    .rc-right-col {
                        position: static !important;
                    }
                }
                @media (max-width: 480px) {
                    .rc-global-stats {
                        flex-direction: column !important;
                    }
                    .rc-global-stats > div {
                        display: flex !important;
                        align-items: center !important;
                        gap: 0.75rem !important;
                        text-align: left !important;
                    }
                }
            `}</style>
        </div>
    );
}