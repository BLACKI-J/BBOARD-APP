import React from 'react';
import {
    ShieldAlert, FileText, Check, X
} from 'lucide-react';
import Avatar from '../common/Avatar';
import { GroupBadge } from '../common/Badges';
import { SearchInput } from '../ui';
import { printHtml } from '../../utils/printHtml';

const OverviewTable = ({
    children,
    groups,
    searchTerm,
    setSearchTerm,
    filterAlertsOnly,
    setFilterAlertsOnly,
    updateParticipantHealth,
    canEdit,
    isMobile,
}) => {
    const handlePrintAllergies = () => {
        const childrenWithAlert = children.filter(c =>
            (c.allergies && c.allergies.trim()) || (c.constraints && c.constraints.trim()) || (c.diet && c.diet.trim())
        );
        const rows = childrenWithAlert.map(c => `
            <tr>
                <td>${c.firstName} ${c.lastName.toUpperCase()}</td>
                <td>${c.allergies || '—'}</td>
                <td>${c.diet || '—'}</td>
                <td>${c.constraints || '—'}</td>
            </tr>`).join('');
        printHtml(`<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8">
            <title>Liste Allergies & Régimes</title>
            <style>
                body { font-family: Arial, sans-serif; font-size: 13px; padding: 24px; }
                h1 { font-size: 18px; margin-bottom: 4px; }
                p { margin: 0 0 16px; color: #666; font-size: 11px; }
                table { width: 100%; border-collapse: collapse; }
                th { background: #f0f0f0; text-align: left; padding: 8px 12px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 2px solid #ddd; }
                td { padding: 8px 12px; border-bottom: 1px solid #eee; vertical-align: top; }
                tr:nth-child(even) td { background: #fafafa; }
            </style></head><body>
            <h1>Allergies & Régimes alimentaires</h1>
            <p>Imprimé le ${new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} — ${childrenWithAlert.length} enfant(s) concerné(s)</p>
            <table><thead><tr><th>Enfant</th><th>Allergies</th><th>Régime</th><th>Contraintes</th></tr></thead>
            <tbody>${rows}</tbody></table>
            </body></html>`);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Search & Filters */}
            <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '1rem', alignItems: 'center' }}>
                <SearchInput
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder="Rechercher un enfant..."
                    style={{ flex: 1, width: isMobile ? '100%' : 'auto' }}
                />
                <button
                    onClick={() => setFilterAlertsOnly(!filterAlertsOnly)}
                    style={{
                        height: '48px', padding: '0 1.25rem', borderRadius: '14px', border: '1.5px solid',
                        borderColor: filterAlertsOnly ? 'var(--danger-color)' : 'var(--glass-border)',
                        background: filterAlertsOnly ? 'oklch(62% 0.2 28 / 0.1)' : 'white',
                        color: filterAlertsOnly ? 'var(--danger-color)' : 'var(--text-muted)',
                        fontWeight: '900', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', transition: 'all 0.2s',
                        width: isMobile ? '100%' : 'auto', justifyContent: 'center'
                    }}
                >
                    <ShieldAlert size={18} /> Alertes Uniquement
                </button>
                <button
                    onClick={handlePrintAllergies}
                    style={{
                        height: '48px', padding: '0 1.25rem', borderRadius: '14px', border: '1.5px solid var(--glass-border)',
                        background: 'white', color: 'var(--text-muted)',
                        fontWeight: '900', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', transition: 'all 0.2s',
                        width: isMobile ? '100%' : 'auto', justifyContent: 'center'
                    }}
                >
                    <FileText size={18} /> Imprimer liste
                </button>
            </div>

            {/* Overview Table */}
            <div className="u-table-wrap">
                <table className="u-table">
                    <thead>
                        <tr style={{ background: 'var(--bg-main)', borderBottom: '1.5px solid var(--glass-border)' }}>
                            <th className="u-th">Participant</th>
                            <th className="u-th">Régime Alimentaire</th>
                            <th className="u-th">Test Natation</th>
                            <th className="u-th">Sommeil & Notes</th>
                            <th className="u-th">Points de Vigilance</th>
                        </tr>
                    </thead>
                    <tbody>
                        {children.map(child => (
                            <tr key={child.id} style={{ borderBottom: '1px solid var(--glass-border)', transition: 'background 0.2s' }} className="hover-row">
                                <td className="u-td">
                                    <div className="u-flex u-items-center u-gap-md">
                                        <Avatar participant={child} size={40} />
                                        <div>
                                            <div style={{ fontWeight: '950', fontSize: '0.95rem', color: 'var(--text-main)', letterSpacing: '-0.02em' }}>{child.firstName} {child.lastName.toUpperCase()}</div>
                                            <div style={{ marginTop: '2px' }}>
                                                <GroupBadge groupId={child.group} groups={groups} />
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="u-td">
                                    <input
                                        type="text" className="inline-input" placeholder="Aucun régime spécifique"
                                        value={child.diet || ''} onChange={e => updateParticipantHealth(child.id, 'diet', e.target.value)}
                                        disabled={!canEdit}
                                        style={{ width: '100%', fontSize: '0.85rem', fontWeight: '700', padding: '8px 12px', borderRadius: '10px', border: '1.5px solid transparent', background: 'var(--bg-main)' }}
                                    />
                                </td>
                                <td className="u-td">
                                    <button
                                        onClick={() => updateParticipantHealth(child.id, 'swimTest', !child.swimTest)}
                                        disabled={!canEdit}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.5rem 1rem', borderRadius: '12px', border: '1.5px solid', cursor: 'pointer', transition: 'all 0.2s',
                                            borderColor: child.swimTest ? 'oklch(62% 0.18 145 / 0.3)' : 'var(--glass-border)',
                                            background: child.swimTest ? 'oklch(96% 0.04 145)' : 'white',
                                            color: child.swimTest ? 'oklch(55% 0.18 145)' : 'var(--text-muted)',
                                            fontWeight: '900', fontSize: '0.75rem'
                                        }}
                                    >
                                        {child.swimTest ? <Check size={14} strokeWidth={3} /> : <X size={14} strokeWidth={3} />}
                                        {child.swimTest ? 'VALIDÉ' : 'À TESTER'}
                                    </button>
                                </td>
                                <td className="u-td">
                                    <input
                                        type="text" className="inline-input" placeholder="Rien à signaler"
                                        value={child.sleepNotes || ''} onChange={e => updateParticipantHealth(child.id, 'sleepNotes', e.target.value)}
                                        disabled={!canEdit}
                                        style={{ width: '100%', fontSize: '0.85rem', fontWeight: '700', padding: '8px 12px', borderRadius: '10px', border: '1.5px solid transparent', background: 'var(--bg-main)' }}
                                    />
                                </td>
                                <td className="u-td">
                                    {((child.allergies && child.allergies.trim()) || (child.constraints && child.constraints.trim())) ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', minWidth: '170px' }}>
                                            {child.allergies && child.allergies.trim() && (
                                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '7px', fontSize: '0.8rem', fontWeight: '800', color: 'var(--danger-color)', lineHeight: 1.3 }}>
                                                    <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--danger-color)', marginTop: '5px', flexShrink: 0 }} />
                                                    <span><span style={{ display: 'block', textTransform: 'uppercase', fontSize: '0.6rem', letterSpacing: '0.05em', opacity: 0.75 }}>Allergie</span>{child.allergies}</span>
                                                </div>
                                            )}
                                            {child.constraints && child.constraints.trim() && (
                                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '7px', fontSize: '0.8rem', fontWeight: '800', color: 'oklch(52% 0.16 60)', lineHeight: 1.3 }}>
                                                    <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'oklch(60% 0.17 60)', marginTop: '5px', flexShrink: 0 }} />
                                                    <span><span style={{ display: 'block', textTransform: 'uppercase', fontSize: '0.6rem', letterSpacing: '0.05em', opacity: 0.75 }}>Contrainte</span>{child.constraints}</span>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', opacity: 0.3, fontWeight: '700' }}>R.A.S</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <style>{`
                .hover-row:hover { background: rgba(0,0,0,0.015); }
                .inline-input:hover { border-color: var(--glass-border) !important; background: white; }
                .inline-input:focus { border-color: var(--primary-color) !important; background: white; outline: none; }
            `}</style>
        </div>
    );
};

export default OverviewTable;
