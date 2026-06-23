import React, { useState, useRef, useCallback } from 'react';
import { Camera, X, RefreshCw, Check, AlertCircle } from 'lucide-react';
import { canUseWebcam } from '../../utils/camera';
import { compressImage, fileToDataUrl } from '../../utils/image';

export default function WebcamPhotoCapture({ isOpen, onPhotoCaptured, onClose }) {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);
    const isOpenRef = useRef(isOpen);
    const [stream, setStream] = useState(null);
    const [error, setError] = useState(null);
    const [capturedImage, setCapturedImage] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isCameraRequested, setIsCameraRequested] = useState(false);

    React.useEffect(() => { isOpenRef.current = isOpen; }, [isOpen]);

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
        if (!canUseWebcam()) {
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
                if (!isOpenRef.current) { mediaStream.getTracks().forEach(t => t.stop()); return; }
            } catch {
                mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
                if (!isOpenRef.current) { mediaStream.getTracks().forEach(t => t.stop()); return; }
            }
            streamRef.current = mediaStream;
            setStream(mediaStream);
            const v = videoRef.current;
            if (v) {
                v.srcObject = mediaStream;
                // Déclencher play() uniquement après chargement des métadonnées (évite l'écran noir sur iOS).
                v.onloadedmetadata = () => { v.play().catch(() => {}); };
            }
        } catch (err) {
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
            let msg;
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                msg = isIOS
                    ? "Accès caméra refusé. Sur iPhone/iPad : Réglages → [votre navigateur] → Caméra → Autoriser. Puis appuyez sur « Réessayer »."
                    : "Accès caméra refusé. Appuyez sur 🔒 dans la barre d'adresse, autorisez la caméra, puis réessayez.";
            } else if (err.name === 'NotFoundError') {
                msg = "Aucune caméra détectée sur cet appareil.";
            } else if (err.name === 'NotReadableError') {
                msg = "La caméra est utilisée par une autre application. Fermez-la puis réessayez.";
            } else {
                msg = "Impossible d'accéder à la caméra. Vérifiez les autorisations de votre navigateur puis réessayez.";
            }
            setError(msg);
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
        if (!isOpen) { 
            setIsCameraRequested(false);
            stopCamera(); 
            setCapturedImage(null); 
        }
        return () => stopCamera();
    }, [isOpen, stopCamera]);

    const handleRequestCamera = () => {
        setIsCameraRequested(true);
        startCamera();
    };

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

    const handleFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const dataUrl = await fileToDataUrl(file);
            const compressed = await compressImage(dataUrl, 768, 0.75);
            setCapturedImage(compressed);
            setError(null);
        } catch {
            setError("Impossible de charger cette image. Réessayez avec un autre fichier.");
        }
    };

    return (
        <div className="modal-overlay animate-fade-in" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(20px)', zIndex: 1100 }}>
            <div className="modal-content animate-scale-in" style={{ 
                background: 'var(--surface-color)', borderRadius: '32px', padding: '2rem', width: '100%', maxWidth: '480px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem',
                boxShadow: '0 30px 100px oklch(0% 0 0 / 0.4)', border: '1.5px solid var(--glass-border)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ background: 'var(--primary-gradient)', borderRadius: '12px', padding: '8px', color: 'white', display: 'flex' }}>
                            <Camera size={20} strokeWidth={2} />
                        </div>
                        <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', fontFamily: 'Bricolage Grotesque, sans-serif', color: 'var(--text-main)', letterSpacing: '-0.02em' }}>Capture Photo</h3>
                    </div>
                    <button onClick={() => { stopCamera(); onClose(); }} style={{ background: 'var(--bg-secondary)', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', borderRadius: '12px', padding: '8px', display: 'flex' }}>
                        <X size={20} strokeWidth={2} />
                    </button>
                </div>

                {error ? (
                    <div style={{ padding: '2.5rem 1.5rem', background: 'oklch(62% 0.2 28 / 0.05)', color: 'var(--danger-color)', borderRadius: '24px', textAlign: 'center', border: '1.5px solid oklch(62% 0.2 28 / 0.1)', width: '100%' }}>
                        <AlertCircle size={40} style={{ margin: '0 auto 1.25rem', opacity: 0.8 }} />
                        <p style={{ margin: '0 0 1.5rem 0', fontWeight: '850', fontSize: '0.95rem' }}>{error}</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <button onClick={startCamera} className="btn btn-primary" style={{ background: 'var(--danger-color)', boxShadow: 'none' }}>Réessayer la caméra</button>
                            <label className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.85rem', borderRadius: '12px', cursor: 'pointer', background: 'white', fontWeight: '850', color: 'var(--text-main)', border: '1.5px solid var(--glass-border)', margin: 0 }}>
                                <Camera size={18} /> Prendre avec l'appareil photo
                                <input type="file" accept="image/*" capture="environment" onChange={handleFileUpload} style={{ display: 'none' }} />
                            </label>
                        </div>
                    </div>
                ) : !isCameraRequested && !capturedImage ? (
                    <div style={{ padding: '2.5rem 1.5rem', background: 'var(--bg-secondary)', color: 'var(--primary-color)', borderRadius: '24px', textAlign: 'center', width: '100%', border: '1.5px solid var(--border-color)' }}>
                        <Camera size={44} strokeWidth={2} style={{ margin: '0 auto 1.25rem', color: 'var(--primary-color)' }} />
                        <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)' }}>Utiliser la caméra ?</h4>
                        <p style={{ margin: '0 0 1.5rem 0', fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: '600' }}>Nous devons demander l'autorisation à votre navigateur pour prendre la photo directement.</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <button onClick={handleRequestCamera} className="btn btn-primary" style={{ width: '100%', padding: '1rem', borderRadius: '14px', fontWeight: '950' }}>Activer la caméra</button>
                            <label className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.85rem', borderRadius: '14px', cursor: 'pointer', background: 'white', fontWeight: '850', color: 'var(--text-main)', border: '1.5px solid var(--glass-border)', margin: 0 }}>
                                Choisir depuis la galerie
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

                {!error && (isCameraRequested || capturedImage) && (
                    <div style={{ width: '100%' }}>
                        {!capturedImage ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <button onClick={capturePhoto} disabled={isLoading} className="btn btn-primary" style={{ width: '100%', padding: '1.15rem', borderRadius: '18px', fontSize: '1.1rem', fontWeight: '950', gap: '0.75rem' }}>
                                    <Camera size={24} strokeWidth={2} /> Prendre la photo
                                </button>
                                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.75rem', borderRadius: '14px', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '800', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.05)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                    Écran noir ? Utiliser l'appareil
                                    <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
                                </label>
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <button onClick={() => setCapturedImage(null)} className="btn btn-secondary" style={{ padding: '1rem', borderRadius: '18px', fontWeight: '950', gap: '0.5rem' }}>
                                    <RefreshCw size={20} strokeWidth={2} /> Recommencer
                                </button>
                                <button onClick={() => { onPhotoCaptured(capturedImage); stopCamera(); onClose(); }} className="btn btn-primary" style={{ background: 'var(--success-color)', boxShadow: '0 12px 24px oklch(from var(--success-color) l c h / 0.2)', padding: '1rem', borderRadius: '18px', fontWeight: '950', gap: '0.5rem' }}>
                                    <Check size={20} strokeWidth={2} /> Valider
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
