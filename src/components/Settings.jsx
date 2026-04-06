import React, { useEffect, useMemo, useState } from 'react';
import { Download, Upload, Trash2, Lock, Unlock, FileSpreadsheet, KeyRound, ShieldCheck, Users, EyeOff, FileClock, Settings2, AlertCircle, Eye, LayoutDashboard, Database, ShieldAlert, Sparkles, ChevronRight, Search, Activity, Trash, History } from 'lucide-react';
import { useUi } from '../ui/UiProvider';
import { v4 as uuidv4 } from 'uuid';

const SECTION_LABELS = {
    seatmap: 'Transports',
    schedule: 'Planning',
    exitsheet: 'Fiche de sortie',
    incident: 'FEI',
    recap: 'Coordination',
    attendance: 'Pointage',
    inventory: 'Matériel',
    directory: 'Annuaire',
    settings: 'Paramètres'
};

const ROLE_KEYS = ['direction', 'animator'];

const PERMISSIONS = [
    { key: 'viewSeatmap', label: 'Voir Transports' },
    { key: 'editSeatmap', label: 'Modifier Transports' },
    { key: 'viewSchedule', label: 'Voir Planning' },
    { key: 'editSchedule', label: 'Modifier Planning' },
    { key: 'viewExitSheet', label: 'Voir Fiche de sortie' },
    { key: 'editExitSheet', label: 'Modifier Fiche de sortie' },
    { key: 'viewIncident', label: 'Voir FEI' },
    { key: 'editIncident', label: 'Modifier FEI' },
    { key: 'viewDirectory', label: 'Voir Annuaire' },
    { key: 'editDirectory', label: 'Modifier Annuaire' },
    { key: 'viewAttendance', label: 'Voir Pointage' },
    { key: 'editAttendance', label: 'Modifier Pointage' },
    { key: 'viewInventory', label: 'Voir Matériel' },
    { key: 'editInventory', label: 'Modifier Matériel' },
    { key: 'searchInventoryAI', label: 'Recherche IA Matériel' },
    { key: 'viewSettings', label: 'Accès Paramètres' },
    { key: 'manageUsers', label: 'Gérer utilisateurs' },
    { key: 'manageAccess', label: 'Gérer droits globaux' },
    { key: 'viewLogs', label: 'Voir logs' }
];

const USER_PERMISSION_TEMPLATES = {
    standard_anim: {
        label: 'Anim standard',
        permissions: {
            editDirectory: true, editSchedule: true, editSeatmap: true, editIncident: true,
            editAttendance: true, viewInventory: true, editInventory: true, searchInventoryAI: true,
            viewSettings: false, viewLogs: false, manageUsers: false
        }
    },
    pointage_only: {
        label: 'Pointage uniquement',
        permissions: {
            editDirectory: false, editSchedule: false, editSeatmap: false, editIncident: false,
            editAttendance: true, viewInventory: true, editInventory: false, searchInventoryAI: false,
            viewSettings: false, viewLogs: false, manageUsers: false
        }
    },
    read_only: {
        label: 'Lecture seule',
        permissions: {
            editDirectory: false, editSchedule: false, editSeatmap: false, editIncident: false,
            editAttendance: false, viewInventory: true, editInventory: false, searchInventoryAI: false,
            viewSettings: false, viewLogs: false, manageUsers: false
        }
    },
    coordo: {
        label: 'Coordinateur',
        permissions: {
            editDirectory: true, editSchedule: true, editSeatmap: true, editIncident: true,
            editAttendance: true, viewInventory: true, editInventory: true, searchInventoryAI: true,
            viewSettings: true, viewLogs: true, manageUsers: false
        }
    }
};

