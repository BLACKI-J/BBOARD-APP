import React, { useState, useEffect, useRef, useMemo, useCallback, Suspense } from 'react';
import { Calendar, Contact, Settings as SettingsIcon, Menu, ClipboardList, FileText, Bell, ClipboardCheck, AlertCircle, AlertTriangle, Package, Utensils, Zap, Sparkles, ChevronDown, Activity, LayoutDashboard } from 'lucide-react';
import { io } from 'socket.io-client';
import Login from './components/Login';
import { useUi } from './ui/UiProvider';
import { hasUnsavedChanges } from './utils/unsavedGuard';
import PullToRefresh from './components/common/PullToRefresh';
import SyncStatus from './components/common/SyncStatus';
import useAppStore from './store/useAppStore';

const loadSchedule = () => import('./components/Schedule');
const loadDirectory = () => import('./components/Directory');
const loadSettings = () => import('./components/Settings');
const loadMeetingRecap = () => import('./components/MeetingRecap');
const loadExitSheet = () => import('./components/ExitSheet');
const loadAttendance = () => import('./components/Attendance');
const loadIncidentSheet = () => import('./components/IncidentSheet');
const loadInventory = () => import('./components/Inventory');
const loadHealthCenter = () => import('./components/HealthCenter');
const loadHome = () => import('./components/Home');

const Schedule = React.lazy(loadSchedule);
const Directory = React.lazy(loadDirectory);
const Settings = React.lazy(loadSettings);
const MeetingRecap = React.lazy(loadMeetingRecap);
const ExitSheet = React.lazy(loadExitSheet);
const Attendance = React.lazy(loadAttendance);
const IncidentSheet = React.lazy(loadIncidentSheet);
const Inventory = React.lazy(loadInventory);
const HealthCenter = React.lazy(loadHealthCenter);
const Home = React.lazy(loadHome);

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
    home: 'Tableau de bord',
    seatmap: 'Transports',
    schedule: 'Planning',
    exitsheet: 'Fiche de sortie',
    incident: 'FEI',
    recap: 'Coordination',
    attendance: 'Pointage',
    inventory: 'Matériel',
    directory: 'Annuaire',
    settings: 'Paramètres',
    health: 'Santé'
};

const defaultAccessControl = {
    roles: [
        { id: 'direction', label: 'Direction', base: true },
        { id: 'animator', label: 'Animateur', base: true },
        { id: 'child', label: 'Enfant', base: true }
    ],
    hiddenSections: {
        home: false, schedule: false, exitsheet: false, incident: false,
        recap: false, attendance: false, inventory: false, directory: false, health: false
    },
    rolePermissions: {
        direction: {
            viewSchedule: true, editSchedule: true,
            viewExitSheet: true, editExitSheet: true, viewIncident: true, editIncident: true,
            viewRecap: true, editRecap: true, viewDirectory: true, editDirectory: true,
            viewAttendance: true, editAttendance: true, viewInventory: true, editInventory: true,
            viewHealth: true, editHealth: true,
            searchInventoryAI: true, viewSettings: true, manageUsers: true, manageAccess: true, viewLogs: true
        },
        animator: {
            viewSchedule: true, editSchedule: true,
            viewExitSheet: true, editExitSheet: true, viewIncident: true, editIncident: true,
            viewRecap: true, editRecap: true, viewDirectory: true, editDirectory: true,
            viewAttendance: true, editAttendance: true, viewInventory: true, editInventory: true,
            viewHealth: true, editHealth: true,
            searchInventoryAI: true, viewSettings: false, manageUsers: false, manageAccess: false, viewLogs: false
        },
        child: {}
    },
    userPermissions: {}, disabledUsers: {}, incidentAiDefaultMode: 'detaille'
};

