import React, { useState } from 'react';
import { MessageSquareText, Send, Check } from 'lucide-react';
import { useUi } from '../../ui/UiProvider';

const pad = (n) => String(n).padStart(2, '0');
const isoOffset = (days) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const PRIO = [
    { id: 'info',      label: 'Info',      color: 'var(--primary-color)' },
    { id: 'important', label: 'Important', color: 'oklch(58% 0.15 75)' },
    { id: 'urgent',    label: 'Urgent',    color: 'var(--danger-color)' },
];

// Compose a transmission/consigne shown on the dashboard on its target day.
export default function TransmissionComposer({ children = [], transmissions = [], setTransmissions, activeUser, canEdit, isMobile }) {
    const ui = useUi();
    const [open, setOpen] = useState(false);
    const [text, setText] = useState('');
    const [priority, setPriority] = useState('info');
    const [childId, setChildId] = useState('');
    const [targetDate, setTargetDate] = useState(isoOffset(1)); // default: tomorrow

    const pending = (transmissions || []).filter(t => !t.done).length;

    const submit = () => {
        if (!text.trim()) { ui.toast('Écrivez une consigne.', { type: 'error' }); return; }
        const child = children.find(c => c.id === childId);
        const entry = {
            id: (crypto?.randomUUID?.() || `tr_${Date.now()}`),
            text: text.trim(),
            priority,
            targetDate,
            childName: child ? `${child.firstName} ${child.lastName.toUpperCase()}` : '',
            author: activeUser ? `${activeUser.firstName || ''} ${activeUser.lastName || ''}`.trim() : '',
            createdAt: new Date().toISOString(),
            done: false,
        };
        setTransmissions([entry, ...(transmissions || [])]);
        setText(''); setPriority('info'); setChildId(''); setTargetDate(isoOffset(1));
        setOpen(false);
        ui.toast('Consigne transmise.', { type: 'success' });
    };

    if (!canEdit) return null;

    return (
        <div className="card-glass" style={{ borderRadius: '20px', border: '1.5px solid var(--glass-border)', background: 'white', overflow: 'hidden' }}>
            <button onClick={() => setOpen(o => !o)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem 1.25rem', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                <div style={{ background: 'var(--primary-light)', color: 'var(--primary-color)', borderRadius: '10px', padding: '0.5rem', display: 'flex' }}>
                    <MessageSquareText size={18} strokeWidth={2.5} />
                </div>
                <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '900', fontSize: '0.92rem', color: 'var(--text-main)' }}>Laisser une consigne / relève</div>
                    <div style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--text-muted)' }}>Apparaît sur le Tableau de bord au jour choisi{pending > 0 ? ` · ${pending} en cours` : ''}</div>
                </div>
                <span style={{ fontSize: '0.78rem', fontWeight: '900', color: 'var(--primary-color)' }}>{open ? 'Fermer' : 'Écrire'}</span>
            </button>

            {open && (
                <div className="animate-fade-in" style={{ padding: '0 1.25rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                    <textarea
                        value={text} onChange={e => setText(e.target.value)} autoFocus
                        placeholder="Ex: Surveiller la fièvre de Léa cette nuit, redonner Doliprane si > 38.5°C…"
                        className="glass-input" style={{ minHeight: '70px', padding: '0.75rem', resize: 'vertical', borderRadius: '12px', fontWeight: '600' }}
                    />
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '0.75rem' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: '950', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>Vacancier concerné (optionnel)</label>
                            <select value={childId} onChange={e => setChildId(e.target.value)} className="glass-input" style={{ height: '42px', fontWeight: '700' }}>
                                <option value="">— Aucun / général —</option>
                                {children.map(c => <option key={c.id} value={c.id}>{c.firstName} {c.lastName.toUpperCase()}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: '950', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>Pour le</label>
                            <input type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)} className="glass-input" style={{ height: '42px', fontWeight: '700' }} />
                        </div>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                            {PRIO.map(p => (
                                <button key={p.id} onClick={() => setPriority(p.id)} style={{
                                    display: 'flex', alignItems: 'center', gap: '4px', padding: '0.45rem 0.85rem', borderRadius: '10px', cursor: 'pointer',
                                    border: '1.5px solid', borderColor: priority === p.id ? p.color : 'var(--glass-border)',
                                    background: priority === p.id ? p.color : 'white', color: priority === p.id ? 'white' : 'var(--text-muted)',
                                    fontWeight: '900', fontSize: '0.75rem'
                                }}>
                                    {priority === p.id && <Check size={12} strokeWidth={3} />} {p.label}
                                </button>
                            ))}
                        </div>
                        <button onClick={submit} className="btn btn-primary" style={{ height: '42px', padding: '0 1.25rem', borderRadius: '12px', fontWeight: '950', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Send size={15} /> Transmettre
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
