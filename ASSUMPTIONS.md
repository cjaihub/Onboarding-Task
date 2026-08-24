# Engineering Assumptions

While the challenge document was detailed, there were a few areas that required my engineering judgment. I wanted to document these assumptions here so you know exactly how I interpreted the requirements.

---

# A001 — The Core Workflow

## Assumption
I assumed the primary workflow strictly follows:
`OPEN -> IN_PROGRESS -> REVIEW -> RESOLVED -> CLOSED`

## Reason
This perfectly matches the workflow states defined in the challenge. I also interpreted the requirement to mean that `CLOSED` is a terminal state that can only occur *after* `RESOLVED`.

---

# A002 — Strict Transition Control

## Assumption
I assumed that arbitrary jumps between statuses (e.g., jumping straight from `OPEN` to `CLOSED`) should not be allowed.

## Reason
The challenge explicitly required invalid workflow transitions to be rejected. I felt that enforcing a strict, sequential pipeline was the most sensible interpretation of a controlled operational environment.

---

# A003 — Overdue Definition

## Assumption
I defined a work item as "overdue" if:
`due_date < current date` AND `status` is not `RESOLVED` or `CLOSED`.

## Reason
This satisfies the requirement to identify overdue work without relying on a brittle, persisted database flag.

---

# A004 — Meaningful Resolution Notes & Comments

## Assumption
I assumed that whitespace-only resolution notes or comments should be rejected as empty.

## Reason
An empty comment or a spacebar resolution note provides absolutely no operational value to the team. I wanted to enforce data quality.

---

# A005 — Activity Log Depth

## Assumption
I decided that the activity records needed to capture exactly:
* What changed (the specific field)
* The previous and new values
* When it changed
* Who performed the action

## Reason
The command center requires a highly operational, chronological timeline. Without this level of detail, the activity feed wouldn't be useful for auditing incidents.

---

# A006 — Seed Data

## Assumption
I treated the seed data script purely as a development environment utility, completely decoupled from application logic.

## Reason
You explicitly requested repeatable seed data. Keeping it separate ensures that the frontend never relies on hardcoded IDs or mocked data.

---

# A007 — Authentication as a Baseline

## Assumption
While the rubric listed JWT authentication as a "Stretch Goal", I assumed it was critical enough to the architecture to implement natively from the start.

## Reason
Without authentication, the real-time WebSocket architecture and the strict "who did what" Activity Feed would be impossible to secure. I built the JWT infrastructure to prove the platform is production-ready.

---

# A008 — Mobile Scope

## Assumption
I assumed the Flutter app should focus exclusively on the core operational workflow (list, filter, view details, change status, and comment) rather than trying to cram the entire Next.js analytical dashboard into a phone screen.

## Reason
The challenge explicitly defined Flutter with a smaller, field-operations scope.

---

# A009 — Closed Items on the Kanban Board

## Assumption
I intentionally excluded `CLOSED` items from the active Kanban board columns.

## Reason
The challenge only listed four active columns for the board. I felt that flooding an active operational board with archived/closed tickets would ruin the UX. Closed items are still fully accessible via the investigation list view.

---

# A010 — API Pagination & Filtering

## Assumption
I assumed that server-side pagination and URL-based query filtering were mandatory for the Next.js investigation view.

## Reason
In an operational tool, users need to be able to share links to specific filtered views (e.g., `?status=OPEN&tags=Production`). URL state management is the only way to achieve this reliably.