function mergeAccessControl(raw) {
    const source = raw && typeof raw === 'object' ? raw : {};
    
    // Merge custom roles with base roles
    let mergedRoles = [...defaultAccessControl.roles];
    if (Array.isArray(source.roles)) {
        source.roles.forEach(sr => {
            if (!mergedRoles.find(mr => mr.id === sr.id)) mergedRoles.push(sr);
            else if (!sr.base) {
                // update existing custom role
                const idx = mergedRoles.findIndex(mr => mr.id === sr.id);
                mergedRoles[idx] = { ...mergedRoles[idx], ...sr };
            }
        });
    }

    return {
        ...defaultAccessControl, ...source,
        roles: mergedRoles,
        hiddenSections: { ...defaultAccessControl.hiddenSections, ...(source.hiddenSections || {}) },
        rolePermissions: {
            ...defaultAccessControl.rolePermissions,
            ...(source.rolePermissions || {})
        },
        userPermissions: { ...defaultAccessControl.userPermissions, ...(source.userPermissions || {}) },
        disabledUsers: { ...defaultAccessControl.disabledUsers, ...(source.disabledUsers || {}) }
    };
}

const sectionPermissionMap = {
    schedule: 'viewSchedule', exitsheet: 'viewExitSheet',
    incident: 'viewIncident', recap: 'viewRecap', attendance: 'viewAttendance',
    inventory: 'viewInventory', directory: 'viewDirectory', health: 'viewHealth'
};

const tabPreloaders = {
    home: loadHome, schedule: loadSchedule, exitsheet: loadExitSheet,
    incident: loadIncidentSheet, recap: loadMeetingRecap, attendance: loadAttendance,
    inventory: loadInventory, directory: loadDirectory, settings: loadSettings, health: loadHealthCenter
};

