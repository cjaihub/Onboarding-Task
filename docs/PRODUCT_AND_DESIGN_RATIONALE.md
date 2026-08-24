# Internal Incident & Work Tracker
# Product & Design Rationale

## 1. Executive Summary
This document provides the product and design rationale for the Internal Incident & Work Tracker, built using Next.js (Web), Flutter (Mobile), and Django REST Framework (Backend). The system is a premium, engineering-focused platform for tracking bugs, incidents, feature requests, and operational tasks across multiple software projects. It delivers real-time visibility, domain-enforced workflow rules, and a dark-mode glassmorphic aesthetic designed to optimize high-velocity engineering operations.

## 2. Challenge Interpretation
The challenge requested a development-team system capable of managing various operational tasks with strict workflow states. Although no Figma design was provided, the requirement was to demonstrate senior UI/UX judgment, preferring clean information hierarchy, functional interactions, and professional styling over basic, unstructured lists. We interpreted this as a mandate to build a "Command Center" aesthetic rather than a conventional CRUD form-builder app.

## 3. Product Problem
Engineering teams manage complex, high-stakes work items (e.g., live production incidents, critical bugs, blocking features). A generic tracker often conflates status, priority, and metadata, leading to cognitive overload. The product problem solved here is **structured visibility and controlled execution**: ensuring developers instantly know what is broken, what they own, and exactly where a task resides in its lifecycle.

## 4. Intended Users
The primary users are Software Engineers, Engineering Managers, and Product Managers who require dense, accurate information and rapid workflow transitions. They operate under high cognitive load and require a system that enforces rules (like assignment before resolution) without arbitrary friction.

## 5. Primary User Goals
- **Triage**: Rapidly identify high-priority or overdue incidents.
- **Investigation**: Filter and locate specific work items across projects.
- **Execution**: Move work items through a controlled workflow (Open -> In Progress -> Review -> Resolved -> Closed).
- **Communication**: Track real-time activity and communicate via contextual comments.

## 6. Product Mental Model
The platform is conceptualized not as a spreadsheet, but as a live control room. 
- The **Dashboard** acts as the telemetry screen (answering "What needs attention?").
- The **Investigation View (Work Items)** acts as the database query interface ("What exists and how do I find it?").
- The **Kanban Board** acts as the tactical execution layer ("Where is work in the workflow?").
- The **Command Center (Detail View)** acts as the focal point for a single issue ("What is happening with this specific item?").
- The **Activity Feed** acts as the audit log ("What changed?").

## 7. Information Architecture
The application is logically divided to answer specific operational questions:

- **Dashboard**: "What needs attention immediately?" It surfaces workload, risks, and overarching metrics.
- **Work Items / Investigation**: "What exists and how do I find it?" It provides robust filtering, search, and tabular sorting.
- **Kanban / Workflow**: "Where is work in the workflow?" It visualizes the pipeline of active work and facilitates transitions.
- **Work Item Command Center (Detail Page)**: "What is happening with this specific item?" It consolidates metadata, comments, and the activity audit trail into a single view.
- **Activity**: "What changed?" It provides a global, real-time feed of all system mutations.

## 8. Dashboard Design Rationale
The dashboard is designed for immediate operational awareness. Rather than simply rendering a row of counters, it visualizes:
- **Summary Metrics**: High-level counts of active vs. resolved work.
- **Workload Visibility**: A breakdown of items assigned to the current user vs. unassigned items.
- **Risk Visibility**: A dedicated section for overdue and critical-priority items.
- **Status & Priority Distribution**: Visual charts or categorical breakdowns to understand system health.
- **Activity Feed**: A real-time stream of recent mutations.
This ensures managers and developers can instantly identify bottlenecks or neglected incidents.

## 9. Investigation View Rationale
The Work Items list is optimized for data density and rapid filtering.
- **Search & Filters**: Users can filter by status, priority, category, and project.
- **Useful Columns**: The table prioritizes the Reference Number (e.g., `INC-00012`), Status, Priority, and Assignee. 
- **Pagination & Sorting**: Implemented via server-side pagination to handle scale, preventing frontend memory bloat.

