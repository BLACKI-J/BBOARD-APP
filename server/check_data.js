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

    const rows = await db.all('SELECT data FROM exit_sheets LIMIT 1');
    console.log('Sample Data Column:');
    if (rows.length > 0) {
        console.log(JSON.stringify(JSON.parse(rows[0].data), null, 2));
    } else {
        console.log('No data found');
    }
    await db.close();
}

checkDb().catch(console.error);
