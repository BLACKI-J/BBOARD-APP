import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import cors from 'cors';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnvFile(filePath) {
    if (!fs.existsSync(filePath)) return;
    const content = fs.readFileSync(filePath, 'utf8');
    content.split('\n').forEach((line) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return;
        const eqIndex = trimmed.indexOf('=');
        if (eqIndex === -1) return;
        const key = trimmed.slice(0, eqIndex).trim();
        let value = trimmed.slice(eqIndex + 1).trim();
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
        }
        if (!process.env[key]) {
            process.env[key] = value;
        }
    });
}

loadEnvFile(join(__dirname, '.env'));
loadEnvFile(join(__dirname, '..', '.env'));
// Database path — prioritized by environment variable for Docker flexibility
const dbPath = process.env.DATABASE_PATH || join(__dirname, 'data', 'database.sqlite');
const dbDir = dirname(dbPath);
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';
const FEI_REWRITE_MAX_CHARS = 5000;
const HF_API_URL = process.env.HF_API_URL || 'https://api-inference.huggingface.co/models/openai/clip-vit-base-patch32';
const HF_API_KEY = process.env.HUGGINGFACE_API_KEY || '';
const SESSION_COOKIE_NAME = 'bboard_session';
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;
const ADMIN_VERIFICATION_TTL_MS = 5 * 60 * 1000;
const sessions = new Map();

const defaultAccessControl = {
    roles: [
        { id: 'direction', label: 'Direction', base: true },
        { id: 'animator', label: 'Animateur', base: true },
        { id: 'child', label: 'Enfant', base: true }
    ],
    hiddenSections: {
        home: false, schedule: false, exitsheet: false, incident: false,
        recap: false, attendance: false, inventory: false, directory: false, health: false
    },
    rolePermissions: {
        direction: {
            viewSchedule: true, editSchedule: true,
            viewExitSheet: true, editExitSheet: true, viewIncident: true, editIncident: true,
            viewRecap: true, editRecap: true, viewDirectory: true, editDirectory: true,
            viewAttendance: true, editAttendance: true, viewInventory: true, editInventory: true,
            viewHealth: true, editHealth: true,
            searchInventoryAI: true, viewSettings: true, manageUsers: true, manageAccess: true, viewLogs: true
        },
        animator: {
            viewSchedule: true, editSchedule: true,
            viewExitSheet: true, editExitSheet: true, viewIncident: true, editIncident: true,
            viewRecap: true, editRecap: true, viewDirectory: true, editDirectory: true,
            viewAttendance: true, editAttendance: true, viewInventory: true, editInventory: true,
            viewHealth: true, editHealth: true,
            searchInventoryAI: true, viewSettings: false, manageUsers: false, manageAccess: false, viewLogs: false
        },
        child: {}
    },
    userPermissions: {},
    disabledUsers: {},
    incidentAiDefaultMode: 'detaille'
};


const app = express();
const httpServer = createServer(app);
app.set('trust proxy', 'loopback');

// Flexible CORS for local network and production
const envOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim()) : [];
const allowedOrigins = ["http://localhost:5173", ...envOrigins];
const corsOptions = {
    origin: (origin, callback) => {
        // Allow no-origin (like mobile apps or curl) or allowed list or any local IP
        if (!origin || allowedOrigins.indexOf(origin) !== -1 || origin.startsWith('http://localhost') || /^http:\/\/127\./.test(origin) || /^http:\/\/192\.168\./.test(origin) || /^http:\/\/10\./.test(origin) || /^http:\/\/172\.(1[6-9]|2[0-9]|3[0-1])\./.test(origin)) {
            callback(null, true);
        } else {
            // Refus propre : pas d'en-tête CORS (le navigateur bloque) au lieu de
            // lever une erreur qui produit un 500. Indice clair dans les logs.
            console.warn(`CORS: origine non autorisée → ${origin}. Ajoutez-la à ALLOWED_ORIGINS dans .env.`);
            callback(null, false);
        }
    },
    methods: ["GET", "POST", "DELETE"],
    credentials: true
};

const io = new Server(httpServer, { cors: corsOptions });
app.use(cors(corsOptions));
app.use(express.json({ strict: false, limit: '15mb' }));

// Logging Middleware
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    if (req.method === 'POST') {
        if (req.url.startsWith('/api/auth/') || /^\/api\/users\/[^/]+\/pin$/.test(req.url)) {
            console.log('Body: { credentials: [REDACTED] }');
        } else if (req.url === '/api/ai/rewrite-fei') {
            const textLength = typeof req.body?.text === 'string' ? req.body.text.length : 0;
            console.log(`Body: { textLength: ${textLength}, mode: ${req.body?.mode || 'detaille'} }`);
        } else if (req.url.startsWith('/api/inventory/items/') && req.url.endsWith('/photos')) {
            const imageLength = typeof req.body?.imageBase64 === 'string' ? req.body.imageBase64.length : 0;
            console.log(`Body: { participantId: ${req.body?.participantId || 'unknown'}, imageLength: ${imageLength} }`);
        } else if (req.url === '/api/inventory/search') {
            const imageLength = typeof req.body?.imageBase64 === 'string' ? req.body.imageBase64.length : 0;
            console.log(`Body: { imageLength: ${imageLength}, topK: ${req.body?.topK || 5} }`);
        } else {
            const summary = Array.isArray(req.body)
                ? { type: 'array', items: req.body.length }
                : { type: typeof req.body, keys: Object.keys(req.body || {}) };
            console.log('Body summary:', summary);
        }
    }
    next();
});

function parseCookies(header = '') {
    return header.split(';').reduce((cookies, part) => {
        const separator = part.indexOf('=');
        if (separator === -1) return cookies;
        const key = part.slice(0, separator).trim();
        const value = part.slice(separator + 1).trim();
        if (key) cookies[key] = decodeURIComponent(value);
        return cookies;
    }, {});
}

function parseJsonValue(value, fallback = null) {
    try {
        return value == null ? fallback : JSON.parse(value);
    } catch (err) {
        return fallback;
    }
}

function isValidPin(pin) {
    return typeof pin === 'string' && /^\d{4}$/.test(pin);
}

function hashPin(pin) {
    const salt = randomBytes(16).toString('hex');
    const hash = scryptSync(pin, salt, 64).toString('hex');
    return `scrypt$${salt}$${hash}`;
}

