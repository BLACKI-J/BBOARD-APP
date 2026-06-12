import React, { useState, useRef, useCallback } from 'react';
import { Camera, X, RefreshCw, Check, AlertCircle } from 'lucide-react';

export default function WebcamPhotoCapture({ isOpen, onPhotoCaptured, onClose }) {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);
    const [stream, setStream] = useState(null);
    const [error, setError] = useState(null);
    const [capturedImage, setCapturedImage] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setStream(null);
    }, []);

    const startCamera = useCallback(async () => {
        if (!isOpen) return;
        setIsLoading(true);
        setError(null);
        setCapturedImage(null); // reset entre deux ouvertures (sinon on garde la photo précédente)
        // getUserMedia exige un contexte sécurisé (HTTPS ou localhost). En HTTP/LAN il est absent.
        if (!navigator.mediaDevices?.getUserMedia) {
            setError("Caméra intégrée indisponible ici (nécessite HTTPS). Sur réseau local, utilisez « Galerie » ou l'appli photo du téléphone.");
            setIsLoading(false);
            return;
        }
        try {
            stopCamera();
            let mediaStream;
            try {
                mediaStream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 1280 } }
                });
            } catch {
                // Fallback : n'importe quelle caméra (certains appareils refusent la contrainte facingMode).
                mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
            }
            streamRef.current = mediaStream;
            setStream(mediaStream);
            const v = videoRef.current;
            if (v) {
                v.srcObject = mediaStream;
                // iOS/Safari : lecture explicite requise (sinon écran noir malgré autoPlay).
                v.onloadedmetadata = () => { v.play().catch(() => {}); };
                v.play().catch(() => {});
            }
        } catch (err) {
            setError("Impossible d'accéder à la caméra. Autorisez l'accès dans les réglages du navigateur, puis réessayez.");
        } finally {
            setIsLoading(false);
        }
    }, [isOpen, stopCamera]);

    React.useEffect(() => {
        if (isOpen && stream && videoRef.current && videoRef.current.srcObject !== stream) {
            videoRef.current.srcObject = stream;
            videoRef.current.play?.().catch(() => {});
        }
    }, [isOpen, stream]);

    React.useEffect(() => {
        if (isOpen) startCamera();
        else { stopCamera(); setCapturedImage(null); }
        return () => stopCamera();
    }, [isOpen, startCamera, stopCamera]);

    if (!isOpen) return null;

    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            const size = Math.min(video.videoWidth, video.videoHeight);
            // Plafonne la sortie à 768px : évite un base64 énorme (mémoire/réseau sur tél).
            const out = Math.min(size, 768);
            canvas.width = out;
            canvas.height = out;
            const ctx = canvas.getContext('2d');
            const startX = (video.videoWidth - size) / 2;
            const startY = (video.videoHeight - size) / 2;
            ctx.drawImage(video, startX, startY, size, size, 0, 0, out, out);
            setCapturedImage(canvas.toDataURL('image/jpeg', 0.75));
        }
    };

    const handleFileUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            setCapturedImage(event.target.result);
            setError(null);
        };
        reader.readAsDataURL(file);
    };

    return (
        <div className="modal-overlay animate-fade-in" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(20px)', zIndex: 1100 }}>
            <div className="modal-content animate-scale-in" style={{ 
                background: 'white', borderRadius: '32px', padding: '2rem', width: '100%', maxWidth: '480px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem',
                boxShadow: '0 30px 100px oklch(0% 0 0 / 0.4)', border: '1.5px solid var(--glass-border)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ background: 'var(--primary-gradient)', borderRadius: '12px', padding: '8px', color: 'white', display: 'flex' }}>
                            <Camera size={20} strokeWidth={2.5} />
                        </div>
                        <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '950', fontFamily: 'Bricolage Grotesque, sans-serif', color: 'var(--text-main)', letterSpacing: '-0.02em' }}>Capture Photo</h3>
                    </div>
                    <button onClick={() => { stopCamera(); onClose(); }} style={{ background: 'var(--bg-secondary)', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', borderRadius: '12px', padding: '8px', display: 'flex' }}>
                        <X size={20} strokeWidth={2.5} />
                    </button>
                </div>

                {error ? (
                    <div style={{ padding: '2.5rem 1.5rem', background: 'oklch(62% 0.2 28 / 0.05)', color: 'var(--danger-color)', borderRadius: '24px', textAlign: 'center', border: '1.5px solid oklch(62% 0.2 28 / 0.1)', width: '100%' }}>
                        <AlertCircle size={40} style={{ margin: '0 auto 1.25rem', opacity: 0.8 }} />
                        <p style={{ margin: '0 0 1.5rem 0', fontWeight: '850', fontSize: '0.95rem' }}>{error}</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <button onClick={startCamera} className="btn btn-primary" style={{ background: 'var(--danger-color)', boxShadow: 'none' }}>Réessayer la caméra</button>
                            <label className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.85rem', borderRadius: '12px', cursor: 'pointer', background: 'white', fontWeight: '850', color: 'var(--text-main)', border: '1.5px solid var(--glass-border)', margin: 0 }}>
                                <Camera size={18} /> Prendre avec l'appareil
                                <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
                            </label>
                        </div>
                    </div>
                ) : (
                    <div style={{ position: 'relative', width: '320px', height: '320px', borderRadius: '28px', overflow: 'hidden', background: 'var(--bg-secondary)', border: '2px solid var(--glass-border)', boxShadow: 'inset 0 4px 12px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {isLoading && !capturedImage && (
                            <div style={{ textAlign: 'center' }}>
                                <div className="spinner-small" style={{ margin: '0 auto 1rem' }} />
                                <div style={{ fontSize: '11px', fontWeight: '950', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Activation caméra...</div>
                            </div>
                        )}
                        {!capturedImage ? (
                            <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            <img src={capturedImage} alt="Capture" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        )}
                        <canvas ref={canvasRef} style={{ display: 'none' }} />
                        
                        {!capturedImage && !isLoading && (
                            <div style={{ position: 'absolute', inset: '10%', border: '2px solid rgba(255,255,255,0.4)', borderRadius: '20px', pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <div style={{ fontSize: '10px', fontWeight: '950', color: 'white', opacity: 0.6, textTransform: 'uppercase' }}>Cadre de capture</div>
                            </div>
                        )}
                    </div>
                )}

                {!error && (
                    <div style={{ width: '100%' }}>
                        {!capturedImage ? (
                            <button onClick={capturePhoto} disabled={isLoading} className="btn btn-primary" style={{ width: '100%', padding: '1.15rem', borderRadius: '18px', fontSize: '1.1rem', fontWeight: '950', gap: '0.75rem' }}>
                                <Camera size={24} strokeWidth={2.5} /> Prendre la photo
                            </button>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <button onClick={() => setCapturedImage(null)} className="btn btn-secondary" style={{ padding: '1rem', borderRadius: '18px', fontWeight: '950', gap: '0.5rem' }}>
                                    <RefreshCw size={20} strokeWidth={2.5} /> Recommencer
                                </button>
                                <button onClick={() => { onPhotoCaptured(capturedImage); stopCamera(); onClose(); }} className="btn btn-primary" style={{ background: 'var(--success-color)', boxShadow: '0 12px 24px oklch(from var(--success-color) l c h / 0.2)', padding: '1rem', borderRadius: '18px', fontWeight: '950', gap: '0.5rem' }}>
                                    <Check size={20} strokeWidth={2.5} /> Valider
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
