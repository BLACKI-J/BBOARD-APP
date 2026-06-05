const fs = require('fs');

// 1. Today.jsx
let todayPath = '/home/jathur/projects/colo-app/src/components/Today.jsx';
if (fs.existsSync(todayPath)) {
    let today = fs.readFileSync(todayPath, 'utf8');
    today = today.replace("<span style={{ fontSize: '1.25rem' }}>🏊</span>", "<span style={{ fontSize: '1.25rem', color: 'var(--primary-color)' }}>•</span>");
    today = today.replace("<span style={{ fontSize: '1.25rem' }}>✅</span>", "<span style={{ fontSize: '1.25rem', color: 'var(--success-color)' }}>•</span>");
    fs.writeFileSync(todayPath, today);
}

// 2. HealthCenter.jsx
let healthPath = '/home/jathur/projects/colo-app/src/components/HealthCenter.jsx';
if (fs.existsSync(healthPath)) {
    let health = fs.readFileSync(healthPath, 'utf8');
    health = health.replace("icon: '🌅'", "icon: <Sunrise size={18} />");
    health = health.replace("icon: '☀️'", "icon: <Sun size={18} />");
    health = health.replace("icon: '🍎'", "icon: <Apple size={18} />");
    health = health.replace("icon: '🌙'", "icon: <Moon size={18} />");
    
    // Check if Sunrise, Sun, Apple, Moon are imported from lucide-react
    if (!health.includes('Sunrise')) {
        health = health.replace('import {', 'import { Sunrise, Sun, Apple, Moon,');
    }
    fs.writeFileSync(healthPath, health);
}

// 3. ParticipantForm.jsx
let partPath = '/home/jathur/projects/colo-app/src/components/directory/ParticipantForm.jsx';
if (fs.existsSync(partPath)) {
    let part = fs.readFileSync(partPath, 'utf8');
    part = part.replace("icon: '🌅'", "icon: <Sunrise size={16} />");
    part = part.replace("icon: '☀️'", "icon: <Sun size={16} />");
    part = part.replace("icon: '🍎'", "icon: <Apple size={16} />");
    part = part.replace("icon: '🌙'", "icon: <Moon size={16} />");
    if (!part.includes('Sunrise')) {
        part = part.replace('import {', 'import { Sunrise, Sun, Apple, Moon,');
    }
    fs.writeFileSync(partPath, part);
}

// 4. Schedule.jsx
let schedPath = '/home/jathur/projects/colo-app/src/components/Schedule.jsx';
if (fs.existsSync(schedPath)) {
    let sched = fs.readFileSync(schedPath, 'utf8');
    sched = sched.replace("🏊 {nonTestedCount} non-testé", "{nonTestedCount} non-testé");
    sched = sched.replace("🏊 Tous testés", "Tous testés");
    fs.writeFileSync(schedPath, sched);
}

console.log("Emojis removed/replaced!");
