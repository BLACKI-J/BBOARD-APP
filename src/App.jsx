import React, { useState, useEffect } from 'react';
import { Users, Calendar, Map as MapIcon, Contact, Settings as SettingsIcon, Tent, Menu, ClipboardList, FileText } from 'lucide-react';
import Sidebar from './components/Sidebar';
import SeatMap from './components/SeatMap';
import Schedule from './components/Schedule';
import Directory from './components/Directory';
import Settings from './components/Settings';
import MeetingRecap from './components/MeetingRecap';
import ExitSheet from './components/ExitSheet';
import { v4 as uuidv4 } from 'uuid';

export default function App() {
    // Persist active tab state
    const [activeTab, setActiveTab] = useState(() => {
        return localStorage.getItem('colo-active-tab') || 'seatmap';
    });
    
    // Mobile sidebar state
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        localStorage.setItem('colo-active-tab', activeTab);
    }, [activeTab]);

    // State for groups
    const [groups, setGroups] = useState(() => {
        const saved = localStorage.getItem('colo-groups');
        if (saved) return JSON.parse(saved);
        return [
            { id: 'A', name: 'Groupe A', color: '#3b82f6' },
            { id: 'B', name: 'Groupe B', color: '#10b981' },
            { id: 'C', name: 'Groupe C', color: '#f59e0b' }
        ];
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
        return { 'Trajet Aller': {} };
    });
    
    const [currentViewName, setCurrentViewName] = useState(() => {
        const saved = localStorage.getItem('colo-current-view-name');
        return saved || 'Trajet Aller';
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

    // Keep localStorage in sync
    useEffect(() => {
        localStorage.setItem('colo-participants', JSON.stringify(participants));
    }, [participants]);

    useEffect(() => {
        localStorage.setItem('colo-groups', JSON.stringify(groups));
    }, [groups]);

    useEffect(() => {
        localStorage.setItem('colo-saved-views', JSON.stringify(savedViews));
    }, [savedViews]);
    
    useEffect(() => {
        localStorage.setItem('colo-current-view-name', currentViewName);
    }, [currentViewName]);

    useEffect(() => {
        localStorage.setItem('colo-activities', JSON.stringify(activities));
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
            <div className={`sidebar ${isSidebarOpen ? 'open' : ''} ${activeTab !== 'seatmap' ? 'hidden-desktop' : ''}`}>
                 {activeTab === 'seatmap' && <Sidebar participants={participants} setParticipants={setParticipants} groups={groups} />}
            </div>
            
            <style>{`
                @media (min-width: 769px) {
                    .hidden-desktop { display: none !important; }
                }
            `}</style>

            {/* Main Content Area */}
            <main className="main-content">
                <header className="content-header glass-surface" style={{ zIndex: 5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 2rem' }}>
                    {/* Left: Logo & Menu */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        {activeTab === 'seatmap' && (
                            <button 
                                className="btn-icon mobile-only" 
                                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                                style={{ display: 'none' }} // Visible only on mobile via CSS
                            >
                                <Menu size={24} />
                            </button>
                        )}
                        <style>{`
                            @media (max-width: 768px) {
                                .mobile-only { display: block !important; }
                            }
                        `}</style>
                        
                        <div style={{ background: 'var(--primary-color)', color: 'white', padding: '0.5rem', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Tent size={24} />
                        </div>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-main)', margin: 0 }}>CampManager</h1>
                    </div>

                    {/* Right: Navigation */}
                    <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '2px', alignItems: 'center' }}>
                        <button
                            className={`btn ${activeTab === 'seatmap' ? 'btn-primary' : ''}`}
                            style={activeTab !== 'seatmap' ? { background: 'white', color: 'var(--text-main)', border: '1px solid var(--border-color)' } : {}}
                            onClick={() => setActiveTab('seatmap')}
                        >
                            <MapIcon size={18} />
                            Plans
                        </button>
                        <button
                            className={`btn ${activeTab === 'schedule' ? 'btn-primary' : ''}`}
                            style={activeTab !== 'schedule' ? { background: 'white', color: 'var(--text-main)', border: '1px solid var(--border-color)' } : {}}
                            onClick={() => setActiveTab('schedule')}
                        >
                            <Calendar size={18} />
                            Planning
                        </button>
                        <button
                            className={`btn ${activeTab === 'exitsheet' ? 'btn-primary' : ''}`}
                            style={activeTab !== 'exitsheet' ? { background: 'white', color: 'var(--text-main)', border: '1px solid var(--border-color)' } : {}}
                            onClick={() => setActiveTab('exitsheet')}
                        >
                            <FileText size={18} />
                            Fiche Sortie
                        </button>
                        <button
                            className={`btn ${activeTab === 'recap' ? 'btn-primary' : ''}`}
                            style={activeTab !== 'recap' ? { background: 'white', color: 'var(--text-main)', border: '1px solid var(--border-color)' } : {}}
                            onClick={() => setActiveTab('recap')}
                        >
                            <ClipboardList size={18} />
                            Récap
                        </button>
                        <button
                            className={`btn ${activeTab === 'directory' ? 'btn-primary' : ''}`}
                            style={activeTab !== 'directory' ? { background: 'white', color: 'var(--text-main)', border: '1px solid var(--border-color)' } : {}}
                            onClick={() => setActiveTab('directory')}
                        >
                            <Contact size={18} />
                            Annuaire
                        </button>
                        <button
                            className={`btn ${activeTab === 'settings' ? 'btn-primary' : ''}`}
                            style={activeTab !== 'settings' ? { background: 'white', color: 'var(--text-main)', border: '1px solid var(--border-color)' } : {}}
                            onClick={() => setActiveTab('settings')}
                        >
                            <SettingsIcon size={18} />
                            Paramètres
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