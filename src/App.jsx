import React, { useState, useEffect, useRef } from 'react';
import { Users, Calendar, Map as MapIcon, Contact, Settings as SettingsIcon, Tent, Menu, ClipboardList, FileText, Utensils, Bell, ClipboardCheck } from 'lucide-react';
import Sidebar from './components/Sidebar';
import SeatMap from './components/SeatMap';
import Schedule from './components/Schedule';
import Directory from './components/Directory';
import Settings from './components/Settings';
import MeetingRecap from './components/MeetingRecap';
import ExitSheet from './components/ExitSheet';
import Attendance from './components/Attendance';
import { v4 as uuidv4 } from 'uuid';
import { io } from 'socket.io-client';

const API_URL = '/api';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, info: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error: error };
    }

    componentDidCatch(error, info) {
        this.setState({ info });
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: '2rem', background: '#fee2e2', color: '#991b1b', height: '100%', overflow: 'auto' }}>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Erreur fatale de rendu React</h2>
                    <details style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', background: '#fef2f2', padding: '1rem', border: '1px solid #fecaca', borderRadius: '8px' }}>
                        <summary style={{ cursor: 'pointer', fontWeight: 'bold', marginBottom: '0.5rem' }}>{this.state.error && this.state.error.toString()}</summary>
                        <br />
                        {this.state.info && this.state.info.componentStack}
                    </details>
                </div>
            );
        }
        return this.props.children;
    }
}

