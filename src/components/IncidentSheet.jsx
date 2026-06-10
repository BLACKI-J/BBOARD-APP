import React, { useEffect, useLayoutEffect, useState, useRef } from 'react';
import { AlertTriangle, Save, Printer, Trash2, Eye, ArrowLeft, Plus, History, Sparkles, CheckCircle2, ShieldAlert, FileText, ChevronRight, Users, MapPin, User, Calendar, Clock, Check } from 'lucide-react';
import { useUi } from '../ui/UiProvider';
import { useUnsavedGuard } from '../utils/unsavedGuard';
import Button from './ui/Button';

// Imports harmonisés depuis le sous-dossier incidents/
import PrintContent from './incidents/IncidentPrint';
import {
    ROLE_OPTIONS,
    EVENT_TYPES,
    INTERNAL_NOTIFIED,
    EXTERNAL_NOTIFIED,
    createPerson,
    defaultForm,
    severityLabels,
    severityColors,
    roleChecklist,
    eventChecked,
    legendItems
} from './incidents/incidentUtils';

export default function IncidentSheet({ defaultRewriteMode = 'detaille', canEdit = true, actorHeaders = { 'Content-Type': 'application/json' }, activeUser, incidentSheets = [], participants = [], onRefresh, isMobile }) {
    const ui = useUi();
    const [form, setForm] = useState(defaultForm());
    const history = incidentSheets;
    const [saveStatus, setSaveStatus] = useState(null);
    const [showPreview, setShowPreview] = useState(false);
    const [rewriteMode, setRewriteMode] = useState(defaultRewriteMode);
    const [aiDraft, setAiDraft] = useState('');
    const [isRewriting, setIsRewriting] = useState(false);
    const [rewriteError, setRewriteError] = useState('');
    const [originalDetails, setOriginalDetails] = useState('');
    const [activeTab, setActiveTab] = useState('infos');
    const [autocomplete, setAutocomplete] = useState({ section: null, index: null, results: [] });

    // Aperçu Cerfa : page A4 fixe de 210mm (~794px) → scale écran pour tenir sur mobile.
    // N'affecte que l'aperçu (.no-print) ; la copie .print-view imprimée reste intacte.
    // Le scale se base sur la largeur RÉELLE du conteneur (padding + sidebar déduits),
    // pas sur window.innerWidth qui rognait le bord gauche sur certaines largeurs.
    const a4Ref = useRef(null);
    const previewWrapperRef = useRef(null);
    const [previewScale, setPreviewScale] = useState(1);
    const [a4Height, setA4Height] = useState(0);
    useLayoutEffect(() => {
        const computeScale = () =>
            setPreviewScale(Math.min(1, (previewWrapperRef.current?.clientWidth || window.innerWidth) / 794));
        computeScale();
        window.addEventListener('resize', computeScale);
        return () => window.removeEventListener('resize', computeScale);
    }, [showPreview]);
    useEffect(() => {
        if (showPreview && a4Ref.current) setA4Height(a4Ref.current.offsetHeight);
    }, [showPreview, form, previewScale]);

    // Baseline of the form at its last clean point (initial / saved / reset / loaded).
    // Used to warn about unsaved edits before leaving the section or closing the tab.
    const cleanSnapshot = useRef(JSON.stringify(defaultForm()));
    const isDirty = JSON.stringify(form) !== cleanSnapshot.current;
    useUnsavedGuard('incident-form', isDirty);

    const handleSearch = (section, index, query) => {
        if (!query || query.length < 2) {
            setAutocomplete({ section: null, index: null, results: [] });
            return;
        }

        const filtered = (participants || []).filter(p => {
            const fullName = `${p.firstName} ${p.lastName}`.toLowerCase();
            const search = query.toLowerCase();
            
            // Only show staff for reporters
            if (section === 'reporters' && p.role === 'child') return false;
            
            return fullName.includes(search);
        }).slice(0, 5);

        setAutocomplete({ section, index, results: filtered });
    };

    const selectParticipant = (section, index, p) => {
        setForm(prev => {
            const copy = [...prev[section]];
            copy[index] = { 
                ...copy[index], 
                firstName: p.firstName, 
                lastName: p.lastName, 
                role: p.role === 'child' ? 'Vacancier' : (p.role === 'direction' ? 'Directeur.trice' : (p.role === 'animator' ? 'Anim' : p.role))
            };
            return { ...prev, [section]: copy };
        });
        setAutocomplete({ section: null, index: null, results: [] });
    };

    // Les données sont maintenant gérées par App.jsx et synchronisées via Socket.io
    // fetchHistory et useEffect locaux ont été supprimés.

    const updatePerson = (section, index, key, value) => {
        setForm(prev => {
            const copy = [...prev[section]];
            copy[index] = { ...copy[index], [key]: value };
            return { ...prev, [section]: copy };
        });
    };

    const addPerson = (section) => {
        setForm(prev => ({
            ...prev,
            [section]: [...prev[section], createPerson()]
        }));
    };

    const removePerson = (section, index) => {
        setForm(prev => ({
            ...prev,
            [section]: prev[section].filter((_, i) => i !== index)
        }));
    };

    const toggleArrayFlag = (section, label) => {
        setForm(prev => ({
            ...prev,
            [section]: { ...(prev[section] || {}), [label]: !prev[section]?.[label] }
        }));
    };

    const toggleEventType = (type) => {
        setForm(prev => ({
            ...prev,
            eventTypes: prev.eventTypes.includes(type) ? prev.eventTypes.filter(t => t !== type) : [...prev.eventTypes, type]
        }));
    };

    const saveIncident = async (silent = false) => {
        if (!canEdit && !silent) return;
        if (!silent) setSaveStatus('saving');
        const id = form.id || `incident_${Date.now()}`;
        const payload = { ...form, id, timestamp: new Date().toISOString() };
        try {
            const res = await fetch('/api/incident-sheets', { method: 'POST', headers: actorHeaders, body: JSON.stringify(payload) });
            if (!res.ok) throw new Error('Save failed');
            setForm(prev => ({ ...prev, id }));
            cleanSnapshot.current = JSON.stringify({ ...form, id });
            if (onRefresh) onRefresh();
            if (!silent) {
                setSaveStatus('saved');
                ui.toast('FEI archivée avec succès.', { type: 'success' });
                setTimeout(() => setSaveStatus(null), 2500);
            }
        } catch (err) {
            if (!silent) { setSaveStatus('error'); ui.toast('Échec de l\'archivage.', { type: 'error' }); }
        }
    };

    const handlePrint = async () => {
        if (!canEdit) return;
        await saveIncident(true);
        window.print();
    };

    const requestRewrite = async (sourceText) => {
        if (!canEdit) return;
        const text = (sourceText || '').trim();
        if (!text) { setRewriteError('Veuillez saisir un texte à reformuler.'); return; }
        setIsRewriting(true); setRewriteError('');
        try {
            const res = await fetch('/api/ai/rewrite-fei', { method: 'POST', headers: actorHeaders, body: JSON.stringify({ text, mode: rewriteMode }) });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.error || 'Échec reformulation.');
            setAiDraft(data.rewrittenText || '');
        } catch (err) { setRewriteError(err.message); }
        finally { setIsRewriting(false); }
    };

    const deleteIncident = async (e, id) => {
        if (!canEdit) return;
        e.stopPropagation();
        const ok = await ui.confirm({
            title: 'Supprimer la fiche',
            message: 'Supprimer définitivement cette FEI ?',
            confirmText: 'Supprimer',
            danger: true
        });
        if (!ok) return;
        try {
            const res = await fetch(`/api/incident-sheets/${id}`, { method: 'DELETE', headers: actorHeaders });
            if (res.ok) {
                if (onRefresh) onRefresh();
                ui.toast('FEI supprimée.', { type: 'success' });
            }
        } catch (err) { console.error(err); }
    };

    const resetForm = () => {
        const fresh = defaultForm();
        setForm(fresh);
        cleanSnapshot.current = JSON.stringify(fresh);
        setAiDraft('');
        setRewriteError('');
        setOriginalDetails('');
    };

    return (
        <div style={{ width: '100%', maxWidth: '100vw', overflowX: 'hidden', position: 'relative', background: 'transparent' }}>
            {!showPreview ? (
                <div style={{ flex: 1, overflowY: 'auto' }} className="no-scrollbar">
                    <div className="fei-responsive-grid" style={{ maxWidth: '1440px', margin: '0 auto', padding: 'clamp(0.5rem, 3vw, 2rem)', display: 'flex', flexWrap: 'wrap', gap: 'clamp(1rem, 4vw, 2rem)', alignItems: 'flex-start' }}>
                        
                        {/* Main Editor */}
                        <div style={{ flex: '1 1 100%', display: 'flex', flexDirection: 'column', gap: 'clamp(1rem, 4vw, 2rem)' }}>
                            <div className="card-glass fei-header-card" style={{
                                padding: isMobile ? '1rem' : '1.5rem 2rem',
                                display: 'flex',
                                flexDirection: isMobile ? 'column' : 'row',
                                alignItems: isMobile ? 'flex-start' : 'center',
                                justifyContent: 'space-between',
                                gap: '1.25rem'
                            }}>
                                <div className="fei-header-title-block" style={{ display: 'flex', alignItems: 'center', gap: '1rem', width: '100%' }}>
                                    <div style={{ background: 'var(--primary-gradient)', borderRadius: '14px', padding: isMobile ? '0.75rem' : '1rem', display: 'flex', color: 'white', flexShrink: 0 }}>
                                        <AlertTriangle size={isMobile ? 24 : 32} strokeWidth={2.5} />
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <h1 style={{ margin: 0, fontSize: isMobile ? '1.2rem' : '1.8rem', fontWeight: '950', fontFamily: 'Bricolage Grotesque, sans-serif', letterSpacing: '-0.03em', lineHeight: '1.2', overflowWrap: 'break-word', wordBreak: 'break-word' }}>Feuille d'Événement Indésirable</h1>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: isMobile ? '0.8rem' : '0.95rem', fontWeight: '800', marginTop: '0.25rem' }}>
                                            <FileText size={isMobile ? 14 : 16} /> Questionaire FEI
                                        </div>
                                    </div>
                                </div>
                                <div className="fei-header-actions-block" style={{ display: 'flex', gap: '0.75rem', width: isMobile ? '100%' : 'auto', flexWrap: 'wrap' }}>
                                    <Button 
                                        variant="secondary" 
                                        icon={saveStatus === 'saved' ? CheckCircle2 : Save} 
                                        onClick={() => saveIncident(false)} 
                                        disabled={!canEdit} 
                                        style={{ flex: isMobile ? 1 : 'none', color: saveStatus === 'saved' ? 'var(--success-color)' : undefined }}
                                    >
                                        {saveStatus === 'saved' ? 'Enregistré' : 'Enregistrer'}
                                    </Button>
                                    <Button 
                                        variant="secondary" 
                                        icon={Eye} 
                                        onClick={() => setShowPreview(true)} 
                                        style={{ flex: isMobile ? 1 : 'none' }}
                                    >
                                        Aperçu
                                    </Button>
                                    
                                    {activeUser?.role === 'direction' && (
                                        <Button 
                                            variant="primary" 
                                            icon={Printer} 
                                            onClick={handlePrint} 
                                            style={{ width: isMobile ? '100%' : 'auto' }}
                                        >
                                            Imprimer
                                        </Button>
                                    )}
                                </div>
                            </div>

                            <div className="card-glass fei-form-card" style={{ background: 'white' }}>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: isMobile ? '1rem' : '1.5rem', marginBottom: isMobile ? '1.5rem' : '2.5rem' }}>
                                    <div style={{ flex: isMobile ? '1 1 100%' : '1', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                                        <label className="fei-label">Nom du Séjour</label>
                                        <div style={{ position: 'relative' }}>
                                            <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}><MapPin size={16} /></div>
                                            <input className="glass-input fei-input" style={{ width: '100%', paddingLeft: '2.5rem', fontSize: '0.95rem' }} placeholder="Ex: Colo d'été..." value={form.stayName} onChange={e => setForm(prev => ({ ...prev, stayName: e.target.value }))} />
                                        </div>
                                    </div>
                                    <div style={{ flex: isMobile ? '1 1 100%' : '1', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                                        <label className="fei-label">Directeur(trice)</label>
                                        <div style={{ position: 'relative' }}>
                                            <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}><User size={16} /></div>
                                            <input className="glass-input fei-input" style={{ width: '100%', paddingLeft: '2.5rem', fontSize: '0.95rem' }} placeholder="Prénom Nom" value={form.directorName} onChange={e => setForm(prev => ({ ...prev, directorName: e.target.value }))} />
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '2.5rem' }}>
                                    <div style={{ flex: '1 1 100%', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                        <label className="fei-label">Date de l'événement</label>
                                        <div style={{ position: 'relative' }}>
                                            <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}><Calendar size={18} /></div>
                                            <input type="date" className="glass-input fei-input" style={{ width: '100%', paddingLeft: '2.75rem', fontSize: '1rem' }} value={form.eventDate} onChange={e => setForm(prev => ({ ...prev, eventDate: e.target.value }))} />
                                        </div>
                                    </div>
                                    <div style={{ flex: '1 1 100%', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                        <label className="fei-label">Heure</label>
                                        <div style={{ position: 'relative' }}>
                                            <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}><Clock size={18} /></div>
                                            <input type="time" className="glass-input fei-input" style={{ width: '100%', paddingLeft: '2.75rem', fontSize: '1rem' }} value={form.eventTime} onChange={e => setForm(prev => ({ ...prev, eventTime: e.target.value }))} />
                                        </div>
                                    </div>
                                </div>

                                <div style={{ marginBottom: '2.5rem' }}>
                                    <label className="fei-label" style={{ marginBottom: '1.25rem', display: 'block' }}>Niveau de gravité</label>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                                        {Object.entries(severityLabels).map(([key, label]) => {
                                            const isActive = form.severity === key;
                                            return (
                                                <button
                                                    key={key} type="button" onClick={() => setForm(prev => ({ ...prev, severity: key }))}
                                                    className={`severity-btn ${isActive ? 'active' : ''}`}
                                                    style={{
                                                        flex: '1 1 90px',
                                                        padding: 'clamp(0.75rem, 3vw, 1.25rem) 0.5rem', borderRadius: '18px', 
                                                        border: '2px solid', 
                                                        borderColor: isActive ? severityColors[key] : 'var(--glass-border)',
                                                        background: isActive ? `oklch(from ${severityColors[key]} l c h / 0.1)` : 'var(--bg-secondary)', 
                                                        boxShadow: isActive ? `0 8px 25px oklch(from ${severityColors[key]} l c h / 0.25)` : 'none',
                                                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.85rem', cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                                        transform: isActive ? 'translateY(-4px)' : 'none'
                                                    }}>
                                                    <div style={{ 
                                                        width: '28px', height: '28px', background: severityColors[key], 
                                                        borderRadius: '50%', border: '3px solid white', 
                                                        boxShadow: isActive ? `0 0 15px ${severityColors[key]}` : '0 2px 8px oklch(0% 0 0 / 0.1)',
                                                        transition: 'all 0.3s'
                                                    }} />
                                                    <div style={{ 
                                                        fontSize: '11px', fontWeight: '950', 
                                                        color: isActive ? 'var(--text-main)' : 'var(--text-muted)', 
                                                        textTransform: 'uppercase', letterSpacing: '0.05em' 
                                                    }}>{label.split(' - ')[0]}</div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div style={{ marginBottom: '2.5rem' }}>
                                    <label className="fei-label" style={{ marginBottom: '1.25rem', display: 'block' }}>Type d'incident</label>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' }}>
                                        {EVENT_TYPES.map(type => {
                                            const isSelected = form.eventTypes.includes(type);
                                            return (
                                                <label key={type} onClick={() => toggleEventType(type)}
                                                    className="event-type-card"
                                                    style={{ 
                                                        display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '1rem 1.5rem', borderRadius: '16px', cursor: 'pointer',
                                                        background: isSelected ? 'oklch(58% 0.2 var(--brand-hue) / 0.08)' : 'var(--bg-secondary)',
                                                        border: '2px solid', borderColor: isSelected ? 'var(--primary-color)' : 'transparent', 
                                                        transition: 'all 0.25s',
                                                        boxShadow: isSelected ? '0 4px 15px oklch(58% 0.2 var(--brand-hue) / 0.15)' : 'none'
                                                    }}>
                                                    <div style={{ 
                                                        width: '24px', height: '24px', borderRadius: '8px', 
                                                        border: isSelected ? 'none' : '2px solid var(--glass-border)', 
                                                        background: isSelected ? 'var(--primary-color)' : 'white', 
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        transition: 'all 0.2s', color: 'white'
                                                    }}>
                                                        {isSelected && <Check size={16} strokeWidth={3} />}
                                                    </div>
                                                    <span style={{ fontSize: '0.9rem', fontWeight: isSelected ? '800' : '700', color: isSelected ? 'var(--primary-color)' : 'var(--text-main)' }}>{type}</span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2.5rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: '950', fontSize: '1rem', color: 'var(--text-main)' }}>
                                        <Users size={20} /> Membres Impliqués
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? '1rem' : '1.5rem' }}>
                                        <div style={{ background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '20px', border: '1px solid var(--glass-border)' }}>
                                            <div className="fei-label" style={{ marginBottom: '1.25rem', fontSize: '11px', color: 'var(--text-main)' }}>Déclarants (Staff)</div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                                {form.reporters.map((row, i) => (
                                                    <div key={`rep-${i}`} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', position: 'relative' }}>
                                                        <div style={{ display: 'flex', gap: '0.5rem', background: 'white', padding: '0.5rem', borderRadius: '14px', border: '1px solid var(--glass-border)', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                                                            <input className="glass-input" 
                                                                style={{ flex: 1, padding: '0.5rem 0.75rem', borderRadius: '10px', fontSize: '0.85rem', border: 'none', background: 'transparent' }} 
                                                                placeholder="Prénom Nom" 
                                                                value={`${row.firstName} ${row.lastName}`.trim()} 
                                                                onChange={e => {
                                                                    const val = e.target.value;
                                                                    const parts = val.split(' ');
                                                                    updatePerson('reporters', i, 'firstName', parts[0] || '');
                                                                    updatePerson('reporters', i, 'lastName', parts.slice(1).join(' ') || '');
                                                                    handleSearch('reporters', i, val);
                                                                }}
                                                                onBlur={() => setTimeout(() => setAutocomplete({ section: null, index: null, results: [] }), 200)}
                                                            />
                                                            <select className="glass-input" style={{ width: '130px', padding: '0.5rem', borderRadius: '10px', fontSize: '0.8rem', background: 'var(--bg-secondary)', border: 'none', fontWeight: '800' }} value={row.role} onChange={e => updatePerson('reporters', i, 'role', e.target.value)}>
                                                                {ROLE_OPTIONS.filter(r => r !== 'Vacancier').map(role => <option key={role} value={role}>{role}</option>)}
                                                            </select>
                                                            <button onClick={() => removePerson('reporters', i)} aria-label="Supprimer" style={{ background: 'transparent', border: 'none', color: 'var(--danger-color)', cursor: 'pointer', padding: '0.875rem', display: 'flex', alignItems: 'center', opacity: 0.85 }}>
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                        {autocomplete.section === 'reporters' && autocomplete.index === i && autocomplete.results.length > 0 && (
                                                            <div className="card-glass animate-scale-in" style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, background: 'white', marginTop: '4px', padding: '0.5rem', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', border: '1px solid var(--glass-border)' }}>
                                                                {autocomplete.results.map(p => (
                                                                    <div key={p.id} onClick={() => selectParticipant('reporters', i, p)} style={{ padding: '0.6rem 0.75rem', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} className="autocomplete-item">
                                                                        <span style={{ fontSize: '0.85rem', fontWeight: '800' }}>{p.firstName} {p.lastName}</span>
                                                                        <span style={{ fontSize: '10px', opacity: 0.5, textTransform: 'uppercase' }}>{p.role}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                                <button onClick={() => addPerson('reporters')} style={{ width: '100%', padding: '0.6rem', background: 'white', border: '1.5px dashed var(--glass-border)', borderRadius: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', transition: 'all 0.2s', fontSize: '0.85rem', fontWeight: '800' }}>
                                                    <Plus size={16} /> Ajouter un déclarant
                                                </button>
                                            </div>
                                        </div>
                                        <div style={{ background: 'oklch(58% 0.2 var(--brand-hue) / 0.03)', padding: '1.5rem', borderRadius: '20px', border: '1px solid oklch(58% 0.2 var(--brand-hue) / 0.1)' }}>
                                            <div className="fei-label" style={{ marginBottom: '1.25rem', fontSize: '11px', color: 'var(--primary-color)' }}>Personnes concernées</div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                                {form.concerned.map((row, i) => (
                                                    <div key={`con-${i}`} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', position: 'relative' }}>
                                                        <div style={{ display: 'flex', gap: '0.5rem', background: 'white', padding: '0.5rem', borderRadius: '14px', border: '1px solid oklch(58% 0.2 var(--brand-hue) / 0.1)', boxShadow: '0 2px 8px oklch(58% 0.2 var(--brand-hue) / 0.05)' }}>
                                                            <input className="glass-input" 
                                                                style={{ flex: 1, padding: '0.5rem 0.75rem', borderRadius: '10px', fontSize: '0.85rem', border: 'none', background: 'transparent' }} 
                                                                placeholder="Prénom Nom" 
                                                                value={`${row.firstName} ${row.lastName}`.trim()} 
                                                                onChange={e => {
                                                                    const val = e.target.value;
                                                                    const parts = val.split(' ');
                                                                    updatePerson('concerned', i, 'firstName', parts[0] || '');
                                                                    updatePerson('concerned', i, 'lastName', parts.slice(1).join(' ') || '');
                                                                    handleSearch('concerned', i, val);
                                                                }}
                                                                onBlur={() => setTimeout(() => setAutocomplete({ section: null, index: null, results: [] }), 200)}
                                                            />
                                                            <select className="glass-input" style={{ width: '130px', padding: '0.5rem', borderRadius: '10px', fontSize: '0.8rem', background: 'oklch(58% 0.2 var(--brand-hue) / 0.05)', border: 'none', fontWeight: '800', color: 'var(--primary-color)' }} value={row.role} onChange={e => updatePerson('concerned', i, 'role', e.target.value)}>
                                                                {ROLE_OPTIONS.map(role => <option key={role} value={role}>{role}</option>)}
                                                            </select>
                                                            <button onClick={() => removePerson('concerned', i)} aria-label="Supprimer" style={{ background: 'transparent', border: 'none', color: 'var(--danger-color)', cursor: 'pointer', padding: '0.875rem', display: 'flex', alignItems: 'center', opacity: 0.85 }}>
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                        {autocomplete.section === 'concerned' && autocomplete.index === i && autocomplete.results.length > 0 && (
                                                            <div className="card-glass animate-scale-in" style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, background: 'white', marginTop: '4px', padding: '0.5rem', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', border: '1px solid var(--glass-border)' }}>
                                                                {autocomplete.results.map(p => (
                                                                    <div key={p.id} onClick={() => selectParticipant('concerned', i, p)} style={{ padding: '0.6rem 0.75rem', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} className="autocomplete-item">
                                                                        <span style={{ fontSize: '0.85rem', fontWeight: '800' }}>{p.firstName} {p.lastName}</span>
                                                                        <span style={{ fontSize: '10px', opacity: 0.5, textTransform: 'uppercase' }}>{p.role}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                                <button onClick={() => addPerson('concerned')} style={{ width: '100%', padding: '0.6rem', background: 'oklch(58% 0.2 var(--brand-hue) / 0.02)', border: '1.5px dashed oklch(58% 0.2 var(--brand-hue) / 0.15)', borderRadius: '12px', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', transition: 'all 0.2s', fontSize: '0.85rem', fontWeight: '800', opacity: 0.8 }}>
                                                    <Plus size={16} /> Ajouter une personne
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                    <label className="fei-label">Détails de l'événement & Actions entreprises</label>
                                    <textarea className="glass-input custom-textarea" rows={12} value={form.details} onChange={e => setForm(prev => ({ ...prev, details: e.target.value }))}
                                        placeholder="Ex: L'enfant a fait une crise lors du repas... Nous avons isolé l'enfant au calme..."
                                        style={{ width: '100%', padding: '1.5rem', borderRadius: '24px', background: 'var(--bg-secondary)', resize: 'vertical', border: '2px solid var(--glass-border)', fontSize: '1rem', color: 'var(--text-main)', transition: 'border-color 0.2s' }} />

                                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '-0.5rem' }}>
                                        <button type="button" onClick={() => requestRewrite(form.details)} disabled={isRewriting}
                                            className="btn-magic"
                                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.2rem', minHeight: '44px', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '950', fontSize: '0.85rem', cursor: 'pointer', opacity: isRewriting ? 0.7 : 1, boxShadow: '0 8px 30px oklch(0% 0 0 / 0.1)' }}>
                                            <Sparkles size={16} /> {isRewriting ? 'Reformulation...' : 'Ajuster le ton pour le Cerfa'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Sidebar - History & Tools */}
                        <div className="fei-sidebar" style={{ flex: '1 1 380px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div className="card-glass" style={{ padding: '2rem', background: 'white', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: '950', fontSize: '1rem', color: 'var(--text-main)' }}>
                                    <History size={20} /> Archives
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '600px', overflowY: 'auto' }} className="no-scrollbar">
                                    {history.length === 0 ? (
                                        <div style={{ textAlign: 'center', padding: '3rem 1rem', background: 'var(--bg-secondary)', borderRadius: '20px', border: '1.5px dashed var(--glass-border)', color: 'var(--text-muted)' }}>
                                            Aucune fiche archivée.
                                        </div>
                                    ) : (
                                        history.map((incident, idx) => (
                                            <div key={incident.id || idx} onClick={() => { const loaded = { ...defaultForm(), ...incident }; setForm(loaded); cleanSnapshot.current = JSON.stringify(loaded); setShowPreview(true); }}
                                                style={{ padding: '1rem', borderRadius: '16px', background: 'white', border: '1.5px solid var(--glass-border)', cursor: 'pointer', transition: 'all 0.2s', position: 'relative' }}
                                                className="fei-history-item"
                                            >
                                                <div style={{ position: 'absolute', left: 0, top: '20%', bottom: '20%', width: '4px', background: severityColors[incident.severity], borderRadius: '0 4px 4px 0' }} />
                                                <div style={{ fontSize: '11px', fontWeight: '950', color: 'var(--text-muted)', marginBottom: '4px' }}>{incident.eventDate}</div>
                                                <div style={{ fontWeight: '950', color: 'var(--text-main)', fontSize: '0.9rem', marginBottom: '6px' }}>{incident.stayName || 'Sans titre'}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{incident.details}</div>
                                                <button onClick={(e) => { e.stopPropagation(); deleteIncident(e, incident.id); }} aria-label="Supprimer" style={{ position: 'absolute', top: 0, right: 0, width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><Trash2 size={14} /></button>
                                            </div>
                                        ))
                                    )}
                                </div>
                                <button className="btn btn-secondary" onClick={resetForm} style={{ width: '100%', padding: '0.85rem', fontWeight: '950', borderRadius: '14px' }}>
                                    <Plus size={18} /> Nouvelle Fiche
                                </button>
                            </div>

                        </div>
                    </div>
                </div>
            ) : (
                <div className="no-print" style={{ flex: 1, overflowY: 'auto', background: 'oklch(20% 0.05 40)', padding: 'clamp(1rem, 3vw, 2.5rem)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ maxWidth: '920px', width: '100%', background: 'white', borderRadius: '24px', padding: '1rem 2rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 20px 40px oklch(0% 0 0 / 0.2)' }}>
                        <button onClick={() => setShowPreview(false)} className="btn btn-secondary" style={{ padding: '0.625rem 1rem' }}><ArrowLeft size={18} /> Retour Édition</button>
                        <div style={{ fontWeight: '950', fontSize: '1rem', color: 'var(--text-main)' }}>Aperçu du Cerfa FEI</div>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button onClick={handlePrint} className="btn btn-primary" style={{ padding: '0.625rem 1.5rem' }}><Printer size={18} strokeWidth={2.5} /> Imprimer Maintenant</button>
                        </div>
                    </div>
                    {/* Mesure de la largeur réellement disponible (sert au calcul du scale) */}
                    <div ref={previewWrapperRef} style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                        {/* Wrapper dimensionné à la taille visuelle (le transform ne réduit pas la boîte de layout) */}
                        <div style={{ width: `${794 * previewScale}px`, height: a4Height ? `${a4Height * previewScale}px` : 'auto', overflow: 'visible' }}>
                            <div className="fei-a4-holder" ref={a4Ref} style={{ width: '794px', transform: `scale(${previewScale})`, transformOrigin: 'top left' }}>
                                <PrintContent data={form} />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .no-print .fei-page { margin-bottom: 3rem; box-shadow: 0 20px 50px oklch(0% 0 0 / 0.25); border-radius: 4px; border: 1px solid var(--glass-border); }
                .fei-label { font-size: 11px; font-weight: 950; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.12em; margin-bottom: 0.5rem; display: block; }
                .fei-input:focus { border-color: var(--primary-color) !important; background: white !important; box-shadow: 0 0 0 3px oklch(58% 0.2 var(--brand-hue) / 0.15) !important; }
                .custom-textarea:focus { border-color: var(--primary-color) !important; background: white !important; box-shadow: 0 0 0 3px oklch(58% 0.2 var(--brand-hue) / 0.15) !important; outline: none; }
                
                .severity-btn:hover { border-color: var(--text-muted) !important; }
                .severity-btn.active:hover { border-color: currentColor !important; }
                
                .event-type-card:hover { border-color: var(--primary-color) !important; transform: translateY(-2px); }

                .btn-magic {
                    background: linear-gradient(135deg, oklch(58% 0.2 270), oklch(62% 0.18 310), oklch(58% 0.2 270));
                    background-size: 200% auto;
                    transition: all 0.5s ease;
                }
                .btn-magic:hover:not(:disabled) {
                    background-position: right center;
                    transform: scale(1.02);
                }
                
                @media (max-width: 1200px) {
                    .fei-responsive-grid { padding: 1.5rem !important; }
                    .fei-sidebar { flex: 1 1 100% !important; order: 2; }
                }
                @media (max-width: 900px) {
                    .fei-header-card { flex-direction: column !important; align-items: stretch !important; gap: 1.5rem !important; }
                    .fei-header-title-block, .fei-header-actions-block { width: 100% !important; flex: 1 1 100% !important; }
                    .fei-header-actions-block { justify-content: space-between !important; }
                }
                @media (max-width: 600px) {
                    .fei-responsive-grid { padding: 0.75rem !important; }
                    .fei-header-actions-block { flex-direction: column !important; }
                    .fei-header-actions-block > button { width: 100% !important; justify-content: center; }
                }
                @media (max-width: 500px) {
                    .fei-header-title-block { flex-direction: column !important; align-items: center !important; gap: 0.5rem !important; text-align: center; }
                    .fei-header-title-block > div:first-child { align-self: center !important; }
                    .fei-header-title-block > div:last-child { word-break: break-word; white-space: normal; }
                    .fei-form-card { padding: 1rem !important; }
                    .severity-btn { flex: 1 1 90px !important; padding: 0.75rem 0.25rem !important; gap: 0.5rem !important; }
                    .severity-btn > div:first-child { width: 22px !important; height: 22px !important; border-width: 2px !important; }
                }

                .fei-form-card {
                    padding: clamp(1rem, 5vw, 2.5rem);
                    transition: padding 0.3s;
                }

                .fei-header-card {
                    padding: clamp(1rem, 4vw, 2rem);
                    display: flex;
                    flex-wrap: wrap;
                    gap: 1.5rem;
                    justify-content: space-between;
                    align-items: center;
                    background: white;
                    border-left: 8px solid var(--primary-color);
                    min-width: 0;
                    width: 100% !important;
                }
                .fei-header-title-block {
                    display: flex;
                    align-items: center;
                    gap: clamp(1rem, 3vw, 1.5rem);
                    flex: 1 1 320px;
                    min-width: 0;
                }
                .fei-header-actions-block {
                    display: flex;
                    gap: 0.75rem;
                    flex-wrap: wrap;
                    flex: 0 1 auto;
                }

                .autocomplete-item:hover { background: var(--bg-secondary); }
                                .fei-history-item:hover { transform: translateX(5px); border-color: var(--primary-color) !important; box-shadow: var(--shadow-md) !important; }
                .fei-a4-holder { transform-origin: top center; transition: transform 0.3s; }
                
                .print-view { display: none; }

                @media print {
                    .no-print { display: none !important; }
                    .print-view { display: block !important; position: absolute; left: 0; top: 0; width: 100%; }
                    body { background: white !important; }
                    body * { visibility: hidden; }
                    .print-view, .print-view * { visibility: visible; }
                    @page { size: A4 portrait; margin: 10mm; }
                }
            `}</style>

            <div className="print-view">
                <PrintContent data={form} />
            </div>
        </div>
    );
}
