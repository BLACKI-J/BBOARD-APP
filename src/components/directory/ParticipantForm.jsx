import React from 'react';
import { X, Plus } from 'lucide-react';

const ParticipantForm = ({ isOpen, onClose, formData, setFormData, onSubmit, editingId, groups }) => {
    if (!isOpen) return null;

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
                            <label>Photo URL</label>
                            <input type="url" className="input-field" placeholder="https://..." value={formData.photo} onChange={e => setFormData({ ...formData, photo: e.target.value })} />
                        </div>

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
