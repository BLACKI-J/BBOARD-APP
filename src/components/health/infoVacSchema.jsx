import React from 'react';
import { Dribbble, Bath, Moon, UtensilsCrossed, Activity, Pill } from 'lucide-react';

// Static reference info schema for a vacancier's "fiche".
export const SECTIONS = [
    {
        id: 'activites', label: 'Activités', icon: <Dribbble size={15} />, color: 'oklch(62% 0.18 232)',
        fields: [
            { key: 'ivBaignade',      label: 'Baignade',            type: 'select', options: ['OUI','NON','Avec surveillance'] },
            { key: 'ivNage',          label: 'Sait nager',          type: 'select', options: ['OUI','NON','Notions'] },
            { key: 'ivDroitImageInt', label: 'Photo interne',       type: 'select', options: ['OUI','NON'] },
            { key: 'ivDroitImageExt', label: 'Photo externe',       type: 'select', options: ['OUI','NON'] },
            { key: 'ivContraIndic',   label: 'Contre-indications',  type: 'text' },
        ],
    },
    {
        id: 'hygiene', label: 'Hygiène', icon: <Bath size={15} />, color: 'oklch(62% 0.18 200)',
        fields: [
            { key: 'ivDouche',      label: 'Douche',       type: 'select', options: ['Autonome','Suivi partiel','Avec aide','Surveillance adulte'] },
            { key: 'ivEssuyer',     label: "S'essuyer",    type: 'select', options: ['Autonome','Avec aide','RAS'] },
            { key: 'ivHabiller',    label: "S'habiller",   type: 'select', options: ['Autonome','Avec aide','RAS'] },
            { key: 'ivDentaire',    label: 'Dentaire',     type: 'select', options: ['Autonome','Avec aide','RAS'] },
            { key: 'ivHygieneNote', label: 'Notes',        type: 'text' },
        ],
    },
    {
        id: 'sommeil', label: 'Sommeil', icon: <Moon size={15} />, color: 'oklch(62% 0.18 270)',
        fields: [
            { key: 'ivSommeilHeures', label: 'Heures',        type: 'text', placeholder: 'Ex: 20h30 → 7h' },
            { key: 'ivSommeilRituel', label: 'Rituel',        type: 'text', placeholder: 'Ex: Doudou, lecture…' },
            { key: 'ivSommeilNotes',  label: 'Particularités',type: 'text', placeholder: 'Ex: Porte ouverte…' },
        ],
    },
    {
        id: 'repas', label: 'Repas', icon: <UtensilsCrossed size={15} />, color: 'oklch(62% 0.18 80)',
        fields: [
            { key: 'ivRegime',     label: 'Régime',          type: 'text',   placeholder: 'Standard, végétarien…' },
            { key: 'ivAllergie',   label: 'Aliment interdit',type: 'text',   placeholder: 'Ex: Arachides…' },
            { key: 'ivAideRepas',  label: 'Aide repas',      type: 'select', options: ['Non','Oui','Canalisé'] },
            { key: 'ivBavoir',     label: 'Bavoir',          type: 'select', options: ['NON','OUI'] },
            { key: 'ivRepasNotes', label: 'Notes',           type: 'text' },
        ],
    },
    {
        id: 'sante', label: 'Santé', icon: <Activity size={15} />, color: 'oklch(62% 0.18 20)',
        fields: [
            { key: 'ivEnuresie',     label: 'Énurésie',     type: 'select', options: ['NON','OUI'] },
            { key: 'ivEncopresie',   label: 'Encoprésie',   type: 'select', options: ['NON','OUI'] },
            { key: 'ivChangesJour',  label: 'Changes jour', type: 'select', options: ['NON','OUI'] },
            { key: 'ivChangesNuit',  label: 'Changes nuit', type: 'select', options: ['NON','OUI'] },
            { key: 'ivEpilepsie',    label: 'Épilepsie',    type: 'select', options: ['NON','OUI'] },
            { key: 'ivAppareillage', label: 'Appareillage', type: 'text',   placeholder: 'Lunettes, appareil…' },
        ],
    },
    {
        id: 'traitements', label: 'Traitements', icon: <Pill size={15} />, color: 'oklch(62% 0.18 145)',
        fields: [
            { key: 'ivMedMatin',   label: 'Matin',   type: 'text', placeholder: 'Médicament + dose' },
            { key: 'ivMedMidi',    label: 'Midi',    type: 'text', placeholder: 'Médicament + dose' },
            { key: 'ivMedGouter',  label: 'Goûter',  type: 'text', placeholder: 'Médicament + dose' },
            { key: 'ivMedSoir',    label: 'Soir',    type: 'text', placeholder: 'Médicament + dose' },
            { key: 'ivMedCoucher', label: 'Coucher', type: 'text', placeholder: 'Médicament + dose' },
        ],
    },
];

// Non-empty summary rows for a card preview.
export const getSummaryRows = (child) => {
    const rows = [];
    SECTIONS.forEach(sec => {
        sec.fields.forEach(f => {
            const v = child[f.key];
            if (!v || v === '' || v === '--' || v === 'NON' || v === 'RAS' || v === 'Non') return;
            rows.push({ icon: sec.icon, color: sec.color, label: f.label, value: v });
        });
    });
    return rows;
};

// Count OUI flags on health-section fields.
export const getAlertCount = (child) => {
    const alertKeys = ['ivEnuresie','ivEncopresie','ivChangesJour','ivChangesNuit','ivEpilepsie'];
    return alertKeys.filter(k => child[k] === 'OUI').length;
};
