import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import cors from 'cors';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

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

const app = express();
const httpServer = createServer(app);

// Flexible CORS for local network and production
const envOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim()) : [];
const allowedOrigins = ["http://localhost:5173", ...envOrigins];
const corsOptions = {
    origin: (origin, callback) => {
        // Allow no-origin (like mobile apps or curl) or allowed list or any local IP
        if (!origin || allowedOrigins.indexOf(origin) !== -1 || origin.startsWith('http://localhost') || /^http:\/\/127\./.test(origin) || /^http:\/\/192\.168\./.test(origin) || /^http:\/\/10\./.test(origin) || /^http:\/\/172\.(1[6-9]|2[0-9]|3[0-1])\./.test(origin)) {
            callback(null, true);
        } else {
            console.log('CORS Blocked for origin:', origin);
            callback(new Error('Not allowed by CORS'));
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
        if (req.url === '/api/ai/rewrite-fei') {
            const textLength = typeof req.body?.text === 'string' ? req.body.text.length : 0;
            console.log(`Body: { textLength: ${textLength}, mode: ${req.body?.mode || 'detaille'} }`);
        } else if (req.url.startsWith('/api/inventory/items/') && req.url.endsWith('/photos')) {
            const imageLength = typeof req.body?.imageBase64 === 'string' ? req.body.imageBase64.length : 0;
            console.log(`Body: { participantId: ${req.body?.participantId || 'unknown'}, imageLength: ${imageLength} }`);
        } else if (req.url === '/api/inventory/search') {
            const imageLength = typeof req.body?.imageBase64 === 'string' ? req.body.imageBase64.length : 0;
            console.log(`Body: { imageLength: ${imageLength}, topK: ${req.body?.topK || 5} }`);
        } else {
            console.log('Body:', JSON.stringify(req.body).substring(0, 100));
        }
    }
    next();
});

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
    const requiredColumns = ['firstName', 'lastName', 'role', 'groupId', 'allergies', 'constraints'];

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

    // 4. Initialisez le PIN admin par défaut si nécessaire
    const adminPinRow = await db.get('SELECT value FROM app_state WHERE key = "adminPin"');
    if (!adminPinRow) {
        console.log('Initializing default admin PIN (1234)...');
        await db.run('INSERT INTO app_state (key, value) VALUES ("adminPin", ?)', JSON.stringify('1234'));
    }

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

async function replaceCollection({ table, rows, insertOne }) {
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

        const PORT = 3001;
        httpServer.listen(PORT, '0.0.0.0', () => {
            console.log(`Backend server running on http://0.0.0.0:${PORT}`);
        });
    } catch (err) {
        console.error('Failed to start server:', err);
        process.exit(1);
    }
}

startServer();

