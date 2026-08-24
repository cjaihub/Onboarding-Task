# Engineering Decision Log

## 1. Architecture

**Problem:** The challenge requires a multi-client ecosystem (Web + Mobile) interacting with the same data.
**Decision:** Adopt a decoupled client-server architecture with a Monorepo structure.
**Reason:** A single backend API serves both the Next.js frontend and the Flutter mobile app. A monorepo ensures that API contracts, documentation, and feature branches remain synchronized across all three platforms.
**Alternative:** Separate repositories for web, mobile, and backend.
**Trade-off:** Monorepos can become large and require complex CI/CD pipelines.
**Result:** Seamless cross-stack development and unified versioning.

## 2. Backend Responsibility

**Problem:** Workflow rules (e.g., cannot resolve without an assignee) must be strictly enforced.
**Decision:** The Django backend is the authoritative source for all domain and workflow logic.
**Reason:** If business rules were duplicated in both Next.js and Flutter, they would inevitably drift out of sync, and a compromised client could bypass them entirely.
**Alternative:** Client-side validation only.
**Trade-off:** Requires robust API error normalization so clients can display backend rejection messages gracefully.
**Result:** A secure, robust domain model where invalid transitions are impossible.

## 3. Frontend Responsibility

**Problem:** How should the frontend handle state and routing?
**Decision:** Next.js uses App Router for routing and layout, while delegating complex server-state management to TanStack Query.
**Reason:** Next.js provides excellent routing and SEO/SSR capabilities, but TanStack Query excels at managing asynchronous data fetching, caching, and optimistic UI updates for highly interactive dashboards.
**Alternative:** Redux or native React Context for all state.
**Trade-off:** Introduces an additional dependency (TanStack Query) to the stack.
**Result:** Clean separation between UI rendering and server-state synchronization.

## 4. SQLite as Database

**Problem:** A relational database is required, but infrastructure complexity should be minimized for the challenge.
**Decision:** Use SQLite via the Django ORM.
**Reason:** SQLite perfectly satisfies the challenge requirements for persistence without the overhead of spinning up a PostgreSQL or MySQL container.
**Alternative:** PostgreSQL via Docker.
**Trade-off:** SQLite lacks advanced concurrency features, but is more than sufficient for a single-team internal tool.
**Result:** Zero-configuration database setup that works instantly out of the box.

## 5. Docker Environment

**Problem:** The application needs to be easily deployable and testable by reviewers.
**Decision:** Containerize the backend and web frontend using Docker Compose.
**Reason:** Eliminates "it works on my machine" issues by standardizing the Python and Node.js runtimes.
**Alternative:** Manual `requirements.txt` and `npm install` instructions.
**Trade-off:** Slower initial build times for Docker images.
**Result:** A one-command (`docker-compose up`) launch sequence for the entire stack.

## 6. Real-Time WebSockets

**Problem:** The Activity Feed needs to update instantly without manual refreshing.
**Decision:** Use Django Channels for the backend and `web_socket_channel` in Flutter / native WebSockets in React.
**Reason:** Polling the API every X seconds wastes bandwidth and drains mobile batteries. WebSockets provide an efficient, real-time push mechanism.
**Alternative:** Short-polling via REST API.
**Trade-off:** Adds architectural complexity (ASGI, Redis layer in production, though in-memory is used for development).
**Result:** A highly responsive Activity Feed that feels instantly alive.

## 7. Authentication Strategy

**Problem:** How to secure the application and track user activity attribution.
**Decision:** Implement JWT Authentication (`rest_framework_simplejwt`).
**Reason:** JWTs are stateless and work seamlessly across both web browsers (via HTTP headers) and mobile apps (via secure storage).
**Alternative:** Django Session Auth.
**Trade-off:** Requires manual token management and refresh logic on the clients.
**Result:** Secure, stateless authentication that natively supports cross-platform clients.

## 8. WebSocket Authentication

**Problem:** Standard Django AuthMiddleware does not read JWTs from WebSocket connections automatically.
**Decision:** Implement a custom `TokenAuthMiddleware` in ASGI.
**Reason:** To ensure real-time streams are secure, the middleware intercepts the `?token=` query parameter during the WS handshake, decodes the JWT, and populates the scope user.
**Alternative:** Allow unauthenticated WebSockets.
**Trade-off:** Requires custom middleware code.
**Result:** Secure, authenticated real-time data streams.
