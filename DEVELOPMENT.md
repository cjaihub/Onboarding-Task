# Development
# Development Protocol

## Purpose

This document defines how development work must be performed on the Internal Incident & Work Tracker.

The implementation agent is Gemini 3.1 operating through Antigravity.

The objective is to produce a complete, coherent, maintainable application rather than maximize the amount of generated code.

---

# 1. Development Philosophy

Work like a senior software engineer working on an existing production codebase.

Prioritize:

1. Correctness
2. Maintainability
3. Clear architecture
4. Backend authority
5. Type safety
6. Error handling
7. Testability
8. User experience
9. Performance
10. Scope discipline

Do not optimize for the number of files or lines of code produced.

A smaller correct implementation is preferable to a larger incomplete implementation.

---

# 2. Required Development Cycle

Every feature must follow this cycle:

```text
READ
  ↓
INSPECT
  ↓
UNDERSTAND
  ↓
PLAN
  ↓
IMPLEMENT
  ↓
RUN
  ↓
VERIFY
  ↓
TEST
  ↓
DOCUMENT
  ↓
COMMIT
```

Do not skip directly from READ to IMPLEMENT.

---

# 3. Before Changing Code

Before implementing a feature:

1. Read the relevant project documentation.
2. Inspect the existing implementation.
3. Identify related files.
4. Inspect existing dependencies.
5. Identify the current data flow.
6. Identify affected API contracts.
7. Determine whether existing functionality can be reused.
8. Identify possible regressions.
9. Create a short implementation plan.

Do not modify unrelated code.

Do not rewrite an entire subsystem when a focused change is sufficient.

---

# 4. Dependency Management

Before installing a dependency:

1. Check whether it is already installed.
2. Check whether existing functionality can solve the requirement.
3. Determine whether the dependency is actually necessary.
4. Check compatibility with the current stack.
5. Install using the appropriate package manager.
6. Update the appropriate dependency manifest.
7. Verify the installation.
8. Run the relevant build/test/type-check command.

Avoid dependency bloat.

Do not install libraries merely because they are popular.

Every dependency should have a clear technical purpose.

---

# 5. Implementation Discipline

Implement features in coherent vertical slices.

For example:

```text
Backend model
    ↓
Backend business logic
    ↓
API
    ↓
API verification
    ↓
Frontend API integration
    ↓
Frontend UI
    ↓
Frontend state/error handling
    ↓
End-to-end verification
```

Do not build large amounts of frontend UI against an imaginary API.

Do not create frontend behavior that the backend does not support.

---

# 6. No Fake Implementations

The application must use real functionality.

Never use:

* mock API responses
* fake repositories
* hardcoded dashboard metrics
* hardcoded work items
* fake comments
* fake activity
* static Kanban cards
* simulated API success
* placeholder business logic
* fake loading completion
* temporary data presented as production functionality

Development seed data is allowed only through the backend seed mechanism.

The web and mobile applications must consume the actual Django REST API.

---

# 7. No Incomplete Implementations

Before declaring a feature complete, search the relevant implementation for:

* TODO
* FIXME
* placeholder
* mock
* fake
* not implemented
* empty event handlers
* dummy return values
* commented-out unfinished code
* temporary bypasses

Do not leave incomplete functionality behind.

If something cannot be completed within the current scope, document it explicitly rather than pretending it is complete.

---

# 8. Backend Authority

Django REST Framework is authoritative for domain rules.

The backend must enforce:

* workflow transitions
* resolution requirements
* closing requirements
* reference generation
* assignment behavior
* activity creation
* validation
* filtering semantics
* dashboard aggregation

Frontend validation is for user experience.

It is not a security or business-rule boundary.

---

# 9. API-First Integration

When implementing a feature that crosses frontend/backend boundaries:

1. Confirm the API contract.
2. Implement/verify backend behavior.
3. Test the endpoint directly.
4. Implement the frontend integration.
5. Test success and failure paths.