function isPinHash(value) {
    return typeof value === 'string' && /^scrypt\$[a-f0-9]{32}\$[a-f0-9]{128}$/.test(value);
}

function verifyPin(pin, storedHash) {
    if (!isValidPin(pin) || !isPinHash(storedHash)) return false;
    const [, salt, expectedHex] = storedHash.split('$');
    const actual = scryptSync(pin, salt, 64);
    const expected = Buffer.from(expectedHex, 'hex');
    return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function sanitizeParticipant(participant) {
    if (!participant || typeof participant !== 'object') return participant;
    const clean = { ...participant };
    delete clean.pin;
    delete clean.pinHash;
    delete clean.pin_hash;
    delete clean.password;
    delete clean.data;
    return clean;
}

// Réponse d'erreur 500 uniforme : log serveur détaillé + message générique au client
// (pas de fuite de err.message). Utilisé par tous les catch de routes.
function serverError(req, res, err) {
    console.error(`${req.method} ${req.path} error:`, err);
    res.status(500).json({ error: 'Erreur serveur.' });
}

function mergeAccessControl(raw) {
    const source = raw && typeof raw === 'object' ? raw : {};
    return {
        ...defaultAccessControl,
        ...source,
        hiddenSections: { ...defaultAccessControl.hiddenSections, ...(source.hiddenSections || {}) },
        // Conserve TOUS les rôles (custom inclus). Les deux rôles de base héritent
        // de leurs valeurs par défaut, les rôles custom sont gardés tels quels.
        rolePermissions: {
            ...(source.rolePermissions && typeof source.rolePermissions === 'object' ? source.rolePermissions : {}),
            direction: { ...defaultAccessControl.rolePermissions.direction, ...(source.rolePermissions?.direction || {}) },
            animator: { ...defaultAccessControl.rolePermissions.animator, ...(source.rolePermissions?.animator || {}) }
        },
        userPermissions: { ...defaultAccessControl.userPermissions, ...(source.userPermissions || {}) },
        disabledUsers: { ...defaultAccessControl.disabledUsers, ...(source.disabledUsers || {}) }
    };
}

async function getStateValue(database, key, fallback = null) {
    const row = await database.get('SELECT value FROM app_state WHERE key = ?', key);
    return row ? parseJsonValue(row.value, fallback) : fallback;
}

async function setStateValue(database, key, value) {
    await database.run('INSERT OR REPLACE INTO app_state (key, value) VALUES (?, ?)', key, JSON.stringify(value));
}

async function ensureAdminPin(database) {
    const existingHash = await getStateValue(database, 'adminPinHash');
    if (isPinHash(existingHash)) {
        await database.run('DELETE FROM app_state WHERE key = ?', 'adminPin');
        return;
    }

    const legacyPin = await getStateValue(database, 'adminPin');
    const configuredPin = process.env.INITIAL_ADMIN_PIN?.trim();
    let initialPin = legacyPin;

    if (!isValidPin(initialPin) || initialPin === '1234') {
        if (!isValidPin(configuredPin)) {
            throw new Error('INITIAL_ADMIN_PIN must contain exactly 4 digits before the first start or migration from the legacy default PIN');
        }
        initialPin = configuredPin;
        console.log('Initial admin PIN loaded from INITIAL_ADMIN_PIN.');
    }

    await setStateValue(database, 'adminPinHash', hashPin(initialPin));
    await database.run('DELETE FROM app_state WHERE key = ?', 'adminPin');
}

function createSession(userId) {
    const token = randomBytes(32).toString('hex');
    sessions.set(token, { userId, expiresAt: Date.now() + SESSION_TTL_MS, adminVerifiedUntil: 0 });
    return token;
}

function getSession(token) {
    const session = token ? sessions.get(token) : null;
    if (!session) return null;
    if (session.expiresAt <= Date.now()) {
        sessions.delete(token);
        return null;
    }
    session.expiresAt = Date.now() + SESSION_TTL_MS;
    return session;
}

setInterval(() => {
    const now = Date.now();
    for (const [token, session] of sessions.entries()) {
        if (session.expiresAt <= now) sessions.delete(token);
    }
}, 60 * 60 * 1000).unref();

function setSessionCookie(res, token) {
    res.cookie(SESSION_COOKIE_NAME, token, {
        httpOnly: true,
        sameSite: 'strict',
        secure: process.env.COOKIE_SECURE === 'true',
        maxAge: SESSION_TTL_MS,
        path: '/'
    });
}

function clearSessionCookie(res) {
    res.clearCookie(SESSION_COOKIE_NAME, {
        httpOnly: true,
        sameSite: 'strict',
        secure: process.env.COOKIE_SECURE === 'true',
        path: '/'
    });
}

async function getAccessControl() {
    return mergeAccessControl(await getStateValue(db, 'accessControl', {}));
}

async function getActor(userId) {
    let actor;
    if (userId === 'director') {
        actor = { id: 'director', firstName: 'Direction', lastName: 'Générale', role: 'direction' };
    } else {
        const row = await db.get('SELECT data FROM participants WHERE id = ?', userId);
        const participant = sanitizeParticipant(parseJsonValue(row?.data, null));
        if (!participant || participant.role === 'child') return null;
        actor = participant;
    }

    const accessControl = await getAccessControl();
    const isDisabled = !!accessControl.disabledUsers?.[actor.id];
    const role = actor.role;
    const rolePermissions = accessControl.rolePermissions?.[role] || {};
    const userPermissions = accessControl.userPermissions?.[actor.id] || {};
    const permissions = isDisabled
        ? Object.fromEntries(Object.keys(rolePermissions).map((key) => [key, false]))
        : { ...rolePermissions, ...userPermissions };

    return { ...actor, permissions, disabled: isDisabled };
}

function publicActor(actor) {
    if (!actor) return null;
    return {
        id: actor.id,
        firstName: actor.firstName,
        lastName: actor.lastName,
        role: actor.role,
        permissions: actor.permissions
    };
}

async function authenticateRequest(req, res, next) {
    try {
        const token = parseCookies(req.headers.cookie)[SESSION_COOKIE_NAME];
        const session = getSession(token);
        const actor = session ? await getActor(session.userId) : null;
        if (!session || !actor) {
            if (token) sessions.delete(token);
            clearSessionCookie(res);
            return res.status(401).json({ error: 'Authentication required' });
        }
        if (actor.disabled) {
            sessions.delete(token);
            clearSessionCookie(res);
            return res.status(403).json({ error: 'Account disabled' });
        }
        req.sessionToken = token;
        req.session = session;
        req.actor = actor;
        next();
    } catch (err) {
        serverError(req, res, err);
    }
}

function requireAnyPermission(...permissionKeys) {
    return (req, res, next) => {
        if (permissionKeys.some((key) => req.actor?.permissions?.[key])) return next();
        return res.status(403).json({ error: 'Permission denied' });
    };
}

function createRateLimiter({ windowMs, max }) {
    const attempts = new Map();
    return (req, res, next) => {
        const now = Date.now();
        const key = req.ip || req.socket.remoteAddress || 'unknown';
        const record = attempts.get(key);
        if (!record || record.resetAt <= now) {
            attempts.set(key, { count: 1, resetAt: now + windowMs });
            return next();
        }
        if (record.count >= max) {
            return res.status(429).json({ error: 'Too many requests, try again later' });
        }
        record.count += 1;
        next();
    };
}

// Initialize Database
async function initDb() {
    const db = await open({
        filename: dbPath,
        driver: sqlite3.Database
    });

    // 1. Initial schema creation
    await db.exec(`
        CREATE TABLE IF NOT EXISTS participants (
            id TEXT PRIMARY KEY,
            firstName TEXT,
            lastName TEXT,
            role TEXT,
            groupId TEXT,
            allergies TEXT,
            constraints TEXT,
            pin_hash TEXT,
            data TEXT
        );
        CREATE TABLE IF NOT EXISTS groups (
            id TEXT PRIMARY KEY,
            data TEXT
        );
        CREATE TABLE IF NOT EXISTS activities (
            id TEXT PRIMARY KEY,
            data TEXT
        );
        CREATE TABLE IF NOT EXISTS app_state (
            key TEXT PRIMARY KEY,
            value TEXT
        );
        CREATE TABLE IF NOT EXISTS exit_sheets (
            id TEXT PRIMARY KEY,
            data TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS incident_sheets (
            id TEXT PRIMARY KEY,
            data TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS action_logs (
            id TEXT PRIMARY KEY,
            actor_id TEXT,
            actor_name TEXT,
            actor_role TEXT,
            action TEXT,
            resource TEXT,
            metadata TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS inventory_items (
            id TEXT PRIMARY KEY,
            participant_id TEXT,
            category TEXT,
            label TEXT,
            quantity INTEGER DEFAULT 1,
            arrival_qty INTEGER DEFAULT 0,
            departure_qty INTEGER DEFAULT 0,
            status TEXT,
            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS inventory_photos (
            id TEXT PRIMARY KEY,
            item_id TEXT,
            participant_id TEXT,
            image_base64 TEXT,
            embedding_json TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS inventory_matches (
            id TEXT PRIMARY KEY,
            query_image_base64 TEXT,
            results_json TEXT,
            validated_item_id TEXT,
            validated_by TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS meeting_recaps (
            id TEXT PRIMARY KEY,
            data TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);

    // 2. Migration: Add missing columns if table already existed (v1 -> v2)
    const columns = await db.all("PRAGMA table_info(participants)");
    const columnNames = columns.map(c => c.name);
    const requiredColumns = ['firstName', 'lastName', 'role', 'groupId', 'allergies', 'constraints', 'pin_hash'];

    for (const col of requiredColumns) {
        if (!columnNames.includes(col)) {
            console.log(`Migration: Adding missing column ${col} to participants table...`);
            await db.exec(`ALTER TABLE participants ADD COLUMN ${col} TEXT DEFAULT ''`);
        }
    }

    // 3. Optional: Backfill data from JSON if columns are empty
    const rowsToMigrate = await db.all('SELECT id, data FROM participants WHERE firstName IS NULL OR firstName = ""');
    if (rowsToMigrate.length > 0) {
        console.log(`Migration: Backfilling ${rowsToMigrate.length} participants from JSON data...`);
        const stmt = await db.prepare('UPDATE participants SET firstName = ?, lastName = ?, role = ?, groupId = ?, allergies = ?, constraints = ? WHERE id = ?');
        for (const row of rowsToMigrate) {
            try {
                const data = JSON.parse(row.data);
                await stmt.run(
                    data.firstName || '',
                    data.lastName || '',
                    data.role || '',
                    data.groupId || data.group || '',
                    data.allergies || '',
                    data.constraints || '',
                    row.id
                );
            } catch (e) {
                console.error(`Migration error for participant ${row.id}:`, e);
            }
        }
        await stmt.finalize();
        console.log('Migration complete.');
    }

    // 4. Migrate participant PINs out of the JSON payload.
    const credentialRows = await db.all('SELECT id, data, pin_hash FROM participants');
    for (const row of credentialRows) {
        const participant = parseJsonValue(row.data, {});
        const cleanParticipant = sanitizeParticipant(participant);
        const migratedHash = row.pin_hash || (isValidPin(participant.pin) ? hashPin(participant.pin) : null);
        if (JSON.stringify(cleanParticipant) !== row.data || migratedHash !== row.pin_hash) {
            await db.run(
                'UPDATE participants SET data = ?, pin_hash = ? WHERE id = ?',
                JSON.stringify(cleanParticipant),
                migratedHash,
                row.id
            );
        }
    }

    // 5. Store the admin credential as a hash and remove the legacy plaintext state.
    await ensureAdminPin(db);

    return db;
}

// Global Error Handlers
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    process.exit(1);
});

let db;

// Serialize all collection writes — SQLite has one connection, so concurrent
// BEGIN IMMEDIATE (e.g. fast typing → rapid POSTs) would collide and 500.
let _txChain = Promise.resolve();
async function replaceCollection({ table, rows, insertOne }) {
    const task = _txChain.then(async () => {
        await db.exec('BEGIN IMMEDIATE TRANSACTION');
        try {
            await db.run(`DELETE FROM ${table}`);
            for (const row of rows) {
                await insertOne(row);
            }
            await db.exec('COMMIT');
        } catch (err) {
            await db.exec('ROLLBACK');
            throw err;
        }
    });
    _txChain = task.catch(() => {}); // keep the chain alive even if a write fails
    return task;
}

function cosineSimilarity(a, b) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length === 0 || a.length !== b.length) return 0;
    let dot = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i += 1) {
        const va = Number(a[i]) || 0;
        const vb = Number(b[i]) || 0;
        dot += va * vb;
        normA += va * va;
        normB += vb * vb;
    }
    if (normA === 0 || normB === 0) return 0;
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

function normalizeEmbedding(raw) {
    if (!raw) return null;
    if (Array.isArray(raw) && raw.length > 0 && typeof raw[0] === 'number') return raw;
    if (Array.isArray(raw) && raw.length > 0 && Array.isArray(raw[0])) {
        const rows = raw.filter((row) => Array.isArray(row));
        if (rows.length === 0) return null;
        const width = rows[0].length;
        if (!width) return null;
        const avg = new Array(width).fill(0);
        rows.forEach((row) => {
            for (let i = 0; i < width; i += 1) {
                avg[i] += Number(row[i]) || 0;
            }
        });
        for (let i = 0; i < width; i += 1) avg[i] /= rows.length;
        return avg;
    }
    return null;
}

function fallbackEmbeddingFromBase64(imageBase64) {
    const base64 = (imageBase64 || '').split(',').pop();
    if (!base64) return null;
    const bytes = Buffer.from(base64, 'base64');
    if (!bytes.length) return null;
    const buckets = new Array(64).fill(0);
    for (let i = 0; i < bytes.length; i += 1) {
        buckets[i % 64] += bytes[i];
    }
    const norm = Math.sqrt(buckets.reduce((sum, v) => sum + v * v, 0));
    if (!norm) return buckets;
    return buckets.map((v) => v / norm);
}

async function generateImageEmbedding(imageBase64) {
    const fallback = fallbackEmbeddingFromBase64(imageBase64);
    if (!HF_API_KEY) return fallback;

    const base64 = (imageBase64 || '').split(',').pop();
    if (!base64) return fallback;
    const imageBuffer = Buffer.from(base64, 'base64');
    try {
        const response = await fetch(HF_API_URL, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${HF_API_KEY}`,
                'Content-Type': 'application/octet-stream'
            },
            body: imageBuffer
        });
        if (!response.ok) {
            const txt = await response.text();
            console.warn(`HF embedding fallback engaged: ${txt.slice(0, 120)}`);
            return fallback;
        }
        const payload = await response.json();
        return normalizeEmbedding(payload) || fallback;
    } catch (err) {
        console.warn(`HF embedding fallback engaged: ${err.message}`);
        return fallback;
    }
}

