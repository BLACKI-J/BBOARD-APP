import React from 'react';
import { Dribbble, Bath, Moon, UtensilsCrossed, Activity } from 'lucide-react';

// Static reference info schema for a vacancier's "fiche".
export const SECTIONS = [
    {
        // Champs partagés avec l'Annuaire (mêmes clés `allergies` / `diet`) :
        // une seule source de vérité, éditable depuis la fiche ET l'annuaire.
        id: 'alimentaire', label: 'Allergies & régime', icon: <UtensilsCrossed size={15} />, color: 'oklch(58% 0.14 25)',
        fields: [
            { key: 'allergies', label: 'Allergies connues',    type: 'text', placeholder: 'Ex : arachides, lactose…' },
            { key: 'diet',      label: 'Régime alimentaire',   type: 'text', placeholder: 'Ex : sans porc, végétarien…' },
        ],
    },
    {
        id: 'activites', label: 'Activités', icon: <Dribbble size={15} />, color: 'oklch(60% 0.13 240)',
        fields: [
            { key: 'ivBaignade',      label: 'Baignade',            type: 'select', options: ['OUI','NON','Avec surveillance'] },
            { key: 'ivNage',          label: 'Sait nager',          type: 'select', options: ['OUI','NON','Notions'] },
            { key: 'ivDroitImageInt', label: 'Photo interne',       type: 'select', options: ['OUI','NON'] },
            { key: 'ivDroitImageExt', label: 'Photo externe',       type: 'select', options: ['OUI','NON'] },
            { key: 'ivContraIndic',   label: 'Contre-indications',  type: 'text' },
        ],
    },
    {
        id: 'hygiene', label: 'Hygiène', icon: <Bath size={15} />, color: 'oklch(62% 0.12 195)',
        fields: [
            { key: 'ivDouche',      label: 'Douche',       type: 'select', options: ['Autonome','Suivi partiel','Avec aide','Surveillance adulte'] },
            { key: 'ivEssuyer',     label: "S'essuyer",    type: 'select', options: ['Autonome','Avec aide','RAS'] },
            { key: 'ivHabiller',    label: "S'habiller",   type: 'select', options: ['Autonome','Avec aide','RAS'] },
            { key: 'ivDentaire',    label: 'Dentaire',     type: 'select', options: ['Autonome','Avec aide','RAS'] },
            { key: 'ivHygieneNote', label: 'Notes',        type: 'text' },
        ],
    },
    {
        id: 'sommeil', label: 'Sommeil', icon: <Moon size={15} />, color: 'oklch(56% 0.14 285)',
        fields: [
            { key: 'ivSommeilHeures', label: 'Heures',        type: 'text', placeholder: 'Ex: 20h30 → 7h' },
            { key: 'ivSommeilRituel', label: 'Rituel',        type: 'text', placeholder: 'Ex: Doudou, lecture…' },
            { key: 'ivSommeilNotes',  label: 'Particularités',type: 'text', placeholder: 'Ex: Porte ouverte…' },
        ],
    },
    {
        id: 'repas', label: 'Repas', icon: <UtensilsCrossed size={15} />, color: 'oklch(64% 0.13 70)',
        fields: [
            { key: 'ivRegime',     label: 'Régime',          type: 'text',   placeholder: 'Standard, végétarien…' },
            { key: 'ivAllergie',   label: 'Aliment interdit',type: 'text',   placeholder: 'Ex: Arachides…' },
            { key: 'ivAideRepas',  label: 'Aide repas',      type: 'select', options: ['Non','Oui','Canalisé'] },
            { key: 'ivBavoir',     label: 'Bavoir',          type: 'select', options: ['NON','OUI'] },
            { key: 'ivRepasNotes', label: 'Notes',           type: 'text' },
        ],
    },
    {
        id: 'sante', label: 'Santé', icon: <Activity size={15} />, color: 'oklch(58% 0.13 145)',
        fields: [
            { key: 'ivEnuresie',     label: 'Énurésie',     type: 'select', options: ['NON','OUI'] },
            { key: 'ivEncopresie',   label: 'Encoprésie',   type: 'select', options: ['NON','OUI'] },
            { key: 'ivChangesJour',  label: 'Changes jour', type: 'select', options: ['NON','OUI'] },
            { key: 'ivChangesNuit',  label: 'Changes nuit', type: 'select', options: ['NON','OUI'] },
            { key: 'ivEpilepsie',    label: 'Épilepsie',    type: 'select', options: ['NON','OUI'] },
            { key: 'ivAppareillage', label: 'Appareillage', type: 'text',   placeholder: 'Lunettes, appareil…' },
        ],
    },
    // Section « Traitements » (ivMed*) retirée : faisait doublon avec le vrai
    // système médicaments (formulaire unifié medications[] + module Médicaments).
];

// Une valeur « vide » côté résumé : non renseignée ou égale à la réponse neutre
// (NON / RAS / Non) qu'on n'affiche pas pour ne pas noyer les infos utiles.
const isEmptySummaryValue = (v) => !v || v === '' || v === '--' || v === 'NON' || v === 'RAS' || v === 'Non';

// Mêmes infos mais REGROUPÉES par section (carte « tout visible ») : on ne garde
// que les sections ayant au moins un champ renseigné. (key conservé → filtrage aval)
export const getSummaryBySection = (child) => SECTIONS
    .map(sec => ({
        id: sec.id, label: sec.label, color: sec.color, icon: sec.icon,
        rows: sec.fields
            .filter(f => !isEmptySummaryValue(child[f.key]))
            .map(f => ({ key: f.key, label: f.label, value: child[f.key] })),
    }))
    .filter(sec => sec.rows.length > 0);

// Alertes médicales = flags OUI à signaler en priorité (bandeau rouge de la carte).
export const ALERT_FIELDS = [
    { key: 'ivEnuresie',    label: 'Énurésie' },
    { key: 'ivEncopresie',  label: 'Encoprésie' },
    { key: 'ivChangesJour', label: 'Changes jour' },
    { key: 'ivChangesNuit', label: 'Changes nuit' },
    { key: 'ivEpilepsie',   label: 'Épilepsie' },
];
export const getAlertFlags = (child) => ALERT_FIELDS.filter(f => child[f.key] === 'OUI').map(f => f.label);

// Clés déjà mises en avant ailleurs sur la carte (bandeau critique + résumé d'un
// coup d'œil) → on les retire du détail par section pour éviter les doublons.
const DETAIL_EXCLUDE = new Set(['allergies', 'diet', 'ivBaignade', 'ivNage', ...ALERT_FIELDS.map(f => f.key)]);

// Sections de DÉTAIL pour la carte : tout sauf l'alimentaire (→ bandeau) et sans
// les clés déjà résumées en tête. Sections vidées retirées.
export const getDetailSections = (child) => getSummaryBySection(child)
    .filter(sec => sec.id !== 'alimentaire')
    .map(sec => ({ ...sec, rows: sec.rows.filter(r => !DETAIL_EXCLUDE.has(r.key)) }))
    .filter(sec => sec.rows.length > 0);

// Taux de complétion de la fiche (0-100) : champs renseignés / total des champs.
export const getCompletion = (child) => {
    const keys = SECTIONS.flatMap(s => s.fields.map(f => f.key));
    const filled = keys.filter(k => { const v = child[k]; return v !== undefined && v !== null && v !== ''; }).length;
    return keys.length ? Math.round((filled / keys.length) * 100) : 0;
};
