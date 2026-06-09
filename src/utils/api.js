// Envoi JSON unifié vers l'API : fetch + vérif `res.ok` + extraction du message
// d'erreur serveur. Lance une `Error(message)` (avec `.status`) en cas d'échec,
// renvoie le JSON parsé (ou {}) sinon. Centralise le bloc dupliqué dans
// mutateCollection / Inventory / Settings.
export async function apiSend(method, url, { headers, body } = {}) {
    const res = await fetch(url, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const err = new Error(data?.error || `Erreur ${res.status}`);
        err.status = res.status;
        throw err;
    }
    return res.json().catch(() => ({}));
}
