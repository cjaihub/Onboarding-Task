# Engineering Decision Log

This document records the meaningful technical decisions I made during the implementation of Usalama. I wanted to ensure that my reasoning was clear, rather than just delivering code without context.

---

# Decision 001 — The Monorepo Architecture

## Context
The challenge requires delivering a backend API, a Next.js web application, and a Flutter mobile application.

## Decision
I decided to structure the entire project as a single monorepo. 

## Reason
Since all three components represent a single end-to-end product and the clients share one backend API, keeping them in one repository makes managing API contracts, documentation, and the development workflow significantly easier.

## Consequences
I can review and commit backend, web, and mobile changes together, ensuring that features are always delivered holistically.

---

# Decision 002 — SQLite as the Primary Database

## Context
The challenge explicitly requires using Django's default SQLite database, but in modern production environments, it's tempting to reach for PostgreSQL.

## Decision
I stuck to SQLite through the Django ORM.

## Reason
I wanted to strictly satisfy the challenge requirements and avoid introducing unnecessary database infrastructure overhead for you during the review.

## Consequences
I had to explicitly ensure that SQLite persistence is handled correctly when running the environment through Docker via a volume mount. Because I used the Django ORM natively, transitioning to PostgreSQL in the future would be trivial.

---

# Decision 003 — Backend-Owned Workflow Rules

## Context
Workflow rules (like moving a ticket from "Review" to "Resolved") are core business logic.

## Decision
I strictly enforced all workflow transitions in the Django backend rather than relying on frontend logic.

## Reason
I needed to guarantee that both Next.js and Flutter obey the exact same rules. The backend must remain authoritative; if a compromised or buggy client sends an invalid request, the API must reject it.

## Consequences
I had to build robust error handling on the clients. For instance, the Next.js frontend uses TanStack Query to catch rejected transitions and roll back the UI state automatically.

---

# Decision 004 — Dedicated Workflow Service Layer

## Context
Transition validation involves multiple conditions (e.g., checking for assignees, notes) and affects activity history logs.

## Decision
I extracted the workflow behavior into a dedicated domain/service layer (`services.py`) rather than scattering it across views and serializers.

## Reason
This keeps the business logic highly reusable, testable, and clean. 

## Consequences
The DRF Views and Serializers remain primarily responsible for HTTP orchestration and data validation, exactly as they were designed to be used.

---

# Decision 005 — Derived Overdue State

## Context
The challenge requires identifying overdue work items but does not explicitly require a persisted overdue field in the database.

## Decision
I calculated "overdue" dynamically from `due_date` and the current `status`.

## Reason
Since "overdue" is a factor of time, persisting it as a boolean field would require a daily cron job to flip flags, which introduces the risk of stale data. Deriving it on the fly is far more robust.

## Consequences
I ensured that all queries and dashboard aggregations use this exact same definition of "overdue" consistently.

---

# Decision 006 — TanStack Query for Web Server State

## Context
The web application consumes multiple API resources, performs complex mutations, and needs to feel instantaneous.

## Decision
I used TanStack Query for server state management in the Next.js frontend.

## Reason
It gives me structured caching, cache invalidation, automated loading/error states, and most importantly, optimistic updates out of the box.

## Consequences
The UI feels incredibly fast. For example, drag-and-drop actions on the Kanban board instantly update the UI while syncing with the server in the background.

---

# Decision 007 — dnd-kit for the Kanban Board

## Context
The challenge called for drag-and-drop workflow management.

## Decision
I implemented `dnd-kit` for the Kanban interactions.

## Reason
It provided the exact interaction model I needed while keeping the implementation accessible and focused.

## Consequences
I had to carefully connect the drag completion events to the backend transition API so that moving a card wasn't just a visual trick, but a true state mutation.

---

# Decision 008 — Riverpod for Flutter State

## Context
The Flutter app needs to handle API integration, state management, and separation of concerns cleanly.

## Decision
I chose Riverpod for state management.

## Reason
I find Riverpod provides the most structured and scalable approach for a robust application, ensuring that network requests and state are never entangled directly in the UI widgets.

## Consequences
The Flutter architecture is highly modular and testable.

---

# Decision 009 — Environment-Driven API Configuration

## Context
Both web and mobile clients need to know where the backend is located, which changes between local development and production.

## Decision
I kept all environment-specific API configurations strictly outside the application logic using `.env` files.

## Reason
I wanted to ensure that the exact same application code could run against different environments without any source code changes.

## Consequences
Configuration is clean, and secrets or local IPs aren't accidentally committed to the repository.
