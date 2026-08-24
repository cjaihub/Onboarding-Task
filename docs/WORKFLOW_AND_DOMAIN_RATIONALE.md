# Workflow & Domain Rationale

## Domain Model

The application revolves around a central entity (`WorkItem`) and its relationships.

### Entities & Relationships
- **User**: The authenticated actor in the system.
- **Project**: A high-level container for work (e.g., "Frontend", "Backend"). Projects have members (Users).
- **WorkItem**: A specific task, bug, incident, or feature request. It belongs to a Project.
- **Category**: A strict domain classification on the WorkItem (Bug, Incident, Feature Request, Operational Task).
- **Priority**: A strict domain classification indicating urgency (Low, Medium, High, Critical).
- **Status**: The current state of the WorkItem in the workflow.
- **Comment**: A discussion node attached to a WorkItem, authored by a User.
- **Activity**: An immutable audit log entry recording mutations (e.g., status changes, reassignments, comments). Attached to a WorkItem or Project.

---

## Workflow Lifecycle

The `WorkItem` lifecycle is strictly controlled by the backend Django service (`core/services.py`).

### Standard Workflow
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

### Transition Matrix
- `OPEN` -> `IN_PROGRESS`
- `IN_PROGRESS` -> `OPEN`, `REVIEW`
- `REVIEW` -> `IN_PROGRESS`, `RESOLVED`
- `RESOLVED` -> `IN_PROGRESS`, `CLOSED`
- `CLOSED` -> `OPEN`

### Operation Deep Dives

#### 1. Create Work Item
- **User Action**: Fills out the creation form (Title, Category, Priority, Project).
- **Frontend**: Validates required fields, sends POST request to `/api/work-items/`.
- **Backend API**: Validates data. Automatically mints a unique `reference_number` (e.g., `INC-00045`). Sets status to `OPEN`. 
- **Activity Log**: Records a `CREATED` activity.

#### 2. Assignment
- **User Action**: Selects a developer from the dropdown.
- **Frontend**: Sends PATCH request to `/api/work-items/{id}/` with `assigned_to` ID.
- **Backend API**: Verifies the User ID exists. Updates the `assigned_to` foreign key.
- **Activity Log**: Records an `UPDATED` activity, tracking the `old_value` and `new_value`.

#### 3. Status Transition
- **User Action**: Drags a card on the Kanban board or clicks a transition button in the Command Center.
- **Frontend**: Optimistically updates the UI. Sends PATCH to `/api/work-items/{id}/transition/` (or updates status directly via PATCH).
- **Backend API**: Runs `transition_work_item()`. Validates that the transition adheres to the Matrix.
- **Activity Log**: Records an `UPDATED` activity for the `status` field.
- **UI Sync**: If rejected, the frontend reverts the optimistic update and displays an error toast.

#### 4. Resolution (Special Case)
- **User Action**: Attempts to move an item to `RESOLVED`.
- **Backend API**: Validates that `assigned_to` is NOT NULL and `resolution_note` is NOT EMPTY.
- **Rejection**: If these constraints fail, a `400 Bad Request` is returned, and the UI reverts the status.

#### 5. Comments
- **User Action**: Types and submits a comment on the detail view.
- **Frontend**: Sends POST to `/api/comments/`.
- **Backend API**: Saves the comment attached to the WorkItem.
- **Activity Log**: Automatically generates a `COMMENTED` activity log.

#### 6. Real-Time Activity
- **Backend API**: When any `Activity` is created, Django Signals broadcast the new log to the Channels `board_updates` group.
- **Frontend / Mobile**: Connected via WebSockets (`ws/board/?token=...`), the clients receive the broadcast and instantly prepend the new activity to the UI feed without polling.