async function insertActionLog({ actorId, actorName, actorRole, action, resource, metadata }) {
    if (!db) return;
    try {
        await db.run(
            'INSERT INTO action_logs (id, actor_id, actor_name, actor_role, action, resource, metadata) VALUES (?, ?, ?, ?, ?, ?, ?)',
            `${Date.now()}_${Math.random().toString(16).slice(2)}`,
            actorId || 'unknown',
            actorName || 'Unknown',
            actorRole || 'unknown',
            action,
            resource,
            JSON.stringify(metadata || {})
        );
    } catch (err) {
        console.error('Failed to insert action log:', err.message);
    }
}

async function startServer() {
    try {
        db = await initDb();
        console.log('Database initialized and synchronized');

        const PORT = Number(process.env.PORT) || 3001;
        httpServer.listen(PORT, '0.0.0.0', () => {
            console.log(`Backend server running on http://0.0.0.0:${PORT}`);
        });
    } catch (err) {
        console.error('Failed to start server:', err);
        process.exit(1);
    }
}

startServer();

const loginRateLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 10 });
const adminRateLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 10 });
const aiRateLimiter = createRateLimiter({ windowMs: 60 * 1000, max: 10 });

io.use(async (socket, next) => {
    try {
        const token = parseCookies(socket.handshake.headers.cookie)[SESSION_COOKIE_NAME];
        const session = getSession(token);
        const actor = session ? await getActor(session.userId) : null;
        if (!session || !actor || actor.disabled) return next(new Error('Authentication required'));
        socket.actor = actor;
        next();
    } catch (err) {
        next(new Error('Authentication required'));
    }
});

