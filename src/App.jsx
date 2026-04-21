import React, { useState, useEffect, useRef, useMemo, useCallback, Suspense } from 'react';
import { Users, Calendar, Map as MapIcon, Contact, Settings as SettingsIcon, Menu, ClipboardList, FileText, Bell, ClipboardCheck, AlertCircle, AlertTriangle, Package, Utensils, Zap, Sparkles, ChevronDown, UserCircle } from 'lucide-react';
import { io } from 'socket.io-client';
import Sidebar from './components/Sidebar';
import Login from './components/Login';

const loadSeatMap = () => import('./components/SeatMap');
const loadSchedule = () => import('./components/Schedule');
const loadDirectory = () => import('./components/Directory');
const loadSettings = () => import('./components/Settings');
const loadMeetingRecap = () => import('./components/MeetingRecap');
const loadExitSheet = () => import('./components/ExitSheet');
const loadAttendance = () => import('./components/Attendance');
const loadIncidentSheet = () => import('./components/IncidentSheet');
const loadInventory = () => import('./components/Inventory');

const SeatMap = React.lazy(loadSeatMap);
const Schedule = React.lazy(loadSchedule);
const Directory = React.lazy(loadDirectory);
const Settings = React.lazy(loadSettings);
const MeetingRecap = React.lazy(loadMeetingRecap);
const ExitSheet = React.lazy(loadExitSheet);
const Attendance = React.lazy(loadAttendance);
const IncidentSheet = React.lazy(loadIncidentSheet);
const Inventory = React.lazy(loadInventory);

const API_URL = '/api';

const Logo = () => (
    <div style={{ position: 'relative', width: '38px', height: '38px', flexShrink: 0 }}>
        <img src="/logo/logo.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '12px', background: 'white' }} 
             onError={(e) => { e.target.style.display = 'none'; e.target.nextElementSibling.style.display = 'flex'; }} />
        
        <div style={{
            display: 'none', position: 'absolute', inset: 0,
            alignItems: 'center', justifyContent: 'center', background: 'var(--primary-gradient)',
            borderRadius: '12px', boxShadow: '0 8px 24px var(--shadow-color)', overflow: 'hidden'
        }}>
            <Zap size={22} color="white" strokeWidth={3} />
            <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, transparent 50%, rgba(255,255,255,0.1) 100%)',
                pointerEvents: 'none'
            }} />
        </div>
    </div>
);

