import React from 'react';

/**
 * En-tête de section « éditorial » V2 : pavé icône en aplat couleur de section,
 * titre Bricolage, barre d'accent. La teinte vient des tokens --sec-* (index.css).
 *
 * <SectionHeader hue="var(--sec-sante)" icon={Activity} title="Pôle Santé"
 *   subtitle="Assistant Sanitaire & Suivi Médical" />
 */
export default function SectionHeader({ hue, icon: Icon, title, subtitle, kicker }) {
    const solid = `oklch(52% 0.13 ${hue})`;
    const deep = `oklch(40% 0.12 ${hue})`;
    return (
        <div className="section-head">
            {Icon && (
                <div className="sh-icon" style={{ background: `linear-gradient(140deg, ${solid} 0%, ${deep} 100%)` }}>
                    <Icon size={22} strokeWidth={2.5} />
                </div>
            )}
            <div style={{ minWidth: 0 }}>
                {kicker && <div className="kicker" style={{ color: solid, marginBottom: '3px' }}>{kicker}</div>}
                <h1 className="sh-title">{title}</h1>
                {subtitle ? <p className="sh-sub">{subtitle}</p> : <span className="sh-bar" style={{ background: solid }} />}
            </div>
        </div>
    );
}
