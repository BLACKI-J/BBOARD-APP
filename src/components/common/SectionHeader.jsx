import React from 'react';

/**
 * En-tête de section « éditorial » V2 : pavé icône en aplat graphite,
 * titre Bricolage, barre d'accent.
 *
 * <SectionHeader icon={Activity} title="Pôle Santé"
 *   subtitle="Assistant Sanitaire & Suivi Médical" />
 */
export default function SectionHeader({ icon: Icon, title, subtitle }) {
    // Accent mono minimal : graphite constant.
    const solid = `oklch(40% 0.01 250)`;
    const deep = `oklch(27% 0.012 250)`;
    return (
        <div className="section-head">
            {Icon && (
                <div className="sh-icon" style={{ background: `linear-gradient(140deg, ${solid} 0%, ${deep} 100%)` }}>
                    <Icon size={22} strokeWidth={2} />
                </div>
            )}
            <div style={{ minWidth: 0 }}>
                <h1 className="sh-title">{title}</h1>
                {subtitle ? <p className="sh-sub">{subtitle}</p> : <span className="sh-bar" style={{ background: solid }} />}
            </div>
        </div>
    );
}
