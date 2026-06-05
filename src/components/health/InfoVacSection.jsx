import React, { useState } from 'react';
import { Dribbble, Bath, Moon, UtensilsCrossed, Activity, Pill } from 'lucide-react';

const INFO_VAC_CATEGORIES = [
    { id: 'activites', label: 'Activités', icon: <Dribbble size={16} />, color: 'oklch(62% 0.18 232)' },
    { id: 'hygiene',   label: 'Hygiène',   icon: <Bath size={16} />,    color: 'oklch(62% 0.18 200)' },
    { id: 'sommeil',   label: 'Sommeil',   icon: <Moon size={16} />,    color: 'oklch(62% 0.18 270)' },
    { id: 'repas',     label: 'Repas',     icon: <UtensilsCrossed size={16} />, color: 'oklch(62% 0.18 80)' },
    { id: 'sante',     label: 'Santé',     icon: <Activity size={16} />, color: 'oklch(62% 0.18 20)' },
    { id: 'traitements', label: 'Traitements', icon: <Pill size={16} />, color: 'oklch(62% 0.18 145)' },
];

const CATEGORY_FIELDS = {
    activites: [
        { key: 'ivBaignade',      label: 'Baignade',           type: 'select', options: ['OUI','NON','Avec surveillance'] },
        { key: 'ivNage',          label: 'Sait nager',         type: 'select', options: ['OUI','NON','Notions'] },
        { key: 'ivDroitImageInt', label: 'Droit image interne',type: 'select', options: ['OUI','NON'] },
        { key: 'ivDroitImageExt', label: 'Droit image externe',type: 'select', options: ['OUI','NON'] },
        { key: 'ivContraIndic',   label: 'Contre-indications', type: 'text' },
    ],
    hygiene: [
        { key: 'ivDouche',      label: 'Douche',        type: 'select', options: ['Autonome','Suivi partiel','Avec aide','Surveillance adulte'] },
        { key: 'ivEssuyer',     label: "S'essuyer",     type: 'select', options: ['Autonome','Avec aide','RAS'] },
        { key: 'ivHabiller',    label: "S'habiller",    type: 'select', options: ['Autonome','Avec aide','RAS'] },
        { key: 'ivDentaire',    label: 'Dentaire',      type: 'select', options: ['Autonome','Avec aide','RAS'] },
        { key: 'ivHygieneNote', label: 'Notes',         type: 'text' },
    ],
    sommeil: [
        { key: 'ivSommeilHeures',  label: 'Heures de sommeil', type: 'text', placeholder: 'Ex: 10h (20h30 → 7h)' },
        { key: 'ivSommeilRituel',  label: 'Rituel',            type: 'text', placeholder: 'Ex: Doudou, lecture…' },
        { key: 'ivSommeilNotes',   label: 'Particularités',    type: 'text', placeholder: 'Ex: Porte ouverte, lumière…' },
    ],
    repas: [
        { key: 'ivRegime',     label: 'Régime / Spécificité', type: 'text',   placeholder: 'Standard, végétarien…' },
        { key: 'ivAllergie',   label: 'Aliment interdit',     type: 'text',   placeholder: 'Ex: Arachides…' },
        { key: 'ivAideRepas',  label: 'Aide au repas',        type: 'select', options: ['Non','Oui','Canalisé'] },
        { key: 'ivBavoir',     label: 'Bavoir',               type: 'select', options: ['NON','OUI'] },
        { key: 'ivRepasNotes', label: 'Notes',                type: 'text' },
    ],
    sante: [
        { key: 'ivEnuresie',     label: 'Enuérésie',    type: 'select', options: ['NON','OUI'] },
        { key: 'ivEncopresie',   label: 'Encoprésie',   type: 'select', options: ['NON','OUI'] },
        { key: 'ivChangesJour',  label: 'Changes (jour)',type: 'select', options: ['NON','OUI'] },
        { key: 'ivChangesNuit',  label: 'Changes (nuit)',type: 'select', options: ['NON','OUI'] },
        { key: 'ivEpilepsie',    label: 'Épilepsie',    type: 'select', options: ['NON','OUI'] },
        { key: 'ivAppareillage', label: 'Appareillage', type: 'text',   placeholder: 'Ex: Lunettes, appareil auditif…' },
    ],
    traitements: [
        { key: 'ivMedMatin',   label: 'Matin',   type: 'text', placeholder: 'Médicament + dose' },
        { key: 'ivMedMidi',    label: 'Midi',    type: 'text', placeholder: 'Médicament + dose' },
        { key: 'ivMedGouter',  label: 'Goûter',  type: 'text', placeholder: 'Médicament + dose' },
        { key: 'ivMedSoir',    label: 'Soir',    type: 'text', placeholder: 'Médicament + dose' },
        { key: 'ivMedCoucher', label: 'Coucher', type: 'text', placeholder: 'Médicament + dose' },
    ],
};