export default function App() {
    // Persist active tab state
    const [activeTab, setActiveTab] = useState(() => {
        return localStorage.getItem('colo-active-tab') || 'seatmap';
    });

    // State for groups
    const [groups, setGroups] = useState(() => {
        const saved = localStorage.getItem('colo-groups');
        if (saved) {
            try { const parsed = JSON.parse(saved); return Array.isArray(parsed) ? parsed : []; } catch (e) { return []; }
        }
        return [];
    });

    // State for participants (children + animators + direction)
    const [participants, setParticipants] = useState(() => {
        const saved = localStorage.getItem('colo-participants');
        if (saved) {
            try { const parsed = JSON.parse(saved); return Array.isArray(parsed) ? parsed : []; } catch (e) { return []; }
        }
        return [];
    });

    // State for schedule activities
    const [activities, setActivities] = useState(() => {
        const saved = localStorage.getItem('colo-activities');
        if (saved) {
            try { const parsed = JSON.parse(saved); return Array.isArray(parsed) ? parsed : []; } catch (e) { return []; }
        }
        return [];
    });

    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isNavOpen, setIsNavOpen] = useState(false);
    const [isAlertsOpen, setIsAlertsOpen] = useState(false);

    // Admin States
    const [isAdminMode, setIsAdminMode] = useState(() => {
        return localStorage.getItem('colo-admin-mode') === 'true';
    });

    const [isAttendanceEnabled, setIsAttendanceEnabled] = useState(() => {
        return localStorage.getItem('colo-attendance-enabled') === 'true';
    });

    const [adminPin, setAdminPin] = useState(() => {
        return localStorage.getItem('colo-admin-pin') || '1234';
    });

    useEffect(() => {
        localStorage.setItem('colo-admin-mode', isAdminMode);
    }, [isAdminMode]);

    useEffect(() => {
        localStorage.setItem('colo-attendance-enabled', isAttendanceEnabled);
    }, [isAttendanceEnabled]);

    useEffect(() => {
        localStorage.setItem('colo-active-tab', activeTab);
    }, [activeTab]);

    useEffect(() => {
        localStorage.setItem('colo-admin-pin', adminPin);
    }, [adminPin]);

    // Compute Health Alerts
    const healthAlerts = React.useMemo(() => {
        const alerts = [];
        const today = new Date();
        const currentMonth = today.getMonth();
        const currentDate = today.getDate();

        const safeArr = Array.isArray(participants) ? participants : [];
        safeArr.filter(p => p && p.role === 'child').forEach(child => {
            // Birthdays
            if (child.birthDate) {
                const bDate = new Date(child.birthDate);
                if (bDate.getMonth() === currentMonth && bDate.getDate() === currentDate) {
                    alerts.push({ id: `bday-${child.id}`, type: 'birthday', message: `🎂 C'est l'anniversaire de ${child.firstName} ${child.lastName} aujourd'hui !` });
                }
            }
            // Missing health documents
            if (!child.healthDocProvided) {
                alerts.push({ id: `doc-${child.id}`, type: 'warning', message: `⚠️ Fiche sanitaire manquante pour ${child.firstName} ${child.lastName}.` });
            }
        });
        return alerts;
    }, [participants]);

    // State for seats/placements
    const [savedViews, setSavedViews] = useState(() => {
        const saved = localStorage.getItem('colo-saved-views');
        if (saved) return JSON.parse(saved);

        const oldPlacements = localStorage.getItem('colo-placements');
        if (oldPlacements) {
            return { 'Défaut': JSON.parse(oldPlacements) };
        }
        return {};
    });

    const [currentViewName, setCurrentViewName] = useState(() => {
        const saved = localStorage.getItem('colo-current-view-name');
        return saved || '';
    });

    const placements = savedViews[currentViewName] || {};

    const setPlacements = (newPlacements) => {
        setSavedViews(prev => ({
            ...prev,
            [currentViewName]: newPlacements
        }));
    };


    // Sync with Backend
    const isInitialLoad = useRef(true);

    useEffect(() => {
        const socket = io(); // Connects to the same host/port by default

        const fetchData = async () => {
            try {
                const [gRes, pRes, aRes, vRes, vnRes] = await Promise.all([
                    fetch(`${API_URL}/groups`),
                    fetch(`${API_URL}/participants`),
                    fetch(`${API_URL}/activities`),
                    fetch(`${API_URL}/state/savedViews`),
                    fetch(`${API_URL}/state/currentViewName`),
                    fetch(`${API_URL}/state/adminPin`)
                ]);

                const gData = await gRes.json();
                const pData = await pRes.json();
                const aData = await aRes.json();
                const vData = await vRes.json();
                const vnData = await vnRes.json();
                const pinData = await pinRes.json();

                // Equality checks to avoid loops
                setGroups(prev => JSON.stringify(prev) !== JSON.stringify(gData) && gData?.length > 0 ? gData : prev);
                setParticipants(prev => JSON.stringify(prev) !== JSON.stringify(pData) && pData?.length > 0 ? pData : prev);
                setActivities(prev => JSON.stringify(prev) !== JSON.stringify(aData) && aData?.length > 0 ? aData : prev);
                setSavedViews(prev => JSON.stringify(prev) !== JSON.stringify(vData) && vData ? vData : prev);
                setCurrentViewName(prev => vnData && prev !== vnData ? vnData : prev);
                setAdminPin(prev => pinData && prev !== pinData ? pinData : prev);

                // Migration if server is empty AND local has data
                if (isInitialLoad.current) {
                    if ((!gData || gData.length === 0) && groups.length > 0) {
                        await fetch(`${API_URL}/groups`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(groups) });
                    }
                    if ((!pData || pData.length === 0) && participants.length > 0) {
                        await fetch(`${API_URL}/participants`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(participants) });
                    }
                    if ((!aData || aData.length === 0) && activities.length > 0) {
                        await fetch(`${API_URL}/activities`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(activities) });
                    }
                    isInitialLoad.current = false;
                }
            } catch (err) {
                console.error("Backend sync failed:", err);
            }
        };

        fetchData();

        socket.on('data_updated', (data) => {
            console.log('Real-time update received:', data);
            fetchData();
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    // Keep localStorage and Backend in sync
    useEffect(() => {
        localStorage.setItem('colo-participants', JSON.stringify(participants));
        if (!isInitialLoad.current) {
            fetch(`${API_URL}/participants`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(participants)
            }).catch(console.error);
        }
    }, [participants]);

    useEffect(() => {
        localStorage.setItem('colo-groups', JSON.stringify(groups));
        if (!isInitialLoad.current) {
            fetch(`${API_URL}/groups`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(groups)
            }).catch(console.error);
        }
    }, [groups]);

    useEffect(() => {
        localStorage.setItem('colo-saved-views', JSON.stringify(savedViews));
        if (!isInitialLoad.current) {
            fetch(`${API_URL}/state/savedViews`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(savedViews)
            }).catch(console.error);
        }
    }, [savedViews]);

    useEffect(() => {
        localStorage.setItem('colo-current-view-name', currentViewName);
        if (!isInitialLoad.current) {
            fetch(`${API_URL}/state/currentViewName`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(currentViewName)
            }).catch(console.error);
        }
    }, [currentViewName]);

    useEffect(() => {
        localStorage.setItem('colo-activities', JSON.stringify(activities));
        if (!isInitialLoad.current) {
            fetch(`${API_URL}/activities`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(activities)
            }).catch(console.error);
        }
    }, [activities]);

    useEffect(() => {
        if (!isInitialLoad.current) {
            fetch(`${API_URL}/state/adminPin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(adminPin)
            }).catch(console.error);
        }
    }, [adminPin]);

    // Clean placements when a participant is deleted
    useEffect(() => {
        const newSavedViews = { ...savedViews };
        let globalChanged = false;

        Object.keys(newSavedViews).forEach(viewName => {
            const viewPlacements = { ...newSavedViews[viewName] };
            let changed = false;
            Object.keys(viewPlacements).forEach(seatId => {
                if (!participants.find(p => p.id === viewPlacements[seatId])) {
                    delete viewPlacements[seatId];
                    changed = true;
                }
            });
            if (changed) {
                newSavedViews[viewName] = viewPlacements;
                globalChanged = true;
            }
        });

        if (globalChanged) setSavedViews(newSavedViews);
    }, [participants]);

    return (
        <div className="app-container">
            {/* Mobile Overlay */}
            <div
                className={`sidebar-overlay ${isSidebarOpen ? 'open' : ''}`}
                onClick={() => setIsSidebarOpen(false)}
            />

            {/* Sidebar for Participants List - only visible in seatmap */}
            <div className={`sidebar-wrapper ${isSidebarOpen ? 'open' : ''} ${activeTab !== 'seatmap' ? 'hidden-desktop' : ''}`}>
                {activeTab === 'seatmap' && <Sidebar participants={participants} setParticipants={setParticipants} groups={groups} />}
            </div>


            {/* Mobile Nav Drawer */}
            <div
                className={`sidebar-overlay ${isNavOpen ? 'open' : ''}`}
                onClick={() => setIsNavOpen(false)}
                style={{ zIndex: 60 }}
            />
            <div className={`nav-drawer ${isNavOpen ? 'open' : ''}`}>
                <div style={{ padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                        <div style={{
                            background: 'white',
                            padding: '0.2rem',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)'
                        }}>
                            <img src="/logo.png" alt="BBOARD" style={{ width: '32px', height: '32px', objectFit: 'contain', borderRadius: '8px' }} />
                        </div>
                        <h2 style={{
                            fontSize: '1.75rem',
                            fontWeight: '800',
                            margin: 0,
                            letterSpacing: '-0.5px',
                            background: 'linear-gradient(135deg, var(--text-main) 30%, var(--accent-color))',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent'
                        }}>BBOARD</h2>
                    </div>

                    {[
                        { id: 'seatmap', label: 'Plans', icon: <MapIcon size={20} /> },
                        { id: 'schedule', label: 'Planning', icon: <Calendar size={20} /> },
                        { id: 'exitsheet', label: 'Sortie', icon: <FileText size={20} /> },
                        { id: 'recap', label: 'Récap', icon: <ClipboardList size={20} /> },
                        (isAdminMode || isAttendanceEnabled) ? { id: 'attendance', label: 'Pointage', icon: <ClipboardCheck size={20} /> } : null,
                        { id: 'directory', label: 'Annuaire', icon: <Contact size={20} /> },
                        { id: 'settings', label: 'Paramètres', icon: <SettingsIcon size={20} /> }
                    ].filter(Boolean).map(item => (
                        <button
                            key={item.id}
                            className={`btn ${activeTab === item.id ? 'btn-primary' : 'btn-outline'}`}
                            onClick={() => {
                                setActiveTab(item.id);
                                setIsNavOpen(false);
                            }}
                            style={{ justifyContent: 'flex-start', padding: '1rem', border: activeTab === item.id ? 'none' : '1px solid #e2e8f0' }}
                        >
                            {item.icon}
                            {item.label}
                        </button>
                    ))}
                </div>
            </div>


            {/* Main Content Area */}
            <main className="main-content">
                <header className="content-header glass-surface" style={{ zIndex: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem' }}>
                    {/* Left: Logo & Menu */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <button
                            className="btn-icon mobile-only"
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            style={{ display: activeTab === 'seatmap' ? 'block' : 'none' }}
                        >
                            <Users size={24} />
                        </button>

                        <div style={{
                            background: 'white',
                            padding: '0.2rem',
                            borderRadius: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)'
                        }}>
                            <img src="/logo.png" alt="BBOARD" style={{ width: '28px', height: '28px', objectFit: 'contain', borderRadius: '6px' }} />
                        </div>
                        <h1 style={{
                            fontSize: '1.4rem',
                            fontWeight: '800',
                            margin: 0,
                            letterSpacing: '-0.5px',
                            background: 'linear-gradient(135deg, var(--text-main) 30%, var(--accent-color))',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent'
                        }}>BBOARD</h1>
                    </div>

                    {/* Right: Navigation */}
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flex: 1, justifyContent: 'flex-end', position: 'relative' }}>

                        {/* Health Alerts */}
                        <div style={{ position: 'relative' }}>
                            <button
                                className="btn-icon"
                                onClick={() => setIsAlertsOpen(!isAlertsOpen)}
                                title="Alertes Santé"
                                style={{ padding: '0.5rem', borderRadius: '50%', background: isAlertsOpen ? '#e0e7ff' : 'transparent', color: isAlertsOpen ? '#4338ca' : '#64748b', transition: 'all 0.2s', position: 'relative' }}
                            >
                                <Bell size={20} />
                                {healthAlerts.length > 0 && (
                                    <span style={{ position: 'absolute', top: 0, right: 0, background: '#ef4444', color: 'white', fontSize: '10px', fontWeight: 'bold', width: '16px', height: '16px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid white' }}>
                                        {healthAlerts.length}
                                    </span>
                                )}
                            </button>

                            {isAlertsOpen && (
                                <div style={{ position: 'absolute', top: 'calc(100% + 10px)', right: 0, width: '320px', background: 'white', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0', zIndex: 100, overflow: 'hidden' }}>
                                    <div style={{ padding: '1rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '700', color: '#1e293b' }}>Alertes & Suivi</h3>
                                        <span style={{ fontSize: '0.75rem', background: '#e2e8f0', padding: '2px 8px', borderRadius: '10px', fontWeight: '600' }}>{healthAlerts.length}</span>
                                    </div>
                                    <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                        {healthAlerts.length === 0 ? (
                                            <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#94a3b8' }}>
                                                <Bell size={24} style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />
                                                <p style={{ fontSize: '0.85rem', margin: 0 }}>Aucune alerte pour l'instant.</p>
                                            </div>
                                        ) : (
                                            healthAlerts.map(alert => (
                                                <div key={alert.id} style={{ padding: '0.875rem 1rem', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: '0.75rem', alignItems: 'flex-start', background: alert.type === 'birthday' ? '#fff7ed' : '#fef2f2' }}>
                                                    <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>{alert.type === 'birthday' ? '🎂' : '⚠️'}</span>
                                                    <p style={{ margin: 0, fontSize: '0.85rem', color: alert.type === 'birthday' ? '#c2410c' : '#b91c1c', lineHeight: 1.4 }}>{alert.message}</p>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="desktop-only" style={{ display: 'flex', gap: '0.5rem' }}>
                            {[
                                { id: 'seatmap', label: 'Plans', icon: <MapIcon size={18} /> },
                                { id: 'schedule', label: 'Planning', icon: <Calendar size={18} /> },
                                { id: 'exitsheet', label: 'Sortie', icon: <FileText size={18} /> },
                                { id: 'recap', label: 'Récap', icon: <ClipboardList size={18} /> },
                                (isAdminMode || isAttendanceEnabled) ? { id: 'attendance', label: 'Pointage', icon: <ClipboardCheck size={18} /> } : null,
                                { id: 'directory', label: 'Annuaire', icon: <Contact size={18} /> },
                                { id: 'settings', label: 'Paramètres', icon: <SettingsIcon size={18} />, onlyIcon: true }
                            ].filter(Boolean).map(item => (
                                <button
                                    key={item.id}
                                    className={`btn ${activeTab === item.id ? 'btn-primary' : 'btn-outline'}`}
                                    onClick={() => setActiveTab(item.id)}
                                    style={activeTab !== item.id ? { border: 'none', background: 'transparent' } : {}}
                                >
                                    {item.icon}
                                    {!item.onlyIcon && item.label}
                                </button>
                            ))}
                        </div>

                        <button
                            className="btn-icon mobile-only"
                            onClick={() => setIsNavOpen(true)}
                            style={{ display: 'none' }}
                        >
                            <Menu size={28} />
                        </button>

                    </div>
                </header>

                <div className="workspace-area">
                    {activeTab === 'seatmap' ? (
                        <div className="animate-fade-in" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                            <SeatMap
                                participants={participants}
                                placements={placements}
                                setPlacements={setPlacements}
                                savedViews={savedViews}
                                setSavedViews={setSavedViews}
                                currentViewName={currentViewName}
                                setCurrentViewName={setCurrentViewName}
                                groups={groups}
                            />
                        </div>
                    ) : activeTab === 'schedule' ? (
                        <div className="animate-fade-in" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                            <Schedule activities={activities} setActivities={setActivities} participants={participants} groups={groups} />
                        </div>
                    ) : activeTab === 'exitsheet' ? (
                        <div className="animate-fade-in" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                            <ExitSheet participants={participants} groups={groups} />
                        </div>
                    ) : activeTab === 'recap' ? (
                        <div className="animate-fade-in" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                            <MeetingRecap participants={participants} />
                        </div>
                    ) : activeTab === 'directory' ? (
                        <div className="animate-fade-in" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                            <ErrorBoundary>
                                <Directory participants={participants} setParticipants={setParticipants} groups={groups} setGroups={setGroups} />
                            </ErrorBoundary>
                        </div>
                    ) : activeTab === 'attendance' ? (
                        <div className="animate-fade-in" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                            <Attendance participants={participants} setParticipants={setParticipants} groups={groups} />
                        </div>
                    ) : (
                        <div className="animate-fade-in" style={{ height: '100%', overflow: 'auto' }}>
                            <Settings
                                participants={participants}
                                setParticipants={setParticipants}
                                groups={groups}
                                setGroups={setGroups}
                                activities={activities}
                                setActivities={setActivities}
                                savedViews={savedViews}
                                setSavedViews={setSavedViews}
                                isAdminMode={isAdminMode}
                                setIsAdminMode={setIsAdminMode}
                                isAttendanceEnabled={isAttendanceEnabled}
                                setIsAttendanceEnabled={setIsAttendanceEnabled}
                                adminPin={adminPin}
                                setAdminPin={setAdminPin}
                            />
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}