const nextLikelyTab = {
    home: 'schedule', schedule: 'exitsheet', exitsheet: 'incident',
    incident: 'recap', recap: 'attendance', attendance: 'directory',
    directory: 'inventory', inventory: 'home'
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
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '950', fontFamily: 'Bricolage Grotesque' }}>Interruption du service</h2>
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
    const ui = useUi();
    const isDataLoaded = useRef(false);
    const refreshDataRef = useRef(null);
    const ignoreNextSocketUpdate = useRef(false);
    const [activeTab, setActiveTab] = useState(() => localStorage.getItem('colo-active-tab') || 'home');
    const groups = useAppStore(s => s.groups);
    const setGroups = useAppStore(s => s.setGroups);
    const participants = useAppStore(s => s.participants);
    const setParticipants = useAppStore(s => s.setParticipants);
    const activities = useAppStore(s => s.activities);
    const setActivities = useAppStore(s => s.setActivities);
    const incidentSheets = useAppStore(s => s.incidentSheets);
    const setIncidentSheets = useAppStore(s => s.setIncidentSheets);
    const exitSheets = useAppStore(s => s.exitSheets);
    const setExitSheets = useAppStore(s => s.setExitSheets);
    const meetingRecaps = useAppStore(s => s.meetingRecaps);
    const setMeetingRecaps = useAppStore(s => s.setMeetingRecaps);
    const inventoryItems = useAppStore(s => s.inventoryItems);
    const setInventoryItems = useAppStore(s => s.setInventoryItems);
    const menus = useAppStore(s => s.menus);
    const setMenus = useAppStore(s => s.setMenus);

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
    const [isUserSwitcherOpen, setIsUserSwitcherOpen] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState('connecting'); // 'connecting', 'connected', 'error'
    const [retryCount, setRetryCount] = useState(0);
    const [lastSyncAt, setLastSyncAt] = useState(null);
    const [isSyncing, setIsSyncing] = useState(false);
    const [moreOpen, setMoreOpen] = useState(false);
    const [staffUsers, setStaffUsers] = useState([]);
    const [transmissions, setTransmissions] = useState([]);
    const [sessionUser, setSessionUser] = useState(null);
    const [authChecked, setAuthChecked] = useState(false);

    const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const isMobile = windowWidth < 1024;

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const [accessControl, setAccessControl] = useState(defaultAccessControl);
    const [activeUserId, setActiveUserId] = useState('');

    const activeUser = useMemo(() => {
        return sessionUser || staffUsers.find((u) => u.id === activeUserId) || { id: '', firstName: '', lastName: '', role: 'animator' };
    }, [staffUsers, activeUserId, sessionUser]);

    const permissions = useMemo(() => {
        const role = activeUser?.role || 'animator';
        const base = { ...(accessControl.rolePermissions?.[role] || accessControl.rolePermissions?.['animator'] || defaultAccessControl.rolePermissions.animator) };
        const userOverride = accessControl.userPermissions?.[activeUser?.id] || {};
        if (!!accessControl.disabledUsers?.[activeUser?.id]) return Object.fromEntries(Object.keys(base).map((k) => [k, false]));
        return { ...base, ...userOverride };
    }, [activeUser, accessControl]);

    const actorHeaders = useMemo(() => ({ 'Content-Type': 'application/json' }), []);

    const canAccessSection = useCallback((sectionId) => {
        if (accessControl.hiddenSections?.[sectionId]) return false;
        const key = sectionPermissionMap[sectionId];
        if (!key) return true;
        return !!permissions[key];
    }, [accessControl.hiddenSections, permissions]);

    const navItems = useMemo(() => {
        const all = [
            { id: 'home', label: 'Tableau de bord', icon: <LayoutDashboard size={22} strokeWidth={2.5} /> },
            { id: 'schedule', label: 'Planning', icon: <Calendar size={22} strokeWidth={2.5} /> },
            { id: 'exitsheet', label: 'Fiche de sortie', icon: <FileText size={22} strokeWidth={2.5} /> },
            { id: 'health', label: 'Santé', icon: <Activity size={22} strokeWidth={2.5} /> },
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

    const applyAuthenticatedSession = useCallback((payload) => {
        setSessionUser(payload.user);
        setActiveUserId(payload.user.id);
        setAccessControl(mergeAccessControl(payload.accessControl));
        setIsAuthenticated(true);
        setConnectionStatus('connected');
    }, []);

    const clearAuthenticatedSession = useCallback(() => {
        setSessionUser(null);
        setActiveUserId('');
        setIsAuthenticated(false);
        setIsUserSwitcherOpen(false);
        setParticipants([]);
        setGroups([]);
        setActivities([]);
        setMenus({});
        setIncidentSheets([]);
        setExitSheets([]);
        setMeetingRecaps([]);
        setTransmissions([]);
        setInventoryItems([]);
        isDataLoaded.current = false;
    }, []);

    useEffect(() => {
        localStorage.removeItem('colo-authenticated');
        localStorage.removeItem('colo-admin-pin');
        localStorage.removeItem('colo-active-user-id');
        localStorage.removeItem('colo-participants');
        localStorage.removeItem('colo-groups');
        localStorage.removeItem('colo-activities');
        localStorage.removeItem('colo-access-control');
        localStorage.removeItem('colo-menus');
        localStorage.removeItem('colo-van-config');

        const bootstrapSession = async () => {
            try {
                const profilesResponse = await fetch(`${API_URL}/auth/profiles`);
                if (!profilesResponse.ok) throw new Error(`Profiles returned ${profilesResponse.status}`);
                setStaffUsers(await profilesResponse.json());

                const sessionResponse = await fetch(`${API_URL}/auth/session`);
                const sessionData = sessionResponse.ok ? await sessionResponse.json() : null;
                if (sessionData?.authenticated) {
                    applyAuthenticatedSession(sessionData);
                } else {
                    clearAuthenticatedSession();
                    setConnectionStatus('connected');
                }
            } catch (err) {
                console.error('Session bootstrap failed:', err);
                clearAuthenticatedSession();
                setConnectionStatus('error');
            } finally {
                setAuthChecked(true);
            }
        };

        bootstrapSession();
    }, [applyAuthenticatedSession, clearAuthenticatedSession]);

    const handleLogin = async (user, pin) => {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id, pin })
        });
        if (!response.ok) throw new Error('Code PIN invalide');
        applyAuthenticatedSession(await response.json());
    };

    const handleLogout = useCallback(async () => {
        try {
            await fetch(`${API_URL}/auth/logout`, { method: 'POST' });
        } catch (err) {
            console.error('Logout failed:', err);
        } finally {
            clearAuthenticatedSession();
        }
    }, [clearAuthenticatedSession]);
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

    const navBadges = useMemo(() => {
        const kids = (participants || []).filter((p) => p && p.role === 'child');
        const absent = isAttendanceEnabled ? kids.filter((c) => !c.isPresent).length : 0;
        return { health: healthAlerts.length, attendance: absent };
    }, [participants, healthAlerts.length, isAttendanceEnabled]);

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
        if (!isAuthenticated) return undefined;

        const socket = io({
            reconnectionAttempts: 10,
            reconnectionDelay: 2000,
        });
        let retryTimer;

        const fetchJson = async (url, fallback) => {
            const response = await fetch(url);
            if (response.status === 401) {
                const error = new Error('Authentication expired');
                error.status = 401;
                throw error;
            }
            if (response.status === 403 && fallback !== undefined) return fallback;
            if (!response.ok) throw new Error(`Server returned ${response.status}`);
            return response.json();
        };

        const refreshData = async () => {
            setIsSyncing(true);
            try {
                const data = await Promise.all([
                    fetchJson(`${API_URL}/groups`, []),
                    fetchJson(`${API_URL}/participants`, []),
                    fetchJson(`${API_URL}/activities`, []),
                    fetchJson(`${API_URL}/state/accessControl`, {}),
                    fetchJson(`${API_URL}/incident-sheets`, []),
                    fetchJson(`${API_URL}/exit-sheets`, []),
                    fetchJson(`${API_URL}/meeting-recaps`, []),
                    fetchJson(`${API_URL}/inventory/items`, []),
                    fetchJson(`${API_URL}/auth/profiles`, []),
                    fetchJson(`${API_URL}/state/menus`, {}),
                    fetchJson(`${API_URL}/state/transmissions`, [])
                ]);

                const newGroups = data[0]; const newParticipants = data[1];
                setGroups(newGroups); setParticipants(newParticipants); setActivities(data[2]);
                setAccessControl(mergeAccessControl(data[3]));
                setIncidentSheets(data[4] || []);
                setExitSheets(data[5] || []);
                setMeetingRecaps(data[6] || []);
                setInventoryItems(data[7] || []);
                setStaffUsers(data[8] || []);
                setMenus(data[9] || {});
                setTransmissions(Array.isArray(data[10]) ? data[10] : []);
                // Sync to global store
                useAppStore.getState().setParticipants(newParticipants);
                useAppStore.getState().setGroups(newGroups);

                isDataLoaded.current = true;
                setConnectionStatus('connected');
                setRetryCount(0);
                setLastSyncAt(Date.now());
            } catch (err) {
                console.error('Sync failed:', err);
                if (err.status === 401) {
                    clearAuthenticatedSession();
                    return;
                }
                setConnectionStatus('error');
                if (retryCount < 5) {
                    retryTimer = setTimeout(() => setRetryCount((prev) => prev + 1), 3000);
                }
            } finally {
                setIsSyncing(false);
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
        refreshDataRef.current = refreshData;

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
            clearTimeout(retryTimer);
            if (refreshDataRef.current === refreshData) refreshDataRef.current = null;
        };
    }, [clearAuthenticatedSession, isAuthenticated, retryCount]);

    const mutateCollection = useCallback(async (endpoint, setter, update, currentValue) => {
        const finalValue = typeof update === 'function' ? update(currentValue) : update;
        setter(finalValue);
        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: actorHeaders,
                body: JSON.stringify(finalValue)
            });
            if (response.status === 401) clearAuthenticatedSession();
            if (!response.ok) throw new Error(`Server returned ${response.status}`);
        } catch (err) {
            console.error(`Failed to sync ${endpoint}:`, err);
            setter(currentValue);
        }
    }, [actorHeaders, clearAuthenticatedSession]);

    const onRefresh = useCallback(() => refreshDataRef.current?.(), []);

    // Blocks tab changes while a form holds unsaved edits (see useUnsavedGuard).
    const guardedNavigate = useCallback(async (tab) => {
        if (tab !== activeTab && hasUnsavedChanges()) {
            const ok = await ui.confirm({
                title: 'Modifications non enregistrées',
                message: 'Vous avez des modifications non enregistrées. Quitter cette section ?',
                confirmText: 'Quitter', cancelText: 'Rester', danger: true
            });
            if (!ok) return;
        }
        setActiveTab(tab);
        setIsNavOpen(false);
    }, [activeTab, ui]);

    const setSyncedMenus = useCallback((v) => {
        mutateCollection(`${API_URL}/state/menus`, setMenus, v, menus);
    }, [mutateCollection, menus]);

    const setSyncedTransmissions = useCallback((v) => {
        mutateCollection(`${API_URL}/state/transmissions`, setTransmissions, v, transmissions);
    }, [mutateCollection, transmissions]);

    const loadingShell = (
        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="card-glass" style={{ padding: 'var(--space-lg)', background: 'white', borderRadius: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-md)', border: '1.5px solid var(--glass-border)' }}>
                <div className="spinner-large" />
                <div style={{ fontWeight: '950', color: 'var(--text-main)', fontSize: '1rem', letterSpacing: '-0.02em' }}>Assemblage du module...</div>
            </div>
        </div>
    );

    if (!authChecked) {
        return <div style={{ height: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-main)' }}><div className="spinner-large" /></div>;
    }

    if (!isAuthenticated) {
        return <Login staffUsers={staffUsers} onLogin={handleLogin} connectionStatus={connectionStatus} />;
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
        <div className="app-layout" style={{ background: 'transparent', overflow: 'hidden', display: 'flex', width: '100vw', height: '100dvh' }}>
            {/* Sidebar Navigation — desktop only */}
            {!isMobile && <aside className={`nav-sidebar ${isNavOpen ? 'open' : ''}`} style={{ borderRight: '1.5px solid var(--glass-border)', background: 'var(--glass-bg)', backdropFilter: 'blur(32px)', zIndex: 110, transition: 'all 0.4s var(--ease-out-expo)', flexShrink: 0, width: '250px' }}>
                <div style={{ padding: '1.75rem 1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Logo />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontFamily: 'Bricolage Grotesque, sans-serif', fontWeight: '950', fontSize: '1.4rem', color: 'var(--text-main)', letterSpacing: '-0.05em', lineHeight: 1 }}>BBOARD</span>
                        <div style={{ fontSize: '9px', fontWeight: '950', color: 'var(--primary-color)', textTransform: 'uppercase', letterSpacing: '0.12em', marginTop: '2px' }}>Plateforme Session</div>
                    </div>
                </div>

                <nav style={{ padding: '0 0.85rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', flex: 1 }}>
                    {navItems.map((item) => {
                        const isActive = activeTab === item.id;
                        const badge = navBadges[item.id] || 0;
                        return (
                        <button
                            key={item.id}
                            onClick={() => guardedNavigate(item.id)}
                            onMouseEnter={() => prefetchTab(item.id)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.875rem 1.25rem',
                                border: 'none', background: isActive ? 'var(--primary-gradient)' : 'transparent',
                                color: isActive ? 'white' : 'var(--text-muted)',
                                borderRadius: '16px', fontWeight: '950', cursor: 'pointer', transition: 'all 0.3s var(--ease-out-expo)',
                                textAlign: 'left', fontSize: '0.9rem', boxShadow: isActive ? '0 8px 24px var(--shadow-color)' : 'none'
                            }}
                        >
                            <span style={{ display: 'flex' }}>{item.icon}</span>
                            <span>{item.label}</span>
                            {badge > 0 ? (
                                <span style={{
                                    marginLeft: 'auto', minWidth: '20px', height: '20px', padding: '0 6px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    background: isActive ? 'rgba(255,255,255,0.28)' : 'var(--danger-color)',
                                    color: 'white', fontSize: '10px', fontWeight: '950', borderRadius: '10px'
                                }}>{badge > 99 ? '99+' : badge}</span>
                            ) : isActive ? (
                                <Sparkles size={14} style={{ marginLeft: 'auto', opacity: 0.8 }} />
                            ) : null}
                        </button>
                        );
                    })}

                    {permissions.viewSettings && (
                        <button
                            onClick={() => guardedNavigate('settings')}
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
            </aside>}

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
                    height: isMobile ? '56px' : '90px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: isMobile ? '0 0.875rem' : '0 2.5rem', background: 'rgba(255,255,255,0.4)', backdropFilter: 'blur(16px)',
                    borderBottom: '1.5px solid var(--glass-border)', zIndex: 100, transition: 'all 0.3s var(--ease-out-expo)',
                    flexShrink: 0
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '0.625rem' : '1.5rem', minWidth: 0, flex: 1 }}>
                        {!isMobile && <Logo />}
                        <h1 style={{ margin: 0, fontSize: isMobile ? '1rem' : '1.5rem', fontWeight: '950', fontFamily: 'Bricolage Grotesque', color: 'var(--text-main)', letterSpacing: '-0.03em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>
                            {TAB_TITLES[activeTab] || activeTab}
                        </h1>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '0.375rem' : '1.25rem', flexShrink: 0 }}>
                        {/* Sync status — desktop only; mobile shows dot via SyncStatus isMobile */}
                        <SyncStatus status={connectionStatus} isSyncing={isSyncing} lastSyncAt={lastSyncAt} onRefresh={onRefresh} isMobile={isMobile} />

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
                                            <button key={u.id} onClick={() => { if (activeUserId === u.id) setIsUserSwitcherOpen(false); else handleLogout(); }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.65rem 0.75rem', border: 'none', background: activeUserId === u.id ? 'var(--primary-light)' : 'transparent', borderRadius: '12px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}>
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
                <PullToRefresh
                    onRefresh={onRefresh}
                    disabled={!isMobile}
                    className="no-scrollbar"
                    style={{ flex: 1, padding: isMobile ? `var(--space-sm) var(--space-sm) 84px` : 'var(--space-md) 1rem', position: 'relative', overflowY: 'auto' }}
                >
                    <Suspense fallback={loadingShell}>
                        <ErrorBoundary key={activeTab}>
                            <div className="animate-fade-in" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                                {activeTab === 'home' ? <Home activities={activities} participants={participants} groups={groups} menus={menus} healthAlerts={healthAlerts} transmissions={transmissions} setTransmissions={setSyncedTransmissions} activeUser={activeUser} onNavigate={guardedNavigate} isMobile={isMobile} />
                                : activeTab === 'schedule' ? <Schedule activities={activities} setActivities={(v) => mutateCollection(`${API_URL}/activities`, setActivities, v, activities)} participants={participants} groups={groups} canEdit={permissions.editSchedule} menus={menus} setMenus={setSyncedMenus} />
                                : activeTab === 'exitsheet' ? <ExitSheet participants={participants} groups={groups} canEdit={permissions.editExitSheet} actorHeaders={actorHeaders} exitSheets={exitSheets} setExitSheets={(v) => mutateCollection(`${API_URL}/exit-sheets`, setExitSheets, v, exitSheets)} onRefresh={onRefresh} isMobile={isMobile} />
                                : activeTab === 'recap' ? <MeetingRecap participants={participants} canEdit={permissions.editRecap} meetingRecaps={meetingRecaps} setMeetingRecaps={(v) => mutateCollection(`${API_URL}/meeting-recaps`, setMeetingRecaps, v, meetingRecaps)} onRefresh={onRefresh} isMobile={isMobile} />
                                : activeTab === 'incident' ? <IncidentSheet canEdit={permissions.editIncident} actorHeaders={actorHeaders} activeUser={activeUser} incidentSheets={incidentSheets} participants={participants} onRefresh={onRefresh} isMobile={isMobile} />
                                : activeTab === 'directory' ? <Directory participants={participants} setParticipants={(v) => mutateCollection(`${API_URL}/participants`, setParticipants, v, participants)} groups={groups} setGroups={(v) => mutateCollection(`${API_URL}/groups`, setGroups, v, groups)} canEdit={permissions.editDirectory} isMobile={isMobile} roles={accessControl.roles} />
                                : activeTab === 'attendance' ? <Attendance participants={participants} setParticipants={(v) => mutateCollection(`${API_URL}/participants`, setParticipants, v, participants)} groups={groups} canEdit={permissions.editAttendance} isMobile={isMobile} />
                                : activeTab === 'inventory' ? <Inventory participants={participants} canEdit={permissions.editInventory} canSearchAI={permissions.searchInventoryAI} actorHeaders={actorHeaders} inventoryItems={inventoryItems} setInventoryItems={(v) => mutateCollection(`${API_URL}/inventory/items`, setInventoryItems, v, inventoryItems)} onRefresh={onRefresh} isMobile={isMobile} />
                                : activeTab === 'health' ? <HealthCenter participants={participants} setParticipants={(v) => mutateCollection(`${API_URL}/participants`, setParticipants, v, participants)} groups={groups} canEdit={permissions.editHealth} actorHeaders={actorHeaders} onRefresh={onRefresh} transmissions={transmissions} setTransmissions={setSyncedTransmissions} activeUser={activeUser} isMobile={isMobile} />
                                : activeTab === 'settings' ? <Settings
                                    participants={participants} setParticipants={(v) => mutateCollection(`${API_URL}/participants`, setParticipants, v, participants)} groups={groups} setGroups={(v) => mutateCollection(`${API_URL}/groups`, setGroups, v, groups)}
                                    activities={activities} setActivities={(v) => mutateCollection(`${API_URL}/activities`, setActivities, v, activities)} savedViews={savedViews} setSavedViews={(v) => mutateCollection(`${API_URL}/state/savedViews`, setSavedViews, v, savedViews)}
                                    isAdminMode={isAdminMode} setIsAdminMode={setIsAdminMode} isAttendanceEnabled={isAttendanceEnabled}
                                    setIsAttendanceEnabled={setIsAttendanceEnabled}
                                    accessControl={accessControl} setAccessControl={(v) => mutateCollection(`${API_URL}/state/accessControl`, setAccessControl, v, accessControl)}
                                    actorHeaders={actorHeaders} currentUser={activeUser} permissions={permissions} isMobile={isMobile}
                                /> : null}
                            </div>
                        </ErrorBoundary>
                    </Suspense>
                </PullToRefresh>
            </main>

            {/* ── Bottom Nav Bar (mobile only) ── */}
            {isMobile && (() => {
                const PRIMARY_TABS = ['home', 'health', 'schedule', 'attendance', 'directory'];
                const primaryItems = navItems.filter(i => PRIMARY_TABS.includes(i.id));
                const moreItems = navItems.filter(i => !PRIMARY_TABS.includes(i.id));
                const isMoreActive = moreItems.some(i => i.id === activeTab) || activeTab === 'settings';
                return (
                    <>
                        {/* Backdrop for "more" drawer */}
                        {moreOpen && <div onClick={() => setMoreOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 199, background: 'rgba(0,0,0,0.25)', backdropFilter: 'blur(4px)' }} />}

                        {/* More drawer */}
                        {moreOpen && (
                            <div className="animate-scale-in" style={{ position: 'fixed', bottom: '68px', left: '1rem', right: '1rem', zIndex: 200, background: 'white', borderRadius: '24px', padding: '0.75rem', boxShadow: '0 -4px 40px rgba(0,0,0,0.15)', border: '1.5px solid var(--glass-border)' }}>
                                {[...moreItems, ...(permissions.viewSettings ? [{ id: 'settings', label: 'Paramètres', icon: <SettingsIcon size={20} strokeWidth={2.5} /> }] : [])].map(item => (
                                    <button key={item.id} onClick={() => { guardedNavigate(item.id); setMoreOpen(false); }}
                                        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.875rem 1rem', borderRadius: '14px', border: 'none', cursor: 'pointer', textAlign: 'left', fontWeight: '850', fontSize: '0.92rem', background: activeTab === item.id ? 'var(--primary-light)' : 'transparent', color: activeTab === item.id ? 'var(--primary-color)' : 'var(--text-main)' }}>
                                        <span style={{ color: activeTab === item.id ? 'var(--primary-color)' : 'var(--text-muted)' }}>{item.icon}</span>
                                        {item.label}
                                        {navBadges[item.id] > 0 && <span style={{ marginLeft: 'auto', minWidth: '20px', height: '20px', padding: '0 6px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--danger-color)', color: 'white', fontSize: '10px', fontWeight: '950', borderRadius: '10px' }}>{navBadges[item.id]}</span>}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Bottom bar */}
                        <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 200, height: '64px', background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(20px)', borderTop: '1px solid var(--glass-border)', display: 'flex', alignItems: 'stretch', paddingBottom: 'env(safe-area-inset-bottom)', boxShadow: '0 -4px 20px rgba(0,0,0,0.07)' }}>
                            {primaryItems.map(item => {
                                const isActive = activeTab === item.id;
                                const badge = navBadges[item.id] || 0;
                                return (
                                    <button key={item.id} onClick={() => guardedNavigate(item.id)} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '3px', border: 'none', background: 'transparent', cursor: 'pointer', color: isActive ? 'var(--primary-color)' : 'var(--text-muted)', position: 'relative', minHeight: '44px' }}>
                                        <span style={{ position: 'relative', display: 'flex' }}>
                                            {item.icon}
                                            {badge > 0 && <span style={{ position: 'absolute', top: '-5px', right: '-7px', minWidth: '16px', height: '16px', padding: '0 4px', background: 'var(--danger-color)', color: 'white', fontSize: '9px', fontWeight: '950', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid white' }}>{badge > 9 ? '9+' : badge}</span>}
                                        </span>
                                        <span style={{ fontSize: '9px', fontWeight: isActive ? '950' : '800', letterSpacing: '0.01em', lineHeight: 1 }}>{item.label.length > 8 ? item.label.slice(0, 7) + '.' : item.label}</span>
                                        {isActive && <span style={{ position: 'absolute', bottom: '0', left: '50%', transform: 'translateX(-50%)', width: '20px', height: '3px', background: 'var(--primary-color)', borderRadius: '999px 999px 0 0' }} />}
                                    </button>
                                );
                            })}
                            {/* More button */}
                            {(moreItems.length > 0 || permissions.viewSettings) && (
                                <button onClick={() => setMoreOpen(o => !o)} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '3px', border: 'none', background: 'transparent', cursor: 'pointer', color: isMoreActive || moreOpen ? 'var(--primary-color)' : 'var(--text-muted)', minHeight: '44px' }}>
                                    <Menu size={22} strokeWidth={2.5} />
                                    <span style={{ fontSize: '9px', fontWeight: isMoreActive || moreOpen ? '950' : '800', letterSpacing: '0.01em', lineHeight: 1 }}>Plus</span>
                                </button>
                            )}
                        </nav>
                    </>
                );
            })()}

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
