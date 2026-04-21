import React, { useState, useEffect, useMemo } from 'react';
import { UserCircle, Lock, ChevronRight, AlertCircle, Zap, ShieldCheck } from 'lucide-react';

export default function Login({ staffUsers, onLogin, adminPin, connectionStatus }) {
    const [selectedUser, setSelectedUser] = useState(null);
    const [pin, setPin] = useState('');
    const [error, setError] = useState(false);
    const [showPinEntry, setShowPinEntry] = useState(false);

    const handlePinChange = (digit) => {
        if (pin.length < 4) {
            const newPin = pin + digit;
            setPin(newPin);
            if (newPin.length === 4) {
                const targetPin = selectedUser?.pin || adminPin;
                if (newPin === targetPin) {
                    onLogin(selectedUser);
                } else {
                    setError(true);
                    setTimeout(() => {
                        setPin('');
                        setError(false);
                    }, 800);
                }
            }
        }
    };

    const handleDelete = () => {
        setPin(pin.slice(0, -1));
    };

    return (
        <div className="login-page" style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'var(--bg-main)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden'
        }}>
            {/* Background Decorations */}
            <div className="morph-blob" style={{ top: '-10%', left: '-5%', width: '800px', height: '800px', opacity: 0.2 }} />
            <div className="morph-blob-2" style={{ bottom: '-10%', right: '-5%', width: '600px', height: '600px', opacity: 0.15 }} />

            <div className="card-glass animate-scale-in" style={{
                width: '100%', maxWidth: '440px', padding: '2.5rem',
                borderRadius: '32px', boxShadow: '0 40px 100px rgba(0,0,0,0.12)',
                background: 'rgba(255, 255, 255, 0.7)', backdropFilter: 'blur(40px)',
                display: 'flex', flexDirection: 'column', gap: '2rem',
                margin: '1.5rem', border: '1.5px solid var(--glass-border)'
            }}>
                <header style={{ textAlign: 'center' }}>
                    <div style={{
                        width: '64px', height: '64px', background: 'var(--primary-gradient)',
                        borderRadius: '20px', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', margin: '0 auto 1.25rem',
                        boxShadow: '0 12px 32px var(--shadow-color)'
                    }}>
                        <Zap size={32} color="white" strokeWidth={3} />
                    </div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: '950', marginBottom: '0.5rem', color: 'var(--text-main)' }}>BBOARD</h1>
                    <p style={{ fontSize: '0.85rem', fontWeight: '900', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                        Session Été 2024
                    </p>
                </header>

                {!showPinEntry ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: '950', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                            Choisir un profil
                        </div>
                        <div style={{ 
                            maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem',
                            paddingRight: '0.5rem'
                        }} className="no-scrollbar">
                            {staffUsers.map(user => (
                                <button
                                    key={user.id}
                                    onClick={() => { setSelectedUser(user); setShowPinEntry(true); }}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '1rem',
                                        padding: '1rem', borderRadius: '18px',
                                        background: 'white', border: '1.5px solid var(--glass-border)',
                                        textAlign: 'left', cursor: 'pointer', transition: 'all 0.3s var(--ease-out-expo)',
                                        boxShadow: 'var(--shadow-sm)'
                                    }}
                                    className="profile-item"
                                >
                                    <div style={{
                                        width: '40px', height: '40px', background: user.role === 'direction' ? 'var(--primary-gradient)' : 'oklch(62% 0.18 200)',
                                        borderRadius: '12px', display: 'flex', alignItems: 'center',
                                        justifyContent: 'center', color: 'white', fontWeight: '950',
                                        fontSize: '0.9rem'
                                    }}>
                                        {user.firstName[0]}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '0.95rem', fontWeight: '950', color: 'var(--text-main)' }}>{user.firstName} {user.lastName}</div>
                                        <div style={{ fontSize: '0.75rem', fontWeight: '850', color: 'var(--text-muted)' }}>{user.role}</div>
                                    </div>
                                    <ChevronRight size={18} color="var(--text-softer)" />
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'center' }} className="animate-fade-in">
                        <button 
                            onClick={() => { setShowPinEntry(false); setPin(''); setError(false); }}
                            style={{ alignSelf: 'flex-start', fontSize: '0.75rem', fontWeight: '950', color: 'var(--primary-color)', cursor: 'pointer' }}
                        >
                            ← Retour aux profils
                        </button>
                        
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '1rem', fontWeight: '950', color: 'var(--text-main)' }}>{selectedUser.firstName}</div>
                            <div style={{ fontSize: '0.8rem', fontWeight: '900', color: 'var(--text-muted)' }}>Code PIN requis</div>
                        </div>

                        {/* PIN View */}
                        <div style={{ display: 'flex', gap: '1rem', margin: '1rem 0' }}>
                            {[0, 1, 2, 3].map(i => (
                                <div key={i} style={{
                                    width: '16px', height: '16px', borderRadius: '50%',
                                    background: pin.length > i ? 'var(--primary-color)' : 'var(--glass-border)',
                                    transform: error && pin.length > i ? 'translateX(0)' : 'none',
                                    transition: 'all 0.2s',
                                    border: pin.length > i ? '2px solid var(--primary-light)' : 'none',
                                    boxShadow: pin.length > i ? '0 0 12px var(--shadow-color)' : 'none'
                                }} />
                            ))}
                        </div>

                        {error && (
                            <div style={{ color: 'var(--danger-color)', fontSize: '0.8rem', fontWeight: '950', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <AlertCircle size={14} /> Code incorrect
                            </div>
                        )}

                        {/* Numpad */}
                        <div style={{
                            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
                            gap: '1rem', width: '100%'
                        }}>
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                                <button key={num} onClick={() => handlePinChange(num.toString())} className="numpad-btn">{num}</button>
                            ))}
                            <div />
                            <button onClick={() => handlePinChange('0')} className="numpad-btn">0</button>
                            <button onClick={handleDelete} className="numpad-btn" style={{ fontSize: '0.8rem', color: 'var(--danger-color)' }}>DEL</button>
                        </div>
                    </div>
                )}

                <footer style={{ marginTop: 'auto', textAlign: 'center', fontSize: '0.75rem', fontWeight: '900', color: 'var(--text-softer)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    <ShieldCheck size={14} /> Connexion sécurisée
                </footer>
            </div>

            {/* Backend Connection Indicator */}
            <div style={{
                position: 'fixed', bottom: '2rem', left: '2rem',
                zIndex: 1100, display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '0.75rem 1.25rem', borderRadius: '100px',
                background: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(12px)',
                border: '1.5px solid var(--glass-border)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.05)',
                transition: 'all 0.3s ease'
            }} className="animate-fade-in">
                <div style={{
                    width: '10px', height: '10px', borderRadius: '50%',
                    background: connectionStatus === 'connected' ? '#22c55e' : '#ef4444',
                    boxShadow: connectionStatus === 'connected' ? '0 0 12px rgba(34, 197, 94, 0.5)' : '0 0 12px rgba(239, 68, 68, 0.5)',
                    animation: connectionStatus === 'connected' ? 'pulse-green 2s infinite' : 'pulse-red 2s infinite'
                }} />
                <span style={{ fontSize: '0.8rem', fontWeight: '950', color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
                    Serveur Backend : {connectionStatus === 'connected' ? 'Connecté' : 'Non disponible'}
                </span>
            </div>

            <style>{`
                @keyframes pulse-green {
                    0% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.2); opacity: 0.7; }
                    100% { transform: scale(1); opacity: 1; }
                }
                @keyframes pulse-red {
                    0% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.2); opacity: 0.7; }
                    100% { transform: scale(1); opacity: 1; }
                }
                .numpad-btn {
                    height: 60px;
                    background: white;
                    border: 1.5px solid var(--glass-border);
                    border-radius: 18px;
                    font-size: 1.25rem;
                    font-weight: 950;
                    color: var(--text-main);
                    cursor: pointer;
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: var(--shadow-sm);
                }
                .numpad-btn:hover {
                    background: var(--primary-light);
                    border-color: var(--primary-color);
                    color: var(--primary-color);
                    transform: translateY(-2px);
                }
                .numpad-btn:active { transform: scale(0.95); }
                .profile-item:hover {
                    border-color: var(--primary-color);
                    transform: translateY(-4px);
                    box-shadow: var(--shadow-md);
                }
            `}</style>
        </div>
    );
}