app.use((req, res, next) => {
    if (!req.url.startsWith('/api/')) return next();
    if (req.method === 'GET') return next();
    if (req.url.startsWith('/api/action-logs')) return next();

    const startedAt = Date.now();
    res.on('finish', () => {
        const actorId = req.headers['x-actor-id'];
        const actorName = req.headers['x-actor-name'];
        const actorRole = req.headers['x-actor-role'];
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

app.get('/api/participants', async (req, res) => {
    try {
        const rows = await db.all('SELECT data FROM participants');
        res.json(rows.map(r => JSON.parse(r.data)));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/participants', async (req, res) => {
    try {
        const participants = req.body || [];
        const stmt = await db.prepare('INSERT INTO participants (id, firstName, lastName, role, groupId, allergies, constraints, data) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
        try {
            await replaceCollection({
                table: 'participants',
                rows: participants,
                insertOne: async (p) => {
                    if (!p || !p.id) return;
                    await stmt.run(
                        p.id,
                        p.firstName || '',
                        p.lastName || '',
                        p.role || '',
                        p.groupId || p.group || '',
                        p.allergies || '',
                        p.constraints || '',
                        JSON.stringify(p)
                    );
                }
            });
        } finally {
            await stmt.finalize();
        }
        io.emit('data_updated', { type: 'participants' });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Groups API
app.get('/api/groups', async (req, res) => {
    try {
        const rows = await db.all('SELECT data FROM groups');
        res.json(rows.map(r => JSON.parse(r.data)));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/groups', async (req, res) => {
    try {
        const groups = req.body || [];
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
        res.status(500).json({ error: err.message });
    }
});

// Activities API
app.get('/api/activities', async (req, res) => {
    try {
        const rows = await db.all('SELECT data FROM activities');
        res.json(rows.map(r => JSON.parse(r.data)));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/activities', async (req, res) => {
    try {
        const activities = req.body || [];
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
        res.status(500).json({ error: err.message });
    }
});

// Generic App State
app.get('/api/state/:key', async (req, res) => {
    try {
        const row = await db.get('SELECT value FROM app_state WHERE key = ?', req.params.key);
        res.json(row ? JSON.parse(row.value) : null);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/state/:key', async (req, res) => {
    try {
        const value = req.body;
        await db.run('INSERT OR REPLACE INTO app_state (key, value) VALUES (?, ?)', req.params.key, JSON.stringify(value));
        io.emit('data_updated', { type: 'state', key: req.params.key });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Exit Sheets API
app.get('/api/exit-sheets', async (req, res) => {
    try {
        const rows = await db.all('SELECT data FROM exit_sheets ORDER BY created_at DESC');
        res.json(rows.map(r => JSON.parse(r.data)));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/exit-sheets', async (req, res) => {
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
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/exit-sheets/:id', async (req, res) => {
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
        res.status(500).json({ error: err.message });
    }
});

// Incident Sheets API (FEI)
app.get('/api/incident-sheets', async (req, res) => {
    try {
        const rows = await db.all('SELECT data FROM incident_sheets ORDER BY created_at DESC');
        res.json(rows.map(r => JSON.parse(r.data)));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/incident-sheets', async (req, res) => {
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
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/incident-sheets/:id', async (req, res) => {
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
        res.status(500).json({ error: err.message });
    }
});

// Meeting Recaps API (Coordination/CR)
app.get('/api/meeting-recaps', async (req, res) => {
    try {
        const rows = await db.all('SELECT data FROM meeting_recaps ORDER BY created_at DESC');
        res.json(rows.map(r => JSON.parse(r.data)));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/meeting-recaps', async (req, res) => {
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
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/meeting-recaps/:id', async (req, res) => {
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
        res.status(500).json({ error: err.message });
    }
});

// Inventory API
app.get('/api/inventory/items', async (req, res) => {
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
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/inventory/items', async (req, res) => {
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
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/inventory/items/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await db.run('DELETE FROM inventory_photos WHERE item_id = ?', id);
        const result = await db.run('DELETE FROM inventory_items WHERE id = ?', id);
        if (!result.changes) return res.status(404).json({ error: 'Item not found' });
        io.emit('data_updated', { type: 'inventory' });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/inventory/items/:id/photos', async (req, res) => {
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
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/inventory/photos/:photoId', async (req, res) => {
    try {
        const { photoId } = req.params;
        const photo = await db.get('SELECT item_id FROM inventory_photos WHERE id = ?', photoId);
        const result = await db.run('DELETE FROM inventory_photos WHERE id = ?', photoId);
        if (!result.changes) return res.status(404).json({ error: 'Photo not found' });
        if (photo?.item_id) await db.run('UPDATE inventory_items SET updated_at = CURRENT_TIMESTAMP WHERE id = ?', photo.item_id);
        io.emit('data_updated', { type: 'inventory' });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/inventory/search', async (req, res) => {
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
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/inventory/matches/:id/validate', async (req, res) => {
    try {
        const { id } = req.params;
        const { itemId, validatedBy } = req.body || {};
        await db.run('UPDATE inventory_matches SET validated_item_id = ?, validated_by = ? WHERE id = ?', itemId || null, validatedBy || null, id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/ai/rewrite-fei', async (req, res) => {
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
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/action-logs', async (req, res) => {
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
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/action-logs', async (req, res) => {
    try {
        await db.run('DELETE FROM action_logs');
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// Fin du fichier
