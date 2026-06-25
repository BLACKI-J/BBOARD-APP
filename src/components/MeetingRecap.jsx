import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
    CalendarIcon, CheckCircle2, Circle, Plus, Trash2, FileText,
    ChevronLeft, ChevronRight, ChevronDown, Star, Zap, Check
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import SectionHeader from './common/SectionHeader';

const PRIORITY_CONFIG = {
    normal:    { label: 'Normal',    color: 'var(--accent-color)', icon: <Circle size={13} /> },
    important: { label: 'Important', color: 'var(--warning-color)',                icon: <Star size={13} /> },
    urgent:    { label: 'Urgent',    color: 'var(--danger-color)',                icon: <Zap size={13} /> },
};

const pad = (n) => String(n).padStart(2, '0');
const isoDate = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`;
const todayISO = () => { const d = new Date(); return isoDate(d.getFullYear(), d.getMonth(), d.getDate()); };
const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

export default function MeetingRecap({ canEdit = true, meetingRecaps = [], setMeetingRecaps, isMobile }) {
    const [selectedDate, setSelectedDate] = useState(todayISO);
    const [calOpen, setCalOpen] = useState(false);
    const [viewMonth, setViewMonth] = useState(new Date());
    const [newTodo, setNewTodo] = useState('');
    const [newPriority, setNewPriority] = useState('normal');

    const todos = useMemo(() => meetingRecaps.filter(p => p.type === 'todo'), [meetingRecaps]);
    const notes = useMemo(() => {
        const map = {};
        meetingRecaps.filter(p => p.type === 'note').forEach(n => { map[n.date] = n.content; });
        return map;
    }, [meetingRecaps]);

    const todayStr = todayISO();

    // ── Todo actions ──
    // Updaters fonctionnels : résolus contre l'état FRAIS du store (mutateCollection),
    // pas la prop du render — deux actions rapprochées ne s'écrasent plus.
    const addTodo = (e) => {
        e.preventDefault();
        if (!canEdit || !newTodo.trim()) return;
        setMeetingRecaps(prev => [...prev, { id: uuidv4(), type: 'todo', text: newTodo.trim(), completed: false, date: selectedDate, priority: newPriority }]);
        setNewTodo(''); setNewPriority('normal');
    };
    const toggleTodo = (id) => { if (canEdit) setMeetingRecaps(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t)); };
    const deleteTodo = (id) => { if (canEdit) setMeetingRecaps(prev => prev.filter(t => t.id !== id)); };

    // ── Note: local draft + debounced save (avoids a POST on every keystroke) ──
    const [noteDraft, setNoteDraft] = useState('');
    const [noteSaved, setNoteSaved] = useState(true);
    const saveTimer = useRef(null);
    const pendingSave = useRef(null); // { content, date } d'une note pas encore commitée

    // Reset draft when the selected day changes (flush any pending save first)
    useEffect(() => {
        setNoteDraft(notes[selectedDate] || '');
        setNoteSaved(true);
        return () => {
            clearTimeout(saveTimer.current);
            // Flush : si une note attend (debounce pas encore déclenché), on la commit
            // avant de changer de jour / démonter, pour ne pas perdre les dernières frappes.
            const pending = pendingSave.current;
            pendingSave.current = null;
            if (pending && pending.content !== (notes[pending.date] || '')) {
                commitNote(pending.content, pending.date);
            }
        };
    }, [selectedDate]); // eslint-disable-line react-hooks/exhaustive-deps

    // Resync draft when notes arrive late (load/socket) — skipped mid-edit (noteSaved=false)
    useEffect(() => {
        if (noteSaved) setNoteDraft(notes[selectedDate] || '');
    }, [notes, selectedDate, noteSaved]);

    const commitNote = (content, date) => {
        const noteId = `note_${date}`;
        setMeetingRecaps(prev => {
            const existing = prev.find(p => p.id === noteId);
            return existing
                ? prev.map(p => p.id === noteId ? { ...p, content } : p)
                : [...prev, { id: noteId, type: 'note', date, content }];
        });
        setNoteSaved(true);
    };

    const handleNoteChange = (e) => {
        if (!canEdit) return;
        const content = e.target.value;
        const date = selectedDate;
        setNoteDraft(content);
        setNoteSaved(false);
        pendingSave.current = { content, date };
        clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(() => { commitNote(content, date); pendingSave.current = null; }, 700);
    };

    // ── Day navigation ──
    const shiftDay = (delta) => {
        const d = new Date(selectedDate + 'T00:00');
        d.setDate(d.getDate() + delta);
        setSelectedDate(isoDate(d.getFullYear(), d.getMonth(), d.getDate()));
    };
    const shiftMonth = (delta) => { const d = new Date(viewMonth); d.setMonth(d.getMonth() + delta); setViewMonth(d); };

    const y = viewMonth.getFullYear(), m = viewMonth.getMonth();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const firstDay = (new Date(y, m, 1).getDay() + 6) % 7;
    const monthName = viewMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

    const filteredTodos = todos.filter(t => t.date === selectedDate);
    const sortedTodos = [...filteredTodos].sort((a, b) => {
        const order = { urgent: 0, important: 1, normal: 2 };
        return (a.completed ? 10 : 0) - (b.completed ? 10 : 0) || (order[a.priority] ?? 2) - (order[b.priority] ?? 2);
    });
    const completedCount = filteredTodos.filter(t => t.completed).length;
    const isToday = selectedDate === todayStr;
    const dateLabel = new Date(selectedDate + 'T00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

    return (
        <div style={{ height: '100%', overflowY: 'auto', background: 'transparent' }} className="no-scrollbar">
            <div style={{ maxWidth: '760px', margin: '0 auto', minHeight: '100%', display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: isMobile ? '1rem' : '1.5rem' }}>

                {!isMobile && <SectionHeader icon={FileText} title="Coordination" />}

                {/* ── Day bar ── */}
                <div style={{ background: 'var(--surface-color)', border: '1.5px solid var(--glass-border)', borderRadius: '18px', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 0.75rem' }}>
                        <button onClick={() => shiftDay(-1)} className="btn-icon-ref" style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--bg-secondary)', flexShrink: 0 }}><ChevronLeft size={18} /></button>
                        <button onClick={() => setCalOpen(o => !o)} style={{ flex: 1, height: '40px', borderRadius: '12px', border: '1.5px solid', borderColor: calOpen ? 'var(--primary-color)' : 'var(--glass-border)', background: calOpen ? 'var(--primary-light)' : 'var(--surface-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer', color: 'var(--text-main)', fontWeight: '900', fontSize: isMobile ? '0.82rem' : '0.95rem', textTransform: 'capitalize', minWidth: 0 }}>
                            <CalendarIcon size={16} style={{ color: 'var(--primary-color)', flexShrink: 0 }} />
                            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{dateLabel}</span>
                            <ChevronDown size={15} style={{ flexShrink: 0, opacity: 0.5, transition: 'transform 0.2s', transform: calOpen ? 'rotate(180deg)' : 'none' }} />
                        </button>
                        <button onClick={() => shiftDay(1)} className="btn-icon-ref" style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--bg-secondary)', flexShrink: 0 }}><ChevronRight size={18} /></button>
                        {!isToday && <button onClick={() => { setSelectedDate(todayStr); setViewMonth(new Date()); }} style={{ height: '40px', padding: '0 0.9rem', borderRadius: '12px', border: 'none', background: 'var(--primary-gradient)', color: 'white', fontWeight: '900', fontSize: '0.78rem', cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap' }}>Auj.</button>}
                    </div>

                    {calOpen && (
                        <div className="animate-fade-in" style={{ borderTop: '1px solid var(--glass-border)', padding: '0.75rem 1rem 1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                <button onClick={() => shiftMonth(-1)} aria-label="Mois précédent" className="btn-icon-ref" style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'var(--bg-secondary)' }}><ChevronLeft size={16} /></button>
                                <div style={{ fontWeight: '900', fontSize: '0.9rem', textTransform: 'capitalize' }}>{monthName}</div>
                                <button onClick={() => shiftMonth(1)} aria-label="Mois suivant" className="btn-icon-ref" style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'var(--bg-secondary)' }}><ChevronRight size={16} /></button>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '3px', textAlign: 'center', marginBottom: '4px' }}>
                                {WEEKDAYS.map((d, i) => <div key={i} style={{ fontSize: '0.62rem', fontWeight: '950', color: 'var(--text-muted)', padding: '4px 0' }}>{d}</div>)}
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '3px' }}>
                                {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
                                {Array.from({ length: daysInMonth }).map((_, i) => {
                                    const day = i + 1;
                                    const ds = isoDate(y, m, day);
                                    const isSel = ds === selectedDate;
                                    const isTod = ds === todayStr;
                                    const hasData = todos.some(t => t.date === ds) || notes[ds];
                                    return (
                                        <button key={day} onClick={() => { setSelectedDate(ds); setCalOpen(false); }}
                                            style={{ position: 'relative', aspectRatio: '1', borderRadius: '10px', border: isTod && !isSel ? '1.5px solid var(--primary-color)' : '1.5px solid transparent', background: isSel ? 'var(--primary-gradient)' : 'transparent', color: isSel ? 'white' : 'var(--text-main)', fontWeight: isSel || isTod ? '950' : '700', fontSize: '0.8rem', cursor: 'pointer' }}>
                                            {day}
                                            {hasData && !isSel && <span style={{ position: 'absolute', bottom: '4px', left: '50%', transform: 'translateX(-50%)', width: '4px', height: '4px', borderRadius: '50%', background: 'var(--primary-color)' }} />}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Compte-rendu (grows to fill available height) ── */}
                <section style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: isMobile ? '240px' : '300px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.05rem', fontWeight: '800', margin: 0, color: 'var(--text-main)' }}>
                            <FileText size={18} style={{ color: 'var(--primary-color)' }} /> Compte-rendu
                        </h2>
                        {canEdit && noteDraft.trim() && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', fontWeight: '800', color: noteSaved ? 'var(--success-color)' : 'var(--text-muted)' }}>
                                {noteSaved ? <><Check size={13} strokeWidth={2} /> Enregistré</> : 'Enregistrement…'}
                            </span>
                        )}
                    </div>
                    <div style={{ flex: 1, display: 'flex', background: 'var(--surface-color)', border: '1.5px solid var(--glass-border)', borderRadius: '18px', padding: isMobile ? '1rem' : '1.25rem 1.5rem', boxShadow: 'var(--shadow-sm)' }}>
                        <textarea
                            value={noteDraft}
                            onChange={handleNoteChange}
                            disabled={!canEdit}
                            placeholder="Déroulement de la journée, points à retenir, incidents…"
                            style={{ width: '100%', flex: 1, border: 'none', background: 'transparent', resize: 'none', outline: 'none', fontSize: '0.95rem', lineHeight: '1.6', color: 'var(--text-main)', fontWeight: '600', fontFamily: 'inherit' }}
                        />
                    </div>
                </section>

                {/* ── Tâches ── */}
                <section>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.05rem', fontWeight: '800', margin: 0, color: 'var(--text-main)' }}>
                            <CheckCircle2 size={18} style={{ color: 'var(--primary-color)' }} /> Tâches
                        </h2>
                        {filteredTodos.length > 0 && (
                            <span style={{ fontSize: '0.72rem', fontWeight: '900', color: 'var(--primary-color)', background: 'var(--primary-light)', padding: '4px 12px', borderRadius: '100px' }}>
                                {completedCount}/{filteredTodos.length}
                            </span>
                        )}
                    </div>

                    {canEdit && (
                        <form onSubmit={addTodo} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                            <select value={newPriority} onChange={e => setNewPriority(e.target.value)}
                                style={{ background: 'var(--surface-color)', border: '1.5px solid var(--glass-border)', fontWeight: '900', color: PRIORITY_CONFIG[newPriority].color, outline: 'none', cursor: 'pointer', padding: '0 0.625rem', borderRadius: '12px', fontSize: '0.7rem', textTransform: 'uppercase', flexShrink: 0, minHeight: '46px' }}>
                                {Object.entries(PRIORITY_CONFIG).map(([k, c]) => <option key={k} value={k}>{c.label}</option>)}
                            </select>
                            <input type="text" placeholder="Nouvelle tâche…" value={newTodo} onChange={e => setNewTodo(e.target.value)}
                                className="glass-input" style={{ flex: 1, height: '46px', borderRadius: '12px', paddingLeft: '0.875rem', fontWeight: '700', minWidth: 0 }} />
                            <button type="submit" className="btn btn-primary" style={{ width: '46px', height: '46px', padding: 0, borderRadius: '12px', flexShrink: 0 }}><Plus size={22} strokeWidth={2} /></button>
                        </form>
                    )}

                    {sortedTodos.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)', background: 'var(--surface-color)', borderRadius: '18px', border: '1.5px dashed var(--glass-border)' }}>
                            <CheckCircle2 size={28} strokeWidth={1.5} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                            <p style={{ fontWeight: '800', fontSize: '0.88rem', margin: 0 }}>Aucune tâche pour ce jour.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {sortedTodos.map(todo => {
                                const prio = PRIORITY_CONFIG[todo.priority || 'normal'];
                                return (
                                    <div key={todo.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', background: 'var(--surface-color)', border: '1.5px solid var(--glass-border)', borderRadius: '14px', opacity: todo.completed ? 0.55 : 1 }}>
                                        <button onClick={() => toggleTodo(todo.id)} aria-label="Marquer comme fait(e)" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: todo.completed ? 'var(--success-color)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, width: '44px', height: '44px', padding: 0, margin: '-0.5rem 0 -0.5rem -10px' }}>
                                            {todo.completed ? <CheckCircle2 size={24} strokeWidth={2} /> : <Circle size={24} strokeWidth={2} />}
                                        </button>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontSize: '0.92rem', fontWeight: '800', color: 'var(--text-main)', textDecoration: todo.completed ? 'line-through' : 'none' }}>{todo.text}</div>
                                            {todo.priority !== 'normal' && (
                                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.65rem', fontWeight: '950', color: prio.color, textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: '3px' }}>
                                                    {prio.icon} {prio.label}
                                                </div>
                                            )}
                                        </div>
                                        {canEdit && (
                                            <button onClick={() => deleteTodo(todo.id)} aria-label="Supprimer la tâche" className="btn-icon-ref danger" style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'var(--bg-secondary)', flexShrink: 0 }}><Trash2 size={16} strokeWidth={2} /></button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>
            </div>

            <style>{`
                .btn-icon-ref { border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; color: var(--text-muted); transition: all 0.2s; }
                .btn-icon-ref:hover { color: var(--primary-color); }
                .btn-icon-ref.danger:hover { color: var(--danger-color); background: color-mix(in oklch, var(--danger-color) 10%, transparent); }
            `}</style>
        </div>
    );
}
