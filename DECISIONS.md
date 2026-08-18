# Decisions
# Architecture & Engineering Decisions

This document records meaningful technical decisions made during implementation.

Do not record trivial implementation details.

Each decision should explain:

1. Context
2. Decision
3. Reason
4. Consequences

---

# Decision 001 — Monorepo

## Context

The application contains:

* Django REST backend
* Next.js web application
* Flutter mobile application

## Decision

Use a single repository containing:

```text
backend/
web/
mobile/
docs/
```

## Reason

The challenge is an end-to-end product and the clients share one backend API.

A monorepo makes the API contract, documentation and development workflow easier to manage.

## Consequences

Backend, web and mobile changes can be reviewed together.

---

# Decision 002 — SQLite

## Context

The challenge explicitly requires Django's default SQLite database.

## Decision

Use SQLite through Django ORM.

## Reason

It satisfies the challenge and avoids introducing unnecessary database infrastructure.

## Consequences

The implementation must explicitly handle SQLite persistence when running through Docker.

---

# Decision 003 — Backend-Owned Workflow

## Context

Workflow rules are business rules and must not depend on client behavior.

## Decision

Enforce workflow transitions in Django.

## Reason

Both Next.js and Flutter must obey the same rules.

The backend must remain authoritative even if a client sends an invalid request.

## Consequences

Clients must consume transition API responses and correctly handle rejected transitions.

---

# Decision 004 — Dedicated Workflow Logic

## Context

Transition validation involves multiple conditions and affects activity history.

## Decision

Keep workflow behavior in a dedicated domain/service layer rather than scattering it across views and serializers.

## Reason

This keeps business logic reusable and testable.

## Consequences

Views remain primarily responsible for HTTP orchestration.

---

# Decision 005 — Derived Overdue State

## Context

The challenge requires identifying overdue work items but does not require a persisted overdue field.

## Decision

Calculate overdue from due_date and current status.

## Reason

Overdue is derived from existing information.

Persisting it could introduce stale data.

## Consequences

Queries and dashboard aggregation must use the same overdue definition consistently.

---

# Decision 006 — TanStack Query for Web Server State

## Context

The web application consumes multiple API resources and performs mutations.

## Decision

Use TanStack Query for server state.

## Reason

It provides structured caching, invalidation, loading/error states and mutation handling.

## Consequences

Components should not independently implement duplicated API caching behavior.

---

# Decision 007 — dnd-kit for Kanban

## Context

The challenge prefers drag-and-drop workflow management.

## Decision

Use dnd-kit for the Kanban interaction.

## Reason

It provides the required interaction model while keeping the implementation focused.

## Consequences

Drag completion must be connected to the backend transition API rather than treated as a purely visual operation.

---

# Decision 008 — Riverpod for Flutter State

## Context

Flutter requires API integration, state management and separation of concerns.

## Decision

Use Riverpod.

## Reason

It provides a structured approach suitable for a small application while allowing the architecture to scale.

## Consequences

Networking and feature state should not be embedded directly in widgets.

---

# Decision 009 — API Configuration Through Environment

## Context

Web and mobile clients need to know the backend location.

## Decision

Keep environment-specific API configuration outside application logic.

## Reason

The same application should be able to run against different environments without changing source code.

## Consequences

Configuration must be documented and `.env.example` files maintained.

---

# Decision Log

New decisions should be added below using this format:

```text
# Decision XXX — Title

## Context

...

## Decision

...

## Reason

...

## Consequences

...
```

Do not modify previous decisions merely because a later implementation changes.

If a decision is superseded, add a new decision explaining why.
