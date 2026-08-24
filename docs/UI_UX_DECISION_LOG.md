# UI/UX Decision Log

## Decision 01: Dashboard Hierarchy

### Problem
Users need to immediately understand the state of their engineering operations without hunting for data.

### Context
Engineering managers and developers log in to find what is broken, what is due, and what they need to work on next.

### Options Considered
1. A simple list of all tickets sorted by date.
2. A generic grid of cards.
3. A segmented layout prioritizing metrics, workload, risk, and activity.

### Chosen Approach
A segmented "telemetry" layout (Option 3).

### Why This Approach
It answers the core operational questions hierarchically: "What is the overall health?" (Metrics), "What do I own?" (Workload), "What is on fire?" (Risk), and "What just happened?" (Activity).

### Trade-offs
Takes up more vertical space and requires complex aggregation queries on the backend compared to a simple list.

### Result
The dashboard provides instant operational awareness and acts as a true command center.

---

## Decision 02: Work-Item List Filtering

### Problem
Finding specific tasks in a growing database of bugs, incidents, and requests becomes impossible without strong filtering.

### Context
Users need to locate items by project, status, priority, or category.

### Options Considered
1. Advanced search syntax (e.g., `status:open AND priority:critical`).
2. Explicit dropdown filters for key fields.

### Chosen Approach
Explicit dropdown filters (Option 2).

### Why This Approach
It reduces the learning curve and cognitive load. Dropdowns instantly show users what filtering dimensions are available without requiring them to memorize query syntax.

### Trade-offs
Less flexible for highly complex queries involving multiple exclusions or OR conditions.

### Result
Users can rapidly slice the dataset to find their target items.

---

## Decision 03: Work Item Assignment

### Problem
Assigning a work item needs to be accurate and integrated with the domain model.

### Context
Users must assign tasks to team members who are responsible for resolution.

### Options Considered
1. A free-text input field.
2. A searchable dropdown linked to the backend user database.

### Chosen Approach
Searchable dropdown linked to the `User` model (Option 2).

### Why This Approach
Assignment represents ownership. Using a free-text field breaks referential integrity and makes it impossible to query "My Work." The dropdown ensures assignment is a strict domain action.

### Trade-offs
Requires an additional API fetch to load the list of eligible users.

### Result
Consistent, queryable assignment that correctly attributes ownership and triggers valid activity logs.

---

## Decision 04: Command Center (Detail View) Layout

### Problem
The detail view must facilitate investigation, discussion, and workflow transitions without feeling like a sprawling, disconnected form.

### Context
When viewing an incident, a developer needs to see metadata, history, and comments simultaneously.

### Options Considered
1. A single long scrolling page.
2. A tabbed interface hiding comments behind a click.
3. A side-by-side layout (on desktop) separating immutable metadata from the chronological discussion/activity feed.

### Chosen Approach
Side-by-side layout (Option 3).

### Why This Approach
It maximizes screen real estate on desktop, allowing a user to read the description and transition the status while simultaneously monitoring incoming comments and activity logs.

### Trade-offs
Requires careful responsive design to collapse gracefully into a single column on mobile/tablet.

### Result
A highly functional workspace that minimizes context switching.

---

## Decision 05: Kanban Transition Mechanics

### Problem
Updating workflow status via Kanban must respect backend domain rules.

### Context
Dragging a card from `OPEN` to `RESOLVED` might be visually possible but domain-invalid if the item lacks an assignee.

### Options Considered
1. Purely optimistic UI updates that fail silently.
2. Strict pessimistic updates that freeze the UI until the server responds.
3. Optimistic visual updates with automatic revert on API rejection.

### Chosen Approach
Optimistic updates with automatic revert (Option 3).

### Why This Approach
Provides the fluidity expected from modern drag-and-drop interfaces (`dnd-kit`), but respects the backend as the ultimate authority. If a transition is invalid, the card snaps back, and a Toast error explains why.

### Trade-offs
Slightly more complex client-state management to handle the revert animation.

### Result
Fast, fluid interactions that never drift out of sync with the true database state.

---

## Decision 06: Dark Mode / Glassmorphic Aesthetic

### Problem
The challenge required a demonstration of UI/UX capability without relying on generic, flat "AI-dashboard" templates.

### Context
The application needs to feel premium, modern, and suitable for high-end engineering teams.

### Options Considered
1. Standard light mode with flat UI components.
2. A highly customized dark mode with glassmorphic depth.

### Chosen Approach
Custom dark mode with glassmorphism (Option 2).

### Why This Approach
Dark mode reduces eye strain for developers working long hours. Glassmorphism (subtle blurs and translucent panels) establishes a clear visual hierarchy and a premium feel that distinguishes the product from basic CRUD templates.

### Trade-offs
Requires rigorous attention to contrast ratios to maintain WCAG accessibility standards.

### Result
A visually striking application that looks intentional and professional.
