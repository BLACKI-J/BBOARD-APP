import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = join(__dirname, 'database.sqlite');

async function checkDb() {
    const db = await open({
        filename: dbPath,
        driver: sqlite3.Database
    });

    const rows = await db.all('SELECT id FROM exit_sheets');
    console.log('Current Exit Sheets IDs:');
    console.log(JSON.stringify(rows, null, 2));
    await db.close();
}

checkDb().catch(console.error);