const TAB_TITLES = {
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

const defaultAccessControl = {
    hiddenSections: {
        seatmap: false, schedule: false, exitsheet: false, incident: false,
        recap: false, attendance: false, inventory: false, directory: false
    },
    rolePermissions: {
        direction: {
            viewSeatmap: true, editSeatmap: true, viewSchedule: true, editSchedule: true,
            viewExitSheet: true, editExitSheet: true, viewIncident: true, editIncident: true,
            viewRecap: true, editRecap: true, viewDirectory: true, editDirectory: true,
            viewAttendance: true, editAttendance: true, viewInventory: true, editInventory: true,
            searchInventoryAI: true, viewSettings: true, manageUsers: true, manageAccess: true, viewLogs: true
        },
        animator: {
            viewSeatmap: true, editSeatmap: true, viewSchedule: true, editSchedule: true,
            viewExitSheet: true, editExitSheet: true, viewIncident: true, editIncident: true,
            viewRecap: true, editRecap: true, viewDirectory: true, editDirectory: true,
            viewAttendance: true, editAttendance: true, viewInventory: true, editInventory: true,
            searchInventoryAI: true, viewSettings: false, manageUsers: false, manageAccess: false, viewLogs: false
        }
    },
    userPermissions: {}, disabledUsers: {}, incidentAiDefaultMode: 'detaille'
};

function mergeAccessControl(raw) {
    const source = raw && typeof raw === 'object' ? raw : {};
    return {
        ...defaultAccessControl, ...source,
        hiddenSections: { ...defaultAccessControl.hiddenSections, ...(source.hiddenSections || {}) },
        rolePermissions: {
            direction: { ...defaultAccessControl.rolePermissions.direction, ...(source.rolePermissions?.direction || {}) },
            animator: { ...defaultAccessControl.rolePermissions.animator, ...(source.rolePermissions?.animator || {}) }
        },
        userPermissions: { ...defaultAccessControl.userPermissions, ...(source.userPermissions || {}) },
        disabledUsers: { ...defaultAccessControl.disabledUsers, ...(source.disabledUsers || {}) }
    };
}

const sectionPermissionMap = {
    seatmap: 'viewSeatmap', schedule: 'viewSchedule', exitsheet: 'viewExitSheet',
    incident: 'viewIncident', recap: 'viewRecap', attendance: 'viewAttendance',
    inventory: 'viewInventory', directory: 'viewDirectory'
};

const tabPreloaders = {
    seatmap: loadSeatMap, schedule: loadSchedule, exitsheet: loadExitSheet,
    incident: loadIncidentSheet, recap: loadMeetingRecap, attendance: loadAttendance,
    inventory: loadInventory, directory: loadDirectory, settings: loadSettings
};

const nextLikelyTab = {
    seatmap: 'schedule', schedule: 'exitsheet', exitsheet: 'incident',
    incident: 'recap', recap: 'attendance', attendance: 'directory',
    directory: 'inventory', inventory: 'seatmap'
};

class ErrorBoundary extends React.Component {
    constructor(props) { super(props); this.state = { hasError: false, error: null, info: null }; }
    static getDerivedStateFromError(error) { return { hasError: true, error }; }
    componentDidCatch(error, info) { this.setState({ info }); }
    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: '3rem', background: 'var(--bg-secondary)', color: 'var(--danger-color)', height: '100%', display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'center', justifyContent: 'center' }}>
                    <AlertTriangle size={64} />
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '950', fontFamily: 'Sora' }}>Interruption du service</h2>
                    <details style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', background: 'white', padding: '1.5rem', border: '1.5px solid var(--glass-border)', borderRadius: '24px', maxWidth: '800px', width: '100%', maxHeight: '400px', overflow: 'auto' }}>
                        <summary style={{ cursor: 'pointer', fontWeight: '950' }}>{this.state.error?.toString()}</summary>
                        <div style={{ marginTop: '1rem', fontSize: '13px', lineHeight: '1.6', opacity: 0.7 }}>{this.state.info?.componentStack}</div>
                    </details>
                    <button onClick={() => window.location.reload()} className="btn btn-primary" style={{ padding: '0.75rem 2rem', borderRadius: '14px' }}>Réinitialiser l'interface</button>
                </div>
            );
        }
        return this.props.children;
    }
}