export default function Settings({
    participants, setParticipants,
    groups, setGroups,
    activities, setActivities,
    savedViews, setSavedViews,
    isAdminMode, setIsAdminMode,
    isAttendanceEnabled, setIsAttendanceEnabled,
    adminPin, setAdminPin,
    accessControl, setAccessControl,
    actorHeaders,
    currentUser,
    permissions,
    isMobile
}) {
    const ui = useUi();
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [pinInput, setPinInput] = useState('');
    const [pinError, setPinError] = useState(false);
    const [isChangingPin, setIsChangingPin] = useState(false);
    const [newPin, setNewPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [logs, setLogs] = useState([]);
    const [logsLoading, setLogsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('overview'); 
    const [userSearch, setUserSearch] = useState('');
    const [selectedUserIds, setSelectedUserIds] = useState([]);
    const [selectedTemplateKey, setSelectedTemplateKey] = useState('standard_anim');
    const [newUser, setNewUser] = useState({ firstName: '', lastName: '', role: 'animator', pin: '1234' });

    const staffUsers = useMemo(
        () => (participants || []).filter((p) => p && (p.role === 'animator' || p.role === 'direction')),
        [participants]
    );

    const filteredUsers = useMemo(() => {
        if (!userSearch) return staffUsers;
        return staffUsers.filter(u => `${u.firstName} ${u.lastName}`.toLowerCase().includes(userSearch.toLowerCase()));
    }, [staffUsers, userSearch]);

    const canManageAccess = !!permissions?.manageAccess;
    const canManageUsers = !!permissions?.manageUsers;
    const canViewLogs = !!permissions?.viewLogs;

    const updateUserPermission = (userId, perm, value) => {
        if (!canManageUsers) return;
        setAccessControl(prev => ({
            ...prev,
            userPermissions: {
                ...prev.userPermissions,
                [userId]: { ...(prev.userPermissions?.[userId] || {}), [perm]: value }
            }
        }));
    };

    const updateUserPin = (userId, newPin) => {
        if (!canManageUsers) return;
        setParticipants(prev => prev.map(p => {
            if (p.id === userId) {
                const updated = { ...p, pin: newPin };
                try {
                    const data = JSON.parse(p.data || '{}');
                    updated.data = JSON.stringify({ ...data, pin: newPin });
                } catch (e) {
                    updated.data = JSON.stringify({ pin: newPin });
                }
                return updated;
            }
            return p;
        }));
    };

    const updateRolePermission = (role, perm, value) => {
        if (!canManageAccess) return;
        setAccessControl(prev => ({
            ...prev,
            rolePermissions: {
                ...prev.rolePermissions,
                [role]: { ...(prev.rolePermissions?.[role] || {}), [perm]: value }
            }
        }));
    };

    const applyTemplateToSelection = () => {
        if (!canManageUsers || selectedUserIds.length === 0) return;
        const template = USER_PERMISSION_TEMPLATES[selectedTemplateKey];
        if (!template) return;
        setAccessControl(prev => {
            const newUserPerms = { ...prev.userPermissions };
            selectedUserIds.forEach(uid => {
                newUserPerms[uid] = { ...(newUserPerms[uid] || {}), ...template.permissions };
            });
            return { ...prev, userPermissions: newUserPerms };
        });
        ui.toast(`Template "${template.label}" appliqué à ${selectedUserIds.length} utilisateur(s).`, { type: 'success' });
        setSelectedUserIds([]);
    };

    const handleAddUser = (e) => {
        e.preventDefault();
        if (!newUser.firstName || !newUser.lastName) {
            ui.toast('Prénom et nom sont requis.', { type: 'error' });
            return;
        }

        const id = uuidv4();
        const userToAdd = {
            ...newUser,
            id,
            healthDocProvided: true,
            groupId: '',
            allergies: '',
            constraints: '',
            data: JSON.stringify({ ...newUser, id })
        };

        setParticipants(prev => [...prev, userToAdd]);

        // Default permissions for new animators
        if (newUser.role === 'animator') {
            const template = USER_PERMISSION_TEMPLATES['standard_anim'];
            setAccessControl(prev => ({
                ...prev,
                userPermissions: {
                    ...prev.userPermissions,
                    [id]: template.permissions
                }
            }));
        }

        setNewUser({ firstName: '', lastName: '', role: 'animator', pin: '1234' });
        setActiveTab('users');
        ui.toast(`Utilisateur ${newUser.firstName} créé avec succès.`, { type: 'success' });
    };

    const handleResetAll = async () => {
        const ok = await ui.confirm({
            title: 'Réinitialisation complète',
            message: 'Toutes les données seront effacées définitivement. Cette action est irréversible.',
            confirmText: 'Tout supprimer',
            danger: true
        });
        if (!ok) return;
        setParticipants([]);
        setGroups([]);
        setActivities([]);
        setSavedViews({});
        localStorage.clear();
        ui.toast('Réinitialisation complète effectuée.', { type: 'success' });
    };

    const blockingAlerts = useMemo(() => {
        const alerts = [];
        const children = (participants || []).filter((p) => p?.role === 'child');
        const missingHealth = children.filter((p) => !p.healthDocProvided).length;
        const noGroup = children.filter((p) => !p.group).length;
        if (missingHealth > 0) alerts.push(`${missingHealth} enfant(s) sans fiche sanitaire.`);
        if (noGroup > 0) alerts.push(`${noGroup} enfant(s) sans groupe.`);
        return alerts;
    }, [participants]);

    const fetchLogs = async () => {
        if (!canViewLogs) return;
        setLogsLoading(true);
        try {
            const res = await fetch('/api/action-logs?limit=200');
            if (res.ok) {
                const data = await res.json();
                setLogs(Array.isArray(data) ? data : []);
            }
        } catch (err) { console.error(err); }
        finally { setLogsLoading(false); }
    };

    useEffect(() => { fetchLogs(); }, [canViewLogs]);

    const handleUnlock = (e) => {
        e.preventDefault();
        if (pinInput === adminPin) { setIsUnlocked(true); setPinError(false); }
        else { setPinError(true); setPinInput(''); }
    };

    const handleUpdatePin = (e) => {
        e.preventDefault();
        if (newPin.length < 4) { ui.toast('Le code PIN doit faire au moins 4 chiffres.', { type: 'error' }); return; }
        if (newPin !== confirmPin) { ui.toast('Les codes PIN ne correspondent pas.', { type: 'error' }); return; }
        setAdminPin(newPin); setIsChangingPin(false); setNewPin(''); setConfirmPin('');
        ui.toast('Code PIN mis à jour.', { type: 'success' });
    };

    const handleFullExport = () => {
        const exportData = { version: '1.0', date: new Date().toISOString(), participants, groups, activities, savedViews };
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.body.appendChild(document.createElement('a'));
        link.href = url; link.download = `colo-backup-${new Date().toISOString().split('T')[0]}.json`;
        link.click(); document.body.removeChild(link);
    };

    if (!isUnlocked) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '2rem' }}>
                <div className="card-glass animate-scale-in" style={{ maxWidth: '440px', width: '100%', padding: '3.5rem 2.5rem', textAlign: 'center', background: 'white', borderRadius: '40px', boxShadow: '0 40px 100px oklch(0% 0 0 / 0.15)', border: '1.5px solid var(--glass-border)' }}>
                    <div style={{ background: 'var(--primary-gradient)', width: '80px', height: '80px', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem', color: 'white', transform: 'rotate(-5deg)', boxShadow: '0 12px 32px var(--shadow-color)' }}>
                        <Lock size={36} strokeWidth={2.5} />
                    </div>
                    <h2 style={{ fontSize: '1.85rem', fontWeight: '950', marginBottom: '0.75rem', color: 'var(--text-main)', fontFamily: 'Sora, sans-serif', letterSpacing: '-0.04em' }}>Espace Direction</h2>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem', fontSize: '0.95rem', fontWeight: '850', lineHeight: '1.5' }}>Authentification requise pour accéder aux paramètres de sécurité et droits d'accès.</p>
                    <form onSubmit={handleUnlock}>
                        <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
                            <input type="password" inputMode="numeric" autoFocus placeholder="••••" value={pinInput} onChange={(e) => setPinInput(e.target.value.replace(/\D/g, '').slice(0, 8))} 
                                style={{ width: '100%', padding: '1.25rem', textAlign: 'center', fontSize: '2.5rem', letterSpacing: '0.625rem', borderRadius: '20px', border: `2.5px solid ${pinError ? 'var(--danger-color)' : 'var(--bg-secondary)'}`, background: 'var(--bg-secondary)', fontWeight: '950', transition: 'all 0.3s' }} />
                        </div>
                        {pinError && <p style={{ color: 'var(--danger-color)', fontSize: '0.85rem', marginBottom: '1.25rem', fontWeight: '950', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Code PIN invalide</p>}
                        <button className="btn btn-primary" style={{ width: '100%', padding: '1.25rem', fontWeight: '950', fontSize: '1rem', borderRadius: '18px' }}>Deverrouiller l'accès</button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'transparent', padding: isMobile ? '1rem' : '0' }}>
            {/* Header Area */}
            {/* Header Area */}
            <div className="card-glass" style={{ 
                padding: isMobile ? '1rem' : '1.25rem 2rem', 
                marginBottom: isMobile ? '1rem' : '2rem', 
                display: 'flex', 
                flexDirection: isMobile ? 'column' : 'row',
                justifyContent: 'space-between', 
                alignItems: isMobile ? 'flex-start' : 'center', 
                background: 'white', 
                borderRadius: '24px', 
                border: '1.5px solid var(--glass-border)',
                gap: '1rem'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '0.75rem' : '1.25rem' }}>
                    <div style={{ background: 'var(--primary-gradient)', borderRadius: '12px', padding: isMobile ? '0.5rem' : '0.75rem', color: 'white', display: 'flex' }}>
                        <ShieldCheck size={isMobile ? 22 : 28} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h2 style={{ margin: 0, fontWeight: '950', fontSize: isMobile ? '1.1rem' : '1.5rem', fontFamily: 'Sora, sans-serif', letterSpacing: '-0.03em' }}>
                            Paramètres
                        </h2>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: '850' }}>
                            <Activity size={10} strokeWidth={3} /> {currentUser?.firstName}
                        </div>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', width: isMobile ? '100%' : 'auto' }}>
                    <button className="btn btn-secondary" style={{ flex: isMobile ? 1 : 'none', padding: '0.625rem 1rem', borderRadius: '12px', fontWeight: '950', fontSize: '0.85rem' }} onClick={() => setIsUnlocked(false)}>
                        <Lock size={16} strokeWidth={2.5} /> Verrouiller
                    </button>
                </div>
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? '1.5rem' : '2.5rem', overflow: isMobile ? 'visible' : 'hidden' }}>
                {/* Sidebar Navigation */}
                <div style={{ 
                    display: 'flex', 
                    flexDirection: isMobile ? 'row' : 'column', 
                    gap: '0.5rem', 
                    overflowX: isMobile ? 'auto' : 'visible',
                    paddingBottom: isMobile ? '0.5rem' : '0',
                    flexShrink: 0
                }} className="no-scrollbar">
                    {[
                        { id: 'overview', label: 'Vue d\'ensemble', icon: <LayoutDashboard size={18} strokeWidth={2.5} /> },
                        { id: 'users', label: 'Équipe & Droits', icon: <Users size={18} strokeWidth={2.5} /> },
                        { id: 'create_user', label: 'Créer Utilisateur', icon: <Sparkles size={18} strokeWidth={2.5} /> },
                        { id: 'roles', label: 'Permissions Rôles', icon: <Unlock size={18} strokeWidth={2.5} /> },
                        { id: 'sections', label: 'Modules Visibles', icon: <Settings2 size={18} strokeWidth={2.5} /> },
                        { id: 'security', label: 'Sécurité & PIN', icon: <KeyRound size={18} strokeWidth={2.5} /> },
                        { id: 'maintenance', label: 'Maintenance & Logs', icon: <Database size={18} strokeWidth={2.5} /> },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            style={{ 
                                display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.875rem 1.25rem',
                                border: 'none', background: activeTab === tab.id ? 'var(--primary-light)' : 'transparent',
                                color: activeTab === tab.id ? 'var(--primary-color)' : 'var(--text-muted)',
                                borderRadius: '14px', fontWeight: '950', cursor: 'pointer', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                textAlign: 'left', fontSize: '12px', whiteSpace: 'nowrap'
                            }}
                        >
                            <span style={{ display: 'flex' }}>{tab.icon}</span>
                            {!isMobile && <span>{tab.label}</span>}
                            {activeTab === tab.id && !isMobile && <ChevronRight size={14} style={{ marginLeft: 'auto' }} strokeWidth={3} />}
                            {isMobile && <span>{tab.label}</span>}
                        </button>
                    ))}
                </div>

                {/* Main Tab Content */}
                <div style={{ overflowY: 'auto', paddingRight: '0.5rem' }} className="no-scrollbar">
                    
                    {/* OVERVIEW TAB */}
                    {activeTab === 'overview' && (
                        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
                                {[
                                    { label: 'Personnel', value: staffUsers.length, color: 'var(--primary-color)', icon: <Users size={18} /> },
                                    { label: 'Modules Actifs', value: Object.keys(SECTION_LABELS).length - (Object.values(accessControl?.hiddenSections || {}).filter(Boolean).length), color: 'var(--success-color)', icon: <LayoutDashboard size={18} /> },
                                    { label: 'Actions Logs', value: logs.length, color: 'var(--text-main)', icon: <History size={18} /> }
                                ].map((stat, i) => (
                                    <div key={i} className="card-glass" style={{ padding: '1.75rem', borderRadius: '24px', border: '1.5px solid var(--glass-border)', background: 'white' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                                            <div style={{ background: 'var(--bg-secondary)', padding: '6px', borderRadius: '8px', color: stat.color }}>{stat.icon}</div>
                                            <div style={{ fontSize: '10px', fontWeight: '950', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>{stat.label}</div>
                                        </div>
                                        <div style={{ fontSize: '2.5rem', fontWeight: '950', color: 'var(--text-main)', letterSpacing: '-0.04em', fontFamily: 'Sora, sans-serif' }}>{stat.value}</div>
                                    </div>
                                ))}
                            </div>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'minmax(0, 1fr) 400px', gap: '2rem' }}>
                                <div className="card-glass" style={{ padding: '2rem', borderRadius: '32px', background: 'white', border: '1.5px solid var(--glass-border)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
                                        <div style={{ background: 'oklch(62% 0.18 20 / 0.1)', padding: '8px', borderRadius: '10px', color: 'var(--danger-color)' }}><ShieldAlert size={20} strokeWidth={2.5} /></div>
                                        <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '950', color: 'var(--text-main)' }}>Points de Vigilance</h4>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        {blockingAlerts.length === 0 ? (
                                            <div style={{ padding: '2rem', textAlign: 'center', background: 'var(--bg-secondary)', borderRadius: '20px', border: '1.5px dashed var(--glass-border)', color: 'var(--success-color)', fontWeight: '950', fontSize: '0.9rem' }}>
                                                <Sparkles size={24} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                                                <p>État du système nominal. Aucune alerte critique détectée.</p>
                                            </div>
                                        ) : (
                                            blockingAlerts.map((msg, i) => (
                                                <div key={i} style={{ padding: '1rem 1.25rem', background: 'oklch(62% 0.18 20 / 0.05)', borderRadius: '16px', border: '1.5px solid oklch(62% 0.18 20 / 0.1)', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                                                    <AlertCircle size={18} style={{ color: 'var(--danger-color)', flexShrink: 0, marginTop: '2px' }} />
                                                    <span style={{ fontSize: '0.95rem', fontWeight: '850', color: 'oklch(20% 0.05 20)' }}>{msg}</span>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                                <div className="card-glass" style={{ padding: '2rem', borderRadius: '32px', background: 'white', border: '1.5px solid var(--glass-border)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
                                        <div style={{ background: 'var(--bg-secondary)', padding: '8px', borderRadius: '10px', color: 'var(--text-main)' }}><History size={20} strokeWidth={2.5} /></div>
                                        <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '950', color: 'var(--text-main)' }}>Audit Récent</h4>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        {logs.slice(0, 6).map((log, i) => (
                                            <div key={i} style={{ display: 'flex', gap: '12px', borderBottom: '1px solid var(--bg-secondary)', paddingBottom: '10px' }}>
                                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary-color)', marginTop: '6px', opacity: 0.6 }} />
                                                <div>
                                                    <div style={{ fontSize: '13px', fontWeight: '950', color: 'var(--text-main)' }}>{log.action}</div>
                                                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '900', textTransform: 'uppercase', marginTop: '2px' }}>{log.actor_name} · {new Date(log.created_at).toLocaleTimeString('fr-FR')}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* USERS TAB */}
                    {activeTab === 'users' && (
                        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div style={{ 
                                background: 'white', borderRadius: '24px', padding: isMobile ? '1rem' : '1.25rem 1.75rem', 
                                border: '1.5px solid var(--glass-border)', display: 'flex', flexDirection: isMobile ? 'column' : 'row',
                                gap: '1rem', alignItems: isMobile ? 'stretch' : 'center', position: 'sticky', top: 0, zIndex: 10, boxShadow: 'var(--shadow-lg)' 
                            }}>
                                <div style={{ flex: 1, position: 'relative' }}>
                                    <Search size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
                                    <input className="glass-input" placeholder="Filtrer par nom ou prénom..." value={userSearch} onChange={e => setUserSearch(e.target.value)} style={{ paddingLeft: '48px', height: '52px', background: 'var(--bg-secondary)', borderRadius: '16px', fontWeight: '800' }} />
                                </div>
                                <select className="glass-input" value={selectedTemplateKey} onChange={(e) => setSelectedTemplateKey(e.target.value)} style={{ width: 'auto', background: 'var(--bg-secondary)', borderRadius: '16px', fontWeight: '950', border: 'none' }}>
                                    {Object.entries(USER_PERMISSION_TEMPLATES).map(([key, tpl]) => <option key={key} value={key}>{tpl.label}</option>)}
                                </select>
                                <button className="btn btn-primary" onClick={applyTemplateToSelection} disabled={selectedUserIds.length === 0} style={{ padding: '0 1.5rem', height: '52px', borderRadius: '16px', fontWeight: '950', fontSize: '0.9rem' }}>Appliquer Template ({selectedUserIds.length})</button>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                                {filteredUsers.map((user, idx) => (
                                    <div key={user.id} className="card-glass animate-fade-in" style={{ 
                                        '--i': idx,
                                        animationDelay: `calc(var(--i) * 30ms)`,
                                        padding: '1.75rem', borderRadius: '28px', background: 'white', border: selectedUserIds.includes(user.id) ? '2.5px solid var(--primary-color)' : '1.5px solid var(--glass-border)',
                                        transition: 'all 0.3s var(--ease-out-expo)'
                                    }}>
                                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem' }}>
                                            <input type="checkbox" checked={selectedUserIds.includes(user.id)} onChange={e => setSelectedUserIds(prev => e.target.checked ? [...prev, user.id] : prev.filter(id => id !== user.id))} style={{ width: '20px', height: '20px' }} />
                                            <div style={{ width: '44px', height: '44px', background: 'var(--primary-gradient)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '950', fontSize: '1.1rem' }}>
                                                {user.firstName[0]}{user.lastName[0]}
                                            </div>
                                            <div style={{ minWidth: 0, flex: 1 }}>
                                                <div style={{ fontWeight: '950', fontSize: '1rem', color: 'var(--text-main)', letterSpacing: '-0.02em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.firstName} {user.lastName}</div>
                                                <div style={{ fontSize: '10px', color: 'var(--primary-color)', fontWeight: '950', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '2px' }}>{user.role}</div>
                                            </div>
                                        </div>
                                        
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', padding: '1.25rem', background: 'var(--bg-secondary)', borderRadius: '20px' }}>
                                            {['editDirectory', 'editSchedule', 'editSeatmap', 'editIncident', 'editAttendance', 'editInventory', 'viewSettings', 'viewLogs'].map(perm => (
                                                <label key={perm} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                                    <input type="checkbox" checked={!!accessControl?.userPermissions?.[user.id]?.[perm]} onChange={e => updateUserPermission(user.id, perm, e.target.checked)} />
                                                    <span style={{ fontSize: '11px', fontWeight: '850', color: 'var(--text-muted)' }}>{perm.replace('edit', '').replace('view', '')}</span>
                                                </label>
                                            ))}
                                        </div>

                                        <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', background: 'var(--bg-main)', borderRadius: '16px', border: '1.5px solid var(--glass-border)' }}>
                                            <KeyRound size={14} style={{ opacity: 0.5 }} />
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: '9px', fontWeight: '950', color: 'var(--text-muted)', textTransform: 'uppercase' }}>CODE PIN</div>
                                                <input 
                                                    type="password" inputMode="numeric" maxLength={4}
                                                    value={user.pin || ''} 
                                                    onChange={e => updateUserPin(user.id, e.target.value.replace(/\D/g, ''))}
                                                    placeholder="1234"
                                                    style={{ width: '100%', border: 'none', background: 'transparent', outline: 'none', color: 'var(--text-main)', fontWeight: '950', fontSize: '0.9rem', letterSpacing: '0.2rem' }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* CREATE USER TAB */}
                    {activeTab === 'create_user' && (
                        <div className="card-glass animate-fade-in" style={{ padding: '3rem', borderRadius: '32px', background: 'white', border: '1.5px solid var(--glass-border)', maxWidth: '600px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2.5rem' }}>
                                <div style={{ background: 'var(--primary-light)', padding: '10px', borderRadius: '12px', color: 'var(--primary-color)' }}><Sparkles size={24} strokeWidth={2.5} /></div>
                                <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '950', fontFamily: 'Sora, sans-serif' }}>Nouveau Membre</h3>
                            </div>
                            
                            <form onSubmit={handleAddUser} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <div>
                                    <label className="input-label">Prénom</label>
                                    <input className="glass-input" required value={newUser.firstName} onChange={e => setNewUser(p => ({ ...p, firstName: e.target.value }))} placeholder="Ex: Jean" />
                                </div>
                                <div>
                                    <label className="input-label">Nom</label>
                                    <input className="glass-input" required value={newUser.lastName} onChange={e => setNewUser(p => ({ ...p, lastName: e.target.value }))} placeholder="Ex: Dupont" />
                                </div>
                                <div>
                                    <label className="input-label">Rôle</label>
                                    <select className="glass-input" value={newUser.role} onChange={e => setNewUser(p => ({ ...p, role: e.target.value }))}>
                                        <option value="animator">Animateur</option>
                                        <option value="direction">Direction / Manager</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="input-label">Code PIN (4 chiffres)</label>
                                    <input 
                                        type="password" inputMode="numeric" maxLength={4} required
                                        className="glass-input" value={newUser.pin} 
                                        onChange={e => setNewUser(p => ({ ...p, pin: e.target.value.replace(/\D/g, '') }))} 
                                        placeholder="1234" 
                                        style={{ textAlign: 'center', letterSpacing: '0.5rem', fontSize: '1.25rem' }} 
                                    />
                                </div>
                                <div style={{ marginTop: '1rem', padding: '1.25rem', background: 'var(--bg-secondary)', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
                                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '850', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <ShieldCheck size={14} /> Les nouveaux animateurs recevront automatiquement les droits d'accès standards.
                                    </p>
                                </div>
                                <button type="submit" className="btn btn-primary" style={{ height: '56px', borderRadius: '16px', fontWeight: '950', fontSize: '1rem', marginTop: '1rem' }}>
                                    Créer le profil
                                </button>
                            </form>
                        </div>
                    )}

                    {/* ROLES TAB */}
                    {activeTab === 'roles' && (
                        <div className="card-glass animate-fade-in" style={{ padding: isMobile ? '1.5rem' : '3rem', borderRadius: '32px', background: 'white', border: '1.5px solid var(--glass-border)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2.5rem' }}>
                                <div style={{ background: 'var(--primary-light)', padding: '10px', borderRadius: '12px', color: 'var(--primary-color)' }}><Unlock size={20} strokeWidth={2.5} /></div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: isMobile ? '1.2rem' : '1.5rem', fontWeight: '950', fontFamily: 'Sora, sans-serif' }}>Permissions</h3>
                                    <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '850' }}>Configuration par rôle.</p>
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 60px 60px' : 'minmax(0, 1fr) 140px 140px', gap: isMobile ? '0.5rem' : '1.5rem', borderBottom: '2px solid var(--bg-secondary)', paddingBottom: '1.25rem', marginBottom: '1rem' }}>
                                <div style={{ fontWeight: '950', fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Accès</div>
                                <div style={{ fontWeight: '950', fontSize: '10px', color: 'var(--primary-color)', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.1em' }}>DIR</div>
                                <div style={{ fontWeight: '950', fontSize: '10px', color: 'oklch(62% 0.18 200)', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.1em' }}>ANIM</div>
                            </div>
                            {PERMISSIONS.map(perm => (
                                <div key={perm.key} style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 60px 60px' : 'minmax(0, 1fr) 140px 140px', gap: isMobile ? '0.5rem' : '1.5rem', padding: '1rem 0', borderBottom: '1.5px solid var(--bg-secondary)', alignItems: 'center' }}>
                                    <div style={{ fontSize: '0.85rem', fontWeight: '900', color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{perm.label}</div>
                                    {ROLE_KEYS.map(role => (
                                        <div key={role} style={{ display: 'flex', justifyContent: 'center' }}>
                                            <input 
                                                type="checkbox" 
                                                checked={!!accessControl?.rolePermissions?.[role]?.[perm.key]} 
                                                onChange={e => updateRolePermission(role, perm.key, e.target.checked)}
                                                style={{ width: '18px', height: '18px' }}
                                            />
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* SECTIONS TAB */}
                    {activeTab === 'sections' && (
                        <div className="card-glass animate-fade-in" style={{ padding: '3rem', borderRadius: '32px', background: 'white', border: '1.5px solid var(--glass-border)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                                <div style={{ background: 'var(--primary-light)', padding: '10px', borderRadius: '12px', color: 'var(--primary-color)' }}><Settings2 size={24} strokeWidth={2.5} /></div>
                                <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '950', fontFamily: 'Sora, sans-serif' }}>Modules de l'Interface</h3>
                            </div>
                            <p style={{ color: 'var(--text-muted)', fontSize: '1rem', marginBottom: '3rem', fontWeight: '850', maxWidth: '600px', lineHeight: '1.6' }}>Masquez les modules non-essentiels pour optimiser le workflow de l'équipe d'animation pendant le séjour.</p>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.5rem' }}>
                                {Object.entries(SECTION_LABELS).map(([key, label]) => (
                                    <label key={key} className="card-glass" style={{ 
                                        padding: '1.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer',
                                        background: accessControl?.hiddenSections?.[key] ? 'var(--bg-secondary)' : 'white', 
                                        opacity: accessControl?.hiddenSections?.[key] ? 0.6 : 1, 
                                        border: accessControl?.hiddenSections?.[key] ? '1.5px solid var(--glass-border)' : '1.5px solid var(--primary-color)',
                                        borderRadius: '24px', transition: 'all 0.3s var(--ease-out-expo)'
                                    }}>
                                        <span style={{ fontWeight: '950', fontSize: '1.1rem', color: 'var(--text-main)', letterSpacing: '-0.02em' }}>{label}</span>
                                        <input 
                                            type="checkbox" 
                                            checked={!accessControl?.hiddenSections?.[key]} 
                                            onChange={e => setAccessControl(prev => ({ ...prev, hiddenSections: { ...prev.hiddenSections, [key]: !e.target.checked } }))}
                                            style={{ width: '24px', height: '24px' }}
                                        />
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* SECURITY TAB */}
                    {activeTab === 'security' && (
                        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                            <div className="card-glass" style={{ padding: '3rem', borderRadius: '32px', background: 'white', border: '1.5px solid var(--glass-border)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2.5rem' }}>
                                    <div style={{ background: 'var(--primary-light)', padding: '10px', borderRadius: '12px', color: 'var(--primary-color)' }}><KeyRound size={24} strokeWidth={2.5} /></div>
                                    <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '950', fontFamily: 'Sora, sans-serif' }}>Paramètres de Sécurité</h3>
                                </div>
                                
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.75rem 2rem', background: 'var(--bg-secondary)', borderRadius: '24px', marginBottom: '2.5rem' }}>
                                    <div>
                                        <div style={{ fontWeight: '950', fontSize: '1.1rem', color: 'var(--text-main)' }}>Mode Développeur / Admin</div>
                                        <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: '850', marginTop: '4px' }}>Activation des outils de diagnostic système</div>
                                    </div>
                                    <input type="checkbox" checked={isAdminMode} onChange={e => setIsAdminMode(e.target.checked)} style={{ width: '28px', height: '28px' }} />
                                </div>

                                <div style={{ background: 'white', border: '2px solid var(--glass-border)', padding: '2.5rem', borderRadius: '28px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                                        <Lock size={18} strokeWidth={2.5} style={{ color: 'var(--text-muted)' }} />
                                        <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '950' }}>Modifier le code PIN d'accès Direction</h4>
                                    </div>
                                    {!isChangingPin ? (
                                        <button className="btn btn-primary" onClick={() => setIsChangingPin(true)} style={{ width: '100%', height: '54px', borderRadius: '16px', fontWeight: '950' }}>Modifier mon code PIN</button>
                                    ) : (
                                        <form onSubmit={handleUpdatePin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                            <input type="password" placeholder="Nouveau code PIN" value={newPin} onChange={e => setNewPin(e.target.value.replace(/\D/g, ''))} className="glass-input" style={{ background: 'var(--bg-secondary)', height: '54px', borderRadius: '16px', textAlign: 'center', fontSize: '1.25rem', fontWeight: '950', letterSpacing: '0.5rem' }} />
                                            <input type="password" placeholder="Confirmer le nouveau code" value={confirmPin} onChange={e => setConfirmPin(e.target.value.replace(/\D/g, ''))} className="glass-input" style={{ background: 'var(--bg-secondary)', height: '54px', borderRadius: '16px', textAlign: 'center', fontSize: '1.25rem', fontWeight: '950', letterSpacing: '0.5rem' }} />
                                            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                                                <button className="btn btn-primary" style={{ flex: 1, height: '54px', borderRadius: '16px', fontWeight: '950' }}>Valider le changement</button>
                                                <button type="button" className="btn btn-secondary" style={{ flex: 1, height: '54px', borderRadius: '16px', fontWeight: '950' }} onClick={() => setIsChangingPin(false)}>Annuler</button>
                                            </div>
                                        </form>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* MAINTENANCE TAB */}
                    {activeTab === 'maintenance' && (
                        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                            <div className="card-glass" style={{ padding: '3rem', borderRadius: '32px', background: 'white', border: '1.5px solid var(--glass-border)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2.5rem' }}>
                                    <div style={{ background: 'var(--primary-light)', padding: '10px', borderRadius: '12px', color: 'var(--primary-color)' }}><Database size={24} strokeWidth={2.5} /></div>
                                    <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '950', fontFamily: 'Sora, sans-serif' }}>Maintenance & Data</h3>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                                    <button className="btn-maintenance" onClick={handleFullExport}>
                                        <Download size={32} strokeWidth={2} />
                                        <span>Exporter JSON</span>
                                        <small>Sauvegarde complète</small>
                                    </button>
                                    <label className="btn-maintenance outline">
                                        <Upload size={32} strokeWidth={2} />
                                        <span>Restaurer</span>
                                        <small>Fichier .json uniquement</small>
                                        <input type="file" accept=".json" onChange={(e) => {
                                            const file = e.target.files[0];
                                            if (!file) return;
                                            const reader = new FileReader();
                                            reader.onload = (ev) => {
                                                try {
                                                    const imported = JSON.parse(ev.target.result);
                                                    setParticipants(imported.participants || []);
                                                    setGroups(imported.groups || []);
                                                    setActivities(imported.activities || []);
                                                    setSavedViews(imported.savedViews || { 'Trajet Aller': {} });
                                                    ui.toast('Restauration réussie.', { type: 'success' });
                                                } catch (err) { ui.toast('Import invalide.', { type: 'error' }); }
                                            };
                                            reader.readAsText(file);
                                        }} style={{ display: 'none' }} />
                                </label>
                                    <button className="btn-maintenance danger" onClick={handleResetAll}>
                                        <Trash2 size={32} strokeWidth={2} />
                                        <span>Full Reset</span>
                                        <small>Action irréversible</small>
                                    </button>
                                </div>
                            </div>

                            <div className="card-glass" style={{ padding: '3rem', borderRadius: '32px', background: 'white', border: '1.5px solid var(--glass-border)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div style={{ background: 'var(--bg-secondary)', padding: '10px', borderRadius: '12px', color: 'var(--text-main)' }}><FileClock size={24} strokeWidth={2.5} /></div>
                                        <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '950', fontFamily: 'Sora, sans-serif' }}>Journal d'Activité</h3>
                                    </div>
                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                        <button className="btn btn-secondary" style={{ padding: '0.75rem 1.25rem', borderRadius: '12px', fontWeight: '950', fontSize: '13px' }} onClick={fetchLogs}>Actualiser</button>
                                        <button className="btn btn-secondary" style={{ padding: '0.75rem 1.25rem', borderRadius: '12px', fontWeight: '950', fontSize: '13px', color: 'var(--danger-color)' }} onClick={() => setLogs([])}>Effacer</button>
                                    </div>
                                </div>
                                <div style={{ maxHeight: '600px', overflowY: 'auto', paddingRight: '0.5rem' }} className="no-scrollbar">
                                    {logsLoading ? (
                                        <div style={{ textAlign: 'center', padding: '4rem' }}><div className="spinner-small" /></div>
                                    ) : logs.length === 0 ? (
                                        <div style={{ textAlign: 'center', padding: '4rem', background: 'var(--bg-secondary)', borderRadius: '24px', border: '1.5px dashed var(--glass-border)', color: 'var(--text-muted)', fontWeight: '850' }}>Aucun log disponible.</div>
                                    ) : (
                                        logs.map((log, i) => (
                                            <div key={i} style={{ padding: '1.5rem', borderBottom: '1.5px solid var(--bg-secondary)', display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                                                <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'oklch(20% 0.05 240 / 0.4)' }}>
                                                    <FileClock size={22} strokeWidth={2.5} />
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontWeight: '950', fontSize: '0.95rem', color: 'var(--text-main)', letterSpacing: '-0.01em' }}>{log.action}</div>
                                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '900', textTransform: 'uppercase', marginTop: '4px', letterSpacing: '0.04em' }}>
                                                        {log.actor_name} · <span style={{ color: 'var(--primary-color)' }}>{log.resource}</span>
                                                    </div>
                                                </div>
                                                <div style={{ textAlign: 'right', fontSize: '10px', color: 'var(--text-muted)', fontWeight: '950', textTransform: 'uppercase' }}>
                                                    {new Date(log.created_at).toLocaleDateString()}<br/>{new Date(log.created_at).toLocaleTimeString()}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                .perm-row:hover { background: var(--bg-secondary); }
                .btn-maintenance {
                    display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.75rem;
                    padding: 2.5rem; background: var(--primary-light); color: var(--primary-color); border: none;
                    border-radius: 28px; cursor: pointer; transition: all 0.3s var(--ease-out-expo);
                }
                .btn-maintenance:hover { transform: translateY(-4px); box-shadow: 0 16px 32px var(--shadow-color); background: white; border: 1.5px solid var(--primary-color); }
                .btn-maintenance.outline { background: white; border: 2px dashed var(--glass-border); color: var(--text-muted); }
                .btn-maintenance.outline:hover { border-color: var(--primary-color); color: var(--primary-color); background: var(--primary-light); }
                .btn-maintenance.danger { background: oklch(62% 0.18 20 / 0.1); color: var(--danger-color); }
                .btn-maintenance.danger:hover { background: var(--danger-color); color: white; border: none; }
            `}</style>
        </div>
    );
}
