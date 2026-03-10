import React, { useState, useRef, useCallback } from 'react';
import { Camera, X, RefreshCw, Check, AlertCircle } from 'lucide-react';

export default function WebcamPhotoCapture({ isOpen, onPhotoCaptured, onClose }) {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null); // Ref to hold the stream without triggering re-renders
    const [stream, setStream] = useState(null);
    const [error, setError] = useState(null);
    const [capturedImage, setCapturedImage] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // Arrêter la webcam proprement
    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setStream(null);
    }, []);

    // Démarrer la webcam
    const startCamera = useCallback(async () => {
        if (!isOpen) return;
        setIsLoading(true);
        setError(null);
        try {
            // Ensure any previous stream is stopped
            stopCamera();

            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 640 } }
            });

            streamRef.current = mediaStream;
            setStream(mediaStream);

            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        } catch (err) {
            console.error("Erreur d'accès à la webcam:", err);
            setError("Impossible d'accéder à la caméra. Veuillez vérifier les permissions de votre navigateur.");
        } finally {
            setIsLoading(false);
        }
    }, [isOpen, stopCamera]);

    // Use a separate effect to sync the stream to the video element
    // This helps if the video element wasn't ready when startCamera finished
    React.useEffect(() => {
        if (isOpen && stream && videoRef.current && videoRef.current.srcObject !== stream) {
            videoRef.current.srcObject = stream;
        }
    }, [isOpen, stream]);

    // Lancer au montage/ouverture, nettoyer au démontage/fermeture
    React.useEffect(() => {
        if (isOpen) {
            startCamera();
        } else {
            stopCamera();
        }
        return () => stopCamera();
    }, [isOpen, startCamera, stopCamera]);

    if (!isOpen) return null;

    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;

            // On veut une image carrée pour les avatars
            const size = Math.min(video.videoWidth, video.videoHeight);
            canvas.width = size;
            canvas.height = size;

            const ctx = canvas.getContext('2d');

            // Calcul pour centrer et croper en carré
            const startX = (video.videoWidth - size) / 2;
            const startY = (video.videoHeight - size) / 2;

            ctx.drawImage(video, startX, startY, size, size, 0, 0, size, size);

            const imageUrl = canvas.toDataURL('image/jpeg', 0.8);
            setCapturedImage(imageUrl);
        }
    };

    const handleConfirm = () => {
        if (capturedImage) {
            onPhotoCaptured(capturedImage);
            stopCamera();
            onClose();
        }
    };

    const handleRetake = () => {
        setCapturedImage(null);
    };

    const handleCancel = () => {
        stopCamera();
        onClose();
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 300,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
        }}>
            <div style={{
                background: 'white', borderRadius: '20px', padding: '1.5rem', width: '100%', maxWidth: '450px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', boxShadow: '0 25px 50px rgba(0,0,0,0.25)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '700', color: '#1e293b' }}>Prendre une photo</h3>
                    <button onClick={handleCancel} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                        <X size={24} />
                    </button>
                </div>

                {error ? (
                    <div style={{ padding: '2rem', background: '#fee2e2', color: '#b91c1c', borderRadius: '12px', textAlign: 'center' }}>
                        <AlertCircle size={32} style={{ margin: '0 auto 1rem' }} />
                        <p style={{ margin: 0, fontWeight: '500' }}>{error}</p>
                        <button onClick={startCamera} style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: '#dc2626', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                            Réessayer
                        </button>
                    </div>
                ) : (
                    <div style={{ position: 'relative', width: '300px', height: '300px', borderRadius: '50%', overflow: 'hidden', background: '#f1f5f9', border: '4px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {isLoading && !capturedImage && <div style={{ color: '#94a3b8' }}>Chargement caméra...</div>}

                        {!capturedImage ? (
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' /* Mirror effect */ }}
                            />
                        ) : (
                            <img src={capturedImage} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        )}
                        <canvas ref={canvasRef} style={{ display: 'none' }} />
                    </div>
                )}

                {!error && (
                    <div style={{ display: 'flex', gap: '1rem', width: '100%' }}>
                        {!capturedImage ? (
                            <button onClick={capturePhoto} disabled={isLoading} style={{
                                width: '100%', padding: '1rem', background: '#4f46e5', color: 'white', border: 'none',
                                borderRadius: '12px', fontWeight: '700', fontSize: '1.1rem', cursor: isLoading ? 'not-allowed' : 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                opacity: isLoading ? 0.7 : 1
                            }}>
                                <Camera size={22} /> Capturer
                            </button>
                        ) : (
                            <>
                                <button onClick={handleRetake} style={{
                                    flex: 1, padding: '1rem', background: '#f1f5f9', color: '#475569', border: 'none',
                                    borderRadius: '12px', fontWeight: '700', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                                }}>
                                    <RefreshCw size={20} /> Refaire
                                </button>
                                <button onClick={handleConfirm} style={{
                                    flex: 1, padding: '1rem', background: '#10b981', color: 'white', border: 'none',
                                    borderRadius: '12px', fontWeight: '700', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                                }}>
                                    <Check size={20} /> Valider
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
