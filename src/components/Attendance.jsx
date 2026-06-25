import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Camera, Image as ImageIcon, UserCheck, UserMinus, Users, Check } from 'lucide-react';
import WebcamPhotoCapture from './directory/WebcamPhotoCapture';
import confetti from 'canvas-confetti';
import { useUi } from '../ui/UiProvider';
import { compressImage, fileToDataUrl } from '../utils/image';
import { canUseWebcam } from '../utils/camera';
import SectionHeader from './common/SectionHeader';

export default function Attendance({ participants, setParticipants, groups, canEdit = true, isMobile }) {
    const ui = useUi();

    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [selectedParticipantId, setSelectedParticipantId] = useState(null);
    const [photoMenuFor, setPhotoMenuFor] = useState(null);
    const fileInputRef = useRef(null);
    const cameraInputRef = useRef(null);
    const fileTargetId = useRef(null);

    const children = useMemo(() =>
        [...(participants || []).filter(p => p.role === 'child')]
            .sort((a, b) => (a.lastName || '').localeCompare(b.lastName || '') || (a.firstName || '').localeCompare(b.firstName || '')),
        [participants]
    );

    const groupMap = useMemo(() => Object.fromEntries(groups.map(g => [g.id, g])), [groups]);

    const presentCount = useMemo(() => children.filter(c => c.isPresent).length, [children]);
    const totalCount = children.length;
    const progress = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

    useEffect(() => {
        if (progress !== 100) return;
        const duration = 4000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 40, spread: 360, ticks: 100, zIndex: 1000 };
        const rand = (min, max) => Math.random() * (max - min) + min;
        const interval = setInterval(() => {
            const timeLeft = animationEnd - Date.now();
            if (timeLeft <= 0) return clearInterval(interval);
            const particleCount = 60 * (timeLeft / duration);
            confetti({ ...defaults, particleCount, origin: { x: rand(0.1, 0.4), y: Math.random() - 0.2 } });
            confetti({ ...defaults, particleCount, origin: { x: rand(0.6, 0.9), y: Math.random() - 0.2 } });
        }, 300);
        return () => clearInterval(interval);
    }, [progress]);

    const togglePresence = (id) => {
        if (!canEdit) { ui.toast('Pointage non autorisé.', { type: 'error' }); return; }
        setParticipants(prev => prev.map(p => p.id === id ? { ...p, isPresent: !p.isPresent } : p));
    };

    const markAll = (status) => {
        if (!canEdit) return;
        setParticipants(prev => prev.map(p => p.role === 'child' ? { ...p, isPresent: status } : p));
    };

    const handlePhotoUpload = async (e, participantId) => {
        if (!canEdit) return;
        const file = e.target.files[0];
        e.target.value = '';
        if (!file) return;
        try {
            const dataUrl = await fileToDataUrl(file);
            const compressed = await compressImage(dataUrl, 768, 0.7);
            setParticipants(prev => prev.map(p => p.id === participantId ? { ...p, photo: compressed } : p));
        } catch {
            ui.toast('Échec du traitement de la photo.', { type: 'error' });
        }
    };

    const triggerCamera = (participantId) => {
        if (!canEdit) return;
        if (canUseWebcam()) {
            setSelectedParticipantId(participantId);
            setIsCameraOpen(true);
        } else {
            fileTargetId.current = participantId;
            setTimeout(() => cameraInputRef.current?.click(), 50);
        }
    };

    const choosePicCamera = () => { const t = photoMenuFor; setPhotoMenuFor(null); triggerCamera(t); };

    const choosePicGallery = () => {
        fileTargetId.current = photoMenuFor;
        setPhotoMenuFor(null);
        setTimeout(() => fileInputRef.current?.click(), 50);
    };

    const handlePhotoCaptured = (photoBase64) => {
        if (!canEdit) return;
        setParticipants(prev => prev.map(p => p.id === selectedParticipantId ? { ...p, photo: photoBase64 } : p));
        setIsCameraOpen(false);
        setSelectedParticipantId(null);
    };

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'transparent' }}>

            {/* Header */}
            <div style={{
                padding: isMobile ? '0.75rem 1rem' : '1rem 2.5rem',
                borderBottom: '1.5px solid var(--glass-border)',
                background: 'rgba(255,255,255,0.85)',
                backdropFilter: 'blur(20px)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                gap: '1rem', flexShrink: 0, zIndex: 10
            }}>
                {!isMobile && <SectionHeader icon={UserCheck} title="Pointage" />}

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginLeft: isMobile ? 0 : 'auto' }}>
                    <span style={{ fontWeight: '950', fontSize: isMobile ? '1rem' : '1.1rem', color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
                        <span style={{ color: 'var(--success-color)' }}>{presentCount}</span>
                        <span style={{ color: 'var(--text-muted)', fontWeight: '700' }}> / {totalCount}</span>
                    </span>

                    {canEdit && (
                        <>
                            <button
                                onClick={() => markAll(true)}
                                className="btn btn-primary"
                                style={{ padding: isMobile ? '0.5rem 0.75rem' : '0.5rem 1rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: '900', gap: '0.5rem' }}
                            >
                                <UserCheck size={16} strokeWidth={2} />
                                {!isMobile && 'Tout cocher'}
                            </button>
                            <button
                                onClick={() => markAll(false)}
                                className="btn btn-secondary"
                                style={{ width: '40px', height: '40px', padding: 0, borderRadius: '12px', justifyContent: 'center' }}
                                title="Réinitialiser"
                                aria-label="Réinitialiser le pointage"
                            >
                                <UserMinus size={18} strokeWidth={2} />
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Liste */}
            <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '0.75rem' : '1.5rem 2.5rem' }} className="no-scrollbar">
                {children.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '6rem 2rem', color: 'var(--text-muted)' }}>
                        <Users size={48} style={{ opacity: 0.15, margin: '0 auto 1.5rem', display: 'block' }} />
                        <p style={{ fontWeight: '800' }}>Aucun vacancier dans l'annuaire.</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingBottom: '4rem' }}>
                        {children.map((child) => {
                            const group = groupMap[child.group];
                            const accentColor = group?.color || 'var(--primary-color)';
                            return (
                                <div
                                    key={child.id}
                                    className="attendance-card"
                                    style={{
                                        background: child.isPresent ? 'color-mix(in oklch, var(--success-color) 5%, transparent)' : 'var(--surface-color)',
                                        border: `1.5px solid ${child.isPresent ? 'var(--success-color)' : 'var(--glass-border)'}`,
                                        borderRadius: '20px',
                                        padding: isMobile ? '0.6rem' : '0.75rem 1rem',
                                        display: 'flex', alignItems: 'center', gap: isMobile ? '0.75rem' : '1rem',
                                        transition: 'border-color 0.2s, background 0.2s'
                                    }}
                                >
                                    {/* Zone photo — tap direct */}
                                    <button
                                        onClick={() => canEdit && (child.photo ? setPhotoMenuFor(child.id) : triggerCamera(child.id))}
                                        style={{
                                            position: 'relative', flexShrink: 0, cursor: canEdit ? 'pointer' : 'default',
                                            width: isMobile ? '72px' : '80px', height: isMobile ? '72px' : '80px',
                                            borderRadius: '18px', border: 'none', padding: 0, background: 'none', overflow: 'visible'
                                        }}
                                        aria-label="Photo"
                                    >
                                        {child.photo ? (
                                            <>
                                                <img
                                                    src={child.photo}
                                                    alt={child.firstName}
                                                    style={{ width: '100%', height: '100%', borderRadius: '18px', objectFit: 'cover', display: 'block', border: '2.5px solid white', boxShadow: '0 4px 12px rgba(0,0,0,0.12)' }}
                                                />
                                                {canEdit && (
                                                    <div style={{ position: 'absolute', bottom: '-5px', right: '-5px', width: '26px', height: '26px', background: 'var(--surface-color)', border: '1.5px solid var(--glass-border)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.12)', color: 'var(--text-muted)' }}>
                                                        <Camera size={13} strokeWidth={2} />
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <div style={{
                                                width: '100%', height: '100%', borderRadius: '18px',
                                                background: `${accentColor}12`,
                                                border: `2px dashed ${accentColor}50`,
                                                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                                gap: '4px', color: accentColor
                                            }}>
                                                <Camera size={isMobile ? 22 : 26} strokeWidth={2} />
                                                <span style={{ fontSize: '9px', fontWeight: '950', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.8 }}>Photo</span>
                                            </div>
                                        )}
                                    </button>

                                    {/* Nom + groupe */}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontWeight: '950', color: 'var(--text-main)', fontSize: isMobile ? '0.92rem' : '1rem', letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {child.lastName?.toUpperCase()}
                                        </div>
                                        <div style={{ fontWeight: '750', color: 'var(--text-muted)', fontSize: isMobile ? '0.82rem' : '0.88rem', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {child.firstName}
                                        </div>
                                        {group && (
                                            <span style={{ fontSize: '9px', padding: '2px 7px', background: `${accentColor}15`, color: accentColor, borderRadius: '5px', fontWeight: '950', border: `1px solid ${accentColor}25` }}>
                                                {group.name}
                                            </span>
                                        )}
                                    </div>

                                    {/* Bouton présence */}
                                    <button
                                        onClick={() => togglePresence(child.id)}
                                        style={{
                                            width: isMobile ? '52px' : '58px',
                                            height: isMobile ? '52px' : '58px',
                                            borderRadius: '16px',
                                            background: child.isPresent ? 'var(--success-color)' : 'var(--surface-color)',
                                            color: child.isPresent ? 'white' : 'var(--glass-border)',
                                            border: `2px solid ${child.isPresent ? 'var(--success-color)' : 'var(--glass-border)'}`,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            cursor: 'pointer',
                                            transition: 'all 0.25s var(--ease-out-expo)',
                                            boxShadow: child.isPresent ? '0 4px 16px color-mix(in oklch, var(--success-color) 40%, transparent)' : 'none',
                                            flexShrink: 0
                                        }}
                                        aria-label={child.isPresent ? 'Marquer absent' : 'Marquer présent'}
                                    >
                                        {child.isPresent
                                            ? <Check size={26} strokeWidth={2} />
                                            : <div style={{ width: '11px', height: '11px', borderRadius: '50%', background: 'var(--glass-border)' }} />
                                        }
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <WebcamPhotoCapture
                isOpen={isCameraOpen}
                onClose={() => { setIsCameraOpen(false); setSelectedParticipantId(null); }}
                onPhotoCaptured={handlePhotoCaptured}
            />

            <input ref={fileInputRef} type="file" accept="image/*" onChange={(e) => handlePhotoUpload(e, fileTargetId.current)} style={{ display: 'none' }} />
            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={(e) => handlePhotoUpload(e, fileTargetId.current)} style={{ display: 'none' }} />

            {/* Bottom sheet choix photo */}
            {photoMenuFor && (
                <div
                    onClick={() => setPhotoMenuFor(null)}
                    style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: isMobile ? '0' : '2rem' }}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="animate-scale-in"
                        style={{ width: '100%', maxWidth: '440px', background: 'var(--surface-color)', borderRadius: isMobile ? '24px 24px 0 0' : '24px', padding: '1.5rem', paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))', boxShadow: '0 -8px 40px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}
                    >
                        <div style={{ textAlign: 'center', marginBottom: '0.25rem' }}>
                            <div style={{ fontWeight: '800', fontSize: '1.05rem', color: 'var(--text-main)' }}>Photo du vacancier</div>
                        </div>
                        <button onClick={choosePicCamera} className="btn btn-primary" style={{ height: '54px', borderRadius: '16px', fontWeight: '950', fontSize: '0.95rem', gap: '0.75rem', justifyContent: 'flex-start', paddingLeft: '1.5rem' }}>
                            <Camera size={20} strokeWidth={2} /> Prendre une photo
                        </button>
                        <button onClick={choosePicGallery} className="btn btn-secondary" style={{ height: '54px', borderRadius: '16px', fontWeight: '950', fontSize: '0.95rem', gap: '0.75rem', justifyContent: 'flex-start', paddingLeft: '1.5rem', background: 'var(--bg-secondary)', border: '1.5px solid var(--glass-border)' }}>
                            <ImageIcon size={20} strokeWidth={2} /> Choisir depuis la galerie
                        </button>
                        <button onClick={() => setPhotoMenuFor(null)} style={{ height: '48px', borderRadius: '16px', border: 'none', background: 'transparent', color: 'var(--text-muted)', fontWeight: '900', fontSize: '0.9rem', cursor: 'pointer' }}>
                            Annuler
                        </button>
                    </div>
                </div>
            )}

            <style>{`
                @media (hover: hover) {
                    .attendance-card:hover { background: white !important; }
                }
                .attendance-card:active { transform: scale(0.99); }
            `}</style>
        </div>
    );
}
