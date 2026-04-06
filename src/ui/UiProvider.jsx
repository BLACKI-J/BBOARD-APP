import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, Info, X, AlertTriangle, Sparkles } from 'lucide-react';

const UiContext = createContext(null);

const Toast = ({ toast, onClose }) => {
    const icon = useMemo(() => {
        if (toast.type === 'error') return <AlertCircle size={18} strokeWidth={3} />;
        if (toast.type === 'success') return <CheckCircle2 size={18} strokeWidth={3} />;
        if (toast.type === 'warning') return <AlertTriangle size={18} strokeWidth={3} />;
        return <Info size={18} strokeWidth={3} />;
    }, [toast.type]);

    const color = useMemo(() => {
        if (toast.type === 'error') return 'var(--danger-color)';
        if (toast.type === 'success') return 'var(--success-color)';
        if (toast.type === 'warning') return 'var(--warning-color)';
        return 'var(--primary-color)';
    }, [toast.type]);

    return (
        <div className="card-glass animate-scale-in" style={{
            minWidth: '320px', maxWidth: '480px', background: 'white',
            border: `1.5px solid var(--glass-border)`, borderRadius: '20px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.1)', padding: '1.25rem',
            display: 'flex', alignItems: 'flex-start', gap: '1rem',
            transition: 'all 0.3s var(--ease-out-expo)', position: 'relative', overflow: 'hidden'
        }}>
            <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: color }} />
            <div style={{ background: `${color}15`, padding: '0.5rem', borderRadius: '10px', color, display: 'flex' }}>
                {icon}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                {toast.title && <div style={{ fontSize: '0.9rem', fontWeight: '950', color: 'var(--text-main)', marginBottom: '2px', fontFamily: 'Sora' }}>{toast.title}</div>}
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.5', fontWeight: '850' }}>{toast.message}</div>
            </div>
            <button onClick={onClose} style={{ color: 'var(--text-muted)', opacity: 0.5, border: 'none', background: 'transparent', cursor: 'pointer', padding: '0.25rem', display: 'flex' }}>
                <X size={16} strokeWidth={3} />
            </button>
        </div>
    );
};

const DialogShell = ({ children, onClose }) => (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(12px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }} onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className="card-glass animate-scale-in" style={{ width: '100%', maxWidth: '540px', borderRadius: '32px', border: '1.5px solid var(--glass-border)', background: 'white', boxShadow: '0 40px 100px rgba(0,0,0,0.2)', overflow: 'hidden' }}>
            {children}
        </div>
    </div>
);