app.get('/api/auth/profiles', async (req, res) => {
    try {
        const rows = await db.all("SELECT data FROM participants WHERE role != 'child'");
        const accessControl = await getAccessControl();
        const profiles = rows
            .map((row) => sanitizeParticipant(parseJsonValue(row.data, null)))
            .filter((participant) => participant && !accessControl.disabledUsers?.[participant.id])
            .map(({ id, firstName, lastName, role }) => ({ id, firstName, lastName, role }));
        res.json([{ id: 'director', firstName: 'Direction', lastName: 'Générale', role: 'direction' }, ...profiles]);
    } catch (err) {
        serverError(req, res, err);
    }
});

app.post('/api/auth/login', loginRateLimiter, async (req, res) => {
    try {
        const { userId, pin } = req.body || {};
        let storedHash;
        if (userId === 'director') {
            storedHash = await getStateValue(db, 'adminPinHash');
        } else {
            const row = await db.get("SELECT pin_hash FROM participants WHERE id = ? AND role != 'child'", userId);
            storedHash = row?.pin_hash;
        }

        const accessControl = await getAccessControl();
        if (!verifyPin(String(pin || ''), storedHash) || accessControl.disabledUsers?.[userId]) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const actor = await getActor(userId);
        if (!actor) return res.status(401).json({ error: 'Invalid credentials' });
        const token = createSession(userId);
        setSessionCookie(res, token);
        res.json({ user: publicActor(actor), accessControl });
    } catch (err) {
        console.error('Login failed:', err);
        serverError(req, res, err);
    }
});

// Soft session check — always 200 (avoids console 401 noise on initial load when not logged in).
app.get('/api/auth/session', async (req, res) => {
    try {
        const token = parseCookies(req.headers.cookie)[SESSION_COOKIE_NAME];
        const session = getSession(token);
        const actor = session ? await getActor(session.userId) : null;
        if (!session || !actor || actor.disabled) {
            if (token && (!session || !actor || actor?.disabled)) { sessions.delete(token); clearSessionCookie(res); }
            return res.json({ authenticated: false });
        }
        res.json({ authenticated: true, user: publicActor(actor), accessControl: await getAccessControl() });
    } catch (err) {
        serverError(req, res, err);
    }
});

