import { create } from 'zustand';

/**
 * Minimal global store — holds shared read data so child components
 * don't need deep prop drilling. Write operations stay in App.jsx via callbacks.
 *
 * Usage: const participants = useAppStore(s => s.participants);
 */
const useAppStore = create((set) => ({
    // Core data
    participants: [],
    groups: [],
    isMobile: false,
    activities: [],
    accessControl: {},
    incidentSheets: [],
    exitSheets: [],
    meetingRecaps: [],
    inventoryItems: [],
    staffUsers: [],
    menus: {},

    // Setters (called from App.jsx after API fetches)
    setParticipants: (participants) => set({ participants }),
    setGroups: (groups) => set({ groups }),
    setIsMobile: (isMobile) => set({ isMobile }),
    setActivities: (activities) => set({ activities }),
    setAccessControl: (accessControl) => set({ accessControl }),
    setIncidentSheets: (incidentSheets) => set({ incidentSheets }),
    setExitSheets: (exitSheets) => set({ exitSheets }),
    setMeetingRecaps: (meetingRecaps) => set({ meetingRecaps }),
    setInventoryItems: (inventoryItems) => set({ inventoryItems }),
    setStaffUsers: (staffUsers) => set({ staffUsers }),
    setMenus: (menus) => set({ menus }),

    // Selectors (derived data)
    getChildren: () => {
        const { participants } = useAppStore.getState();
        return participants.filter(p => p.role === 'child');
    },
}));

export default useAppStore;