const InfoVacSection = ({ children, groups, updateParticipantHealth, canEdit, isMobile }) => {
    const [activeCategory, setActiveCategory] = useState('activites');
    const fields = CATEGORY_FIELDS[activeCategory] || [];
    const cat = INFO_VAC_CATEGORIES.find(c => c.id === activeCategory);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Category pills */}
            <div className="u-flex u-flex-wrap u-gap-sm">
                {INFO_VAC_CATEGORIES.map(c => (
                    <button key={c.id} onClick={() => setActiveCategory(c.id)} style={{
                        display: 'flex', alignItems: 'center', gap: '0.625rem',
                        padding: '0.75rem 1.25rem', borderRadius: '16px', border: '2px solid', cursor: 'pointer',
                        fontWeight: '850', fontSize: '0.85rem', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        borderColor: activeCategory === c.id ? c.color : 'var(--glass-border)',
                        background: activeCategory === c.id ? 'white' : 'rgba(255,255,255,0.4)',
                        color: activeCategory === c.id ? c.color : 'var(--text-muted)',
                        boxShadow: activeCategory === c.id ? `0 8px 24px ${c.color}25` : 'none',
                        transform: activeCategory === c.id ? 'translateY(-2px)' : 'none',
                    }}>
                        {c.icon} {c.label}
                    </button>
                ))}
            </div>

            {/* Section header */}
            <div className="u-flex u-items-center u-gap-md" style={{ padding: '1.25rem 1.75rem', borderRadius: '24px', background: `${cat.color}08`, border: `1.5px solid ${cat.color}20` }}>
                <div style={{ background: 'white', padding: '0.75rem', borderRadius: '14px', color: cat.color, boxShadow: 'var(--shadow-sm)' }}>{cat.icon}</div>
                <div>
                    <div style={{ fontWeight: '950', fontSize: '1.1rem', color: 'var(--text-main)', letterSpacing: '-0.02em' }}>{cat.label}</div>
                    <div className="u-text-sm u-text-muted u-font-bold">{children.length} participants · Édition directe dans le tableau</div>
                </div>
            </div>

            {/* Data table */}
            <div className="u-table-wrap">
                <table className="u-table" style={{ minWidth: `${250 + fields.length * 160}px` }}>
                    <thead>
                        <tr style={{ background: 'rgba(0,0,0,0.03)', borderBottom: '1.5px solid var(--glass-border)' }}>
                            <th className="u-th" style={{ position: 'sticky', left: 0, background: 'rgba(248,248,248,0.98)', zIndex: 2 }}>Enfant</th>
                            {fields.map(f => <th key={f.key} className="u-th">{f.label}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {children.map((child, idx) => (
                            <tr key={child.id} style={{ borderBottom: idx < children.length - 1 ? '1px solid var(--glass-border)' : 'none' }} className="hover-row">
                                <td style={{ padding: '0.75rem 1.5rem', position: 'sticky', left: 0, background: 'white', zIndex: 1, borderRight: '1px solid var(--glass-border)' }}>
                                    <div style={{ fontWeight: '900', fontSize: '0.88rem', whiteSpace: 'nowrap' }}>{child.firstName} {child.lastName.toUpperCase()}</div>
                                    <div className="u-text-xs u-text-muted u-font-bold">{groups.find(g => g.id === child.group)?.name || ''}</div>
                                </td>
                                {fields.map(f => (
                                    <td key={f.key} style={{ padding: '0.5rem 0.75rem' }}>
                                        {f.type === 'select' ? (
                                            <select
                                                value={child[f.key] || ''}
                                                onChange={e => updateParticipantHealth(child.id, f.key, e.target.value)}
                                                disabled={!canEdit}
                                                style={{ width: '100%', fontSize: '0.82rem', fontWeight: '800', padding: '6px 8px', borderRadius: '8px', border: '1px solid transparent', background: 'transparent', cursor: 'pointer', color: child[f.key] === 'OUI' ? 'oklch(62% 0.18 145)' : child[f.key] === 'NON' ? 'oklch(62% 0.18 20)' : 'var(--text-main)' }}
                                            >
                                                <option value="">--</option>
                                                {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                                            </select>
                                        ) : (
                                            <input
                                                type="text"
                                                value={child[f.key] || ''}
                                                onChange={e => updateParticipantHealth(child.id, f.key, e.target.value)}
                                                disabled={!canEdit}
                                                placeholder={f.placeholder || 'RAS'}
                                                className="inline-input"
                                                style={{ width: '100%', fontSize: '0.82rem', fontWeight: '700', padding: '6px 8px', borderRadius: '8px', border: '1px solid transparent', background: 'transparent' }}
                                            />
                                        )}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default InfoVacSection;