app.post('/api/auth/logout', (req, res) => {
    const token = parseCookies(req.headers.cookie)[SESSION_COOKIE_NAME];
    if (token) sessions.delete(token);
    clearSessionCookie(res);
    res.json({ success: true });
});

app.post('/api/auth/verify-admin-pin', authenticateRequest, requireAnyPermission('viewSettings'), adminRateLimiter, async (req, res) => {
    const storedHash = await getStateValue(db, 'adminPinHash');
    if (!verifyPin(String(req.body?.pin || ''), storedHash)) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }
    req.session.adminVerifiedUntil = Date.now() + ADMIN_VERIFICATION_TTL_MS;
    res.json({ success: true });
});

app.post('/api/auth/admin-pin', authenticateRequest, requireAnyPermission('manageAccess'), async (req, res) => {
    const newPin = String(req.body?.newPin || '');
    if (req.session.adminVerifiedUntil < Date.now()) {
        return res.status(401).json({ error: 'Admin verification required' });
    }
    if (!isValidPin(newPin)) {
        return res.status(400).json({ error: 'PIN must contain exactly 4 digits' });
    }
    await setStateValue(db, 'adminPinHash', hashPin(newPin));
    req.session.adminVerifiedUntil = 0;
    res.json({ success: true });
});

app.use('/api', (req, res, next) => {
    if (req.path === '/health' || req.path.startsWith('/auth/')) return next();
    return authenticateRequest(req, res, next);
});

app.use((req, res, next) => {
    if (!req.url.startsWith('/api/')) return next();
    if (req.method === 'GET') return next();
    if (req.url.startsWith('/api/action-logs')) return next();

    const startedAt = Date.now();
    res.on('finish', () => {
        const actorId = req.actor?.id;
        const actorName = `${req.actor?.firstName || ''} ${req.actor?.lastName || ''}`.trim();
        const actorRole = req.actor?.role;
        insertActionLog({
            actorId,
            actorName,
            actorRole,
            action: `${req.method} ${req.path}`,
            resource: req.path,
            metadata: {
                status: res.statusCode,
                durationMs: Date.now() - startedAt
            }
        });
    });
    next();
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/participants', requireAnyPermission('viewDirectory', 'viewAttendance', 'viewHealth', 'manageUsers'), async (req, res) => {
    try {
        const rows = await db.all('SELECT data FROM participants');
        res.json(rows.map((row) => parseJsonValue(row.data, null)).filter(Boolean).map(sanitizeParticipant));
    } catch (err) {
        serverError(req, res, err);
    }
});

