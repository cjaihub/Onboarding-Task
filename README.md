# 🛡️ USALAMA — Engineering Operations Platform

> **USALAMA** (Swahili for *"Safety"*) is a full-stack engineering operations platform built for elite engineering teams. It combines real-time collaboration, project management, workflow automation, and a Kanban board — all in one beautiful, secure environment.

[![Backend](https://img.shields.io/badge/Backend-Django%205%20%2B%20DRF-009688?logo=django)](./backend)
[![Frontend](https://img.shields.io/badge/Frontend-Next.js%2016%20%2B%20React%2019-000?logo=next.js)](./web)
[![Mobile](https://img.shields.io/badge/Mobile-Flutter%203-02569B?logo=flutter)](./mobile)

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Architecture](#-architecture)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [API Reference](#-api-reference)
- [Key Engineering Decisions](#-key-engineering-decisions)
- [Development Guide](#-development-guide)

---

## 🌟 Overview

USALAMA is a production-ready engineering operations platform that enables teams to:

- **Track work items** end-to-end from creation to resolution with full audit trails
- **Manage projects** with types, tech stacks, team members, attachments, and comments
- **Automate workflows** using configurable multi-step workflow definitions
- **Collaborate in real-time** via WebSocket-powered Kanban boards
- **Monitor health** via a live dashboard with KPI metrics, overdue tracking, and activity feeds
- **Work anywhere** with a full-featured Flutter mobile app for iOS and Android

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    USALAMA Platform                      │
├─────────────┬───────────────────────┬───────────────────┤
│  Flutter    │    Next.js 16         │   Django 5 API    │
│  Mobile App │    Web Frontend       │   REST + WebSocket│
│  (iOS/Android) │ (SSR + React 19)  │ (DRF + Channels)  │
└──────┬──────┴──────────┬────────────┴────────┬──────────┘
       └─────────────────┼──────────────────────┘
                         │
              ┌──────────▼──────────┐
              │   SQLite (dev)      │
              │   PostgreSQL (prod) │
              └─────────────────────┘
```

**Communication:**
- REST API: `http://localhost:8000/api/`
- WebSockets: `ws://localhost:8000/ws/board/<project_id>/`
- JWT Authentication with auto-refresh

---

## ✨ Features

### 📊 Dashboard
- Live KPI cards: Total, Open, In Progress, Critical, Overdue, Resolved
- Work items by status — stacked progress bar visualization
- Risk distribution by priority (Critical / High / Medium / Low)
- Attention Required panel — critical + overdue items
- Recent activity timeline feed

### 📁 Projects
- Create projects with type, description, and tech tool tags
- Multi-step project setup wizard
- Team member management
- File attachments and project-level comments
- Project-level dashboard with stats

### 🎯 Work Items
- Full lifecycle: `OPEN → IN_PROGRESS → REVIEW → RESOLVED → CLOSED`
- Priority levels: `LOW / MEDIUM / HIGH / CRITICAL`
- Assignment, due dates, tags, and resolution notes
- Inline commenting with file attachments
- Complete activity and audit log per item
- Filtering, search, and pagination

### 🔄 Workflows
- Configurable workflow definitions per project
- Named steps with ordering
- Mobile app workflow management screen

### 🗂️ Kanban Board
- Real-time drag-and-drop via WebSockets
- Live collaboration — changes broadcast instantly to all viewers
- Column-based status visualization

### 👤 User Management
- JWT authentication (access + refresh tokens)
- User profiles with bio, role, avatar, and phone
- Password change from profile screen
- Mobile profile and user detail screens

### 📱 Mobile App
- Full work items list with filters
- Project management and project detail views
- Kanban board with real-time WebSocket sync
- Workflow management per project
- User profile management

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Backend** | Django 5 + Django REST Framework | REST API, business logic, auth |
| **Real-time** | Django Channels + WebSockets | Live Kanban board collaboration |
| **Auth** | SimpleJWT | JWT access/refresh token management |
| **Database** | SQLite (dev) / PostgreSQL (prod) | Persistent data storage |
| **Frontend** | Next.js 16 + React 19 | Web dashboard (SSR + CSR) |
| **Styling** | Tailwind CSS 4 | Utility-first design system |
| **State** | TanStack React Query v5 | Server state, caching, mutations |
| **Animation** | Framer Motion | Smooth UI transitions |
| **Drag & Drop** | @dnd-kit | Kanban board interactions |
| **Mobile** | Flutter 3 (Dart) | Cross-platform iOS and Android app |
| **Containers** | Docker + Docker Compose | Dev and deployment orchestration |

---

## 📁 Project Structure

```
Onboarding-Task/
├── backend/                    # Django API server
│   ├── backend/                # Project settings and URLs
│   │   ├── settings.py         # Configuration (CORS, JWT, Channels)
│   │   └── urls.py             # Root URL routing
│   ├── core/                   # Main application
│   │   ├── models.py           # WorkItem, Project, Workflow, Activity
│   │   ├── views.py            # ViewSets + function-based views
│   │   ├── serializers.py      # DRF serializers
│   │   ├── services.py         # Business logic (workflow transitions)
│   │   ├── auth_views.py       # Login, register, me, change-password
│   │   └── urls.py             # API routing
│   ├── collaboration/          # WebSocket consumers
│   │   ├── consumers.py        # Kanban board WebSocket consumer
│   │   └── urls.py             # WebSocket routing
│   ├── requirements.txt        # Python dependencies
│   └── Dockerfile
│
├── web/                        # Next.js frontend
│   ├── src/
│   │   ├── app/                # Next.js App Router pages
│   │   │   ├── page.tsx        # Dashboard (KPI, activity, board status)
│   │   │   ├── login/          # Login and Register page
│   │   │   ├── projects/       # Projects list and detail pages
│   │   │   ├── work-items/     # Work items list and detail pages
│   │   │   ├── board/          # Kanban board page
│   │   │   ├── workflows/      # Workflow management page
│   │   │   └── profile/        # User profile page
│   │   ├── api/                # API client functions
│   │   │   ├── auth.ts         # Login, register, token refresh
│   │   │   ├── workItems.ts    # CRUD + transitions
│   │   │   ├── projects.ts     # Project CRUD + members
│   │   │   ├── dashboard.ts    # Dashboard stats
│   │   │   └── collaboration.ts# WebSocket board sync
│   │   ├── components/         # Reusable UI components
│   │   │   ├── board/          # KanbanBoard, KanbanColumn, KanbanCard
│   │   │   ├── projects/       # ProjectTable, ProjectForm
│   │   │   └── ui/             # Badge, Skeleton, ErrorState, etc.
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx # Global auth state + token management
│   │   ├── hooks/
│   │   │   └── queries.ts      # TanStack Query hooks
│   │   └── lib/
│   │       ├── api-client.ts   # Authenticated fetch with auto token refresh
│   │       └── backend-url.ts  # Backend URL resolution
│   ├── next.config.ts          # Next.js config with /api proxy rewrites
│   └── Dockerfile
│
├── mobile/                     # Flutter mobile app
│   └── lib/
│       ├── features/
│       │   ├── auth/           # Login, profile, user screens
│       │   ├── board/          # Kanban board with WebSocket
│       │   ├── navigation/     # Main tab layout
│       │   ├── projects/       # Projects list, detail, wizard
│       │   └── workflows/      # Workflow management screen
│       ├── models/             # Dart data models
│       ├── repositories/       # Data access layer
│       └── services/
│           └── api_service.dart # HTTP + WebSocket URL management
│
├── docker-compose.yml          # Full stack orchestration
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- Python 3.11+
- Node.js 20+
- Flutter 3.x SDK
- Docker and Docker Compose (optional)

---

### 1. Backend (Django API)

```bash
cd backend

# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# (Optional) Seed demo data
python manage.py seed_data

# Start server
python manage.py runserver
```

API available at: **`http://127.0.0.1:8000/api/`**

**Default dev users (after seeding):**

| Username | Password | Role |
|----------|----------|------|
| `alice` | `Alice123!` | Engineer |
| `bob` | `Bob12345!` | Manager |
| `charlie` | `Charlie1!` | QA |

---

### 2. Web Frontend (Next.js)

```bash
cd web
npm install
npm run dev
```

Available at: **`http://localhost:3000`**

> The frontend proxies all `/api/*` requests to Django via Next.js rewrites — no CORS configuration needed in development.

---

### 3. Mobile App (Flutter)

```bash
cd mobile
flutter pub get
flutter run
```

**Device configuration:**
- **Android Emulator**: Uses `http://10.0.2.2:8000/api` automatically
- **Physical Device**: Update `baseUrl` in `mobile/lib/services/api_service.dart` to your machine's local IP
- **iOS Simulator**: Uses `http://127.0.0.1:8000/api`

---

### 4. Docker (Full Stack)

```bash
docker-compose up --build
```

| Service | URL |
|---------|-----|
| Backend API | `http://localhost:8000/api/` |
| Web Dashboard | `http://localhost:3000` |

---

## 📡 API Reference

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/login/` | Login — returns access + refresh JWT |
| `POST` | `/api/auth/register/` | Register new user |
| `POST` | `/api/auth/refresh/` | Refresh access token |
| `GET/PATCH` | `/api/auth/me/` | Get or update current user profile |
| `POST` | `/api/auth/change-password/` | Change password |
| `POST` | `/api/auth/logout/` | Logout and blacklist token |

### Work Items

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/work-items/` | List work items (filterable + paginated) |
| `POST` | `/api/work-items/` | Create work item |
| `GET` | `/api/work-items/{id}/` | Get work item detail |
| `PATCH` | `/api/work-items/{id}/` | Update work item |
| `POST` | `/api/work-items/{id}/transition/` | Transition status |
| `POST` | `/api/work-items/{id}/assign/` | Assign to user |
| `GET/POST` | `/api/work-items/{id}/comments/` | List or add comments |
| `GET` | `/api/work-items/{id}/activity/` | Get audit log |

### Projects

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET/POST` | `/api/projects/` | List or create projects |
| `GET/PATCH` | `/api/projects/{id}/` | Get or update project |
| `POST` | `/api/projects/{id}/add_member/` | Add team member |
| `POST` | `/api/projects/{id}/upload_attachment/` | Upload file |

### Workflows

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET/POST` | `/api/workflows/` | List or create workflows |
| `GET/PATCH/DELETE` | `/api/workflows/{id}/` | Manage workflow |

### Dashboard and Metadata

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/dashboard/` | Dashboard KPI stats |
| `GET` | `/api/users/` | List all users |
| `GET` | `/api/metadata/` | Project types and tech tools |

### Real-time WebSocket

```
ws://localhost:8000/ws/board/{project_id}/
```

Events: `item_moved`, `item_created`, `item_updated` — broadcast to all connected clients instantly.

---

## 🧠 Key Engineering Decisions

### 1. Enforced Workflow Transitions
Status transitions are validated server-side in `core/services.py`. Moving an item to `RESOLVED` **requires** a `resolution_note`. This prevents data corruption regardless of client behaviour.

### 2. JWT with Auto-Refresh
`api-client.ts` intercepts `401` responses, silently refreshes the access token, and retries the original request — giving seamless sessions without repeated logins.

### 3. Next.js API Proxy
`next.config.ts` rewrites all `/api/*` browser requests to the Django backend. This eliminates CORS preflight issues in development and simplifies deployment.

### 4. Content-Type Guard
The API client validates `Content-Type: application/json` before calling `.json()`. This prevents crashes when the server returns HTML error pages.

### 5. Dynamic WebSocket URL (Mobile)
`ApiService.wsBaseUrl` is derived at runtime from `baseUrl`, ensuring the same codebase works on Android emulator, iOS simulator, and physical devices.

### 6. Full Audit Trail
Every status transition, field change, and comment creates an `Activity` record linked to the work item and actor — providing a complete, tamper-evident audit log.

---

## 🔧 Development Guide

### Environment Variables

**Frontend** (`web/.env.local`):
```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api
NEXT_PUBLIC_WS_URL=ws://127.0.0.1:8000/ws/
```

### Running Tests

```bash
# Backend
cd backend && python manage.py test

# Frontend
cd web && npm test
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Commit: `git commit -m "feat: add your feature"`
4. Push: `git push origin feat/your-feature`
5. Open a Pull Request

---

<div align="center">
  <strong>Built with ❤️ by the USALAMA team</strong><br/>
  <sub>Engineering Operations, Elevated.</sub>
</div>
