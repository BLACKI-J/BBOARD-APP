import React, { useState } from 'react';
import { X, Plus, Trash2, Edit2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

const ParticipantForm = ({ isOpen, onClose, formData, setFormData, onSubmit, editingId, groups }) => {
    if (!isOpen) return null;

    // Initialize pocket money if missing
    if (formData.role === 'child' && !formData.pocketMoney) {
        formData.pocketMoney = { initial: 0, current: 0, history: [] };
    }

    const addPocketExpense = () => {
        const amount = prompt("Montant de la dépense (€) :");
        if (!amount || isNaN(amount)) return;
        const desc = prompt("Motif de la dépense :");
        if (!desc) return;

        const newExpense = { id: uuidv4(), date: new Date().toISOString(), amount: parseFloat(amount), description: desc };
        const newHistory = [...formData.pocketMoney.history, newExpense];

        // Calculate new current total
        const totalSpent = newHistory.reduce((sum, tx) => sum + tx.amount, 0);
        const newCurrent = formData.pocketMoney.initial - totalSpent;

        setFormData({
            ...formData,
            pocketMoney: {
                ...formData.pocketMoney,
                current: newCurrent,
                history: newHistory
            }
        });
    };

    const handleInitialMoneyUpdate = (e) => {
        const initial = parseFloat(e.target.value) || 0;
        const totalSpent = formData.pocketMoney.history.reduce((sum, tx) => sum + tx.amount, 0);
        setFormData({
            ...formData,
            pocketMoney: {
                ...formData.pocketMoney,
                initial: initial,
                current: initial - totalSpent
            }
        });
    };

    const removePocketExpense = (txId) => {
        const newHistory = formData.pocketMoney.history.filter(tx => tx.id !== txId);
        const totalSpent = newHistory.reduce((sum, tx) => sum + tx.amount, 0);
        const newCurrent = formData.pocketMoney.initial - totalSpent;

        setFormData({
            ...formData,
            pocketMoney: {
                ...formData.pocketMoney,
                current: newCurrent,
                history: newHistory
            }
        });
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content animate-scale-in">

                {/* Left Sidebar */}
                <div className="modal-sidebar" style={{ background: '#f8fafc', padding: '2rem', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '1.5rem', lineHeight: '1.2' }}>
                        {editingId ? 'Modifier\nParticipant' : 'Nouveau\nParticipant'}
                    </h3>
                    <div style={{ flex: 1 }}></div>
                    <button className="btn btn-outline" onClick={onClose} style={{ justifyContent: 'center' }}>
                        <X size={18} /> Fermer
                    </button>
                </div>

                {/* Right Content - Form */}
                <div style={{ flex: 1, padding: '2rem', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                    <form onSubmit={onSubmit} style={{ display: 'grid', gap: '1.5rem' }}>

                        {/* Role Selection - Top Bar */}
                        <div className="form-row-aligned">
                            <label>Rôle</label>
                            <div className="role-selector">
                                {['child', 'animator', 'direction'].map(role => (
                                    <div
                                        key={role}
                                        className={`role-option ${formData.role === role ? 'active' : ''}`}
                                        onClick={() => setFormData({ ...formData, role })}
                                    >
                                        {role === 'child' ? 'Enfant' : role === 'animator' ? 'Animateur' : 'Direction'}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* General Fields */}
                        <div className="form-row-aligned">
                            <label>Prénom</label>
                            <input type="text" className="input-field" required value={formData.firstName} onChange={e => setFormData({ ...formData, firstName: e.target.value })} />

                            <label style={{ marginLeft: '1rem' }}>Nom</label>
                            <input type="text" className="input-field" required value={formData.lastName} onChange={e => setFormData({ ...formData, lastName: e.target.value })} />
                        </div>

                        <div className="form-row-aligned">
                            <label>Date de naissance</label>
                            <input type="date" className="input-field" value={formData.birthDate} onChange={e => setFormData({ ...formData, birthDate: e.target.value })} />

                            <label style={{ marginLeft: '1rem' }}>Groupe</label>
                            <select className="input-field" value={formData.group} onChange={e => setFormData({ ...formData, group: e.target.value })}>
                                <option value="">-- Aucun --</option>
                                {groups.map(g => (
                                    <option key={g.id} value={g.id}>{g.name}</option>
                                ))}
                            </select>
                        </div>

                        {formData.role === 'child' && (
                            <div className="form-row-aligned" style={{ marginTop: '-0.5rem', background: '#f8fafc', padding: '1rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                                <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: '600', color: '#1e293b' }}>
                                    <input type="checkbox" checked={!!formData.healthDocProvided} onChange={e => setFormData({ ...formData, healthDocProvided: e.target.checked })} style={{ width: '18px', height: '18px', accentColor: '#10b981', cursor: 'pointer' }} />
                                    Fiche sanitaire fournie
                                </label>
                                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Cochez si vous avez reçu le document médical complet.</span>
                            </div>
                        )}

                        {/* Animator / Direction Specific Fields */}
                        {(formData.role === 'animator' || formData.role === 'direction') && (
                            <div style={{ display: 'grid', gap: '1.5rem', padding: '1.5rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                <h4 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--secondary-color)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Détails Encadrement</h4>

                                <div className="form-row-aligned">
                                    <label>Formation</label>
                                    <input type="text" className="input-field" placeholder="Ex: BAFA, BAFD, PSC1..." value={formData.training} onChange={e => setFormData({ ...formData, training: e.target.value })} />

                                    <label style={{ marginLeft: '1rem' }}>Téléphone</label>
                                    <input type="tel" className="input-field" placeholder="06..." value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                                </div>

                                <div className="form-row-aligned">
                                    <label>Adresse</label>
                                    <input type="text" className="input-field" placeholder="Adresse complète..." value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} style={{ gridColumn: '2 / span 3' }} />
                                </div>

                                <div className="form-row-aligned">
                                    <label>Contact Urgence</label>
                                    <input type="text" className="input-field" placeholder="Nom et numéro du contact..." value={formData.emergencyContact} onChange={e => setFormData({ ...formData, emergencyContact: e.target.value })} style={{ gridColumn: '2 / span 3' }} />
                                </div>
                            </div>
                        )}

                        <div className="form-row-aligned" style={{ alignItems: 'flex-start' }}>
                            <label style={{ marginTop: '0.75rem' }}>Allergies</label>
                            <textarea className="input-field" rows="2" placeholder="Ex: Arachides, Pénicilline..." value={formData.allergies} onChange={e => setFormData({ ...formData, allergies: e.target.value })} style={{ resize: 'vertical' }} />
                        </div>

                        <div className="form-row-aligned" style={{ alignItems: 'flex-start' }}>
                            <label style={{ marginTop: '0.75rem' }}>Notes</label>
                            <textarea className="input-field" rows="2" placeholder="Informations importantes..." value={formData.constraints} onChange={e => setFormData({ ...formData, constraints: e.target.value })} style={{ resize: 'vertical' }} />
                        </div>

                        <div className="form-row-aligned">
                            <label>Photo</label>
                            <div style={{ display: 'flex', gap: '0.5rem', gridColumn: '2 / span 3' }}>
                                <input type="url" className="input-field" placeholder="Lien URL existant..." value={formData.photo} onChange={e => setFormData({ ...formData, photo: e.target.value })} style={{ flex: 1 }} />
                            </div>
                        </div>

                        {/* Pocket Money Section - Only for children */}
                        {formData.role === 'child' && (
                            <div style={{ marginTop: '1rem', padding: '1.5rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                    <h4 style={{ margin: 0, fontSize: '1rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        💰 Argent de Poche
                                    </h4>
                                    <div style={{ background: 'white', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: '700', fontSize: '1.1rem', color: formData.pocketMoney.current < 0 ? '#ef4444' : '#1e293b', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                                        Reste : {Number(formData.pocketMoney.current || 0).toFixed(2)} €
                                    </div>
                                </div>

                                <div className="form-row-aligned" style={{ marginBottom: '1rem' }}>
                                    <label>Dépôt Initial (€)</label>
                                    <input
                                        type="number" step="0.5"
                                        className="input-field"
                                        value={formData.pocketMoney.initial}
                                        onChange={handleInitialMoneyUpdate}
                                        style={{ width: '120px' }}
                                    />
                                </div>

                                <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                                    <div style={{ padding: '0.75rem 1rem', background: '#f1f5f9', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Historique des dépenses</span>
                                        <button type="button" onClick={addPocketExpense} style={{ background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', padding: '0.3rem 0.6rem', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                                            <Plus size={14} /> Dépense
                                        </button>
                                    </div>

                                    {formData.pocketMoney.history.length === 0 ? (
                                        <div style={{ padding: '1.5rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.9rem' }}>
                                            Aucune dépense enregistrée.
                                        </div>
                                    ) : (
                                        <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                            {formData.pocketMoney.history.map(tx => (
                                                <div key={tx.id} style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <div>
                                                        <div style={{ fontWeight: '600', color: '#334155', fontSize: '0.9rem' }}>{tx.description}</div>
                                                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{new Date(tx.date).toLocaleDateString()}</div>
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                        <span style={{ fontWeight: '700', color: '#ef4444' }}>- {tx.amount.toFixed(2)} €</span>
                                                        <button type="button" onClick={() => removePocketExpense(tx.id)} style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer', padding: '4px' }}>
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
                            <button type="button" className="btn btn-outline" onClick={onClose}>Annuler</button>
                            <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 2rem' }}>Enregistrer</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ParticipantForm;
