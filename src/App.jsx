import React, { useState, useEffect, useRef, useMemo, useCallback, Suspense } from 'react';
import { Calendar, Contact, Settings as SettingsIcon, Menu, ClipboardList, FileText, Bell, ClipboardCheck, AlertCircle, AlertTriangle, Package, Zap, Sparkles, ChevronDown, Activity, LayoutDashboard } from 'lucide-react';
import { io } from 'socket.io-client';
import Login from './components/Login';
import { useUi } from './ui/UiProvider';
import { hasUnsavedChanges } from './utils/unsavedGuard';
import { apiSend } from './utils/api';
import useIsMobile from './utils/useIsMobile';
import PullToRefresh from './components/common/PullToRefresh';
import SyncStatus from './components/common/SyncStatus';
import useAppStore from './store/useAppStore';
import { BADGE_TONE, resolveNavGroups } from './config/nav';

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
            viewScheduleActivities: true, editScheduleActivities: true, viewScheduleMenus: true, editScheduleMenus: true,
            viewExitSheet: true, editExitSheet: true, viewIncident: true, editIncident: true,
            viewRecap: true, editRecap: true, viewDirectory: true, editDirectory: true,
            viewAttendance: true, editAttendance: true, viewInventory: true, editInventory: true,
            viewHealth: true, editHealth: true,
            viewHealthInfovac: true, editHealthInfovac: true, viewHealthMeds: true, editHealthMeds: true,
            viewHealthTransmissions: true, editHealthTransmissions: true,
            viewHealthRegistreMeds: true, editHealthRegistreMeds: true,
            viewHealthPassages: true, editHealthPassages: true,
            viewHealthNuit: true, editHealthNuit: true,
            searchInventoryAI: true, viewSettings: true, manageUsers: true, manageAccess: true, viewLogs: true
        },
        animator: {
            viewSchedule: true, editSchedule: true,
            viewScheduleActivities: true, editScheduleActivities: true, viewScheduleMenus: true, editScheduleMenus: true,
            viewExitSheet: true, editExitSheet: true, viewIncident: true, editIncident: true,
            viewRecap: true, editRecap: true, viewDirectory: true, editDirectory: true,
            viewAttendance: true, editAttendance: true, viewInventory: true, editInventory: true,
            viewHealth: true, editHealth: true,
            viewHealthInfovac: true, editHealthInfovac: true, viewHealthMeds: true, editHealthMeds: true,
            viewHealthTransmissions: true, editHealthTransmissions: true,
            viewHealthRegistreMeds: true, editHealthRegistreMeds: true,
            viewHealthPassages: true, editHealthPassages: true,
            viewHealthNuit: true, editHealthNuit: true,
            searchInventoryAI: true, viewSettings: false, manageUsers: false, manageAccess: false, viewLogs: false
        },
        child: {}
    },
    userPermissions: {}, disabledUsers: {}, incidentAiDefaultMode: 'detaille',
    // Ordre personnalisé de la sidebar (réglage admin global). Vide = ordre par défaut NAV_GROUPS.
    navOrder: { groups: [], items: {} }
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
        rolePermissions: Object.fromEntries(
            Object.keys({ ...defaultAccessControl.rolePermissions, ...(source.rolePermissions || {}) }).map(role => [
                role,
                { ...(defaultAccessControl.rolePermissions[role] || {}), ...((source.rolePermissions || {})[role] || {}) }
            ])
        ),
        userPermissions: { ...defaultAccessControl.userPermissions, ...(source.userPermissions || {}) },
        disabledUsers: { ...defaultAccessControl.disabledUsers, ...(source.disabledUsers || {}) },
        navOrder: {
            groups: Array.isArray(source.navOrder?.groups) ? source.navOrder.groups : [],
            items: (source.navOrder?.items && typeof source.navOrder.items === 'object') ? source.navOrder.items : {}
        }
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

    const [isAlertsOpen, setIsAlertsOpen] = useState(false);
    const [isAttendanceEnabled, setIsAttendanceEnabled] = useState(() => localStorage.getItem('colo-attendance-enabled') === 'true');
    const [isUserSwitcherOpen, setIsUserSwitcherOpen] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState('connecting'); // 'connecting', 'connected', 'error'
    const [retryCount, setRetryCount] = useState(0);
    const retryCountRef = useRef(0);
    const [lastSyncAt, setLastSyncAt] = useState(null);
    const [isSyncing, setIsSyncing] = useState(false);
    const [moreOpen, setMoreOpen] = useState(false);
    const [navHidden, setNavHidden] = useState(false); // capsule du bas masquée au scroll vers le bas
    const [staffUsers, setStaffUsers] = useState([]);
    const [transmissions, setTransmissions] = useState([]);
    const [nightLogs, setNightLogs] = useState([]);
    const [sessionUser, setSessionUser] = useState(null);
    const [authChecked, setAuthChecked] = useState(false);

    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const isMobile = useIsMobile();

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

    // Sections rangées par catégorie pour la sidebar, dans l'ordre admin (navOrder)
    // appliqué sur la structure par défaut, filtré aux sections accessibles.
    const navGroups = useMemo(() => {
        const byId = Object.fromEntries(navItems.map((it) => [it.id, it]));
        const accessibleIds = new Set(navItems.map((it) => it.id));
        return resolveNavGroups(accessControl?.navOrder, accessibleIds)
            .map((g) => ({ ...g, items: g.items.map((id) => byId[id]).filter(Boolean) }))
            .filter((g) => g.items.length > 0);
    }, [navItems, accessControl]);

    useEffect(() => {
        if (activeTab === 'settings' && !permissions.viewSettings) { setActiveTab(navItems[0]?.id || 'home'); return; }
        if (activeTab !== 'settings' && !canAccessSection(activeTab)) { setActiveTab(navItems[0]?.id || 'home'); }
    }, [activeTab, permissions.viewSettings, canAccessSection, navItems]);

    useEffect(() => { localStorage.setItem('colo-active-tab', activeTab); }, [activeTab]);
    // Capsule du bas : se masque au scroll vers le bas (révèle le contenu, pas de
    // bande réservée), réapparaît au scroll vers le haut. Écoute en CAPTURE →
    // fonctionne pour n'importe quel conteneur scrollable (App ou scroll interne d'une page).
    useEffect(() => {
        if (!isMobile) return;
        const lastY = new WeakMap();
        const onScroll = (e) => {
            const el = e.target;
            if (!el || el.nodeType !== 1 || typeof el.scrollTop !== 'number') return;
            const y = el.scrollTop;
            const prev = lastY.get(el) ?? 0;
            if (y < 48) setNavHidden(false);
            else if (y > prev + 6) setNavHidden(true);
            else if (y < prev - 6) setNavHidden(false);
            lastY.set(el, y);
        };
        document.addEventListener('scroll', onScroll, true);
        return () => document.removeEventListener('scroll', onScroll, true);
    }, [isMobile]);
    // Toujours visible quand on change d'onglet.
    useEffect(() => { setNavHidden(false); }, [activeTab]);
    useEffect(() => { localStorage.setItem('colo-attendance-enabled', String(isAttendanceEnabled)); }, [isAttendanceEnabled]);

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
        setNightLogs([]);
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
        if (!response.ok) {
            // 401 = mauvais PIN (message générique). 403/409 = compte désactivé /
            // sans PIN défini → on remonte le message serveur pour guider l'utilisateur.
            let message = 'Code PIN invalide';
            if (response.status !== 401) {
                try { const data = await response.json(); if (data?.error) message = data.error; } catch { /* corps non JSON */ }
            }
            const err = new Error(message);
            err.status = response.status;
            throw err;
        }
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
            reconnectionAttempts: Infinity,
            reconnectionDelay: 2000,
            reconnectionDelayMax: 5000,
        });
        let retryTimer;
        let intentionalClose = false; // déconnexion volontaire (logout/démontage) → pas une panne
        let hasConnectedOnce = false; // premier 'connect' déjà couvert par le refreshData() initial

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
                    fetchJson(`${API_URL}/state/transmissions`, []),
                    fetchJson(`${API_URL}/state/nightLogs`, [])
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
                setNightLogs(Array.isArray(data[11]) ? data[11] : []);

                isDataLoaded.current = true;
                setConnectionStatus('connected');
                clearTimeout(retryTimer); // un refresh réussi annule tout retry en attente
                retryCountRef.current = 0;
                setRetryCount(0);
                setLastSyncAt(Date.now());
            } catch (err) {
                console.error('Sync failed:', err);
                if (err.status === 401) {
                    clearAuthenticatedSession();
                    return;
                }
                setConnectionStatus('error');
                // Retry via timer direct (PAS via le state en dépendance d'effet :
                // ça détruisait/recréait le socket à chaque tentative).
                if (retryCountRef.current < 5) {
                    retryCountRef.current += 1;
                    setRetryCount(retryCountRef.current); // affichage uniquement
                    clearTimeout(retryTimer); // jamais deux timers en vol
                    retryTimer = setTimeout(refreshData, 3000);
                }
            } finally {
                setIsSyncing(false);
            }
        };

        refreshData();

        socket.on('connect', () => {
            setConnectionStatus('connected');
            // Première connexion : le refreshData() initial l'a déjà couverte → pas de double sync.
            // Reconnexions : resynchroniser (un 'data_updated' manqué pendant une coupure
            // réseau ne serait jamais rattrapé sinon → UI périmée).
            if (!hasConnectedOnce) { hasConnectedOnce = true; return; }
            refreshData();
        });

        socket.on('disconnect', () => {
            if (intentionalClose) return; // logout/démontage : ne pas signaler une panne
            console.warn('Socket disconnected');
            setConnectionStatus('error');
        });

        socket.on('connect_error', () => {
            setConnectionStatus('error');
        });

        // Refetch CIBLÉ : ne recharge que la collection changée (le serveur envoie
        // le `type`). Évite de retélécharger les 11 collections (dont participants
        // avec photos) à chaque mutation. Type inconnu ou échec → repli complet.
        const refreshOne = async (payload) => {
            const type = payload?.type;
            try {
                switch (type) {
                    case 'participants':
                        setParticipants(await fetchJson(`${API_URL}/participants`, []));
                        fetchJson(`${API_URL}/auth/profiles`, []).then((p) => setStaffUsers(p || [])).catch(() => {});
                        break;
                    case 'groups': setGroups(await fetchJson(`${API_URL}/groups`, [])); break;
                    case 'activities': setActivities(await fetchJson(`${API_URL}/activities`, [])); break;
                    case 'exitsheets': setExitSheets(await fetchJson(`${API_URL}/exit-sheets`, []) || []); break;
                    case 'incidentsheets': setIncidentSheets(await fetchJson(`${API_URL}/incident-sheets`, []) || []); break;
                    case 'meetingrecaps': setMeetingRecaps(await fetchJson(`${API_URL}/meeting-recaps`, []) || []); break;
                    case 'inventory': setInventoryItems(await fetchJson(`${API_URL}/inventory/items`, []) || []); break;
                    case 'state': {
                        const key = payload?.key;
                        if (key === 'accessControl') setAccessControl(mergeAccessControl(await fetchJson(`${API_URL}/state/accessControl`, {})));
                        else if (key === 'menus') setMenus(await fetchJson(`${API_URL}/state/menus`, {}) || {});
                        else if (key === 'transmissions') { const t = await fetchJson(`${API_URL}/state/transmissions`, []); setTransmissions(Array.isArray(t) ? t : []); }
                        else if (key === 'nightLogs') { const n = await fetchJson(`${API_URL}/state/nightLogs`, []); setNightLogs(Array.isArray(n) ? n : []); }
                        else refreshData();
                        break;
                    }
                    default: refreshData(); // type inconnu → refresh complet (sécurité)
                }
                setLastSyncAt(Date.now());
            } catch (err) {
                if (err.status === 401) { clearAuthenticatedSession(); return; }
                refreshData(); // échec du refetch ciblé → repli complet
            }
        };

        // Anti-rafale : une restauration d'archive (ou un import) émet des dizaines de
        // data_updated du même type en quelques secondes → on regroupe par type (400 ms).
        const pendingRefresh = new Map();
        const debouncedRefreshOne = (payload) => {
            const key = `${payload?.type || '?'}:${payload?.key || ''}`;
            clearTimeout(pendingRefresh.get(key));
            pendingRefresh.set(key, setTimeout(() => {
                pendingRefresh.delete(key);
                refreshOne(payload);
            }, 400));
        };

        socket.on('data_updated', debouncedRefreshOne);
        refreshDataRef.current = refreshData;

        // 10-second health check polling — pausé en arrière-plan (économie batterie/data mobile)
        const healthCheck = setInterval(async () => {
            if (typeof document !== 'undefined' && document.hidden) return;
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
            intentionalClose = true; // empêche le handler 'disconnect' de passer en erreur
            socket.off('data_updated', debouncedRefreshOne);
            pendingRefresh.forEach((t) => clearTimeout(t));
            socket.disconnect();
            clearInterval(healthCheck);
            clearTimeout(retryTimer);
            if (refreshDataRef.current === refreshData) refreshDataRef.current = null;
        };
    }, [clearAuthenticatedSession, isAuthenticated]);

    const mutateCollection = useCallback(async (endpoint, setter, update, currentValue) => {
        const finalValue = typeof update === 'function' ? update(currentValue) : update;
        setter(finalValue); // maj optimiste
        try {
            await apiSend('POST', endpoint, { headers: actorHeaders, body: finalValue });
            return true;
        } catch (err) {
            setter(currentValue); // rollback de l'optimiste
            if (err.status === 401) {
                clearAuthenticatedSession();
                return false;
            }
            console.error(`Failed to sync ${endpoint}:`, err);
            ui.toast(`Échec d'enregistrement : ${err.message}`, { type: 'error' });
            return false;
        }
    }, [actorHeaders, clearAuthenticatedSession, ui]);

    // Sauvegarde GRANULAIRE d'un seul participant (PATCH /:id) — ne reposte pas
    // toute la collection. Maj optimiste du store + rollback si échec. Utilisé
    // pour les éditions champ par champ (santé) où reposter 120 fiches photos
    // incluses provoquait lenteur + 413.
    const patchParticipant = useCallback(async (id, fields) => {
        const before = useAppStore.getState().participants;
        setParticipants(before.map(p => p.id === id ? { ...p, ...fields } : p)); // optimiste
        try {
            await apiSend('PATCH', `${API_URL}/participants/${id}`, { headers: actorHeaders, body: fields });
            return true;
        } catch (err) {
            setParticipants(before); // rollback
            if (err.status === 401) { clearAuthenticatedSession(); return false; }
            console.error(`Failed to patch participant ${id}:`, err);
            ui.toast(`Échec d'enregistrement : ${err.message}`, { type: 'error' });
            return false;
        }
    }, [actorHeaders, clearAuthenticatedSession, ui, setParticipants]);

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
    }, [activeTab, ui]);

    const setSyncedMenus = useCallback((v) => {
        mutateCollection(`${API_URL}/state/menus`, setMenus, v, menus);
    }, [mutateCollection, menus]);

    const setSyncedTransmissions = useCallback((v) => {
        mutateCollection(`${API_URL}/state/transmissions`, setTransmissions, v, transmissions);
    }, [mutateCollection, transmissions]);
    const setSyncedNightLogs = useCallback((v) => {
        mutateCollection(`${API_URL}/state/nightLogs`, setNightLogs, v, nightLogs);
    }, [mutateCollection, nightLogs]);

    // Squelette de chargement (shimmer) plutôt qu'un spinner : perçu plus rapide,
    // approxime la mise en page d'un module (en-tête + barre d'outils + grille de cartes).
    const loadingShell = (
        <div className="tab-enter" style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                <div className="skeleton" style={{ width: '46px', height: '46px', borderRadius: '14px', flexShrink: 0 }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div className="skeleton skeleton-text" style={{ width: '40%' }} />
                    <div className="skeleton skeleton-text" style={{ width: '22%', height: '0.7rem' }} />
                </div>
            </div>
            <div className="skeleton" style={{ height: '44px', borderRadius: '14px' }} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(280px, 100%), 1fr))', gap: '0.875rem' }}>
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="skeleton" style={{ height: '150px', borderRadius: '18px' }} />
                ))}
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
                    <div style={{ width: '64px', height: '64px', background: 'color-mix(in oklch, var(--danger-color) 10%, transparent)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--danger-color)' }}>
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
            {!isMobile && <aside className="nav-sidebar" style={{ borderRight: '1px solid var(--border-color)', background: 'oklch(97.2% 0.003 250)', backdropFilter: 'blur(20px) saturate(140%)', WebkitBackdropFilter: 'blur(20px) saturate(140%)', zIndex: 110, transition: 'all 0.4s var(--ease-out-expo)', flexShrink: 0, width: '256px', display: 'flex', flexDirection: 'column' }}>
                {/* En-tête */}
                <div style={{ padding: '1.25rem 1.25rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
                    <Logo />
                    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                        <span style={{ fontFamily: 'Bricolage Grotesque, sans-serif', fontWeight: '800', fontSize: '1.15rem', color: 'var(--text-main)', letterSpacing: '-0.04em', lineHeight: 1.05 }}>BBOARD</span>
                        <span style={{ fontSize: '0.72rem', fontWeight: '600', color: 'var(--text-muted)', marginTop: '1px' }}>Plateforme session</span>
                    </div>
                </div>

                {/* Liste de navigation — groupes repliables, ligne d'arbre, carte active blanche */}
                <nav style={{ padding: '0.75rem 0.65rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.45rem', flex: 1, overflowY: 'auto' }} className="no-scrollbar">
                    {navGroups.map((group) => {
                        return (
                        <div key={group.id} style={{ display: 'flex', flexDirection: 'column' }}>
                            <div style={{ padding: '0.35rem 0.55rem 0.3rem' }}>
                                <span style={{ fontSize: '0.66rem', fontWeight: '800', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'oklch(60% 0.006 250)' }}>{group.label}</span>
                            </div>
                            {(
                                <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '0.1rem', marginTop: '0.1rem', marginBottom: '0.15rem' }}>
                                    <span style={{ position: 'absolute', left: '15px', top: '5px', bottom: '5px', width: '1.5px', background: 'var(--border-color)', borderRadius: '1px' }} />
                                    {group.items.map((item) => {
                                        const isActive = activeTab === item.id;
                                        const badge = navBadges[item.id] || 0;
                                        const tone = BADGE_TONE[item.id] || 'alert';
                                        return (
                                        <button key={item.id} onClick={() => guardedNavigate(item.id)} onMouseEnter={() => prefetchTab(item.id)}
                                            style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.46rem 0.6rem 0.46rem 1.6rem', border: `1px solid ${isActive ? 'var(--border-color)' : 'transparent'}`, background: isActive ? 'var(--surface-color)' : 'transparent', color: isActive ? 'var(--text-main)' : 'oklch(48% 0.006 250)', borderRadius: '11px', fontWeight: isActive ? '800' : '650', cursor: 'pointer', transition: 'background 0.18s var(--ease-out-expo), color 0.18s, transform 0.18s var(--ease-out-expo)', textAlign: 'left', fontSize: '0.88rem', letterSpacing: '-0.01em', width: '100%', boxShadow: isActive ? '0 1px 2px oklch(20% 0 0 / 0.05), 0 6px 16px oklch(20% 0 0 / 0.09)' : 'none' }}
                                            onMouseOver={(e) => { if (!isActive) { e.currentTarget.style.background = 'rgba(255,255,255,0.6)'; e.currentTarget.style.transform = 'translateX(3px)'; } }}
                                            onMouseOut={(e) => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.transform = 'translateX(0)'; } }}>
                                            <span style={{ flexShrink: 0, display: 'inline-flex', color: isActive ? 'var(--text-main)' : 'oklch(52% 0.006 250)' }}>
                                                {React.cloneElement(item.icon, { size: 18, strokeWidth: isActive ? 2.3 : 2 })}
                                            </span>
                                            <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</span>
                                            {badge > 0 && <span className="anim-badge-pop" style={{ minWidth: '22px', height: '20px', padding: '0 6px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: tone === 'info' ? 'color-mix(in oklch, var(--warning-color) 24%, white)' : 'color-mix(in oklch, var(--danger-color) 16%, white)', color: tone === 'info' ? 'color-mix(in oklch, var(--warning-color) 55%, black)' : 'color-mix(in oklch, var(--danger-color) 60%, black)', fontSize: '11px', fontWeight: '800', borderRadius: '8px', flexShrink: 0 }}>{badge > 99 ? '99+' : badge}</span>}
                                        </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                        );
                    })}
                </nav>

                {/* Pied : Paramètres — même style carte blanche active */}
                <div style={{ padding: '0.6rem 0.65rem', borderTop: '1px solid var(--border-color)' }}>
                    {permissions.viewSettings && (() => {
                        const isActive = activeTab === 'settings';
                        return (
                        <button onClick={() => guardedNavigate('settings')}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.5rem 0.7rem', border: `1px solid ${isActive ? 'var(--border-color)' : 'transparent'}`, background: isActive ? 'var(--surface-color)' : 'transparent', color: isActive ? 'var(--text-main)' : 'oklch(48% 0.006 250)', borderRadius: '11px', fontWeight: isActive ? '800' : '650', cursor: 'pointer', transition: 'background 0.18s var(--ease-out-expo), color 0.18s', textAlign: 'left', fontSize: '0.88rem', letterSpacing: '-0.01em', width: '100%', boxShadow: isActive ? '0 1px 2px oklch(20% 0 0 / 0.05), 0 6px 16px oklch(20% 0 0 / 0.09)' : 'none' }}
                            onMouseOver={(e) => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.6)'; }}
                            onMouseOut={(e) => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}>
                            <span style={{ flexShrink: 0, display: 'inline-flex', color: isActive ? 'var(--text-main)' : 'oklch(52% 0.006 250)' }}>
                                <SettingsIcon size={18} strokeWidth={isActive ? 2.3 : 2} />
                            </span>
                            <span>Paramètres</span>
                        </button>
                        );
                    })()}
                </div>
            </aside>}

            {/* Main Content */}
            <main
                style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', position: 'relative', minWidth: 0 }}
            >
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

                {/* Topbar Header — liquid glass */}
                <header style={{
                    height: isMobile ? (navHidden ? '0px' : '56px') : '90px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: isMobile ? '0 0.875rem' : '0 2.5rem',
                    margin: isMobile ? (navHidden ? '0 0.9rem' : 'calc(0.5rem + env(safe-area-inset-top)) 0.9rem 0') : 0,
                    background: isMobile ? 'rgba(255, 255, 255, 0.88)' : 'var(--lg-gloss), var(--lg-bg)',
                    backdropFilter: isMobile ? 'blur(18px)' : 'blur(var(--lg-blur)) saturate(var(--lg-saturate))',
                    WebkitBackdropFilter: isMobile ? 'blur(18px)' : 'blur(var(--lg-blur)) saturate(var(--lg-saturate))',
                    border: isMobile ? 'none' : '0',
                    borderBottom: isMobile ? 'none' : '1px solid var(--lg-border)',
                    borderRadius: isMobile ? '26px' : '0',
                    boxShadow: isMobile ? '0 12px 30px oklch(20% 0 0 / 0.16)' : 'inset 0 1px 0 rgba(255,255,255,0.9)',
                    opacity: navHidden ? 0 : 1,
                    transform: navHidden ? 'translateY(-12px)' : 'none',
                    overflow: 'hidden',
                    zIndex: 100, transition: 'height 0.38s var(--ease-out-expo), margin 0.38s var(--ease-out-expo), opacity 0.28s ease, transform 0.38s var(--ease-out-expo)',
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
                                            <div key={a.id} style={{ padding: '1rem', borderRadius: '16px', background: a.type === 'birthday' ? 'color-mix(in oklch, var(--warning-color) 8%, transparent)' : 'color-mix(in oklch, var(--danger-color) 5%, transparent)', marginBottom: '0.5rem', display: 'flex', gap: '0.75rem' }}>
                                                <AlertCircle size={16} style={{ color: a.type === 'birthday' ? 'var(--warning-color)' : 'var(--danger-color)', flexShrink: 0 }} strokeWidth={3} />
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
                                    {(activeUser?.firstName || '?')[0]}
                                </div>
                                {!isMobile && <ChevronDown size={14} style={{ marginRight: '0.5rem', opacity: 0.5 }} />}
                            </button>

                            {isUserSwitcherOpen && (
                                <div className="liquid-glass-strong animate-scale-in" style={{ position: 'absolute', top: isMobile ? '50px' : '64px', right: 0, width: isMobile ? '240px' : '280px', zIndex: 200, padding: '0.75rem', borderRadius: '24px', boxShadow: 'var(--lg-edge), 0 32px 64px rgba(60,32,8,0.16)' }}>
                                    <div style={{ padding: '0.5rem 0.75rem', fontSize: '10px', fontWeight: '950', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Profil actif</div>
                                    <div style={{ maxHeight: '250px', overflowY: 'auto' }} className="no-scrollbar">
                                        {staffUsers.map(u => (
                                            <button key={u.id} onClick={() => { if (activeUserId === u.id) setIsUserSwitcherOpen(false); else handleLogout(); }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.65rem 0.75rem', border: 'none', background: activeUserId === u.id ? 'var(--primary-light)' : 'transparent', borderRadius: '12px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}>
                                                <div style={{ width: '28px', height: '28px', background: u.role === 'direction' ? 'var(--primary-gradient)' : 'var(--info-color)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '950', fontSize: '0.75rem' }}>{(u.firstName || '?')[0]}</div>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontSize: '0.85rem', fontWeight: '950', color: 'var(--text-main)' }}>{u.firstName}</div>
                                                    <div style={{ fontSize: '8px', fontWeight: '900', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{u.role}</div>
                                                </div>
                                                {activeUserId === u.id && <Sparkles size={12} color="var(--primary-color)" />}
                                            </button>
                                        ))}
                                        <div style={{ margin: '0.75rem 0', height: '1.5px', background: 'var(--glass-border)', opacity: 0.5 }} />
                                        <button onClick={handleLogout} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.65rem 0.75rem', border: 'none', background: 'transparent', borderRadius: '12px', cursor: 'pointer', textAlign: 'left', color: 'var(--danger-color)', fontWeight: '950' }}>
                                            <div style={{ width: '28px', height: '28px', background: 'color-mix(in oklch, var(--danger-color) 10%, transparent)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
                    style={{ flex: 1, minHeight: 0, padding: isMobile ? 'var(--space-sm)' : 'var(--space-md) 1rem', position: 'relative', overflowY: 'auto' }}
                >
                    <Suspense fallback={loadingShell}>
                        <ErrorBoundary key={activeTab}>
                            <div className="tab-enter" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                                {activeTab === 'home' ? <Home activities={activities} participants={participants} groups={groups} menus={menus} healthAlerts={healthAlerts} transmissions={transmissions} setTransmissions={setSyncedTransmissions} permissions={permissions} activeUser={activeUser} onNavigate={guardedNavigate} isMobile={isMobile} />
                                : activeTab === 'schedule' ? <Schedule activities={activities} setActivities={(v) => mutateCollection(`${API_URL}/activities`, setActivities, v, useAppStore.getState().activities)} participants={participants} groups={groups} canEdit={permissions.editSchedule} permissions={permissions} menus={menus} setMenus={setSyncedMenus} />
                                : activeTab === 'exitsheet' ? <ExitSheet participants={participants} groups={groups} canEdit={permissions.editExitSheet} exitSheets={exitSheets} setExitSheets={(v) => mutateCollection(`${API_URL}/exit-sheets`, setExitSheets, v, useAppStore.getState().exitSheets)} onRefresh={onRefresh} isMobile={isMobile} />
                                : activeTab === 'recap' ? <MeetingRecap participants={participants} canEdit={permissions.editRecap} meetingRecaps={meetingRecaps} setMeetingRecaps={(v) => mutateCollection(`${API_URL}/meeting-recaps`, setMeetingRecaps, v, useAppStore.getState().meetingRecaps)} onRefresh={onRefresh} isMobile={isMobile} />
                                : activeTab === 'incident' ? <IncidentSheet canEdit={permissions.editIncident} actorHeaders={actorHeaders} activeUser={activeUser} incidentSheets={incidentSheets} participants={participants} onRefresh={onRefresh} isMobile={isMobile} />
                                : activeTab === 'directory' ? <Directory participants={participants} setParticipants={(v) => mutateCollection(`${API_URL}/participants`, setParticipants, v, useAppStore.getState().participants)} groups={groups} setGroups={(v) => mutateCollection(`${API_URL}/groups`, setGroups, v, useAppStore.getState().groups)} canEdit={permissions.editDirectory} isMobile={isMobile} roles={accessControl.roles} />
                                : activeTab === 'attendance' ? <Attendance participants={participants} setParticipants={(v) => mutateCollection(`${API_URL}/participants`, setParticipants, v, useAppStore.getState().participants)} groups={groups} canEdit={permissions.editAttendance} isMobile={isMobile} />
                                : activeTab === 'inventory' ? <Inventory participants={participants} canEdit={permissions.editInventory} canSearchAI={permissions.searchInventoryAI} actorHeaders={actorHeaders} inventoryItems={inventoryItems} onRefresh={onRefresh} isMobile={isMobile} />
                                : activeTab === 'health' ? <HealthCenter participants={participants} patchParticipant={patchParticipant} groups={groups} canEdit={permissions.editHealth} permissions={permissions} nightLogs={nightLogs} setNightLogs={setSyncedNightLogs} activeUser={activeUser} isMobile={isMobile} />
                                : activeTab === 'settings' ? <Settings
                                    participants={participants} setParticipants={(v) => mutateCollection(`${API_URL}/participants`, setParticipants, v, useAppStore.getState().participants)} groups={groups} setGroups={(v) => mutateCollection(`${API_URL}/groups`, setGroups, v, useAppStore.getState().groups)}
                                    activities={activities} setActivities={(v) => mutateCollection(`${API_URL}/activities`, setActivities, v, useAppStore.getState().activities)}
                                    isAttendanceEnabled={isAttendanceEnabled} setIsAttendanceEnabled={setIsAttendanceEnabled}
                                    accessControl={accessControl} setAccessControl={(v) => mutateCollection(`${API_URL}/state/accessControl`, setAccessControl, v, accessControl)}
                                    actorHeaders={actorHeaders} currentUser={activeUser} permissions={permissions} isMobile={isMobile}
                                /> : null}
                            </div>
                        </ErrorBoundary>
                    </Suspense>
                </PullToRefresh>

                {/* ── Bottom Nav Bar (mobile only) — enfant flex de la colonne (pas fixe → pas de bande blanche) ── */}
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
                            <div className="animate-scale-in liquid-glass-strong" style={{ position: 'fixed', bottom: 'calc(86px + env(safe-area-inset-bottom))', left: '0.9rem', right: '0.9rem', zIndex: 200, borderRadius: '24px', padding: '0.75rem', boxShadow: 'var(--lg-edge), 0 -4px 40px rgba(60,32,8,0.18)' }}>
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

                        {/* Bottom bar — liquid glass */}
                        <nav style={{ position: 'fixed', bottom: 'calc(0.7rem + env(safe-area-inset-bottom))', left: '0.9rem', right: '0.9rem', zIndex: 200, height: '64px', background: 'rgba(255, 255, 255, 0.88)', backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)', border: 'none', borderRadius: '26px', display: 'flex', alignItems: 'stretch', padding: '0 0.4rem', boxShadow: '0 14px 34px oklch(20% 0 0 / 0.18)', transformOrigin: 'bottom center', transform: navHidden ? 'translateY(140%) scale(0.94)' : 'translateY(0) scale(1)', opacity: navHidden ? 0 : 1, transition: 'transform 0.45s var(--ease-out-expo), opacity 0.28s ease' }}>
                            {primaryItems.map(item => {
                                const isActive = activeTab === item.id;
                                const badge = navBadges[item.id] || 0;
                                return (
                                    <button key={item.id} onClick={() => guardedNavigate(item.id)} className="nav-ig-btn" aria-label={item.label} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: 'transparent', cursor: 'pointer', minHeight: '44px' }}>
                                        <span className={`nav-ig-icon${isActive ? ' is-active' : ''}`} style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '46px', height: '46px', borderRadius: '16px', background: isActive ? 'var(--text-main)' : 'transparent', color: isActive ? '#fff' : 'var(--text-softer)', boxShadow: isActive ? '0 6px 16px oklch(20% 0 0 / 0.22)' : 'none', transition: 'background 0.25s var(--ease-out-expo), color 0.25s var(--ease-out-expo), transform 0.18s var(--ease-out-expo)' }}>
                                            {React.cloneElement(item.icon, { size: 25, strokeWidth: isActive ? 2.4 : 2.2 })}
                                            {badge > 0 && <span style={{ position: 'absolute', top: '0px', right: '0px', minWidth: '17px', height: '17px', padding: '0 4px', background: 'var(--danger-color)', color: 'white', fontSize: '9px', fontWeight: '950', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--lg-bg-strong)' }}>{badge > 9 ? '9+' : badge}</span>}
                                        </span>
                                    </button>
                                );
                            })}
                            {/* More button */}
                            {(moreItems.length > 0 || permissions.viewSettings) && (
                                <button onClick={() => setMoreOpen(o => !o)} className="nav-ig-btn" aria-label="Plus" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: 'transparent', cursor: 'pointer', minHeight: '44px' }}>
                                    <span className={`nav-ig-icon${(isMoreActive || moreOpen) ? ' is-active' : ''}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '46px', height: '46px', borderRadius: '16px', background: (isMoreActive || moreOpen) ? 'var(--text-main)' : 'transparent', color: (isMoreActive || moreOpen) ? '#fff' : 'var(--text-softer)', boxShadow: (isMoreActive || moreOpen) ? '0 6px 16px oklch(20% 0 0 / 0.22)' : 'none', transition: 'background 0.25s var(--ease-out-expo), color 0.25s var(--ease-out-expo), transform 0.18s var(--ease-out-expo)' }}>
                                        <Menu size={25} strokeWidth={(isMoreActive || moreOpen) ? 2.4 : 2.2} />
                                    </span>
                                </button>
                            )}
                        </nav>
                    </>
                );
                })()}
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

                /* Nav mobile « IG pur » : tuile active sombre + pop au tap */
                .nav-ig-btn:active .nav-ig-icon { transform: scale(0.88); }
                .nav-ig-icon.is-active { animation: navIgPop 0.34s var(--ease-out-expo); }
                @keyframes navIgPop { 0% { transform: scale(0.78); } 55% { transform: scale(1.14); } 100% { transform: scale(1); } }
                body.ui-reduce-motion .nav-ig-icon.is-active { animation: none; }
            `}</style>
        </div>
    );
}
