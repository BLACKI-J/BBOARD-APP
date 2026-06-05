import React, { useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';

const pad = (n) => String(n).padStart(2, '0');
const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fromISO = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const MONTHS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

// Retractable date picker for the meds dashboard. Lets you jump to any past day
// to review/print its record; future days are disabled.
export default function MedsCalendar({ selectedDate, onSelect, datesWithRecords = new Set(), isMobile }) {
    const todayISO = toISO(new Date());
    const [open, setOpen] = useState(false);
    const [viewMonth, setViewMonth] = useState(() => fromISO(selectedDate || todayISO));

    const selDate = fromISO(selectedDate || todayISO);
    const isToday = selectedDate === todayISO;

    const shiftDay = (delta) => {
        const d = fromISO(selectedDate);
        d.setDate(d.getDate() + delta);
        const iso = toISO(d);
        if (iso > todayISO) return; // no future
        onSelect(iso);
        setViewMonth(fromISO(iso));
    };

    const shiftMonth = (delta) => {
        setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + delta, 1));
    };

    const y = viewMonth.getFullYear();
    const m = viewMonth.getMonth();
    const startWeekday = (new Date(y, m, 1).getDay() + 6) % 7; // Monday-first
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const cells = [...Array(startWeekday).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

    const longLabel = selDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    return (
        <div style={{ background: 'white', border: '1.5px solid var(--glass-border)', borderRadius: '20px', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
            {/* Bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 0.75rem' }}>
                <button onClick={() => shiftDay(-1)} title="Jour précédent"
                    style={{ width: '38px', height: '38px', borderRadius: '12px', border: '1.5px solid var(--glass-border)', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)', flexShrink: 0 }}>
                    <ChevronLeft size={18} />
                </button>

                <button onClick={() => setOpen(o => !o)}
                    style={{ flex: 1, height: '38px', borderRadius: '12px', border: '1.5px solid', borderColor: open ? 'var(--primary-color)' : 'var(--glass-border)', background: open ? 'var(--primary-light)' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer', color: 'var(--text-main)', fontWeight: '900', fontSize: isMobile ? '0.8rem' : '0.9rem', textTransform: 'capitalize', minWidth: 0 }}>
                    <Calendar size={16} style={{ color: 'var(--primary-color)', flexShrink: 0 }} />
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{longLabel}</span>
                    <ChevronDown size={15} style={{ transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none', flexShrink: 0, opacity: 0.5 }} />
                </button>

                <button onClick={() => shiftDay(1)} disabled={isToday} title="Jour suivant"
                    style={{ width: '38px', height: '38px', borderRadius: '12px', border: '1.5px solid var(--glass-border)', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: isToday ? 'not-allowed' : 'pointer', color: 'var(--text-muted)', opacity: isToday ? 0.4 : 1, flexShrink: 0 }}>
                    <ChevronRight size={18} />
                </button>

                {!isToday && (
                    <button onClick={() => { onSelect(todayISO); setViewMonth(fromISO(todayISO)); }}
                        style={{ height: '38px', padding: '0 0.9rem', borderRadius: '12px', border: 'none', background: 'var(--primary-gradient)', color: 'white', fontWeight: '900', fontSize: '0.78rem', cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap' }}>
                        Aujourd'hui
                    </button>
                )}
            </div>

            {/* Month grid */}
            {open && (
                <div className="animate-fade-in" style={{ borderTop: '1px solid var(--glass-border)', padding: '0.75rem 1rem 1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                        <button onClick={() => shiftMonth(-1)} style={{ width: '32px', height: '32px', borderRadius: '10px', border: '1.5px solid var(--glass-border)', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                            <ChevronLeft size={16} />
                        </button>
                        <div style={{ fontWeight: '950', fontSize: '0.95rem', color: 'var(--text-main)' }}>{MONTHS[m]} {y}</div>
                        <button onClick={() => shiftMonth(1)} style={{ width: '32px', height: '32px', borderRadius: '10px', border: '1.5px solid var(--glass-border)', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                            <ChevronRight size={16} />
                        </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '3px', marginBottom: '4px' }}>
                        {WEEKDAYS.map((d, i) => (
                            <div key={i} style={{ textAlign: 'center', fontSize: '0.65rem', fontWeight: '950', color: 'var(--text-muted)', textTransform: 'uppercase', padding: '4px 0' }}>{d}</div>
                        ))}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '3px' }}>
                        {cells.map((day, i) => {
                            if (day === null) return <div key={`e${i}`} />;
                            const iso = `${y}-${pad(m + 1)}-${pad(day)}`;
                            const isFuture = iso > todayISO;
                            const isSel = iso === selectedDate;
                            const isTod = iso === todayISO;
                            const hasRec = datesWithRecords.has(iso);
                            return (
                                <button key={iso} disabled={isFuture}
                                    onClick={() => { onSelect(iso); setOpen(false); }}
                                    style={{
                                        position: 'relative', aspectRatio: '1', borderRadius: '10px', cursor: isFuture ? 'not-allowed' : 'pointer',
                                        border: isTod && !isSel ? '1.5px solid var(--primary-color)' : '1.5px solid transparent',
                                        background: isSel ? 'var(--primary-gradient)' : 'transparent',
                                        color: isSel ? 'white' : isFuture ? 'var(--text-softer)' : 'var(--text-main)',
                                        fontWeight: isSel || isTod ? '950' : '700', fontSize: '0.82rem',
                                        opacity: isFuture ? 0.35 : 1, transition: 'all 0.15s',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}>
                                    {day}
                                    {hasRec && !isSel && (
                                        <span style={{ position: 'absolute', bottom: '4px', left: '50%', transform: 'translateX(-50%)', width: '4px', height: '4px', borderRadius: '50%', background: 'var(--success-color)' }} />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
