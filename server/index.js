import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = join(__dirname, 'database.sqlite');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: ["http://localhost:5173", "https://camp.black-i.uk"],
        methods: ["GET", "POST", "DELETE"]
    }
});

app.use(cors({
    origin: ["http://localhost:5173", "https://camp.black-i.uk"]
}));
app.use(express.json());

// Logging Middleware
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    if (req.method === 'POST') {
        console.log('Body:', JSON.stringify(req.body).substring(0, 100));
    }
    next();
});

// Initialize Database
async function initDb() {
    const db = await open({
        filename: dbPath,
        driver: sqlite3.Database
    });

    await db.exec(`
        CREATE TABLE IF NOT EXISTS participants (
            id TEXT PRIMARY KEY,
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
    `);

    // Ensure participants table has the new columns
    const columns = await db.all("PRAGMA table_info(participants)");
    const columnNames = columns.map(c => c.name);
    const requiredColumns = ['firstName', 'lastName', 'role', 'groupId', 'allergies', 'constraints'];

    for (const col of requiredColumns) {
        if (!columnNames.includes(col)) {
            console.log(`Adding missing column ${col} to participants table...`);
            await db.exec(`ALTER TABLE participants ADD COLUMN ${col} TEXT`);
        }
    }

    // Migration logic for participants
    const rows = await db.all('SELECT id, data FROM participants WHERE firstName IS NULL');
    if (rows.length > 0) {
        console.log(`Migrating ${rows.length} participants...`);
        const stmt = await db.prepare('UPDATE participants SET firstName = ?, lastName = ?, role = ?, groupId = ?, allergies = ?, constraints = ? WHERE id = ?');
        for (const row of rows) {
            try {
                const data = JSON.parse(row.data);
                await stmt.run(
                    data.firstName || '',
                    data.lastName || '',
                    data.role || '',
                    data.groupId || '',
                    data.allergies || '',
                    data.constraints || '',
                    row.id
                );
            } catch (e) {
                console.error(`Failed to migrate participant ${row.id}:`, e);
            }
        }
        await stmt.finalize();
        console.log('Migration complete.');
    }

    return db;
}

let db;
initDb().then(database => {
    db = database;
    console.log('Database initialized');
});

// Participants API
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
        await db.run('DELETE FROM participants');
        const stmt = await db.prepare('INSERT INTO participants (id, firstName, lastName, role, groupId, allergies, constraints, data) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
        for (const p of participants) {
            if (p && p.id) {
                await stmt.run(
                    p.id,
                    p.firstName || '',
                    p.lastName || '',
                    p.role || '',
                    p.groupId || '',
                    p.allergies || '',
                    p.constraints || '',
                    JSON.stringify(p)
                );
            }
        }
        await stmt.finalize();
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
        await db.run('DELETE FROM groups');
        const stmt = await db.prepare('INSERT INTO groups (id, data) VALUES (?, ?)');
        for (const g of groups) {
            if (g && g.id) await stmt.run(g.id, JSON.stringify(g));
        }
        await stmt.finalize();
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
        await db.run('DELETE FROM activities');
        const stmt = await db.prepare('INSERT INTO activities (id, data) VALUES (?, ?)');
        for (const a of activities) {
            if (a && a.id) await stmt.run(a.id, JSON.stringify(a));
        }
        await stmt.finalize();
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
        if (!db) {
            console.error('Database not initialized yet!');
            return res.status(503).json({ error: 'Database not initialized' });
        }
        const sheet = req.body;
        console.log('Attempting to save exit sheet:', sheet?.id);
        if (!sheet || !sheet.id) {
            console.error('Invalid sheet data received:', sheet);
            return res.status(400).json({ error: 'Invalid sheet data' });
        }
        const result = await db.run(
            'INSERT OR REPLACE INTO exit_sheets (id, data) VALUES (?, ?)',
            sheet.id,
            JSON.stringify(sheet)
        );
        console.log('Successfully saved exit sheet. Rows affected:', result.changes);
        io.emit('data_updated', { type: 'exitsheets' });
        res.json({ success: true });
    } catch (err) {
        console.error('Error saving exit sheet:', err);
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

const PORT = 3001;
httpServer.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