app.post('/api/participants', requireAnyPermission('editDirectory', 'editAttendance', 'editHealth', 'manageUsers'), async (req, res) => {
    try {
        const participants = req.body || [];
        if (!Array.isArray(participants)) return res.status(400).json({ error: 'Participants must be an array' });
        const accessControl = await getAccessControl();
        const validRoles = new Set(['child', ...((accessControl.roles || []).map((r) => r.id))]);
        const canManageStaff = !!req.actor?.permissions?.manageUsers;
        const existingRows = await db.all('SELECT id, pin_hash, role FROM participants');
        const existingById = new Map(existingRows.map((row) => [row.id, row]));

        // Anti-escalade vérifiée AVANT la transaction : créer/promouvoir un staff exige
        // manageUsers. Un éditeur sans manageUsers peut re-sauver un staff existant inchangé.
        // Pré-valider ici évite un throw en cours de transaction (rollback de tout le lot)
        // et renvoie un 403 explicite au lieu d'un 500 générique.
        if (!canManageStaff) {
            const escalation = participants.some((p) => {
                if (!p || !p.id) return false;
                const role = validRoles.has(p.role) ? p.role : 'child';
                if (role === 'child') return false;
                const prior = existingById.get(p.id);
                return !prior || prior.role !== role;
            });
            if (escalation) {
                return res.status(403).json({ error: 'Permission manageUsers requise pour créer ou modifier un membre du staff.' });
            }
        }

        const stmt = await db.prepare('INSERT INTO participants (id, firstName, lastName, role, groupId, allergies, constraints, pin_hash, data) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
        try {
            await replaceCollection({
                table: 'participants',
                rows: participants,
                insertOne: async (p) => {
                    if (!p || !p.id) return;
                    const cleanParticipant = sanitizeParticipant(p);
                    const prior = existingById.get(p.id);
                    // Rôle inconnu → ramené à 'child' (jamais de rôle arbitraire)
                    const role = validRoles.has(cleanParticipant.role) ? cleanParticipant.role : 'child';
                    cleanParticipant.role = role;
                    // PIN modifiable seulement via manageUsers ; sinon on garde l'existant.
                    // Un staff sans PIN est autorisé (il ne pourra juste pas se connecter).
                    const pinHash = (canManageStaff && isValidPin(p.pin)) ? hashPin(p.pin) : (prior?.pin_hash || null);
                    await stmt.run(
                        cleanParticipant.id,
                        cleanParticipant.firstName || '',
                        cleanParticipant.lastName || '',
                        role,
                        cleanParticipant.groupId || cleanParticipant.group || '',
                        cleanParticipant.allergies || '',
                        cleanParticipant.constraints || '',
                        pinHash,
                        JSON.stringify(cleanParticipant)
                    );
                }
            });
        } finally {
            await stmt.finalize();
        }
        io.emit('data_updated', { type: 'participants' });
        res.json({ success: true });
    } catch (err) {
        serverError(req, res, err);
    }
});

app.post('/api/users/:id/pin', requireAnyPermission('manageUsers'), async (req, res) => {
    try {
        const newPin = String(req.body?.newPin || '');
        if (!isValidPin(newPin)) {
            return res.status(400).json({ error: 'PIN must contain exactly 4 digits' });
        }
        const result = await db.run(
            "UPDATE participants SET pin_hash = ? WHERE id = ? AND role != 'child'",
            hashPin(newPin),
            req.params.id
        );
        if (!result.changes) return res.status(404).json({ error: 'Staff member not found' });
        res.json({ success: true });
    } catch (err) {
        serverError(req, res, err);
    }
});

// Groups API
app.get('/api/groups', requireAnyPermission('viewDirectory', 'viewAttendance'), async (req, res) => {
    try {
        const rows = await db.all('SELECT data FROM groups');
        res.json(rows.map(r => parseJsonValue(r.data, null)).filter(x => x !== null));
    } catch (err) {
        serverError(req, res, err);
    }
});

app.post('/api/groups', requireAnyPermission('editDirectory'), async (req, res) => {
    try {
        const groups = req.body || [];
        if (!Array.isArray(groups)) return res.status(400).json({ error: 'Groups must be an array' });
        const stmt = await db.prepare('INSERT INTO groups (id, data) VALUES (?, ?)');
        try {
            await replaceCollection({
                table: 'groups',
                rows: groups,
                insertOne: async (g) => {
                    if (g && g.id) await stmt.run(g.id, JSON.stringify(g));
                }
            });
        } finally {
            await stmt.finalize();
        }
        io.emit('data_updated', { type: 'groups' });
        res.json({ success: true });
    } catch (err) {
        serverError(req, res, err);
    }
});

// Activities API
app.get('/api/activities', requireAnyPermission('viewSchedule'), async (req, res) => {
    try {
        const rows = await db.all('SELECT data FROM activities');
        res.json(rows.map(r => parseJsonValue(r.data, null)).filter(x => x !== null));
    } catch (err) {
        serverError(req, res, err);
    }
});

app.post('/api/activities', requireAnyPermission('editSchedule'), async (req, res) => {
    try {
        const activities = req.body || [];
        if (!Array.isArray(activities)) return res.status(400).json({ error: 'Activities must be an array' });
        const stmt = await db.prepare('INSERT INTO activities (id, data) VALUES (?, ?)');
        try {
            await replaceCollection({
                table: 'activities',
                rows: activities,
                insertOne: async (a) => {
                    if (a && a.id) await stmt.run(a.id, JSON.stringify(a));
                }
            });
        } finally {
            await stmt.finalize();
        }
        io.emit('data_updated', { type: 'activities' });
        res.json({ success: true });
    } catch (err) {
        serverError(req, res, err);
    }
});

// Generic App State
// Permission de lecture par clé (alignée sur les usages côté front).
const STATE_READ_PERMISSIONS = {
    // null = lisible par tout utilisateur authentifié. accessControl est déjà renvoyé
    // par /auth/session à chaque connexion : tout client en a besoin pour calculer
    // ses propres permissions. Le restreindre casserait les rôles non-admin.
    accessControl: null,
    menus: ['viewSchedule', 'viewSettings'],
    savedViews: ['viewDirectory', 'viewSchedule', 'viewSettings'],
    transmissions: ['viewHealth', 'viewSchedule', 'viewSettings', 'manageAccess']
};

app.get('/api/state/:key', async (req, res) => {
    try {
        if (!(req.params.key in STATE_READ_PERMISSIONS)) return res.status(404).json({ error: 'State key not found' });
        const allowed = STATE_READ_PERMISSIONS[req.params.key];
        if (allowed && !allowed.some((p) => req.actor?.permissions?.[p])) {
            return res.status(403).json({ error: 'Permission denied' });
        }
        const row = await db.get('SELECT value FROM app_state WHERE key = ?', req.params.key);
        res.json(row ? parseJsonValue(row.value, null) : null);
    } catch (err) {
        serverError(req, res, err);
    }
});

app.post('/api/state/:key', async (req, res) => {
    try {
        const permissionByKey = {
            menus: 'editSchedule',
            accessControl: 'manageAccess',
            savedViews: 'editDirectory',
            transmissions: 'editHealth'
        };
        const permission = permissionByKey[req.params.key];
        if (!permission) return res.status(404).json({ error: 'State key not found' });
        if (!req.actor?.permissions?.[permission]) return res.status(403).json({ error: 'Permission denied' });
        const value = req.body;
        await db.run('INSERT OR REPLACE INTO app_state (key, value) VALUES (?, ?)', req.params.key, JSON.stringify(value));
        io.emit('data_updated', { type: 'state', key: req.params.key });
        res.json({ success: true });
    } catch (err) {
        serverError(req, res, err);
    }
});

// Exit Sheets API
app.get('/api/exit-sheets', requireAnyPermission('viewExitSheet'), async (req, res) => {
    try {
        const rows = await db.all('SELECT data FROM exit_sheets ORDER BY created_at DESC');
        res.json(rows.map(r => parseJsonValue(r.data, null)).filter(x => x !== null));
    } catch (err) {
        serverError(req, res, err);
    }
});

app.post('/api/exit-sheets', requireAnyPermission('editExitSheet'), async (req, res) => {
    try {
        const sheets = req.body || [];
        const stmt = await db.prepare('INSERT INTO exit_sheets (id, data) VALUES (?, ?)');
        try {
            await replaceCollection({
                table: 'exit_sheets',
                rows: Array.isArray(sheets) ? sheets : [sheets],
                insertOne: async (s) => {
                    if (s && s.id) await stmt.run(s.id, JSON.stringify(s));
                }
            });
        } finally {
            await stmt.finalize();
        }
        io.emit('data_updated', { type: 'exitsheets' });
        res.json({ success: true });
    } catch (err) {
        serverError(req, res, err);
    }
});

app.delete('/api/exit-sheets/:id', requireAnyPermission('editExitSheet'), async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.run('DELETE FROM exit_sheets WHERE id = ?', id);
        if (result.changes > 0) {
            io.emit('data_updated', { type: 'exitsheets' });
            res.json({ success: true });
        } else {
            res.status(404).json({ error: 'Exit sheet not found' });
        }
    } catch (err) {
        serverError(req, res, err);
    }
});

// Incident Sheets API (FEI)
app.get('/api/incident-sheets', requireAnyPermission('viewIncident'), async (req, res) => {
    try {
        const rows = await db.all('SELECT data FROM incident_sheets ORDER BY created_at DESC');
        res.json(rows.map(r => parseJsonValue(r.data, null)).filter(x => x !== null));
    } catch (err) {
        serverError(req, res, err);
    }
});

