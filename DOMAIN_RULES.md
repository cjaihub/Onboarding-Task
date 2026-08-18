# Domain Rules
# Domain Rules

## Work Item States

Valid statuses:

* OPEN
* IN_PROGRESS
* REVIEW
* RESOLVED
* CLOSED

## Required Workflow

The default workflow is:

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

Additional sensible transitions may be supported if they do not violate the explicit challenge requirements.

## Mandatory Rules

### Rule 1 — Reference Number

Every work item receives a backend-generated reference number.

Format:

```text
INC-00001
INC-00002
INC-00003
```

The frontend must never generate reference numbers.

### Rule 2 — Resolution

A work item cannot transition to RESOLVED unless:

* an assignee exists
* resolution_note is non-empty

This validation must be enforced by the backend.

### Rule 3 — Closing

A work item cannot transition directly from OPEN to CLOSED.

CLOSED requires the item to have reached RESOLVED.

### Rule 4 — Overdue

An item is overdue when:

```text
due_date < current date
AND
status NOT IN [RESOLVED, CLOSED]
```

Overdue should be derived rather than persisted unless there is a documented reason to persist it.

### Rule 5 — Activity

Create activity entries for important changes.

At minimum:

* work item creation
* assignment changes
* priority changes
* status changes
* comments

### Rule 6 — Backend Authority

The backend must reject invalid workflow transitions regardless of what the frontend requests.

### Rule 7 — Partial Updates

PATCH requests must correctly support partial updates.

Validation must not directly index optional fields without considering:

* whether the field exists in the incoming payload
* the current value on the model instance

For example, validation must safely handle:

```text
PATCH { "status": "RESOLVED" }
```

when `resolution_note` is already stored.

It must also safely handle:

```text
PATCH { "resolution_note": "..." }
```

without requiring unrelated fields.

### Rule 8 — Activity Ordering

Activity should be returned chronologically in a predictable order.

The UI should display the timeline in an intentional chronological direction.

### Rule 9 — Comments

Every comment belongs to exactly one work item and records:

* author
* message
* created_at

### Rule 10 — Dashboard

Dashboard totals must be calculated by the backend.

The frontend must not download every work item simply to calculate management totals.
