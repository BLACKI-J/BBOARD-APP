# 🏕️ BBOARD - Summer Camp Management System

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![React](https://img.shields.io/badge/react-%2320232a.svg?style=flat&logo=react&logoColor=%2361DAFB)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/node.js-6DA55F?style=flat&logo=node.js&logoColor=white)](https://nodejs.org/)
[![SQLite](https://img.shields.io/badge/sqlite-%2307405e.svg?style=flat&logo=sqlite&logoColor=white)](https://sqlite.org/)
[![Socket.io](https://img.shields.io/badge/socket.io-black?style=flat&logo=socket.io&logoColor=white)](https://socket.io/)
[![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=flat&logo=docker&logoColor=white)](https://www.docker.com/)

> **The modern all-in-one solution for Summer Camp & Youth Center organization.**  
> *Manage participants, transport logistics, schedules, and medical sheets in one seamless interface.*

---

## 🌟 Key Features

| Feature | Description |
| :--- | :--- |
| **🚌 Visual Transport** | Interactive SeatMap for Bus and Van layouts with real-time drag-and-drop. |
| **🔄 Real-time Sync** | Instant data synchronization across all devices via WebSockets. |
| **📅 Dynamic Planning** | Easily manage weekly schedules, activities, and locations. |
| **📄 Automated Forms** | Generate professional Exit Sheets (A4) with health data and signatures. |
| **👥 Centralized Directory** | Comprehensive database for children, staff, and medical alerts. |
| **📦 Docker Ready** | One-command deployment for production environments. |

---

## � Quick Start (Ubuntu / Debian)

The fastest way to get your camp running is using our automatic installation script.

```bash
# 1. Clone the repository
git clone https://github.com/BLACKI-J/BBOARD-APP.git
cd BBOARD-APP

# 2. Run the automatic installer (installs Docker & Docker Compose)
bash install_docker.sh

# 3. Launch the application
docker compose up -d --build
```
*Your application will be live at `http://localhost`.*

---

## 🛠️ Tech Stack & Architecture

- **Frontend**: Built with **React 18** and **Vite**. UI styling via **TailwindCSS** and standard CSS Modules. Drag-and-drop powered by `@dnd-kit`.
- **Backend**: **Node.js** & **Express** server handling REST APIs and real-time events.
- **Communication**: **Socket.io** for bi-directional, event-based communication.
- **Database**: **SQLite** (relational) with an automatic JSON-to-SQL migration engine.
- **Containers**: Multi-stage **Docker** builds (Nginx for frontend, Node/Debian for backend).

---

## 💻 Developer Setup (Manual)

If you'd like to contribute or run the project outside of Docker:

### Prerequisites
- Node.js (v20+ recommended)
- npm

### Installation
1. **Initialize Backend**:
   ```bash
   cd server
   npm install
   node index.js
   ```
2. **Initialize Frontend**:
   ```bash
   cd ..
   npm install
   npm run dev
   ```
3. **Run Tests**:
   ```bash
   npm run test
   ```

---

## 🛰️ Deployment & Production

For production servers, use the `docker-compose.yml` file. It handles:
- **Service Isolation**: Separate containers for logic and UI.
- **Auto-restart**: Ensures the server comes back up after crashes.
- **Volume Persistence**: Your SQLite database is safely stored in a Docker volume.

To update an existing installation:
```bash
git pull origin main
docker compose up -d --build
```

---

## 🤝 Contributing

We welcome contributions of all kinds!
1. **Fork** the project.
2. Create your **Feature Branch** (`git checkout -b feature/AmazingFeature`).
3. **Commit** your changes (`git commit -m 'Add some AmazingFeature'`).
4. **Push** to the branch (`git push origin feature/AmazingFeature`).
5. Open a **Pull Request**.

---

## 📄 License
This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.

Developed with ❤️ by **BLACKI-J** for the camp management community.