export default function App() {
    const isDataLoaded = useRef(false);
    const ignoreNextSocketUpdate = useRef(false);
    const [activeTab, setActiveTab] = useState(() => localStorage.getItem('colo-active-tab') || 'schedule');
    const [groups, setGroups] = useState(() => {
        const saved = localStorage.getItem('colo-groups');
        try { return saved ? JSON.parse(saved) : []; } catch (e) { return []; }
    });
    const [participants, setParticipants] = useState(() => {
        const saved = localStorage.getItem('colo-participants');
        try { return saved ? JSON.parse(saved) : []; } catch (e) { return []; }
    });
    const [activities, setActivities] = useState(() => {
        const saved = localStorage.getItem('colo-activities');
        try { return saved ? JSON.parse(saved) : []; } catch (e) { return []; }
    });
    const [incidentSheets, setIncidentSheets] = useState([]);
    const [exitSheets, setExitSheets] = useState([]);
    const [meetingRecaps, setMeetingRecaps] = useState([]);
    const [inventoryItems, setInventoryItems] = useState([]);
    const [savedViews, setSavedViews] = useState(() => {
        const saved = localStorage.getItem('colo-saved-views');
        if (saved) try { return JSON.parse(saved); } catch (e) { console.error(e); }
        return {};
    });
    const [currentViewName, setCurrentViewName] = useState(() => localStorage.getItem('colo-current-view-name') || '');

    const [isNavOpen, setIsNavOpen] = useState(false);
    const [isAlertsOpen, setIsAlertsOpen] = useState(false);
    const [isAdminMode, setIsAdminMode] = useState(() => localStorage.getItem('colo-admin-mode') === 'true');
    const [isAttendanceEnabled, setIsAttendanceEnabled] = useState(() => localStorage.getItem('colo-attendance-enabled') === 'true');
    const [adminPin, setAdminPin] = useState(() => localStorage.getItem('colo-admin-pin') || '1234');
    const [isUserSwitcherOpen, setIsUserSwitcherOpen] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState('connecting'); // 'connecting', 'connected', 'error'
    const [retryCount, setRetryCount] = useState(0);

    const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
    const [isAuthenticated, setIsAuthenticated] = useState(() => localStorage.getItem('colo-authenticated') === 'true');
    const isMobile = windowWidth < 1024;

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const [accessControl, setAccessControl] = useState(() => {
        const saved = localStorage.getItem('colo-access-control');
        try { return saved ? mergeAccessControl(JSON.parse(saved)) : defaultAccessControl; } catch (e) { return defaultAccessControl; }
    });
    const [activeUserId, setActiveUserId] = useState(() => localStorage.getItem('colo-active-user-id') || 'director');

    const staffUsers = useMemo(() => {
        const staff = (participants || []).filter((p) => p && (p.role === 'animator' || p.role === 'direction'));
        return [{ id: 'director', firstName: 'Direction', lastName: 'Générale', role: 'direction', pin: adminPin }, ...staff];
    }, [participants]);

    const activeUser = useMemo(() => {
        return staffUsers.find((u) => u.id === activeUserId) || staffUsers[0] || { id: 'director', firstName: 'Direction', lastName: 'Générale', role: 'direction' };
    }, [staffUsers, activeUserId]);

    const permissions = useMemo(() => {
        const role = activeUser?.role === 'direction' ? 'direction' : 'animator';
        const base = { ...(accessControl.rolePermissions?.[role] || defaultAccessControl.rolePermissions[role]) };
        const userOverride = accessControl.userPermissions?.[activeUser?.id] || {};
        if (!!accessControl.disabledUsers?.[activeUser?.id]) return Object.fromEntries(Object.keys(base).map((k) => [k, false]));
        return { ...base, ...userOverride };
    }, [activeUser, accessControl]);

    const actorHeaders = useMemo(() => ({
        'Content-Type': 'application/json',
        'x-actor-id': activeUser?.id || 'unknown',
        'x-actor-name': `${activeUser?.firstName || ''} ${activeUser?.lastName || ''}`.trim() || 'Unknown',
        'x-actor-role': activeUser?.role || 'unknown'
    }), [activeUser]);

    const canAccessSection = useCallback((sectionId) => {
        if (accessControl.hiddenSections?.[sectionId]) return false;
        const key = sectionPermissionMap[sectionId];
        if (!key) return true;
        return !!permissions[key];
    }, [accessControl.hiddenSections, permissions]);

    const navItems = useMemo(() => {
        const all = [
            { id: 'schedule', label: 'Planning', icon: <Calendar size={22} strokeWidth={2.5} /> },
            { id: 'exitsheet', label: 'Fiche de sortie', icon: <FileText size={22} strokeWidth={2.5} /> },
            { id: 'incident', label: 'FEI', icon: <AlertTriangle size={22} strokeWidth={2.5} /> },
            { id: 'recap', label: 'Coordination', icon: <ClipboardList size={22} strokeWidth={2.5} /> },
            { id: 'attendance', label: 'Pointage', icon: <ClipboardCheck size={22} strokeWidth={2.5} /> },
            { id: 'inventory', label: 'Matériel', icon: <Package size={22} strokeWidth={2.5} /> },
            { id: 'directory', label: 'Annuaire', icon: <Contact size={22} strokeWidth={2.5} /> }
        ];
        return all.filter((item) => canAccessSection(item.id));
    }, [canAccessSection]);

    useEffect(() => {
        if (activeTab === 'settings' && !permissions.viewSettings) { setActiveTab(navItems[0]?.id || 'schedule'); return; }
        if (activeTab !== 'settings' && !canAccessSection(activeTab)) { setActiveTab(navItems[0]?.id || 'schedule'); }
    }, [activeTab, permissions.viewSettings, canAccessSection, navItems]);

    useEffect(() => { localStorage.setItem('colo-active-tab', activeTab); }, [activeTab]);
    useEffect(() => { localStorage.setItem('colo-active-user-id', activeUserId); }, [activeUserId]);
    useEffect(() => { localStorage.setItem('colo-access-control', JSON.stringify(accessControl)); }, [accessControl]);
    useEffect(() => { localStorage.setItem('colo-authenticated', isAuthenticated); }, [isAuthenticated]);

    const handleLogin = (user) => {
        setActiveUserId(user.id);
        setIsAuthenticated(true);
    };

    const handleLogout = () => {
        setIsAuthenticated(false);
        setIsUserSwitcherOpen(false);
    };

    const healthAlerts = useMemo(() => {
        const alerts = [];
        const today = new Date();
        const currentMonth = today.getMonth();
        const currentDate = today.getDate();
        (participants || []).filter((p) => p && p.role === 'child').forEach((child) => {
            if (child.birthDate) {
                const bDate = new Date(child.birthDate);
                if (bDate.getMonth() === currentMonth && bDate.getDate() === currentDate) {
                    alerts.push({ id: `bday-${child.id}`, type: 'birthday', message: `Anniversaire : ${child.firstName} ${child.lastName}` });
                }
            }
            if (!child.healthDocProvided) {
                alerts.push({ id: `doc-${child.id}`, type: 'warning', message: `Fiche sanitaire manquante : ${child.firstName} ${child.lastName}` });
            }
        });
        return alerts;
    }, [participants]);

    const prefetchedTabs = useRef(new Set());
    const prefetchTab = useCallback((tabId) => {
        if (!tabId || prefetchedTabs.current.has(tabId)) return;
        const loader = tabPreloaders[tabId];
        if (loader) loader().then(() => prefetchedTabs.current.add(tabId)).catch(() => {});
    }, []);

    useEffect(() => {
        const first = nextLikelyTab[activeTab];
        if (first && canAccessSection(first)) prefetchTab(first);
    }, [activeTab, canAccessSection, prefetchTab]);

    useEffect(() => {
        const socket = io({
            reconnectionAttempts: 10,
            reconnectionDelay: 2000,
        });

        const refreshData = async (payload) => {
            if (ignoreNextSocketUpdate.current) {
                ignoreNextSocketUpdate.current = false;
                return;
            }
            try {
                const results = await Promise.all([
                    fetch(`${API_URL}/groups`), fetch(`${API_URL}/participants`),
                    fetch(`${API_URL}/activities`), fetch(`${API_URL}/state/savedViews`),
                    fetch(`${API_URL}/state/currentViewName`), fetch(`${API_URL}/state/adminPin`),
                    fetch(`${API_URL}/state/accessControl`), fetch(`${API_URL}/incident-sheets`),
                    fetch(`${API_URL}/exit-sheets`), fetch(`${API_URL}/meeting-recaps`),
                    fetch(`${API_URL}/inventory/items`)
                ]);
                
                // Check for any non-ok response
                const failed = results.find(r => !r.ok);
                if (failed) throw new Error(`Server returned ${failed.status}`);

                const data = await Promise.all(results.map(r => r.json()));
                setGroups(data[0]); setParticipants(data[1]); setActivities(data[2]); setSavedViews(data[3]);
                setCurrentViewName(data[4]); setAdminPin(data[5] || '1234'); setAccessControl(mergeAccessControl(data[6]));
                setIncidentSheets(data[7] || []);
                setExitSheets(data[8] || []);
                setMeetingRecaps(data[9] || []);
                setInventoryItems(data[10] || []);
                
                isDataLoaded.current = true;
                setConnectionStatus('connected');
                setRetryCount(0);
            } catch (err) { 
                console.error('Sync failed:', err);
                setConnectionStatus('error');
                // Auto-retry after a delay
                if (retryCount < 5) {
                    setTimeout(() => setRetryCount(prev => prev + 1), 3000);
                }
            }
        };

        refreshData();

        socket.on('connect', () => {
            console.log('Socket connected');
            setConnectionStatus('connected');
            if (!isDataLoaded.current) refreshData();
        });

        socket.on('disconnect', () => {
            console.warn('Socket disconnected');
            setConnectionStatus('error');
        });

        socket.on('connect_error', () => {
            setConnectionStatus('error');
        });

        socket.on('data_updated', refreshData);
        window._refreshBboardData = refreshData;
        
        // 10-second health check polling
        const healthCheck = setInterval(async () => {
            try {
                const response = await fetch(`${API_URL}/health`);
                if (response.ok) {
                    setConnectionStatus('connected');
                } else {
                    setConnectionStatus('error');
                }
            } catch (err) {
                setConnectionStatus('error');
            }
        }, 10000);

        return () => {
            socket.off('data_updated', refreshData);
            socket.disconnect();
            clearInterval(healthCheck);
        };
    }, [retryCount]);

    const mutateCollection = useCallback(async (endpoint, setter, update, currentValue) => {
        const finalValue = typeof update === 'function' ? update(currentValue) : update;
        setter(finalValue);
        ignoreNextSocketUpdate.current = true; 
        try {
            await fetch(endpoint, {
                method: 'POST',
                headers: actorHeaders,
                body: JSON.stringify(finalValue)
            });
        } catch (err) {
            console.error(`Failed to sync ${endpoint}:`, err);
            ignoreNextSocketUpdate.current = false;
        }
    }, [actorHeaders]);

    const loadingShell = (
        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="card-glass" style={{ padding: 'var(--space-lg)', background: 'white', borderRadius: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-md)', border: '1.5px solid var(--glass-border)' }}>
                <div className="spinner-large" />
                <div style={{ fontWeight: '950', color: 'var(--text-main)', fontSize: '1rem', letterSpacing: '-0.02em' }}>Assemblage du module...</div>
            </div>
        </div>
    );

    if (!isAuthenticated) {
        return <Login staffUsers={staffUsers} onLogin={handleLogin} adminPin={adminPin} connectionStatus={connectionStatus} />;
    }

    if (connectionStatus === 'error' && !isDataLoaded.current) {
        return (
            <div style={{ height: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-main)', padding: '2rem' }}>
                <div className="card-glass animate-scale-in" style={{ padding: '3rem', background: 'white', borderRadius: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', border: '2px solid var(--danger-color)', maxWidth: '400px', textAlign: 'center' }}>
                    <div style={{ width: '64px', height: '64px', background: 'oklch(62% 0.18 20 / 0.1)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--danger-color)' }}>
                        <AlertCircle size={32} strokeWidth={3} />
                    </div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '950', color: 'var(--text-main)', margin: 0 }}>Serveur injoignable</h2>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: '850', lineHeight: 1.5 }}>
                        Impossible de se connecter au backend. Vérifiez que le serveur est lancé et que vous êtes sur le bon réseau.
                    </p>
                    <div style={{ fontSize: '0.8rem', color: 'var(--primary-color)', fontWeight: '950' }}>
                        {retryCount > 0 ? `Tentative de reconnexion #${retryCount}...` : 'En attente de connexion...'}
                    </div>
                    <button onClick={() => window.location.reload()} className="btn btn-primary" style={{ marginTop: '1rem', width: '100%' }}>Réessayer manuellement</button>
                </div>
            </div>
        );
    }

    return (
        <div className="app-layout" style={{ background: 'var(--bg-main)', overflow: 'hidden', display: 'flex', width: '100vw', height: '100dvh' }}>
            {/* Sidebar Navigation */}
            <aside className={`nav-sidebar ${isNavOpen ? 'open' : ''}`} style={{ borderRight: '1.5px solid var(--glass-border)', background: 'var(--glass-bg)', backdropFilter: 'blur(32px)', zIndex: 110, transition: 'all 0.4s var(--ease-out-expo)', flexShrink: 0, width: isMobile ? '100%' : '250px' }}>
                <div style={{ padding: '1.75rem 1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Logo />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: '950', fontSize: '1.4rem', color: 'var(--text-main)', letterSpacing: '-0.05em', lineHeight: 1 }}>BBOARD</span>
                        <div style={{ fontSize: '9px', fontWeight: '950', color: 'var(--primary-color)', textTransform: 'uppercase', letterSpacing: '0.12em', marginTop: '2px' }}>Plateforme Session</div>
                    </div>
                </div>

                <nav style={{ padding: '0 0.85rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', flex: 1 }}>
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => { setActiveTab(item.id); setIsNavOpen(false); }}
                            onMouseEnter={() => prefetchTab(item.id)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.875rem 1.25rem',
                                border: 'none', background: activeTab === item.id ? 'var(--primary-gradient)' : 'transparent',
                                color: activeTab === item.id ? 'white' : 'var(--text-muted)',
                                borderRadius: '16px', fontWeight: '950', cursor: 'pointer', transition: 'all 0.3s var(--ease-out-expo)',
                                textAlign: 'left', fontSize: '0.9rem', boxShadow: activeTab === item.id ? '0 8px 24px var(--shadow-color)' : 'none'
                            }}
                        >
                            <span style={{ display: 'flex' }}>{item.icon}</span>
                            <span>{item.label}</span>
                            {activeTab === item.id && <Sparkles size={14} style={{ marginLeft: 'auto', opacity: 0.8 }} />}
                        </button>
                    ))}
                    
                    {permissions.viewSettings && (
                        <button
                            onClick={() => { setActiveTab('settings'); setIsNavOpen(false); }}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.875rem 1.25rem', marginTop: 'auto', marginBottom: '1.5rem',
                                border: 'none', background: activeTab === 'settings' ? 'var(--primary-gradient)' : 'transparent',
                                color: activeTab === 'settings' ? 'white' : 'var(--text-muted)',
                                borderRadius: '16px', fontWeight: '950', cursor: 'pointer', transition: 'all 0.3s var(--ease-out-expo)',
                                textAlign: 'left', fontSize: '0.9rem', boxShadow: activeTab === 'settings' ? '0 8px 24px var(--shadow-color)' : 'none'
                            }}
                        >
                            <SettingsIcon size={22} strokeWidth={2.5} />
                            <span>Paramètres</span>
                        </button>
                    )}
                </nav>
            </aside>

            {/* Mobile Overlays */}
            {isNavOpen && <div className="mobile-overlay" onClick={() => setIsNavOpen(false)} style={{ zIndex: 105, background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)' }} />}

            {/* Main Content */}
            <main style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', position: 'relative', minWidth: 0 }}>
                <div className="morph-blob" style={{ top: '-10%', right: '-5%' }} />
                <div className="morph-blob-2" style={{ bottom: '-5%', left: '5%' }} />

                {connectionStatus === 'error' && isDataLoaded.current && (
                    <div style={{
                        position: 'absolute', top: '100px', left: '50%', transform: 'translateX(-50%)',
                        zIndex: 1000, background: 'var(--danger-color)', color: 'white',
                        padding: '0.75rem 1.5rem', borderRadius: '100px', fontSize: '0.85rem',
                        fontWeight: '950', display: 'flex', alignItems: 'center', gap: '0.75rem',
                        boxShadow: '0 12px 32px rgba(220, 38, 38, 0.4)', pointerEvents: 'none'
                    }} className="animate-fade-in">
                        <AlertCircle size={16} strokeWidth={3} />
                        Mode Hors-ligne (Serveur déconnecté)
                    </div>
                )}

                {/* Topbar Header */}
                <header style={{ 
                    height: isMobile ? '70px' : '90px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: isMobile ? '0 0.75rem' : '0 2.5rem', background: 'rgba(255,255,255,0.4)', backdropFilter: 'blur(16px)',
                    borderBottom: '1.5px solid var(--glass-border)', zIndex: 100, transition: 'all 0.3s var(--ease-out-expo)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '0.5rem' : '1.5rem', minWidth: 0, flex: 1 }}>
                        {isMobile && (
                            <button onClick={() => setIsNavOpen(true)} className="btn-icon-ref" style={{ background: 'white', borderRadius: '12px', width: '40px', height: '40px' }}>
                                <Menu size={20} strokeWidth={3} />
                            </button>
                        )}
                        <h1 style={{ margin: 0, fontSize: isMobile ? '0.85rem' : '1.5rem', fontWeight: '950', fontFamily: 'Sora', color: 'var(--text-main)', letterSpacing: '-0.04em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>
                            {TAB_TITLES[activeTab] || activeTab}
                        </h1>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '0.5rem' : '1.25rem' }}>
                        {/* Notification Bell */}
                        <div style={{ position: 'relative' }}>
                            <button onClick={() => setIsAlertsOpen(!isAlertsOpen)} className="btn-icon-ref" style={{ background: 'white', borderRadius: '14px', width: isMobile ? '40px' : '44px', height: isMobile ? '40px' : '44px', color: isAlertsOpen ? 'var(--primary-color)' : 'var(--text-muted)' }}>
                                <Bell size={isMobile ? 20 : 22} strokeWidth={2.5} />
                                {healthAlerts.length > 0 && <span style={{ position: 'absolute', top: isMobile ? '8px' : '10px', right: isMobile ? '8px' : '10px', width: '8px', height: '8px', background: 'var(--danger-color)', borderRadius: '50%', border: '2px solid white' }} />}
                            </button>
                            
                            {isAlertsOpen && (
                                <div className="card-glass animate-scale-in" style={{ position: 'absolute', top: isMobile ? '50px' : '64px', right: 0, width: isMobile ? 'calc(100vw - 2rem)' : '360px', zIndex: 200, background: 'white', padding: 0, borderRadius: '24px', border: '1.5px solid var(--glass-border)', boxShadow: '0 40px 80px rgba(0,0,0,0.15)' }}>
                                    <div style={{ padding: '1.25rem', borderBottom: '1.5px solid var(--bg-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <h3 style={{ margin: 0, fontSize: '0.85rem', fontWeight: '950', color: 'var(--text-main)', letterSpacing: '0.02em' }}>ALERTES SANTÉ</h3>
                                        <div style={{ background: 'var(--danger-color)', color: 'white', fontSize: '10px', fontWeight: '950', padding: '2px 8px', borderRadius: '100px' }}>{healthAlerts.length}</div>
                                    </div>
                                    <div style={{ maxHeight: '350px', overflowY: 'auto', padding: '0.75rem' }} className="no-scrollbar">
                                        {healthAlerts.length === 0 ? <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontWeight: '850', fontSize: '0.9rem' }}>Tout est sous contrôle.</p> : healthAlerts.map(a => (
                                            <div key={a.id} style={{ padding: '1rem', borderRadius: '16px', background: a.type === 'birthday' ? 'oklch(62% 0.15 82 / 0.08)' : 'oklch(62% 0.18 20 / 0.05)', marginBottom: '0.5rem', display: 'flex', gap: '0.75rem' }}>
                                                <AlertCircle size={16} style={{ color: a.type === 'birthday' ? 'oklch(62% 0.15 82)' : 'var(--danger-color)', flexShrink: 0 }} strokeWidth={3} />
                                                <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: '850', lineHeight: '1.4', color: 'var(--text-main)' }}>{a.message}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {!isMobile && <div style={{ width: '1.5px', height: '24px', background: 'var(--glass-border)', margin: '0 0.5rem' }} />}

                        {/* User Profile Switcher */}
                        <div style={{ position: 'relative' }}>
                            <button onClick={() => setIsUserSwitcherOpen(!isUserSwitcherOpen)} style={{ background: 'white', border: '1.5px solid var(--glass-border)', borderRadius: '20px', padding: isMobile ? '0.25rem' : '0.4rem 0.4rem 0.4rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', transition: 'all 0.2s', boxShadow: 'var(--shadow-sm)' }}>
                                {!isMobile && (
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '0.85rem', fontWeight: '950', color: 'var(--text-main)', letterSpacing: '-0.02em' }}>{activeUser?.firstName}</div>
                                        <div style={{ fontSize: '9px', fontWeight: '950', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{activeUser?.role}</div>
                                    </div>
                                )}
                                <div style={{ width: isMobile ? '34px' : '40px', height: isMobile ? '34px' : '40px', background: 'var(--primary-gradient)', borderRadius: isMobile ? '10px' : '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '950', fontSize: isMobile ? '0.85rem' : '1rem', border: '2.5px solid white', boxShadow: '0 4px 12px var(--shadow-color)' }}>
                                    {activeUser?.firstName[0]}
                                </div>
                                {!isMobile && <ChevronDown size={14} style={{ marginRight: '0.5rem', opacity: 0.5 }} />}
                            </button>

                            {isUserSwitcherOpen && (
                                <div className="card-glass animate-scale-in" style={{ position: 'absolute', top: isMobile ? '50px' : '64px', right: 0, width: isMobile ? '240px' : '280px', zIndex: 200, background: 'white', padding: '0.75rem', borderRadius: '24px', border: '1.5px solid var(--glass-border)', boxShadow: '0 32px 64px rgba(0,0,0,0.12)' }}>
                                    <div style={{ padding: '0.5rem 0.75rem', fontSize: '10px', fontWeight: '950', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Profil actif</div>
                                    <div style={{ maxHeight: '250px', overflowY: 'auto' }} className="no-scrollbar">
                                        {staffUsers.map(u => (
                                            <button key={u.id} onClick={() => { setActiveUserId(u.id); setIsUserSwitcherOpen(false); }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.65rem 0.75rem', border: 'none', background: activeUserId === u.id ? 'var(--primary-light)' : 'transparent', borderRadius: '12px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}>
                                                <div style={{ width: '28px', height: '28px', background: u.role === 'direction' ? 'var(--primary-gradient)' : 'oklch(62% 0.18 200)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '950', fontSize: '0.75rem' }}>{u.firstName[0]}</div>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontSize: '0.85rem', fontWeight: '950', color: 'var(--text-main)' }}>{u.firstName}</div>
                                                    <div style={{ fontSize: '8px', fontWeight: '900', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{u.role}</div>
                                                </div>
                                                {activeUserId === u.id && <Sparkles size={12} color="var(--primary-color)" />}
                                            </button>
                                        ))}
                                        <div style={{ margin: '0.75rem 0', height: '1.5px', background: 'var(--glass-border)', opacity: 0.5 }} />
                                        <button onClick={handleLogout} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.65rem 0.75rem', border: 'none', background: 'transparent', borderRadius: '12px', cursor: 'pointer', textAlign: 'left', color: 'var(--danger-color)', fontWeight: '950' }}>
                                            <div style={{ width: '28px', height: '28px', background: 'oklch(62% 0.18 20 / 0.1)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <Zap size={14} />
                                            </div>
                                            <div style={{ fontSize: '0.85rem' }}>Déconnexion</div>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* Workspace Area */}
                <div style={{ flex: 1, padding: isMobile ? 'var(--space-sm)' : 'var(--space-md) 1rem', position: 'relative', overflowY: 'auto' }} className="no-scrollbar">
                    <Suspense fallback={loadingShell}>
                        <ErrorBoundary>
                            {activeTab === 'schedule' ? <Schedule activities={activities} setActivities={(v) => mutateCollection(`${API_URL}/activities`, setActivities, v, activities)} participants={participants} groups={groups} canEdit={permissions.editSchedule} isMobile={isMobile} />
                            : activeTab === 'exitsheet' ? <ExitSheet participants={participants} groups={groups} canEdit={permissions.editExitSheet} actorHeaders={actorHeaders} exitSheets={exitSheets} setExitSheets={(v) => mutateCollection(`${API_URL}/exit-sheets`, setExitSheets, v, exitSheets)} onRefresh={window._refreshBboardData} isMobile={isMobile} />
                            : activeTab === 'recap' ? <MeetingRecap participants={participants} canEdit={permissions.editRecap} meetingRecaps={meetingRecaps} setMeetingRecaps={(v) => mutateCollection(`${API_URL}/meeting-recaps`, setMeetingRecaps, v, meetingRecaps)} onRefresh={window._refreshBboardData} isMobile={isMobile} />
                            : activeTab === 'incident' ? <IncidentSheet canEdit={permissions.editIncident} actorHeaders={actorHeaders} activeUser={activeUser} incidentSheets={incidentSheets} participants={participants} onRefresh={window._refreshBboardData} isMobile={isMobile} />
                            : activeTab === 'directory' ? <Directory participants={participants} setParticipants={(v) => mutateCollection(`${API_URL}/participants`, setParticipants, v, participants)} groups={groups} setGroups={(v) => mutateCollection(`${API_URL}/groups`, setGroups, v, groups)} canEdit={permissions.editDirectory} isMobile={isMobile} />
                            : activeTab === 'attendance' ? <Attendance participants={participants} setParticipants={(v) => mutateCollection(`${API_URL}/participants`, setParticipants, v, participants)} groups={groups} canEdit={permissions.editAttendance} isMobile={isMobile} />
                            : activeTab === 'inventory' ? <Inventory participants={participants} canEdit={permissions.editInventory} canSearchAI={permissions.searchInventoryAI} actorHeaders={actorHeaders} inventoryItems={inventoryItems} setInventoryItems={(v) => mutateCollection(`${API_URL}/inventory/items`, setInventoryItems, v, inventoryItems)} onRefresh={window._refreshBboardData} isMobile={isMobile} />
                            : activeTab === 'settings' ? <Settings
                                participants={participants} setParticipants={(v) => mutateCollection(`${API_URL}/participants`, setParticipants, v, participants)} groups={groups} setGroups={(v) => mutateCollection(`${API_URL}/groups`, setGroups, v, groups)}
                                activities={activities} setActivities={(v) => mutateCollection(`${API_URL}/activities`, setActivities, v, activities)} savedViews={savedViews} setSavedViews={(v) => mutateCollection(`${API_URL}/state/savedViews`, setSavedViews, v, savedViews)}
                                isAdminMode={isAdminMode} setIsAdminMode={setIsAdminMode} isAttendanceEnabled={isAttendanceEnabled}
                                setIsAttendanceEnabled={setIsAttendanceEnabled} adminPin={adminPin} setAdminPin={(v) => mutateCollection(`${API_URL}/state/adminPin`, setAdminPin, v, adminPin)}
                                accessControl={accessControl} setAccessControl={(v) => mutateCollection(`${API_URL}/state/accessControl`, setAccessControl, v, accessControl)}
                                actorHeaders={actorHeaders} currentUser={activeUser} permissions={permissions} isMobile={isMobile}
                            /> : null}
                        </ErrorBoundary>
                    </Suspense>
                </div>
            </main>

            <style>{`
                .btn-icon-ref {
                    border: 1.5px solid var(--glass-border);
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s var(--ease-out-expo);
                }
                .btn-icon-ref:hover {
                    transform: translateY(-2px);
                    border-color: var(--primary-color);
                    box-shadow: var(--shadow-md);
                }
                .spinner-large {
                    width: 48px;
                    height: 48px;
                    border: 5px solid var(--primary-light);
                    border-top-color: var(--primary-color);
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }
                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}
