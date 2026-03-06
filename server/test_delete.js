import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = join(__dirname, 'database.sqlite');

async function testDelete() {
    const db = await open({
        filename: dbPath,
        driver: sqlite3.Database
    });

    const rows = await db.all('SELECT id FROM exit_sheets LIMIT 1');
    if (rows.length === 0) {
        console.log('No rows to delete');
        return;
    }

    const idToDelete = rows[0].id;
    console.log('Attempting to delete ID:', idToDelete);
    const result = await db.run('DELETE FROM exit_sheets WHERE id = ?', idToDelete);
    console.log('Changes:', result.changes);

    const after = await db.all('SELECT id FROM exit_sheets WHERE id = ?', idToDelete);
    console.log('Found after delete:', after.length);

    await db.close();
}

testDelete().catch(console.error);
