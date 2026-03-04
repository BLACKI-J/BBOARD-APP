import React, { useState, useEffect } from 'react';
import { 
    Calendar as CalendarIcon, 
    CheckSquare, 
    Square, 
    Plus, 
    Trash2, 
    MessageSquare, 
    StickyNote, 
    ClipboardList, 
    ChevronLeft, 
    ChevronRight, 
    Save 
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export default function MeetingRecap() {
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    
    // --- State Management ---
    const [todos, setTodos] = useState(() => {
        const saved = localStorage.getItem('colo-recap-todos');
        return saved ? JSON.parse(saved) : [];
    });
    const [newTodo, setNewTodo] = useState('');

    const [notes, setNotes] = useState(() => {
        const saved = localStorage.getItem('colo-recap-notes');
        return saved ? JSON.parse(saved) : {};
    });

    // --- Persistence ---
    useEffect(() => {
        localStorage.setItem('colo-recap-todos', JSON.stringify(todos));
    }, [todos]);

    useEffect(() => {
        localStorage.setItem('colo-recap-notes', JSON.stringify(notes));
    }, [notes]);

    // --- Handlers ---
    const handleAddTodo = (e) => {
        e.preventDefault();
        if (newTodo.trim()) {
            setTodos([...todos, { 
                id: uuidv4(), 
                text: newTodo, 
                completed: false, 
                date: selectedDate 
            }]);
            setNewTodo('');
        }
    };

    const toggleTodo = (id) => {
        setTodos(todos.map(todo => 
            todo.id === id ? { ...todo, completed: !todo.completed } : todo
        ));
    };

    const deleteTodo = (id) => {
        setTodos(todos.filter(todo => todo.id !== id));
    };

    const handleNoteChange = (e) => {
        setNotes({
            ...notes,
            [selectedDate]: e.target.value
        });
    };

    // --- Calendar Logic ---
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const days = new Date(year, month + 1, 0).getDate();
        const firstDay = new Date(year, month, 1).getDay(); // 0 = Sunday
        // Adjust for Monday start (French week)
        const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1; 
        return { days, firstDay: adjustedFirstDay };
    };

    const changeMonth = (offset) => {
        const newDate = new Date(currentMonth);
        newDate.setMonth(newDate.getMonth() + offset);
        setCurrentMonth(newDate);
    };

    const isSameDay = (d1, d2) => {
        return d1.toISOString().split('T')[0] === d2;
    };

    const { days: daysInMonth, firstDay } = getDaysInMonth(currentMonth);
    const monthName = currentMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

    // --- Computed Values ---
    const filteredTodos = todos.filter(todo => todo.date === selectedDate);
    const completedCount = filteredTodos.filter(t => t.completed).length;
    const progress = filteredTodos.length > 0 ? (completedCount / filteredTodos.length) * 100 : 0;
    const currentNote = notes[selectedDate] || '';

    // Primary Blue Color
    const primaryColor = '#3b82f6'; // Tailwind blue-500
    const primaryLight = '#eff6ff'; // Tailwind blue-50
    const primaryBorder = '#bfdbfe'; // Tailwind blue-200

    return (
        <div className="recap-container" style={{ padding: '2rem', height: '100%', overflowY: 'auto', background: '#f8fafc' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                
                {/* Header */}
                <header style={{ marginBottom: '2rem' }}>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                        <div style={{ background: `linear-gradient(135deg, ${primaryColor} 0%, #2563eb 100%)`, padding: '0.6rem', borderRadius: '12px', color: 'white', display: 'flex', boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.3)' }}>
                            <ClipboardList size={24} />
                        </div>
                        Récapitulatif & Planning
                    </h1>
                    <p style={{ color: '#64748b', fontSize: '1rem', marginLeft: '3.5rem' }}>
                        Gestion des réunions et des tâches par jour.
                    </p>
                </header>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem', alignItems: 'start' }}>
                    
                    {/* Left Column: Notes & Todos */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        
                        {/* 1. Meeting Notes */}
                        <div className="card animate-fade-in" style={{ padding: '0', overflow: 'hidden', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', borderRadius: '12px', background: 'white' }}>
                            <div style={{ background: '#f1f5f9', padding: '1rem 1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h2 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#334155', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <MessageSquare size={18} style={{ color: primaryColor }}/>
                                    Compte-rendu de réunion - {new Date(selectedDate).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                                </h2>
                                <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                    <Save size={12} /> Enregistré
                                </span>
                            </div>
                            
                            <div style={{ padding: '1.5rem' }}>
                                <textarea
                                    value={currentNote}
                                    onChange={handleNoteChange}
                                    placeholder="Notes de la réunion, points importants, décisions..."
                                    style={{ 
                                        width: '100%',
                                        minHeight: '200px', 
                                        resize: 'vertical', 
                                        lineHeight: '1.6',
                                        fontSize: '1rem',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '8px',
                                        padding: '1rem',
                                        background: '#fff',
                                        color: '#334155',
                                        fontFamily: 'inherit',
                                        outlineColor: primaryColor
                                    }}
                                />
                            </div>
                        </div>

                        {/* 2. Todos List */}
                        <div className="card animate-fade-in" style={{ padding: '0', overflow: 'hidden', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', borderRadius: '12px', background: 'white' }}>
                            <div style={{ background: '#f1f5f9', padding: '1rem 1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h2 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#334155', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <CheckSquare size={18} style={{ color: primaryColor }}/>
                                    À faire
                                </h2>
                                <span style={{ fontSize: '0.85rem', fontWeight: '600', color: primaryColor, background: primaryLight, padding: '0.25rem 0.75rem', borderRadius: '20px' }}>
                                    {completedCount}/{filteredTodos.length}
                                </span>
                            </div>

                            {/* Add Form */}
                            <div style={{ padding: '1rem', background: '#fff', borderBottom: '1px solid #f1f5f9' }}>
                                <form onSubmit={handleAddTodo} style={{ display: 'flex', gap: '0.5rem' }}>
                                    <input 
                                        type="text" 
                                        className="input-field" 
                                        placeholder="Nouvelle tâche..." 
                                        value={newTodo}
                                        onChange={(e) => setNewTodo(e.target.value)}
                                        style={{ 
                                            flex: 1, padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0', outlineColor: primaryColor 
                                        }}
                                    />
                                    <button type="submit" className="btn" style={{ background: primaryColor, color: 'white', padding: '0.6rem', borderRadius: '8px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Plus size={20} />
                                    </button>
                                </form>
                            </div>

                            {/* List */}
                            <div style={{ maxHeight: '400px', overflowY: 'auto', padding: '0.5rem' }}>
                                {filteredTodos.length === 0 ? (
                                    <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                                        <p>Aucune tâche pour ce jour.</p>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        {filteredTodos.map(todo => (
                                            <div 
                                                key={todo.id} 
                                                className="todo-item"
                                                style={{ 
                                                    display: 'flex', alignItems: 'flex-start', gap: '0.75rem', 
                                                    padding: '0.75rem', borderRadius: '8px', 
                                                    background: 'white',
                                                    border: '1px solid #f1f5f9',
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                <button 
                                                    onClick={() => toggleTodo(todo.id)} 
                                                    style={{ 
                                                        background: 'none', border: 'none', cursor: 'pointer', 
                                                        color: todo.completed ? primaryColor : '#cbd5e1',
                                                        padding: 0, marginTop: '2px'
                                                    }}
                                                >
                                                    {todo.completed ? <CheckSquare size={20} /> : <Square size={20} />}
                                                </button>
                                                
                                                <span style={{ 
                                                    flex: 1, 
                                                    fontSize: '0.95rem',
                                                    color: todo.completed ? '#94a3b8' : '#334155',
                                                    textDecoration: todo.completed ? 'line-through' : 'none',
                                                    lineHeight: '1.4'
                                                }}>
                                                    {todo.text}
                                                </span>
                                                
                                                <button 
                                                    onClick={() => deleteTodo(todo.id)}
                                                    className="delete-btn"
                                                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px', opacity: 0.4 }}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>

                    {/* Right Column: Calendar Widget */}
                    <div style={{ position: 'sticky', top: '2rem' }}>
                        <div className="card" style={{ padding: '1.5rem', background: 'white', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
                            
                            {/* Calendar Header */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#1e293b', textTransform: 'capitalize' }}>
                                    {monthName}
                                </h3>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button onClick={() => changeMonth(-1)} className="btn-icon" style={{ padding: '4px', borderRadius: '6px', border: '1px solid #e2e8f0' }}><ChevronLeft size={16} /></button>
                                    <button onClick={() => changeMonth(1)} className="btn-icon" style={{ padding: '4px', borderRadius: '6px', border: '1px solid #e2e8f0' }}><ChevronRight size={16} /></button>
                                </div>
                            </div>

                            {/* Calendar Grid */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem', textAlign: 'center', fontSize: '0.85rem' }}>
                                {/* Weekdays */}
                                {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => (
                                    <div key={i} style={{ color: '#94a3b8', fontWeight: '600', paddingBottom: '0.5rem' }}>{d}</div>
                                ))}

                                {/* Empty cells */}
                                {Array.from({ length: firstDay }).map((_, i) => (
                                    <div key={`empty-${i}`}></div>
                                ))}

                                {/* Days */}
                                {Array.from({ length: daysInMonth }).map((_, i) => {
                                    const day = i + 1;
                                    const dateStr = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day).toISOString().split('T')[0]; // Handle timezone carefully in real app, simplified here
                                    // Better date string construction to avoid timezone issues:
                                    const d = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                                    const isoDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                                    
                                    const isSelected = isoDate === selectedDate;
                                    const isToday = isoDate === new Date().toISOString().split('T')[0];
                                    const hasData = todos.some(t => t.date === isoDate) || notes[isoDate];

                                    return (
                                        <button
                                            key={day}
                                            onClick={() => setSelectedDate(isoDate)}
                                            style={{
                                                aspectRatio: '1',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                borderRadius: '50%',
                                                border: 'none',
                                                background: isSelected ? primaryColor : (isToday ? primaryLight : 'transparent'),
                                                color: isSelected ? 'white' : (isToday ? primaryColor : '#334155'),
                                                fontWeight: (isSelected || isToday) ? 'bold' : 'normal',
                                                cursor: 'pointer',
                                                position: 'relative',
                                                fontSize: '0.9rem',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            {day}
                                            {hasData && !isSelected && (
                                                <div style={{ position: 'absolute', bottom: '4px', width: '4px', height: '4px', borderRadius: '50%', background: primaryColor }}></div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>

                            <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
                                <button 
                                    onClick={() => {
                                        const today = new Date();
                                        setSelectedDate(today.toISOString().split('T')[0]);
                                        setCurrentMonth(today);
                                    }}
                                    style={{ width: '100%', padding: '0.75rem', background: primaryLight, color: primaryColor, border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}
                                >
                                    Revenir à aujourd'hui
                                </button>
                            </div>
                        </div>

                        {/* Summary Widget */}
                        <div className="card" style={{ marginTop: '1.5rem', padding: '1.5rem', background: `linear-gradient(135deg, ${primaryColor} 0%, #1d4ed8 100%)`, borderRadius: '16px', color: 'white', boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.4)' }}>
                            <div style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '0.25rem' }}>Progression du jour</div>
                            <div style={{ fontSize: '2.5rem', fontWeight: '800', lineHeight: '1' }}>
                                {Math.round(progress)}%
                            </div>
                            <div style={{ marginTop: '1rem', height: '6px', background: 'rgba(255,255,255,0.2)', borderRadius: '3px', overflow: 'hidden' }}>
                                <div style={{ width: `${progress}%`, height: '100%', background: 'white', borderRadius: '3px', transition: 'width 0.5s ease' }}></div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
            <style>{`
                .todo-item:hover {
                    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                    transform: translateY(-1px);
                    border-color: ${primaryBorder} !important;
                }
                .todo-item:hover .delete-btn {
                    opacity: 1 !important;
                }
            `}</style>
        </div>
    );
}