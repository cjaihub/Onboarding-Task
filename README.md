# Usalama - Internal Incident & Work Tracker

This repository implements the internal incident and work tracker designed as a two-day full-stack engineering challenge. It contains a Django REST Framework API, a Next.js web application, and a Flutter mobile companion app.

## Project Structure

- `backend/`: Django REST Framework API providing business logic, workflow validation, and data persistence.
- `web/`: Next.js frontend featuring an operational dashboard, Kanban workflow board, and detailed incident management views.
- `mobile/`: Flutter mobile application providing on-the-go access to work items, comments, and status updates.

## Tech Stack

- **Backend**: Python 3.11, Django, Django REST Framework, Django Channels (Daphne), SQLite
- **Web Frontend**: Next.js, React, TypeScript, Tailwind CSS, TanStack Query, native WebSockets
- **Mobile Frontend**: Flutter, Dart, HTTP, WebSocketChannel
- **Infrastructure**: Docker, Docker Compose

---

## 1. Running the Backend (Docker)

The backend is fully dockerized and uses Django's default SQLite database. 

### Data Persistence
The `docker-compose.yml` mounts `./backend` to `/app` inside the container. This ensures that the `db.sqlite3` file created during runtime persists on your local host machine. Rebuilding or removing the container will **not** destroy your data as long as the local `db.sqlite3` file is retained. 

### Quick Start
1. Make sure Docker Desktop is running.
2. In the root directory, run:
   ```bash
   docker-compose up --build
   ```
3. The API will be available at `http://127.0.0.1:8000`.

### Database Migrations & Seeding
Once the container is running, open a new terminal and run migrations:
```bash
docker-compose exec backend python manage.py migrate
```

Then, seed the database with test data (Users, Projects, Work Items, and Activity):
```bash
docker-compose exec backend python manage.py seed
```

---

## 2. Running the Web Application (Next.js)

The web dashboard provides complex views for managing the incident queue.

1. Navigate to the `web` directory:
   ```bash
   cd web
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Access the dashboard at `http://localhost:3000`.

---

## 3. Running the Mobile Application (Flutter)

The mobile app provides a clean interface to list work items and perform quick actions like commenting and updating statuses.

1. Navigate to the `mobile` directory:
   ```bash
   cd mobile
   ```
2. Install dependencies:
   ```bash
   flutter pub get
   ```
3. Run the app on an emulator or connected device:
   ```bash
   flutter run
   ```

*Note: The app is pre-configured to point to `http://10.0.2.2:8000/api` which resolves to the host machine's localhost when running in the official Android Emulator. If testing on a physical iOS/Android device, update `baseUrl` in `mobile/lib/services/api_service.dart` to your local machine's IP address on your WiFi network.*

---

## Key Engineering Decisions

- **Backend Validation**: Workflow transitions (e.g., preventing items from moving to `RESOLVED` without a resolution note) are rigidly enforced in `core/services.py` to prevent data corruption.
- **Real-Time Synchronization**: Django Channels broadcasts WebSocket events (`board` group) via `post_save` signals on Activities/Comments/WorkItems. Both Web and Mobile clients intercept these payloads and instantly invalidate their local caches (React Query / Riverpod) to maintain cross-platform state parity without polling.
- **Optimized Dashboards**: The Next.js dashboard uses a custom `GET /api/dashboard/` endpoint which leverages Django ORM's `annotate` and `values` to aggregate statistics on the server side, preventing the need to download large arrays of items to the frontend.
- **Mobile Architecture**: Moved away from a monolithic `main.dart` to a clean folder structure (`models/`, `services/`, `screens/`) adhering to Flutter best practices.

## Recent Updates

- **Authentication System**: Complete auth flows with login and profile management across all platforms.
- **Backend Enhancements**: Added `UserProfile`, `ProjectAttachment`, and `ProjectComment` models with corresponding API endpoints.
- **Web Frontend**: Introduced `/login` and `/profile` routes, `AuthContext`, and interactive Project Dashboards and Tables.
- **Mobile Companion**: Implemented auth features (`LoginScreen`, `ProfileScreen`), `ProjectDashboardScreen`, and a `ProjectSetupWizardScreen`.
