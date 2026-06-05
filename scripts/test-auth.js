import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import net from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { io } from 'socket.io-client';

const projectRoot = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const serverDir = join(projectRoot, 'server');
const databaseDir = await mkdtemp(join(tmpdir(), 'colo-app-auth-'));
const databasePath = join(databaseDir, 'database.sqlite');
const directionPin = '4827';
const animatorPin = '6789';

function getAvailablePort() {
    return new Promise((resolve, reject) => {
        const server = net.createServer();
        server.on('error', reject);
        server.listen(0, '127.0.0.1', () => {
            const { port } = server.address();
            server.close(() => resolve(port));
        });
    });
}

function connectSocket(url, cookie, shouldConnect) {
    return new Promise((resolve, reject) => {
        const socket = io(url, {
            extraHeaders: cookie ? { Cookie: cookie } : undefined,
            reconnection: false,
            timeout: 1000
        });
        const timeout = setTimeout(() => {
            socket.close();
            reject(new Error('Socket.io test timed out'));
        }, 1500);

        socket.on('connect', () => {
            clearTimeout(timeout);
            socket.close();
            shouldConnect ? resolve() : reject(new Error('Unauthenticated Socket.io connection was accepted'));
        });
        socket.on('connect_error', () => {
            clearTimeout(timeout);
            socket.close();
            shouldConnect ? reject(new Error('Authenticated Socket.io connection was rejected')) : resolve();
        });
    });
}

const port = await getAvailablePort();
const baseUrl = `http://127.0.0.1:${port}`;
const server = spawn(process.execPath, ['index.js'], {
    cwd: serverDir,
    env: {
        ...process.env,
        DATABASE_PATH: databasePath,
        INITIAL_ADMIN_PIN: directionPin,
        PORT: String(port)
    },
    stdio: ['ignore', 'pipe', 'pipe']
});

let serverOutput = '';
server.stdout.on('data', (chunk) => { serverOutput += chunk.toString(); });
server.stderr.on('data', (chunk) => { serverOutput += chunk.toString(); });

async function waitForServer() {
    for (let attempt = 0; attempt < 30; attempt += 1) {
        try {
            const response = await fetch(`${baseUrl}/api/health`);
            if (response.ok) return;
        } catch (err) {
            // Server is still starting.
        }
        await new Promise((resolve) => setTimeout(resolve, 100));
    }
    throw new Error(`Server failed to start:\n${serverOutput}`);
}

async function request(path, options = {}) {
    const response = await fetch(`${baseUrl}${path}`, options);
    const body = await response.json();
    return { response, body };
}

try {
    await waitForServer();

    let result = await request('/api/participants');
    assert.equal(result.response.status, 401);

    result = await request('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'director', pin: '1234' })
    });
    assert.equal(result.response.status, 401);

    result = await request('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'director', pin: directionPin })
    });
    assert.equal(result.response.status, 200);
    const directionCookie = result.response.headers.get('set-cookie').split(';')[0];

    result = await request('/api/state/adminPin', { headers: { Cookie: directionCookie } });
    assert.equal(result.response.status, 404);

    result = await request('/api/participants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: directionCookie },
        body: JSON.stringify([
            { id: 'anim-1', firstName: 'Alice', lastName: 'Martin', role: 'animator', pin: animatorPin },
            { id: 'child-1', firstName: 'Zoé', lastName: 'Petit', role: 'child' }
        ])
    });
    assert.equal(result.response.status, 200);

    result = await request('/api/participants', { headers: { Cookie: directionCookie } });
    assert.equal(result.response.status, 200);
    assert.equal(JSON.stringify(result.body).includes('pin'), false);
    assert.equal(JSON.stringify(result.body).includes('data'), false);

    result = await request('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'anim-1', pin: animatorPin })
    });
    assert.equal(result.response.status, 200);
    const animatorCookie = result.response.headers.get('set-cookie').split(';')[0];

    result = await request('/api/action-logs', {
        headers: { Cookie: animatorCookie, 'x-actor-role': 'direction' }
    });
    assert.equal(result.response.status, 403);

    await connectSocket(baseUrl, null, false);
    await connectSocket(baseUrl, directionCookie, true);

    await new Promise((resolve) => setTimeout(resolve, 50));
    assert.equal(serverOutput.includes(directionPin), false);
    assert.equal(serverOutput.includes(animatorPin), false);
    console.log('Authentication integration checks passed.');
} finally {
    if (server.exitCode === null) {
        const exited = new Promise((resolve) => server.once('exit', resolve));
        server.kill('SIGTERM');
        await exited;
    }
    await rm(databaseDir, { recursive: true, force: true });
}
