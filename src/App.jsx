import React, { useState, useEffect, useRef } from 'react';
import { Users, Calendar, Map as MapIcon, Contact, Settings as SettingsIcon, Tent, Menu, ClipboardList, FileText } from 'lucide-react';
import Sidebar from './components/Sidebar';
import SeatMap from './components/SeatMap';
import Schedule from './components/Schedule';
import Directory from './components/Directory';
import Settings from './components/Settings';
import MeetingRecap from './components/MeetingRecap';
import ExitSheet from './components/ExitSheet';
import { v4 as uuidv4 } from 'uuid';
import { Home } from 'lucide-react';
import { io } from 'socket.io-client';

const API_URL = '/api';

export default function App() {
    // Persist active tab state
    const [activeTab, setActiveTab] = useState(() => {
        return localStorage.getItem('colo-active-tab') || 'seatmap';
    });

    // Mobile sidebar state
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isNavOpen, setIsNavOpen] = useState(false);

    useEffect(() => {
        localStorage.setItem('colo-active-tab', activeTab);
    }, [activeTab]);

    // State for groups
    const [groups, setGroups] = useState(() => {
        const saved = localStorage.getItem('colo-groups');
        if (saved) return JSON.parse(saved);
        return [];
    });

    // State for participants (children + animators + direction)
    const [participants, setParticipants] = useState(() => {
        const saved = localStorage.getItem('colo-participants');
        if (saved) return JSON.parse(saved);
        return [];
    });

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

    // State for schedule activities
    const [activities, setActivities] = useState(() => {
        const saved = localStorage.getItem('colo-activities');
        if (saved) return JSON.parse(saved);
        return [];
    });

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
                    fetch(`${API_URL}/state/currentViewName`)
                ]);

                const gData = await gRes.json();
                const pData = await pRes.json();
                const aData = await aRes.json();
                const vData = await vRes.json();
                const vnData = await vnRes.json();

                // Equality checks to avoid loops
                setGroups(prev => JSON.stringify(prev) !== JSON.stringify(gData) && gData?.length > 0 ? gData : prev);
                setParticipants(prev => JSON.stringify(prev) !== JSON.stringify(pData) && pData?.length > 0 ? pData : prev);
                setActivities(prev => JSON.stringify(prev) !== JSON.stringify(aData) && aData?.length > 0 ? aData : prev);
                setSavedViews(prev => JSON.stringify(prev) !== JSON.stringify(vData) && vData ? vData : prev);
                setCurrentViewName(prev => vnData && prev !== vnData ? vnData : prev);

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
                        <div style={{ background: 'var(--primary-color)', color: 'white', padding: '0.5rem', borderRadius: '12px' }}>
                            <Tent size={24} />
                        </div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>BBOARD</h2>
                    </div>

                    {[
                        { id: 'seatmap', label: 'Plans', icon: <MapIcon size={20} /> },
                        { id: 'schedule', label: 'Planning', icon: <Calendar size={20} /> },
                        { id: 'exitsheet', label: 'Sortie', icon: <FileText size={20} /> },
                        { id: 'recap', label: 'Récap', icon: <ClipboardList size={20} /> },
                        { id: 'directory', label: 'Annuaire', icon: <Contact size={20} /> },
                        { id: 'settings', label: 'Paramètres', icon: <SettingsIcon size={20} /> }
                    ].map(item => (
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

                        <div style={{ background: 'var(--primary-color)', color: 'white', padding: '0.4rem', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Tent size={20} />
                        </div>
                        <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-main)', margin: 0 }}>BBOARD</h1>
                    </div>

                    {/* Right: Navigation */}
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flex: 1, justifyContent: 'flex-end' }}>
                        <div className="desktop-only" style={{ display: 'flex', gap: '0.5rem' }}>
                            {[
                                { id: 'seatmap', label: 'Plans', icon: <MapIcon size={18} /> },
                                { id: 'schedule', label: 'Planning', icon: <Calendar size={18} /> },
                                { id: 'exitsheet', label: 'Sortie', icon: <FileText size={18} /> },
                                { id: 'recap', label: 'Récap', icon: <ClipboardList size={18} /> },
                                { id: 'directory', label: 'Annuaire', icon: <Contact size={18} /> },
                                { id: 'settings', label: 'Paramètres', icon: <SettingsIcon size={18} />, onlyIcon: true }
                            ].map(item => (
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
                            <MeetingRecap />
                        </div>
                    ) : activeTab === 'directory' ? (
                        <div className="animate-fade-in" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                            <Directory participants={participants} setParticipants={setParticipants} groups={groups} setGroups={setGroups} />
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
                            />
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}