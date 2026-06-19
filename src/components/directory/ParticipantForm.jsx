import React, { useState, useEffect, useRef } from 'react';
import { Sunrise, Sun, Apple, Moon, Plus, Trash2, Edit2, ShieldAlert, Coins, User, Users, Shield, MapPin, Phone, Mail, GraduationCap, Check, Lock, X } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { useUi } from '../../ui/UiProvider';
import { useUnsavedGuard } from '../../utils/unsavedGuard';
import { getMedicationsList } from '../../utils/meds';

const ParticipantForm = ({ isOpen, onClose, formData, setFormData, onSubmit, editingId, groups, canEdit, roles = [] }) => {
    const ui = useUi();
    const [newMed, setNewMed] = useState('');

    // Snapshot the form when it opens so we can detect unsaved edits on close.
    const initialSnapshot = useRef('');
    useEffect(() => {
        if (isOpen) initialSnapshot.current = JSON.stringify(formData);
    }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps
    const isDirty = isOpen && JSON.stringify(formData) !== initialSnapshot.current;
    useUnsavedGuard('participant-form', isDirty);

    const requestClose = async () => {
        if (isDirty) {
            const ok = await ui.confirm({
                title: 'Modifications non enregistrées',
                message: 'Quitter sans enregistrer ? Les modifications seront perdues.',
                confirmText: 'Quitter',
                cancelText: "Continuer l'édition",
                danger: true
            });
            if (!ok) return;
        }
        onClose();
    };

    if (!isOpen) return null;

    // Défaut au niveau CHAMP : un import partiel (objet sans `initial`) ne doit pas
    // produire d'input non contrôlé / de NaN.
    const pocketMoney = { initial: 0, current: 0, history: [], ...(formData.pocketMoney || {}) };

    const addPocketExpense = async () => {
        const amount = await ui.prompt({
            title: 'Nouvelle dépense',
            message: 'Montant de la dépense (€)',
            placeholder: '0.00',
            validate: (value) => {
                if (!value?.trim()) return 'Le montant est requis.';
                const num = Number(value.replace(',', '.'));
                if (Number.isNaN(num)) return 'Entrez un montant valide.';
                if (num <= 0) return 'Le montant doit être positif.';
                return '';
            }
        });
        if (!amount) return;
        const desc = await ui.prompt({
            title: 'Motif de la dépense',
            message: 'Ajoutez un motif clair (ex: Snack, Souvenir...)',
            placeholder: 'Souvenirs...',
            validate: (value) => !value?.trim() ? 'Le motif est requis.' : ''
        });
        if (!desc) return;

        const numAmount = parseFloat(amount.replace(',', '.'));
        const newExpense = { id: uuidv4(), date: new Date().toISOString(), amount: numAmount, description: desc };
        const newHistory = [...pocketMoney.history, newExpense];
        const totalSpent = newHistory.reduce((sum, tx) => sum + tx.amount, 0);
        const newCurrent = pocketMoney.initial - totalSpent;

        setFormData({ ...formData, pocketMoney: { ...pocketMoney, current: newCurrent, history: newHistory } });
    };

    const handleInitialMoneyUpdate = (e) => {
        const initial = parseFloat(e.target.value) || 0;
        const totalSpent = pocketMoney.history.reduce((sum, tx) => sum + tx.amount, 0);
        setFormData({ ...formData, pocketMoney: { ...pocketMoney, initial: initial, current: initial - totalSpent } });
    };

    const removePocketExpense = (txId) => {
        const newHistory = pocketMoney.history.filter(tx => tx.id !== txId);
        const totalSpent = newHistory.reduce((sum, tx) => sum + tx.amount, 0);
        const newCurrent = pocketMoney.initial - totalSpent;
        setFormData({ ...formData, pocketMoney: { ...pocketMoney, current: newCurrent, history: newHistory } });
    };

    const roleColor = formData.role === 'animator' ? 'var(--secondary-color)' : (formData.role === 'direction' ? 'var(--accent-color)' : 'var(--primary-color)');

    return (
        <div className="modal-overlay animate-fade-in" onClick={(e) => e.target === e.currentTarget && requestClose()} style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(12px)', zIndex: 1000 }}>
            <div className="modal-content animate-scale-in" style={{
                maxWidth: '940px',
                width: '100%',
                borderRadius: '32px',
                background: 'white',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'row',
                boxShadow: '0 25px 80px oklch(0% 0 0 / 0.25)',
                border: '1.5px solid var(--glass-border)',
                position: 'relative'
            }}>

                {/* Bouton fermer (toujours visible — indispensable sur mobile, la sidebar est masquée) */}
                <button type="button" onClick={requestClose} aria-label="Fermer" title="Fermer"
                    style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 20, width: '44px', height: '44px', borderRadius: '14px', background: 'rgba(255,255,255,0.85)', border: '1.5px solid var(--glass-border)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(8px)' }}>
                    <X size={20} strokeWidth={2.5} />
                </button>

                {/* Sidebar Context */}
                <div style={{
                    width: '320px',
                    background: `linear-gradient(180deg, ${roleColor} 0%, oklch(from ${roleColor} 80% 0.1 h) 100%)`,
                    padding: '3rem 2.5rem',
                    color: 'white',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2rem'
                }} className="hide-mobile">
                    <div style={{ width: '64px', height: '64px', background: 'rgba(255,255,255,0.2)', borderRadius: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {editingId ? <Edit2 size={32} strokeWidth={2.5} /> : <Plus size={32} strokeWidth={2.5} />}
                    </div>
                    <div>
                        <h3 style={{ fontSize: '2rem', fontWeight: '950', fontFamily: 'Bricolage Grotesque, sans-serif', lineHeight: '1.1', letterSpacing: '-0.04em', margin: 0 }}>
                            {editingId ? 'Modifier le membre' : 'Nouveau membre'}
                        </h3>
                        <p style={{ marginTop: '1rem', fontSize: '1rem', fontWeight: '700', color: 'rgba(255,255,255,0.8)', lineHeight: '1.5' }}>
                            {editingId ? "Mettez à jour les informations et les documents du participant." : "Créez une nouvelle fiche pour un enfant ou un membre du staff."}
                        </p>
                    </div>

                    <div style={{ marginTop: 'auto' }}>
                        <div style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.15)', borderRadius: '20px', backdropFilter: 'blur(10px)', border: '1.5px solid rgba(255,255,255,0.2)' }}>
                            <div style={{ fontSize: '10px', fontWeight: '950', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '8px' }}>CONSEIL</div>
                            <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: '700', lineHeight: '1.4' }}>
                                Assurez-vous d'avoir la fiche sanitaire avant d'autoriser le départ en activité.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Scrollable Form */}
                <div style={{ flex: 1, maxHeight: '90vh', overflowY: 'auto' }} className="no-scrollbar pform-scroll">
                    <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                        {/* Role Selection */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <label className="form-label">Rôle au sein de la structure</label>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', background: 'oklch(0% 0 0 / 0.05)', padding: '6px', borderRadius: '18px' }}>
                                {roles.length > 0 ? roles.map(r => (
                                    <button
                                        key={r.id}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, role: r.id })}
                                        style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.625rem',
                                            padding: '0.75rem', borderRadius: '14px', border: 'none', cursor: 'pointer',
                                            fontWeight: '950', fontSize: '0.85rem', transition: 'all 0.3s',
                                            background: formData.role === r.id ? 'white' : 'transparent',
                                            color: formData.role === r.id ? roleColor : 'var(--text-muted)',
                                            boxShadow: formData.role === r.id ? 'var(--shadow-sm)' : 'none'
                                        }}
                                    >
                                        {r.id === 'child' ? <User size={18} /> : (r.id === 'direction' ? <Shield size={18} /> : <Users size={18} />)} {r.label}
                                    </button>
                                )) : null}
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <label className="form-label">Prénom</label>
                                <input type="text" required value={formData.firstName} onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                                    className="glass-input" style={{ background: 'var(--bg-secondary)', border: '1.5px solid var(--glass-border)', padding: '0.85rem 1.25rem', borderRadius: '16px', fontWeight: '700' }} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <label className="form-label">Nom</label>
                                <input type="text" required value={formData.lastName} onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                                    className="glass-input" style={{ background: 'var(--bg-secondary)', border: '1.5px solid var(--glass-border)', padding: '0.85rem 1.25rem', borderRadius: '16px', fontWeight: '700' }} />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.25rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <label className="form-label">Date de Naissance</label>
                                <input type="date" value={formData.birthDate || ''} onChange={e => setFormData({ ...formData, birthDate: e.target.value })}
                                    className="glass-input" style={{ background: 'var(--bg-secondary)', border: '1.5px solid var(--glass-border)', padding: '0.85rem 1.25rem', borderRadius: '16px', fontWeight: '700' }} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <label className="form-label">Affectation Groupe</label>
                                <select value={formData.group || ''} onChange={e => setFormData({ ...formData, group: e.target.value })}
                                    className="glass-input" style={{ background: 'var(--bg-secondary)', border: '1.5px solid var(--glass-border)', padding: '0.85rem 1.25rem', borderRadius: '16px', fontWeight: '700', cursor: 'pointer' }}>
                                    <option value="">Aucun groupe</option>
                                    {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                                </select>
                            </div>
                        </div>

                        {formData.role === 'child' && (
                            <>
                                <div
                                    onClick={() => setFormData({ ...formData, healthDocProvided: !formData.healthDocProvided })}
                                    style={{
                                        background: formData.healthDocProvided ? 'oklch(62% 0.18 145 / 0.08)' : 'var(--bg-secondary)',
                                        padding: '1.25rem', borderRadius: '20px', border: '1.5px solid',
                                        borderColor: formData.healthDocProvided ? 'var(--success-color)' : 'var(--glass-border)',
                                        display: 'flex', alignItems: 'center', gap: '1.25rem', cursor: 'pointer', transition: 'all 0.3s'
                                    }}>
                                    <div style={{
                                        width: '32px', height: '32px', borderRadius: '10px',
                                        background: formData.healthDocProvided ? 'var(--success-color)' : 'white',
                                        color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        border: '1.5px solid', borderColor: formData.healthDocProvided ? 'var(--success-color)' : 'var(--glass-border)'
                                    }}>
                                        {formData.healthDocProvided && <Check size={20} strokeWidth={3} />}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: '950', fontSize: '0.95rem', color: formData.healthDocProvided ? 'var(--success-color)' : 'var(--text-main)' }}>Dossier Sanitaire Reçu</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '700' }}>Cochez si la fiche médicale signée est en votre possession.</div>
                                    </div>
                                </div>

                                {/* Medication Section */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '1.75rem', background: 'oklch(62% 0.18 232 / 0.04)', borderRadius: '24px', border: '1.5px solid oklch(62% 0.18 232 / 0.15)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'oklch(62% 0.18 232 / 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'oklch(55% 0.18 232)' }}>
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/></svg>
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: '950', fontSize: '0.9rem', color: 'oklch(45% 0.18 232)' }}>Traitement Médical</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700' }}>Renseignez le traitement et les horaires de prise</div>
                                        </div>
                                    </div>

                                    {/* Formulaire d'ajout d'un traitement */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '0.5rem' }}>
                                        
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                            <label className="form-label">Nom du traitement</label>
                                            <input
                                                type="text"
                                                placeholder="Ex: Ventoline 100μg, Spasfon..."
                                                value={newMed}
                                                onChange={e => setNewMed(e.target.value)}
                                                className="glass-input"
                                                style={{ background: 'white', border: '1.5px solid var(--glass-border)', padding: '0.85rem 1.25rem', borderRadius: '16px', fontWeight: '700' }}
                                            />
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                            <label className="form-label">Créneaux de prise et Doses</label>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '0.75rem' }}>
                                                {[
                                                    { id: 'Matin', label: 'Matin', icon: <Sunrise size={18} /> },
                                                    { id: 'Midi', label: 'Midi', icon: <Sun size={18} /> },
                                                    { id: 'Goûter', label: 'Goûter', icon: <Apple size={18} /> },
                                                    { id: 'Soir', label: 'Soir', icon: <Moon size={18} /> },
                                                    { id: 'Coucher', label: 'Coucher', icon: <Moon size={18} /> },
                                                    { id: 'Si besoin', label: 'Si besoin', icon: <Plus size={18} /> }
                                                ].map(slot => {
                                                    const slots = formData.newMedSlots || [];
                                                    const isActive = slots.includes(slot.id);
                                                    return (
                                                        <div key={slot.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const current = formData.newMedSlots || [];
                                                                    const next = isActive
                                                                        ? current.filter(s => s !== slot.id)
                                                                        : [...current, slot.id];
                                                                    setFormData({ ...formData, newMedSlots: next });
                                                                }}
                                                                style={{
                                                                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
                                                                    padding: '0.85rem 0.5rem', borderRadius: '16px', border: '2px solid',
                                                                    cursor: 'pointer', transition: 'all 0.2s', fontWeight: '950', fontSize: '0.8rem',
                                                                    borderColor: isActive ? 'oklch(55% 0.18 232)' : 'var(--glass-border)',
                                                                    background: isActive ? 'oklch(55% 0.18 232)' : 'white',
                                                                    color: isActive ? 'white' : 'var(--text-muted)',
                                                                    boxShadow: isActive ? '0 4px 16px oklch(55% 0.18 232 / 0.3)' : 'none',
                                                                    transform: isActive ? 'translateY(-2px)' : 'none',
                                                                    height: '100%'
                                                                }}
                                                            >
                                                                <span style={{ fontSize: '1.25rem' }}>{slot.icon}</span>
                                                                {slot.label}
                                                                {isActive && <Check size={14} strokeWidth={3} />}
                                                            </button>
                                                            
                                                            <input
                                                                type="text"
                                                                placeholder="Dose (ex: 4gtt)"
                                                                value={formData.newMedDoses?.[slot.id] || ''}
                                                                onChange={e => {
                                                                    setFormData({
                                                                        ...formData,
                                                                        newMedDoses: { ...(formData.newMedDoses || {}), [slot.id]: e.target.value }
                                                                    });
                                                                }}
                                                                className="glass-input"
                                                                style={{
                                                                    background: 'white', border: '1.5px solid var(--glass-border)',
                                                                    padding: '0.5rem 0.5rem', borderRadius: '10px',
                                                                    fontSize: '0.8rem', fontWeight: '800', textAlign: 'center',
                                                                    width: '100%',
                                                                    opacity: isActive || (formData.newMedDoses?.[slot.id]) ? 1 : 0.4,
                                                                    transition: 'opacity 0.2s'
                                                                }}
                                                            />
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        <button 
                                            type="button"
                                            onClick={() => {
                                                if (newMed.trim()) {
                                                    // Liste BRUTE (getMedicationsList strippe 'Si besoin' → écrirait la perte du tag sur tous les médocs)
                                                    const currentMeds = (Array.isArray(formData.medications) && formData.medications.length > 0) ? [...formData.medications] : getMedicationsList(formData);
                                                    setFormData({ 
                                                        ...formData, 
                                                        medications: [...currentMeds, { 
                                                            name: newMed.trim(), 
                                                            slots: formData.newMedSlots || [],
                                                            doses: formData.newMedDoses || {}
                                                        }],
                                                        newMedSlots: [],
                                                        newMedDoses: {}
                                                    });
                                                    setNewMed('');
                                                }
                                            }}
                                            style={{ 
                                                background: 'oklch(55% 0.18 232)', color: 'white', border: 'none', 
                                                borderRadius: '16px', padding: '1rem', fontWeight: '950', fontSize: '1rem',
                                                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                                boxShadow: '0 4px 12px oklch(55% 0.18 232 / 0.3)'
                                            }}
                                        >
                                            <Plus size={20} strokeWidth={3} /> Ajouter ce traitement
                                        </button>
                                    </div>

                                    {/* Liste des traitements ajoutés */}
                                    {(getMedicationsList(formData).length > 0 || (formData.sibesoin && formData.sibesoin.trim() !== '')) && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '2px dashed var(--glass-border)' }}>
                                            <label className="form-label">Traitements enregistrés pour ce séjour</label>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                                {getMedicationsList(formData).map((med, idx) => (
                                                    <div key={idx} style={{ 
                                                        background: 'white', padding: '1rem 1.25rem', borderRadius: '16px', 
                                                        border: '1.5px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '0.75rem' 
                                                    }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                            <div style={{ fontWeight: '900', fontSize: '1rem', color: 'var(--text-main)' }}>
                                                                {med.name}
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    // Liste BRUTE (getMedicationsList strippe 'Si besoin' → écrirait la perte du tag sur tous les médocs)
                                                    const currentMeds = (Array.isArray(formData.medications) && formData.medications.length > 0) ? [...formData.medications] : getMedicationsList(formData);
                                                                    currentMeds.splice(idx, 1);
                                                                    setFormData({ ...formData, medications: currentMeds });
                                                                }}
                                                                style={{
                                                                    background: 'oklch(62% 0.2 28 / 0.1)', color: 'var(--danger-color)',
                                                                    border: 'none', borderRadius: '10px', width: '36px', height: '36px',
                                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                                                                }}
                                                            >
                                                                <Trash2 size={16} strokeWidth={2.5} />
                                                            </button>
                                                        </div>
                                                        {med.slots && med.slots.length > 0 && (
                                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                                                {med.slots.map(s => (
                                                                    <div key={s} style={{ 
                                                                        background: 'oklch(55% 0.18 232 / 0.1)', color: 'oklch(55% 0.18 232)', 
                                                                        padding: '0.4rem 0.75rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '800',
                                                                        border: '1px solid oklch(55% 0.18 232 / 0.3)'
                                                                    }}>
                                                                        {s}
                                                                        {med.doses?.[s] && (
                                                                            <span style={{ opacity: 0.6, marginLeft: '4px' }}>
                                                                                • {med.doses[s]}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}

                                                {/* Legacy Si Besoin */}
                                                {formData.sibesoin && formData.sibesoin.trim() !== '' && formData.sibesoin.split(/,|\n/).map(s => s.trim()).filter(Boolean).map((med, idx) => (
                                                    <div key={`legacy-${idx}`} style={{ 
                                                        background: 'white', padding: '1rem 1.25rem', borderRadius: '16px', 
                                                        border: '1.5px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '0.75rem' 
                                                    }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                            <div style={{ fontWeight: '900', fontSize: '1rem', color: 'var(--text-main)' }}>
                                                                {med}
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const list = formData.sibesoin.split(/,|\n/).map(s => s.trim()).filter(Boolean);
                                                                    list.splice(idx, 1);
                                                                    setFormData({ ...formData, sibesoin: list.join('\n') });
                                                                }}
                                                                style={{
                                                                    background: 'oklch(62% 0.2 28 / 0.1)', color: 'var(--danger-color)',
                                                                    border: 'none', borderRadius: '10px', width: '36px', height: '36px',
                                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                                                                }}
                                                            >
                                                                <Trash2 size={16} strokeWidth={2.5} />
                                                            </button>
                                                        </div>
                                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                                            <div style={{ 
                                                                background: 'oklch(55% 0.18 232 / 0.1)', color: 'oklch(55% 0.18 232)', 
                                                                padding: '0.4rem 0.75rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '800',
                                                                border: '1px solid oklch(55% 0.18 232 / 0.3)'
                                                            }}>
                                                                Si besoin
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}

                        {/* Animator / Director Sections */}
                        {formData.role !== 'child' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '1.75rem', background: 'var(--bg-secondary)', borderRadius: '24px', border: '1.5px solid var(--glass-border)' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                        <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><GraduationCap size={14} /> Formation</label>
                                        <input type="text" placeholder="BAFA, BAFD..." value={formData.training || ''} onChange={e => setFormData({ ...formData, training: e.target.value })}
                                            className="glass-input" style={{ background: 'white', border: '1.5px solid var(--glass-border)', padding: '0.85rem 1.25rem', borderRadius: '16px', fontWeight: '700' }} />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                        <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Phone size={14} /> Contact</label>
                                        <input type="tel" placeholder="06..." value={formData.phone || ''} onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                            className="glass-input" style={{ background: 'white', border: '1.5px solid var(--glass-border)', padding: '0.85rem 1.25rem', borderRadius: '16px', fontWeight: '700' }} />
                                    </div>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Mail size={14} /> Email</label>
                                    <input type="email" placeholder="prenom.nom@email.com" value={formData.email || ''} onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        className="glass-input" style={{ background: 'white', border: '1.5px solid var(--glass-border)', padding: '0.85rem 1.25rem', borderRadius: '16px', fontWeight: '700' }} />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><MapPin size={14} /> Adresse Résidentielle</label>
                                    <input type="text" placeholder="Rue, Ville, Code Postal..." value={formData.address || ''} onChange={e => setFormData({ ...formData, address: e.target.value })}
                                        className="glass-input" style={{ background: 'white', border: '1.5px solid var(--glass-border)', padding: '0.85rem 1.25rem', borderRadius: '16px', fontWeight: '700' }} />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><ShieldAlert size={14} /> Contact d'Urgence (Nom/Tél)</label>
                                    <input type="text" placeholder="Prénom Nom - 06..." value={formData.emergencyContact || ''} onChange={e => setFormData({ ...formData, emergencyContact: e.target.value })}
                                        className="glass-input" style={{ background: 'white', border: '1.5px solid var(--glass-border)', padding: '0.85rem 1.25rem', borderRadius: '16px', fontWeight: '700' }} />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Lock size={14} /> Code PIN de connexion (4 chiffres)</label>
                                    <input 
                                        type="password" 
                                        pattern="[0-9]{4}"
                                        maxLength={4}
                                        inputMode="numeric"
                                        placeholder={editingId ? "Laisser vide pour conserver le PIN existant" : "Ex: 1234"}
                                        required={!editingId}
                                        value={formData.pin || ''} 
                                        onChange={e => {
                                            const val = e.target.value.replace(/\D/g, '');
                                            setFormData({ ...formData, pin: val });
                                        }}
                                        className="glass-input" 
                                        style={{ background: 'white', border: '1.5px solid var(--glass-border)', padding: '0.85rem 1.25rem', borderRadius: '16px', fontWeight: '700' }} 
                                    />
                                </div>
                            </div>
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <label className="form-label">Allergies Connues</label>
                                <textarea rows="3" placeholder="Aucune allergie..." value={formData.allergies || ''} onChange={e => setFormData({ ...formData, allergies: e.target.value })}
                                    className="glass-input" style={{ background: 'var(--bg-secondary)', border: '1.5px solid var(--glass-border)', padding: '0.85rem 1.25rem', borderRadius: '16px', fontWeight: '700', resize: 'none' }} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <label className="form-label">Régime alimentaire</label>
                                <textarea rows="2" placeholder="Sans porc, végétarien, sans gluten..." value={formData.diet || ''} onChange={e => setFormData({ ...formData, diet: e.target.value })}
                                    className="glass-input" style={{ background: 'var(--bg-secondary)', border: '1.5px solid var(--glass-border)', padding: '0.85rem 1.25rem', borderRadius: '16px', fontWeight: '700', resize: 'none' }} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <label className="form-label">Remarques</label>
                                <textarea rows="3" placeholder="Notes diverses..." value={formData.constraints || ''} onChange={e => setFormData({ ...formData, constraints: e.target.value })}
                                    className="glass-input" style={{ background: 'var(--bg-secondary)', border: '1.5px solid var(--glass-border)', padding: '0.85rem 1.25rem', borderRadius: '16px', fontWeight: '700', resize: 'none' }} />
                            </div>
                        </div>

                        {/* Pocket Money UI */}
                        {formData.role === 'child' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '1.75rem', background: 'var(--bg-secondary)', borderRadius: '24px', border: '1.5px solid var(--glass-border)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: '950', fontSize: '1rem', color: 'var(--text-main)' }}>
                                        <Coins size={22} color="oklch(71% 0.19 45)" /> ARGENT DE POCHE
                                    </div>
                                    <div style={{ padding: '0.5rem 1rem', borderRadius: '12px', background: 'white', border: '1.5px solid var(--glass-border)', fontWeight: '950', color: pocketMoney.current < 0 ? 'var(--danger-color)' : 'var(--success-color)' }}>
                                        Restant : {Number(pocketMoney.current || 0).toFixed(2)} €
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.875rem', alignItems: 'end' }}>
                                    <div>
                                        <label className="form-label" style={{ marginBottom: '8px' }}>Dépôt Initial (€)</label>
                                        <input type="number" step="0.5" value={pocketMoney.initial} onChange={handleInitialMoneyUpdate}
                                            className="glass-input" style={{ width: '100%', background: 'white', border: '1.5px solid var(--glass-border)', padding: '0.75rem 1rem', borderRadius: '14px', fontWeight: '800', height: '48px' }} />
                                    </div>
                                    <button type="button" onClick={addPocketExpense} className="btn btn-primary" style={{ height: '48px', borderRadius: '14px', fontWeight: '950', gap: '0.5rem', background: 'var(--success-color)', boxShadow: 'none', whiteSpace: 'nowrap' }}>
                                        <Plus size={18} strokeWidth={3} /> Nouvelle Dépense
                                    </button>
                                </div>

                                {pocketMoney.history && pocketMoney.history.length > 0 && (
                                    <div style={{ marginTop: '0.5rem', background: 'white', borderRadius: '16px', border: '1.5px solid var(--glass-border)', overflow: 'hidden' }}>
                                        {pocketMoney.history.map((tx, idx) => (
                                            <div key={tx.id} style={{ padding: '0.85rem 1.25rem', borderBottom: idx < pocketMoney.history.length - 1 ? '1.5px solid var(--glass-border)' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div>
                                                    <div style={{ fontWeight: '850', color: 'var(--text-main)', fontSize: '0.9rem' }}>{tx.description}</div>
                                                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '700' }}>{new Date(tx.date).toLocaleDateString()}</div>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                    <span style={{ fontWeight: '950', color: 'var(--danger-color)' }}>-{tx.amount.toFixed(2)} €</span>
                                                    <button type="button" aria-label="Supprimer la dépense" onClick={() => removePocketExpense(tx.id)} style={{ background: 'oklch(62% 0.2 28 / 0.05)', border: 'none', color: 'var(--danger-color)', width: '40px', height: '40px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <Trash2 size={16} strokeWidth={2} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem', paddingTop: '2.5rem', borderTop: '1.5px solid var(--glass-border)' }}>
                            <button type="button" onClick={requestClose} className="btn btn-secondary" style={{ padding: '1rem 2rem', fontWeight: '900', borderRadius: '16px' }}>Annuler</button>
                            <button type="submit" className="btn btn-primary" style={{ padding: '1rem 3rem', fontWeight: '950', borderRadius: '16px', fontSize: '1rem' }}>{editingId ? 'Mettre à jour la fiche' : 'Créer le membre'}</button>
                        </div>
                    </form>
                </div>

                <style>{`
                    .form-label { font-size: 11px; font-weight: 950; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.12em; margin-bottom: 0.5rem; display: block; }
                    .glass-input:focus { border-color: ${roleColor} !important; background: white !important; box-shadow: 0 0 0 4px oklch(from ${roleColor} l c h / 0.1) !important; outline: none; }
                    .pform-scroll { padding: 3rem; padding-top: 3.75rem; }
                    @media (max-width: 1024px) {
                        .hide-mobile { display: none !important; }
                        .pform-scroll { padding: 1.25rem; padding-top: 3.5rem; }
                    }
                `}</style>
            </div>
        </div>
    );
};

export default ParticipantForm;
