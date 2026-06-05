import { useEffect } from 'react';

// Module-level registry of forms that currently hold unsaved changes.
// Keyed by a stable id so multiple forms can register independently.
const dirtySet = new Set();
let beforeUnloadBound = false;

const onBeforeUnload = (e) => {
    if (dirtySet.size === 0) return undefined;
    // Triggers the browser's native "leave site?" prompt on refresh/close.
    e.preventDefault();
    e.returnValue = '';
    return '';
};

// True while any registered form has unsaved changes.
// App uses this to block in-app navigation before it happens.
export function hasUnsavedChanges() {
    return dirtySet.size > 0;
}

// Registers a form's dirty state globally. While dirty, the browser warns
// before unload; App can also intercept tab switches via hasUnsavedChanges().
export function useUnsavedGuard(id, isDirty) {
    useEffect(() => {
        if (!beforeUnloadBound) {
            window.addEventListener('beforeunload', onBeforeUnload);
            beforeUnloadBound = true;
        }
        if (isDirty) dirtySet.add(id);
        else dirtySet.delete(id);
        return () => { dirtySet.delete(id); };
    }, [id, isDirty]);
}