app.post('/api/incident-sheets', requireAnyPermission('editIncident'), async (req, res) => {
    try {
        const sheets = req.body || [];
        const stmt = await db.prepare('INSERT INTO incident_sheets (id, data) VALUES (?, ?)');
        try {
            await replaceCollection({
                table: 'incident_sheets',
                rows: Array.isArray(sheets) ? sheets : [sheets],
                insertOne: async (s) => {
                    if (s && s.id) await stmt.run(s.id, JSON.stringify(s));
                }
            });
        } finally {
            await stmt.finalize();
        }
        io.emit('data_updated', { type: 'incidentsheets' });
        res.json({ success: true });
    } catch (err) {
        serverError(req, res, err);
    }
});

app.delete('/api/incident-sheets/:id', requireAnyPermission('editIncident'), async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.run('DELETE FROM incident_sheets WHERE id = ?', id);
        if (result.changes > 0) {
            io.emit('data_updated', { type: 'incidentsheets' });
            res.json({ success: true });
        } else {
            res.status(404).json({ error: 'Incident sheet not found' });
        }
    } catch (err) {
        serverError(req, res, err);
    }
});

// Meeting Recaps API (Coordination/CR)
app.get('/api/meeting-recaps', requireAnyPermission('viewRecap'), async (req, res) => {
    try {
        const rows = await db.all('SELECT data FROM meeting_recaps ORDER BY created_at DESC');
        res.json(rows.map(r => parseJsonValue(r.data, null)).filter(x => x !== null));
    } catch (err) {
        serverError(req, res, err);
    }
});

app.post('/api/meeting-recaps', requireAnyPermission('editRecap'), async (req, res) => {
    try {
        const recaps = req.body || [];
        const stmt = await db.prepare('INSERT INTO meeting_recaps (id, data) VALUES (?, ?)');
        try {
            await replaceCollection({
                table: 'meeting_recaps',
                rows: Array.isArray(recaps) ? recaps : [recaps],
                insertOne: async (r) => {
                    if (r && r.id) await stmt.run(r.id, JSON.stringify(r));
                }
            });
        } finally {
            await stmt.finalize();
        }
        io.emit('data_updated', { type: 'meetingrecaps' });
        res.json({ success: true });
    } catch (err) {
        serverError(req, res, err);
    }
});

app.delete('/api/meeting-recaps/:id', requireAnyPermission('editRecap'), async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.run('DELETE FROM meeting_recaps WHERE id = ?', id);
        if (result.changes > 0) {
            io.emit('data_updated', { type: 'meetingrecaps' });
            res.json({ success: true });
        } else {
            res.status(404).json({ error: 'Meeting recap not found' });
        }
    } catch (err) {
        serverError(req, res, err);
    }
});

// Inventory API
app.get('/api/inventory/items', requireAnyPermission('viewInventory'), async (req, res) => {
    try {
        const { participantId } = req.query;
        const params = [];
        let where = '';
        if (participantId) {
            where = 'WHERE participant_id = ?';
            params.push(participantId);
        }

        const items = await db.all(
            `SELECT id, participant_id, category, label, quantity, arrival_qty, departure_qty, status, notes, created_at, updated_at
             FROM inventory_items ${where}
             ORDER BY datetime(updated_at) DESC`,
            ...params
        );

        const photos = await db.all('SELECT id, item_id, participant_id, image_base64, created_at FROM inventory_photos ORDER BY datetime(created_at) DESC');
        const byItem = photos.reduce((acc, photo) => {
            if (!acc[photo.item_id]) acc[photo.item_id] = [];
            acc[photo.item_id].push(photo);
            return acc;
        }, {});

        res.json(items.map((item) => ({ ...item, photos: byItem[item.id] || [] })));
    } catch (err) {
        serverError(req, res, err);
    }
});

app.post('/api/inventory/items', requireAnyPermission('editInventory'), async (req, res) => {
    try {
        const item = req.body || {};
        const pId = item.participant_id || 'unassigned_stock';
        if (!item.id || !item.label) {
            return res.status(400).json({ error: 'id and label are required' });
        }
        await db.run(
            `INSERT OR REPLACE INTO inventory_items
             (id, participant_id, category, label, quantity, arrival_qty, departure_qty, status, notes, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, COALESCE((SELECT created_at FROM inventory_items WHERE id = ?), CURRENT_TIMESTAMP), CURRENT_TIMESTAMP)`,
            item.id,
            pId,
            item.category || 'vetement',
            item.label,
            Number(item.quantity || 1),
            Number(item.arrival_qty || 0),
            Number(item.departure_qty || 0),
            item.status || 'ok',
            item.notes || '',
            item.id
        );
        io.emit('data_updated', { type: 'inventory' });
        res.json({ success: true });
    } catch (err) {
        serverError(req, res, err);
    }
});

app.delete('/api/inventory/items/:id', requireAnyPermission('editInventory'), async (req, res) => {
    try {
        const { id } = req.params;
        await db.run('DELETE FROM inventory_photos WHERE item_id = ?', id);
        const result = await db.run('DELETE FROM inventory_items WHERE id = ?', id);
        if (!result.changes) return res.status(404).json({ error: 'Item not found' });
        io.emit('data_updated', { type: 'inventory' });
        res.json({ success: true });
    } catch (err) {
        serverError(req, res, err);
    }
});

app.post('/api/inventory/items/:id/photos', requireAnyPermission('editInventory'), async (req, res) => {
    try {
        const { id } = req.params;
        const { participantId, imageBase64 } = req.body || {};
        const pId = participantId || 'unassigned_stock';
        if (!imageBase64) {
            return res.status(400).json({ error: 'imageBase64 is required' });
        }

        const photoId = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
        let embedding = null;
        try {
            embedding = await generateImageEmbedding(imageBase64);
        } catch (err) {
            console.error('Embedding generation failed:', err.message);
        }

        await db.run(
            'INSERT INTO inventory_photos (id, item_id, participant_id, image_base64, embedding_json) VALUES (?, ?, ?, ?, ?)',
            photoId,
            id,
            pId,
            imageBase64,
            embedding ? JSON.stringify(embedding) : null
        );
        await db.run('UPDATE inventory_items SET updated_at = CURRENT_TIMESTAMP WHERE id = ?', id);
        io.emit('data_updated', { type: 'inventory' });
        res.json({ success: true, photoId, embeddingGenerated: !!embedding });
    } catch (err) {
        serverError(req, res, err);
    }
});

