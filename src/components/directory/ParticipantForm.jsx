import React, { useState } from 'react';
import { X, Plus, Trash2, Edit2, ShieldAlert, Coins, User, Users, Shield, MapPin, Phone, GraduationCap, Check } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { useUi } from '../../ui/UiProvider';

const ParticipantForm = ({ isOpen, onClose, formData, setFormData, onSubmit, editingId, groups, canEdit }) => {
    const ui = useUi();
    if (!isOpen) return null;

    const pocketMoney = formData.pocketMoney || { initial: 0, current: 0, history: [] };

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
        <div className="modal-overlay animate-fade-in" onClick={(e) => e.target === e.currentTarget && onClose()} style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(12px)', zIndex: 1000 }}>
            <div className="modal-content animate-scale-in" style={{ 
                maxWidth: '940px', 
                width: '100%', 
                borderRadius: '32px', 
                background: 'white', 
                overflow: 'hidden', 
                display: 'flex', 
                flexDirection: 'row',
                boxShadow: '0 25px 80px oklch(0% 0 0 / 0.25)',
                border: '1.5px solid var(--glass-border)'
            }}>

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
                        <h3 style={{ fontSize: '2rem', fontWeight: '950', fontFamily: 'Sora, sans-serif', lineHeight: '1.1', letterSpacing: '-0.04em', margin: 0 }}>
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
                <div style={{ flex: 1, maxHeight: '90vh', overflowY: 'auto', padding: '3rem' }} className="no-scrollbar">
                    <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        
                        {/* Role Selection */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <label className="form-label">Rôle au sein de la structure</label>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', background: 'oklch(0% 0 0 / 0.05)', padding: '6px', borderRadius: '18px' }}>
                                {[
                                    { id: 'child', label: 'Enfant', icon: <User size={18} /> },
                                    { id: 'animator', label: 'Anim.', icon: <Users size={18} /> },
                                    { id: 'direction', label: 'Dir.', icon: <Shield size={18} /> }
                                ].map(r => (
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
                                        {r.icon} {r.label}
                                    </button>
                                ))}
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
                        )}

                        {/* Animator / Director Sections */}
                        {(formData.role === 'animator' || formData.role === 'direction') && (
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
                                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><MapPin size={14} /> Adresse Résidentielle</label>
                                    <input type="text" placeholder="Rue, Ville, Code Postal..." value={formData.address || ''} onChange={e => setFormData({ ...formData, address: e.target.value })} 
                                        className="glass-input" style={{ background: 'white', border: '1.5px solid var(--glass-border)', padding: '0.85rem 1.25rem', borderRadius: '16px', fontWeight: '700' }} />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><ShieldAlert size={14} /> Contact d'Urgence (Nom/Tél)</label>
                                    <input type="text" placeholder="Prénom Nom - 06..." value={formData.emergencyContact || ''} onChange={e => setFormData({ ...formData, emergencyContact: e.target.value })} 
                                        className="glass-input" style={{ background: 'white', border: '1.5px solid var(--glass-border)', padding: '0.85rem 1.25rem', borderRadius: '16px', fontWeight: '700' }} />
                                </div>
                            </div>
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <label className="form-label">Allergies Connues</label>
                                <textarea rows="2" placeholder="Aucune allergie..." value={formData.allergies || ''} onChange={e => setFormData({ ...formData, allergies: e.target.value })} 
                                    className="glass-input" style={{ background: 'var(--bg-secondary)', border: '1.5px solid var(--glass-border)', padding: '0.85rem 1.25rem', borderRadius: '16px', fontWeight: '700', resize: 'none' }} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <label className="form-label">Remarques / Régime</label>
                                <textarea rows="2" placeholder="Notes diverses..." value={formData.constraints || ''} onChange={e => setFormData({ ...formData, constraints: e.target.value })} 
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

                                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                                    <div style={{ flex: 1 }}>
                                        <label className="form-label" style={{ marginBottom: '8px' }}>Dépôt Initial (€)</label>
                                        <input type="number" step="0.5" value={pocketMoney.initial} onChange={handleInitialMoneyUpdate} 
                                            className="glass-input" style={{ width: '100%', background: 'white', border: '1.5px solid var(--glass-border)', padding: '0.75rem 1rem', borderRadius: '14px', fontWeight: '800' }} />
                                    </div>
                                    <button type="button" onClick={addPocketExpense} className="btn btn-primary" style={{ marginTop: 'auto', padding: '0.75rem 1.25rem', borderRadius: '14px', fontWeight: '950', gap: '0.5rem', background: 'var(--success-color)', boxShadow: 'none' }}>
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
                                                    <button type="button" onClick={() => removePocketExpense(tx.id)} style={{ background: 'oklch(62% 0.2 28 / 0.05)', border: 'none', color: 'var(--danger-color)', width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
                            <button type="button" onClick={onClose} className="btn btn-secondary" style={{ padding: '1rem 2rem', fontWeight: '900', borderRadius: '16px' }}>Annuler</button>
                            <button type="submit" className="btn btn-primary" style={{ padding: '1rem 3rem', fontWeight: '950', borderRadius: '16px', fontSize: '1rem' }}>{editingId ? 'Mettre à jour la fiche' : 'Créer le membre'}</button>
                        </div>
                    </form>
                </div>

                <style>{`
                    .form-label { font-size: 11px; font-weight: 950; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.12em; margin-bottom: 0.5rem; display: block; }
                    .glass-input:focus { border-color: ${roleColor} !important; background: white !important; box-shadow: 0 0 0 4px oklch(from ${roleColor} l c h / 0.1) !important; outline: none; }
                    @media (max-width: 1024px) {
                        .hide-mobile { display: none !important; }
                    }
                `}</style>
            </div>
        </div>
    );
};

export default ParticipantForm;