Do not guess API response shapes.

Do not duplicate API logic throughout UI components.

---

# 10. Debugging Protocol

When something fails, do not make random changes.

Use this sequence:

```text
REPRODUCE
    ↓
READ ERROR
    ↓
IDENTIFY FAILING LAYER
    ↓
INSPECT LOGS
    ↓
INSPECT REQUEST/RESPONSE
    ↓
FORM HYPOTHESIS
    ↓
MAKE MINIMAL FIX
    ↓
RE-RUN FAILURE
    ↓
RUN REGRESSION TESTS
```

The error message and runtime evidence should drive the fix.

Do not change multiple unrelated things simply to see whether the problem disappears.

---

# 11. TypeScript Discipline

Use explicit types.

Avoid:

```text
any
```

Avoid:

```text
@ts-ignore
```

Avoid type assertions that hide real problems.

API response types should correspond to the actual backend contract.

If the API changes, update the affected client types and integration deliberately.

---

# 12. React / Next.js Discipline

Keep responsibilities separated.

Route-level files should compose features.

Reusable UI should live in reusable components.

Feature-specific behavior should live in feature modules.

Server state should be handled through the chosen server-state mechanism.

Do not scatter raw API calls throughout presentation components.

Do not create giant components when smaller meaningful components improve maintainability.

---

# 13. Backend Architecture Discipline

Keep responsibilities separated between:

* models
* serializers
* views
* filters
* domain/service logic
* API routing

Do not put substantial business logic into random views.

Do not put business rules into frontend components.

Do not create unnecessary abstraction layers where they add no value.

---

# 14. Flutter Discipline

Do not put the entire application in `main.dart`.

Separate:

* configuration
* networking
* data models
* repositories
* state
* screens
* reusable widgets

Flutter must consume the same backend API used by the web application.

Do not duplicate Django business rules inside Flutter.

---

# 15. Verification Before Completion

A feature is not complete because code was generated.

A feature is complete when the relevant behavior has been verified.

Depending on the change, verification may include:

* unit tests
* API tests
* integration tests
* type checking
* linting
* production build
* Docker build
* manual browser verification
* Flutter analysis
* application runtime verification

Use the smallest verification set that provides meaningful confidence, then perform broader regression checks for important changes.

---

# 16. Documentation

When a meaningful technical decision is made:

* record it in `DECISIONS.md`

When an interpretation is made because the challenge leaves something unspecified:

* record it in `ASSUMPTIONS.md`

Do not duplicate long explanations across files.

---

# 17. Git Workflow

Commit incrementally.

Prefer focused commits such as:

```text
feat: add work item workflow validation
feat: add dashboard aggregation
feat: implement kanban transitions
fix: reconcile rejected workflow transition
```

Avoid giant commits containing unrelated features.

Before committing:

1. inspect changed files
2. review the diff
3. run relevant verification
4. ensure no secrets are included
5. ensure no generated junk is included

---

# 18. Scope Control

The mandatory challenge requirements have priority over stretch features.

Do not implement stretch features while mandatory functionality remains broken.

Priority order:

```text
Core backend
    ↓
Core web application
    ↓
Workflow correctness
    ↓
Error/recovery states
    ↓
Flutter core flow
    ↓
Testing/QA
    ↓
Documentation
    ↓
Polish
    ↓
Stretch features
```

---

# 19. Completion Report

After completing a meaningful task, report:

### Changed

What was implemented.

### Verified

What commands/tests/manual checks were executed.

### Result

What passed.

### Remaining

Any known issue or limitation.

Never state that something was verified if it was not actually executed.

---

# 20. Definition of Done

A feature is considered done only when:

* implementation is complete
* related tests pass
* affected application builds
* runtime behavior is verified where appropriate
* error states are handled
* documentation is updated if required
* no known incomplete implementation remains

The objective is a reliable application, not merely generated source code.
