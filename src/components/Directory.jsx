import React, { useState, useMemo, useEffect } from 'react';
import { Search, Plus, Trash2, Download, Upload, Filter, LayoutGrid, LayoutList, Users } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { useUi } from '../ui/UiProvider';

// Components
import DirectoryHeader from './directory/DirectoryHeader';
import DirectoryFilters from './directory/DirectoryFilters';
import ParticipantTable from './directory/ParticipantTable';
import ParticipantCard from './directory/ParticipantCard';
import ParticipantDetails from './directory/ParticipantDetails';
import ParticipantForm from './directory/ParticipantForm';
import GroupManager from './directory/GroupManager';

export default function Directory({ participants = [], setParticipants, groups = [], setGroups, canEdit = true }) {
    const ui = useUi();
    const safeParticipants = Array.isArray(participants) ? participants : [];
    const safeGroups = Array.isArray(groups) ? groups : [];

    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'firstName', direction: 'ascending' });
    const [viewMode, setViewMode] = useState('grid');
    const [filterRole, setFilterRole] = useState('all');
    const [filterGroup, setFilterGroup] = useState('all');

    // Selection State
    const [selectedParticipants, setSelectedParticipants] = useState([]);

    // Viewing State - Drawer Mode
    const [viewingParticipant, setViewingParticipant] = useState(null);

    // Form States
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        firstName: '', lastName: '', birthDate: '', allergies: '', constraints: '', photo: '', role: 'child', group: '', healthDocProvided: false,
        training: '', phone: '', address: '', emergencyContact: '',
        pocketMoney: { initial: 0, current: 0, history: [] }
    });

    // Group Management State
    const [isGroupManagerOpen, setIsGroupManagerOpen] = useState(false);
    const [newGroupData, setNewGroupData] = useState({ name: '', color: '#3b82f6' });

    const toggleSelection = (id) => {
        if (!canEdit) {
            ui.toast('Droits de modification insuffisants.', { type: 'error' });
            return;
        }
        setSelectedParticipants(prev => prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]);
    };

    const toggleSelectAll = () => {
        if (!canEdit) return;
        setSelectedParticipants(selectedParticipants.length === sortedParticipants.length ? [] : sortedParticipants.map(p => p.id));
    };

    const handleBulkDelete = async () => {
        if (!canEdit) {
            ui.toast('Droits de suppression insuffisants.', { type: 'error' });
            return;
        }
        const ok = await ui.confirm({
            title: 'Supprimer la sélection',
            message: `Voulez-vous vraiment supprimer ces ${selectedParticipants.length} participants ?`,
            confirmText: 'Supprimer Tout',
            danger: true
        });
        if (ok) {
            setParticipants(safeParticipants.filter(p => !selectedParticipants.includes(p.id)));
            setSelectedParticipants([]);
            ui.toast('Participants supprimés.', { type: 'success' });
        }
    };

    const handleAddGroup = (e) => {
        e.preventDefault();
        if (!canEdit) return;
        if (newGroupData.name) {
            setGroups([...safeGroups, { id: uuidv4(), ...newGroupData }]);
            setNewGroupData({ name: '', color: '#3b82f6' });
        }
    };

    const handleDeleteGroup = async (groupId) => {
        if (!canEdit) return;
        const ok = await ui.confirm({
            title: 'Supprimer le groupe',
            message: "Supprimer ce groupe ? Les membres seront dissociés.",
            confirmText: 'Supprimer',
            danger: true
        });
        if (ok) {
            setGroups(safeGroups.filter(g => g.id !== groupId));
            setParticipants(safeParticipants.map(p => p.group === groupId ? { ...p, group: '' } : p));
            ui.toast('Groupe supprimé.', { type: 'success' });
        }
    };

    const handleExport = () => {
        const dataStr = JSON.stringify(safeParticipants, null, 2);
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `bboard-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleImport = (event) => {
        if (!canEdit) {
            ui.toast('Import bloqué: droits insuffisants.', { type: 'error' });
            return;
        }
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const imported = JSON.parse(e.target.result);
                if (Array.isArray(imported)) {
                    const ok = await ui.confirm({
                        title: 'Importer les participants',
                        message: `Remplacer la liste actuelle (${safeParticipants.length}) par ${imported.length} participants importés ?`,
                        confirmText: 'Importer Tout'
                    });
                    if (ok) {
                        setParticipants(imported);
                        ui.toast('Import terminé.', { type: 'success' });
                    }
                } else {
                    ui.alert({ title: 'Import invalide', message: 'Le fichier doit contenir un tableau JSON.' });
                }
            } catch (err) {
                ui.alert({ title: 'Erreur', message: 'Erreur lors de la lecture du JSON.' });
            }
        };
        reader.readAsText(file);
        event.target.value = '';
    };

    const resetForm = () => {
        setFormData({
            firstName: '', lastName: '', birthDate: '', allergies: '', constraints: '', photo: '', role: 'child', group: '', healthDocProvided: false,
            training: '', phone: '', address: '', emergencyContact: '',
            pocketMoney: { initial: 0, current: 0, history: [] }
        });
        setEditingId(null);
        setIsFormOpen(false);
    };

    const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const isMobile = windowWidth < 1024;

    const handleEdit = (participant) => {
        if (!canEdit) return;
        setFormData({
            ...participant,
            role: participant.role || 'child',
            firstName: participant.firstName || '',
            lastName: participant.lastName || '',
            birthDate: participant.birthDate || '',
            allergies: participant.allergies || '',
            constraints: participant.constraints || '',
            photo: participant.photo || '',
            group: participant.group || '',
            healthDocProvided: !!participant.healthDocProvided,
            training: participant.training || '',
            phone: participant.phone || '',
            address: participant.address || '',
            emergencyContact: participant.emergencyContact || ''
        });
        setEditingId(participant.id);
        setIsFormOpen(true);
    };

    const handleDelete = async (id) => {
        if (!canEdit) return;
        const ok = await ui.confirm({
            title: 'Supprimer',
            message: 'Voulez-vous vraiment supprimer ce membre ?',
            confirmText: 'Supprimer',
            danger: true
        });
        if (ok) {
            setParticipants(safeParticipants.filter(p => p.id !== id));
            if (viewingParticipant && viewingParticipant.id === id) setViewingParticipant(null);
            ui.toast('Membre supprimé.', { type: 'success' });
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!canEdit) return;
        if (editingId) {
            setParticipants(safeParticipants.map(p => p.id === editingId ? { ...formData, id: editingId } : p));
        } else {
            setParticipants([...safeParticipants, { ...formData, id: uuidv4() }]);
        }
        resetForm();
    };

    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') direction = 'descending';
        setSortConfig({ key, direction });
    };

    const filteredParticipants = useMemo(() => {
        return safeParticipants.filter(p => {
            const fName = (p.firstName || '').toLowerCase();
            const lName = (p.lastName || '').toLowerCase();
            const role = (p.role || '').toLowerCase();
            const searchLower = searchTerm.toLowerCase();
            const matchesSearch = (fName + ' ' + lName).includes(searchLower) || role.includes(searchLower);
            const matchesRole = filterRole === 'all' || p.role === filterRole;
            const matchesGroup = filterGroup === 'all' || (filterGroup === 'none' ? !p.group : p.group === filterGroup);
            return matchesSearch && matchesRole && matchesGroup;
        });
    }, [safeParticipants, searchTerm, filterRole, filterGroup]);

    const sortedParticipants = useMemo(() => {
        let sortableItems = [...filteredParticipants];
        sortableItems.sort((a, b) => {
            let aValue = a[sortConfig.key] || '';
            let bValue = b[sortConfig.key] || '';
            if (sortConfig.key === 'age') { aValue = a.birthDate || ''; bValue = b.birthDate || ''; }
            if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
            return 0;
        });
        return sortableItems;
    }, [filteredParticipants, sortConfig]);

    const stats = useMemo(() => ({
        total: safeParticipants.length,
        children: safeParticipants.filter(p => p.role === 'child').length,
        animators: safeParticipants.filter(p => p.role === 'animator').length,
        direction: safeParticipants.filter(p => p.role === 'direction').length
    }), [safeParticipants]);

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'transparent', overflow: 'hidden', position: 'relative' }}>
            <div style={{ maxWidth: '1600px', width: '96%', margin: '0 auto', display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>

            <DirectoryHeader
                stats={stats}
                selectedCount={selectedParticipants.length}
                handleBulkDelete={handleBulkDelete}
                openGroupManager={() => setIsGroupManagerOpen(true)}
                openNewForm={() => { resetForm(); setIsFormOpen(true); }}
                handleExport={handleExport}
                handleImport={handleImport}
                isMobile={isMobile}
                canEdit={canEdit}
            />

            <DirectoryFilters
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                filterRole={filterRole}
                setFilterRole={setFilterRole}
                filterGroup={filterGroup}
                setFilterGroup={setFilterGroup}
                viewMode={isMobile ? 'grid' : viewMode}
                setViewMode={setViewMode}
                groups={safeGroups}
                isMobile={isMobile}
            />

            <div style={{ flex: 1, overflowY: 'auto' }} className="no-scrollbar">
                <div style={{ padding: isMobile ? '1rem' : '1.5rem 2.5rem' }}>
                {sortedParticipants.length === 0 ? (
                    <div className="card-glass" style={{ textAlign: 'center', padding: '6rem 2rem', maxWidth: '600px', margin: '4rem auto', border: '2.5px dashed var(--glass-border)' }}>
                        <div style={{ width: '90px', height: '90px', background: 'var(--bg-secondary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem' }}>
                            <Search size={44} style={{ opacity: 0.15 }} />
                        </div>
                        <h3 style={{ color: 'var(--text-main)', fontSize: '1.5rem', fontWeight: '950', marginBottom: '0.75rem', letterSpacing: '-0.03em' }}>Aucun résultat</h3>
                        <p style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: '600' }}>Modifiez vos filtres pour voir plus de membres.</p>
                        {(searchTerm || filterGroup !== 'all' || filterRole !== 'all') && (
                            <button onClick={() => { setSearchTerm(''); setFilterGroup('all'); setFilterRole('all'); }} className="btn btn-primary" style={{ marginTop: '2rem', padding: '0.85rem 2rem', fontWeight: '950' }}>Réinitialiser</button>
                        )}
                    </div>
                ) : (
                    <>
                        {(isMobile || viewMode === 'grid') ? (
                            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem', paddingBottom: '4rem' }}>
                                {sortedParticipants.map((p, idx) => (
                                    <ParticipantCard
                                        key={p.id}
                                        participant={p}
                                        index={idx}
                                        isSelected={selectedParticipants.includes(p.id)}
                                        toggleSelection={toggleSelection}
                                        handleViewDetails={() => setViewingParticipant(p)}
                                        handleEdit={handleEdit}
                                        handleDelete={handleDelete}
                                        groups={safeGroups}
                                        isMobile={isMobile}
                                        canEdit={canEdit}
                                    />
                                ))}
                            </div>
                        ) : (
                            <ParticipantTable
                                participants={sortedParticipants}
                                selectedParticipants={selectedParticipants}
                                toggleSelection={toggleSelection}
                                toggleSelectAll={toggleSelectAll}
                                sortConfig={sortConfig}
                                requestSort={requestSort}
                                handleViewDetails={(p) => setViewingParticipant(p)}
                                handleEdit={handleEdit}
                                handleDelete={handleDelete}
                                groups={safeGroups}
                                canEdit={canEdit}
                            />
                        )}
                    </>
                )}
                </div>
            </div>

            {isMobile && !isFormOpen && canEdit && (
                <button 
                    onClick={() => { resetForm(); setIsFormOpen(true); }}
                    className="btn btn-primary"
                    style={{ position: 'fixed', bottom: '32px', right: '32px', width: '64px', height: '64px', borderRadius: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 12px 32px oklch(58% 0.18 var(--brand-hue) / 0.4)', zIndex: 150 }}
                >
                    <Plus size={32} strokeWidth={3} />
                </button>
            )}

            <GroupManager
                isOpen={isGroupManagerOpen}
                onClose={() => setIsGroupManagerOpen(false)}
                groups={safeGroups}
                setGroups={setGroups}
                participants={safeParticipants}
                setParticipants={setParticipants}
                newGroupData={newGroupData}
                setNewGroupData={setNewGroupData}
                onAddGroup={handleAddGroup}
                onDeleteGroup={handleDeleteGroup}
                canEdit={canEdit}
            />

            <ParticipantDetails
                viewingParticipant={viewingParticipant}
                setViewingParticipant={setViewingParticipant}
                handleEdit={handleEdit}
                groups={safeGroups}
                canEdit={canEdit}
            />

            <ParticipantForm
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                formData={formData}
                setFormData={setFormData}
                onSubmit={handleSubmit}
                editingId={editingId}
                groups={safeGroups}
                canEdit={canEdit}
            />

            <style>{`
                .btn-icon-ref {
                    width: 42px; height: 42px; border-radius: 12px; display: flex; align-items: center; justify-content: center;
                    background: white; border: 1.5px solid var(--glass-border); color: var(--text-muted); transition: all 0.2s; cursor: pointer;
                }
                .btn-icon-ref:hover { border-color: var(--primary-color); color: var(--primary-color); transform: translateY(-2px); }
                .btn-icon-ref.danger:hover { border-color: var(--danger-color); color: var(--danger-color); background: oklch(62% 0.2 28 / 0.05); }

                .badge-pill {
                   padding: 0.5rem 1rem; border-radius: 30px; font-size: 0.8rem; fontWeight: 900;
                   display: flex; align-items: center; gap: 0.625rem; background: white; border: 1.5px solid var(--glass-border);
                }
            `}</style>
            </div>
        </div>
    );
}