app.delete('/api/inventory/photos/:photoId', requireAnyPermission('editInventory'), async (req, res) => {
    try {
        const { photoId } = req.params;
        const photo = await db.get('SELECT item_id FROM inventory_photos WHERE id = ?', photoId);
        const result = await db.run('DELETE FROM inventory_photos WHERE id = ?', photoId);
        if (!result.changes) return res.status(404).json({ error: 'Photo not found' });
        if (photo?.item_id) await db.run('UPDATE inventory_items SET updated_at = CURRENT_TIMESTAMP WHERE id = ?', photo.item_id);
        io.emit('data_updated', { type: 'inventory' });
        res.json({ success: true });
    } catch (err) {
        serverError(req, res, err);
    }
});

app.post('/api/inventory/search', requireAnyPermission('searchInventoryAI'), async (req, res) => {
    try {
        const { imageBase64, topK = 5 } = req.body || {};
        if (!imageBase64) return res.status(400).json({ error: 'imageBase64 is required' });

        const queryEmbedding = await generateImageEmbedding(imageBase64);
        if (!queryEmbedding) return res.status(502).json({ error: 'Could not generate query embedding' });

        const rows = await db.all(
            `SELECT p.id AS photo_id, p.item_id, p.participant_id, p.image_base64, p.embedding_json,
                    i.label, i.category, i.status
             FROM inventory_photos p
             LEFT JOIN inventory_items i ON i.id = p.item_id
             WHERE p.embedding_json IS NOT NULL`
        );

        const matches = rows
            .map((row) => {
                let emb = null;
                try { emb = JSON.parse(row.embedding_json); } catch (err) { emb = null; }
                const score = emb ? cosineSimilarity(queryEmbedding, emb) : 0;
                return {
                    photoId: row.photo_id,
                    itemId: row.item_id,
                    participantId: row.participant_id,
                    imageBase64: row.image_base64,
                    label: row.label,
                    category: row.category,
                    status: row.status,
                    score
                };
            })
            .filter((m) => Number.isFinite(m.score) && m.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, Math.min(Number(topK) || 5, 10));

        const searchId = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
        await db.run(
            'INSERT INTO inventory_matches (id, query_image_base64, results_json, validated_item_id, validated_by) VALUES (?, ?, ?, ?, ?)',
            searchId,
            imageBase64,
            JSON.stringify(matches),
            null,
            null
        );

        res.json({ searchId, matches });
    } catch (err) {
        serverError(req, res, err);
    }
});

app.post('/api/inventory/matches/:id/validate', requireAnyPermission('searchInventoryAI'), async (req, res) => {
    try {
        const { id } = req.params;
        const { itemId, validatedBy } = req.body || {};
        await db.run('UPDATE inventory_matches SET validated_item_id = ?, validated_by = ? WHERE id = ?', itemId || null, validatedBy || null, id);
        res.json({ success: true });
    } catch (err) {
        serverError(req, res, err);
    }
});

app.post('/api/ai/rewrite-fei', requireAnyPermission('editIncident'), aiRateLimiter, async (req, res) => {
    try {
        const { text, mode = 'detaille' } = req.body || {};
        const baseText = typeof text === 'string' ? text.trim() : '';

        if (!baseText) {
            return res.status(400).json({ error: 'Text is required' });
        }
        if (baseText.length > FEI_REWRITE_MAX_CHARS) {
            return res.status(400).json({ error: `Text too long (max ${FEI_REWRITE_MAX_CHARS} chars)` });
        }
        if (!process.env.GROQ_API_KEY) {
            return res.status(503).json({ error: 'Groq API key is not configured' });
        }

        const modeInstruction = mode === 'court'
            ? 'Produit une version courte (4 a 7 lignes), claire et complete.'
            : 'Produit une version detaillee, claire et structuree en paragraphes courts.';

        const systemPrompt = [
            'Tu aides a reformuler une FEI (Feuille d\'evenement indesirable) en francais.',
            'Style attendu: factuel, neutre, professionnel, sans jugement.',
            'Respecte la chronologie et conserve les informations importantes (qui, quand, ou, quoi, actions).',
            'N\'invente jamais des faits, personnes, lieux, horaires ou actions.',
            'Interdiction absolue d\'ajouter des noms, dates, heures ou details non presents dans le texte source.',
            'Si une information manque, laisse-la implicite sans la completer.',
            modeInstruction,
            'Retourne uniquement le texte final, sans titre ni liste a puces.'
        ].join(' ');

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);
        let response;
        try {
            response = await fetch(GROQ_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
                },
                body: JSON.stringify({
                    model: GROQ_MODEL,
                    temperature: 0.2,
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: `Texte source FEI (a reformuler sans ajouter d\'information):\n"""\n${baseText}\n"""` }
                    ]
                }),
                signal: controller.signal
            });
        } finally {
            clearTimeout(timeout);
        }

        if (!response.ok) {
            let reason = 'AI provider error';
            try {
                const errorPayload = await response.json();
                reason = errorPayload?.error?.message || reason;
            } catch (parseErr) {
                // Ignore parse error and keep generic reason
            }
            return res.status(502).json({ error: reason });
        }

        const payload = await response.json();
        const rewrittenText = payload?.choices?.[0]?.message?.content?.trim();

        if (!rewrittenText) {
            return res.status(502).json({ error: 'Empty response from AI provider' });
        }

        res.json({ rewrittenText });
    } catch (err) {
        if (err?.name === 'AbortError') {
            return res.status(504).json({ error: 'AI request timed out' });
        }
        serverError(req, res, err);
    }
});

app.get('/api/action-logs', requireAnyPermission('viewLogs'), async (req, res) => {
    try {
        const requestedLimit = Number.parseInt(req.query.limit, 10);
        const limit = Number.isFinite(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 500) : 200;
        const rows = await db.all('SELECT * FROM action_logs ORDER BY datetime(created_at) DESC LIMIT ?', limit);
        const logs = rows.map((row) => {
            let metadata = {};
            try { metadata = row.metadata ? JSON.parse(row.metadata) : {}; } catch (err) { metadata = {}; }
            return { ...row, metadata };
        });
        res.json(logs);
    } catch (err) {
        serverError(req, res, err);
    }
});

app.delete('/api/action-logs', requireAnyPermission('manageAccess'), async (req, res) => {
    try {
        await db.run('DELETE FROM action_logs');
        res.json({ success: true });
    } catch (err) {
        serverError(req, res, err);
    }
});
// Fin du fichier