export function UiProvider({ children }) {
    const [toasts, setToasts] = useState([]);
    const [dialog, setDialog] = useState(null);
    const [promptValue, setPromptValue] = useState('');
    const [promptError, setPromptError] = useState('');

    const dismissToast = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const toast = useCallback((message, options = {}) => {
        const id = crypto?.randomUUID?.() || `toast_${Date.now()}_${Math.random()}`;
        setToasts((prev) => [...prev, { id, message, title: options.title || '', type: options.type || 'info' }]);
        const timeout = options.timeout ?? 4000;
        if (timeout > 0) setTimeout(() => dismissToast(id), timeout);
    }, [dismissToast]);

    const confirm = useCallback((options) => {
        return new Promise((resolve) => {
            setDialog({
                type: 'confirm', title: options?.title || 'Confirmation', message: options?.message || 'Êtes-vous sûr de vouloir continuer ?',
                confirmText: options?.confirmText || 'Confirmer', cancelText: options?.cancelText || 'Annuler',
                danger: !!options?.danger, resolve
            });
        });
    }, []);

    const prompt = useCallback((options) => {
        return new Promise((resolve) => {
            setPromptValue(options?.defaultValue || ''); setPromptError('');
            setDialog({
                type: 'prompt', title: options?.title || 'Saisie', message: options?.message || '',
                placeholder: options?.placeholder || 'Entrez votre texte...', confirmText: options?.confirmText || 'Valider',
                cancelText: options?.cancelText || 'Annuler', validate: options?.validate, resolve
            });
        });
    }, []);

    const alert = useCallback((options) => {
        return new Promise((resolve) => {
            setDialog({
                type: 'alert', title: options?.title || 'Information', message: options?.message || '',
                confirmText: options?.confirmText || 'Compris', resolve
            });
        });
    }, []);

    const closeDialog = useCallback(() => { setDialog(null); setPromptError(''); }, []);

    const onConfirmDialog = useCallback(() => {
        if (!dialog) return;
        if (dialog.type === 'prompt') {
            if (dialog.validate) {
                const maybeError = dialog.validate(promptValue);
                if (maybeError) { setPromptError(maybeError); return; }
            }
            dialog.resolve(promptValue);
        } else dialog.resolve(true);
        closeDialog();
    }, [dialog, promptValue, closeDialog]);

    const onCancelDialog = useCallback(() => {
        if (!dialog) return;
        if (dialog.type === 'prompt') dialog.resolve(null);
        else if (dialog.type === 'confirm') dialog.resolve(false);
        else dialog.resolve(true);
        closeDialog();
    }, [dialog, closeDialog]);

    const value = useMemo(() => ({ toast, confirm, prompt, alert }), [toast, confirm, prompt, alert]);

    return (
        <UiContext.Provider value={value}>
            {children}

            <div style={{ position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 2500, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {toasts.map((item) => <Toast key={item.id} toast={item} onClose={() => dismissToast(item.id)} />)}
            </div>

            {dialog && (
                <DialogShell onClose={onCancelDialog}>
                    <div style={{ padding: '2.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
                            <div style={{ background: dialog.danger ? 'oklch(62% 0.18 20 / 0.1)' : 'var(--primary-light)', padding: '0.625rem', borderRadius: '12px', color: dialog.danger ? 'var(--danger-color)' : 'var(--primary-color)', display: 'flex' }}>
                                {dialog.danger ? <AlertTriangle size={20} strokeWidth={2.5} /> : <Sparkles size={20} strokeWidth={2.5} />}
                            </div>
                            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '950', color: 'var(--text-main)', fontFamily: 'Sora' }}>{dialog.title}</h3>
                        </div>
                        <p style={{ margin: '0', whiteSpace: 'pre-wrap', color: 'var(--text-muted)', fontSize: '0.95rem', fontWeight: '800', lineHeight: '1.6' }}>{dialog.message}</p>
                        
                        {dialog.type === 'prompt' && (
                            <div style={{ marginTop: '1.5rem' }}>
                                <input
                                    className="glass-input"
                                    value={promptValue}
                                    onChange={(e) => { setPromptValue(e.target.value); if (promptError) setPromptError(''); }}
                                    placeholder={dialog.placeholder}
                                    autoFocus
                                    style={{ width: '100%', height: '54px', padding: '0 1.25rem', background: 'var(--bg-secondary)', borderRadius: '16px', border: promptError ? '2px solid var(--danger-color)' : '2px solid transparent', fontWeight: '850', outline: 'none' }}
                                />
                                {promptError && <p style={{ marginTop: '0.5rem', color: 'var(--danger-color)', fontSize: '0.8rem', fontWeight: '950', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{promptError}</p>}
                            </div>
                        )}
                    </div>
                    <div style={{ borderTop: '1.5px solid var(--bg-secondary)', padding: '1.5rem 2.5rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem', background: 'var(--bg-secondary) / 0.3' }}>
                        {dialog.type !== 'alert' && <button className="btn btn-secondary" style={{ padding: '0.75rem 1.5rem', borderRadius: '14px', fontWeight: '950' }} onClick={onCancelDialog}>{dialog.cancelText}</button>}
                        <button className={`btn ${dialog.danger ? 'btn-danger' : 'btn-primary'}`} style={{ padding: '0.75rem 1.5rem', borderRadius: '14px', fontWeight: '950' }} onClick={onConfirmDialog}>{dialog.confirmText}</button>
                    </div>
                </DialogShell>
            )}
        </UiContext.Provider>
    );
}

export function useUi() {
    const ctx = useContext(UiContext);
    if (!ctx) throw new Error('useUi must be used inside UiProvider');
    return ctx;
}
