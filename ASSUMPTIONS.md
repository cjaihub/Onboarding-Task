# Assumptions
# Project Assumptions

This document records interpretations made where the challenge specification leaves room for engineering judgment.

Assumptions must not contradict explicit requirements.

If a requirement is explicit, follow the requirement instead of recording an alternative interpretation.

---

# A001 — Default Workflow

## Assumption

The primary workflow is:

```text
OPEN
↓
IN_PROGRESS
↓
REVIEW
↓
RESOLVED
↓
CLOSED
```

## Reason

This corresponds to the workflow states defined by the challenge and the requirement that CLOSED must only occur after RESOLVED.

---

# A002 — Additional Transition Restrictions

## Assumption

Transitions should be intentionally controlled rather than allowing arbitrary jumps between statuses.

## Reason

The challenge explicitly requires invalid workflow transitions to be rejected and allows sensible additional transition rules.

Any additional restrictions must remain documented and explainable.

---

# A003 — Overdue Definition

## Assumption

A work item is overdue when:

```text
due_date < current date
AND
status NOT IN [RESOLVED, CLOSED]
```

## Reason

The challenge requires overdue work to be identified using due_date and status without requiring a persisted overdue field.

---

# A004 — Resolution Note

## Assumption

Whitespace-only resolution notes should be treated as empty.

## Reason

The requirement says a non-empty resolution note is required.

Whitespace does not represent meaningful resolution information.

---

# A005 — Comments

## Assumption

A comment must contain meaningful non-whitespace text.

## Reason

Empty comments provide no operational value.

---

# A006 — Activity

## Assumption

Important activity records should capture enough information for a reviewer to understand:

* what changed
* when it changed
* who performed the action
* relevant previous/new values where applicable

## Reason

The detail page requires an operational activity timeline.

---

# A007 — Seed Data

## Assumption

Seed data represents a realistic development environment and is not application logic.

## Reason

The challenge explicitly requests repeatable seed data.

Seed data must never be embedded into frontend components.

---

# A008 — Authentication Scope

## Assumption

Authentication is not required for the core implementation unless needed by the chosen implementation environment.

## Reason

JWT authentication is listed as a stretch goal rather than a core requirement.

Do not allow authentication work to delay mandatory functionality.

---

# A009 — Role-Based Permissions

## Assumption

Role-based permissions are outside the core scope.

## Reason

RBAC is listed as a stretch goal.

The implementation should nevertheless maintain clean boundaries so permissions could be introduced later.

---

# A010 — Flutter Scope

## Assumption

Flutter implements the required mobile workflow without attempting to reproduce every web feature.

Required mobile scope:

* work list
* basic status filter
* refresh
* work-item details
* status transition
* comments

## Reason

The challenge explicitly defines Flutter as a smaller scope.

---

# A011 — Closed Items on Kanban

## Assumption

The primary Kanban board displays:

* OPEN
* IN_PROGRESS
* REVIEW
* RESOLVED

CLOSED is not treated as a normal active workflow column.

## Reason

The challenge explicitly lists these four columns for the board.

Closed items can remain accessible through the investigation/list and detail views.

---

# A012 — API Pagination

## Assumption

The work-item list API uses server-side pagination.

## Reason

The challenge explicitly requires pagination and the dashboard must not require downloading every work item.

---

# A013 — URL Filter State

## Assumption

Search and major investigation filters should be represented in URL query parameters.

## Reason

The challenge says this is preferred where practical because it makes views shareable and revisitable.

---

# A014 — Mobile API Configuration

## Assumption

Flutter API configuration is environment-aware rather than hardcoded into feature code.

## Mobile Networking

It is assumed the mobile client connects via HTTP to the local backend during development.

## Docker Persistence

It is assumed that the SQLite database (`db.sqlite3`) will be maintained via a local volume mount in `docker-compose.yml` to fulfill the persistence requirement.

## Reason

Different runtime environments may expose the backend through different hosts.

---

# A015 — Development Data Reset

## Assumption

The seed mechanism may reset/recreate development data when explicitly invoked, provided this behavior is clearly documented.

## Reason

Repeatable development data is more useful when developers can reliably return to a known state.

---

# Assumption Policy

When encountering an ambiguous requirement:

1. Check the challenge document.
2. Check existing project documentation.
3. Prefer the simplest implementation that satisfies the explicit requirement.
4. Avoid introducing unnecessary complexity.
5. Record the interpretation here.
6. If the assumption materially changes architecture, also record the decision in `DECISIONS.md`.

Never silently invent behavior.