## 10. Work Item Creation Rationale
The creation flow is designed to be intentional and structured.
- **Required Fields**: Title, Project, Category, and Priority are strictly enforced.
- **API-Generated Reference**: The backend automatically mints a unique identifier (e.g., `INC-00045`), providing an immutable reference for team communication.
- **Validation**: Strict boundary checks are performed both on the client and server.

## 11. Category Rationale
Category (Bug, Incident, Feature Request, Operational Task) is a core domain concept, not mere frontend decoration. It dictates the urgency and potential impact of the work item. An Incident, for example, represents live operational degradation, whereas a Feature Request represents planned work. The implementation enforces these distinctions through the backend model choices.

## 12. Assignment Rationale
Assignment represents domain ownership of an existing work item.
- **Existing Developers**: The UI restricts assignment to authenticated, registered users of the platform rather than accepting free-text. This maintains referential integrity in the database.
- **Backend Mutation**: Assignment is a distinct API operation that validates the user's existence and records an Activity log, rather than just silently updating a text field.

## 13. Command Center Rationale
The Work Item Detail view is structured as a "Command Center" rather than a database form.
- It displays the immutable status, priority, and category clearly.
- **Transition**: Explicit action buttons govern status changes, respecting the backend domain rules.
- **Resolution**: Enforces the requirement that a work item must have an assignee and a resolution note before moving to `RESOLVED`.
- **Comments & Activity**: Positioned alongside the metadata to provide immediate context on the item's history.

## 14. Kanban Rationale
The Kanban board translates the strict backend workflow into a tactical drag-and-drop interface.
- **Workflow States**: Columns represent `OPEN`, `IN_PROGRESS`, `REVIEW`, and `RESOLVED`. `CLOSED` is intentionally excluded to keep the board focused on active work.
- **Transition API**: Dragging a card triggers a backend mutation. If the backend rejects the transition (e.g., skipping a required state), the frontend reverts the card position, synchronizing with the authoritative server state.

## 15. Responsive Design Rationale
The web UI utilizes Tailwind CSS to gracefully collapse from a wide, multi-column desktop layout (ideal for side-by-side detail and activity views) to a stacked tablet/mobile view. The mobile app (Flutter) provides a distinct, purpose-built interface optimized for touch interactions and on-the-go triage, rather than awkwardly mirroring the desktop UI.

## 16. Application State Rationale
- **Loading & Empty**: Skeletons and empty states are used to maintain layout stability during asynchronous fetches.
- **Mutation & Success**: Optimistic updates are used where safe, backed by Toast notifications for explicit success or error feedback from the API.

## 17. Accessibility Rationale
Contrast ratios follow WCAG guidelines, particularly critical in the dark-mode theme. Semantic HTML and structured heading hierarchies are employed across the Next.js frontend to ensure screen reader compatibility. Focus states are clearly visible for keyboard navigation.

## 18. Visual Design Principles
- **Typography & Spacing**: Uses clear, modern sans-serif fonts with generous padding to prevent visual clutter.
- **Status & Priority Semantics**: Colors are applied functionally (e.g., Red for Critical/Incidents, Green for Resolved).
- **Dark Mode / Glassmorphism**: A premium aesthetic (`UsalamaTheme`) utilizes deep slate backgrounds with subtle gradients and blur effects, avoiding the generic, flat "AI-dashboard" look.

## 19. Design Trade-offs
- **Complex Filtering vs. Simplicity**: We opted for explicit dropdown filters rather than a complex query-builder language to reduce the learning curve for new engineers.
- **Real-Time vs. Polling**: WebSockets are used for real-time activity updates, trading architectural simplicity for operational immediacy.

## 20. Future Improvements
- **Role-Based Access Control (RBAC)**: Currently, any authenticated user can transition any ticket. Future iterations should restrict certain transitions to Project Managers.
- **SLA Tracking**: Adding automated SLA breach notifications based on the derived overdue state.
