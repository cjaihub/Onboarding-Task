# Usalama Mobile Implementation Plan

## Current State
- The Usalama Web application (Next.js) is connected to the Django REST Framework backend with a unified SQLite database.
- The Flutter codebase (`/mobile`) has been restructured to support robust repositories, providers, and modular screens.
- Basic routing and `WorkItems` logic is operational but requires exhaustive Chrome Mobile responsive testing to guarantee visual and functional parity.

## Required Assignment Functionality
- Work Items list (with pagination/filtering support)
- Work Item detail screen
- Status updates (transition validation)
- Comments (fetching & submitting)
- Activity stream parsing
- Pull-to-refresh
- Empty, Loading, and Error states
- Real backend usage (No mocks, no duplicate DB)

## Mobile Architecture
- **State Management:** `provider`
- **Network Layer:** `http` package wrapped in `api_service.dart` with token injection and error interception.
- **Data Layer:** `work_item_repository.dart`
- **UI Layer:** Feature-driven folders (`features/work_items/screens`, `features/work_items/widgets`) utilizing unified `theme` constants.

## Phases
1. **M0 - M9 (Core Realignment):** Ensure authentication, models, and core API interactions function flawlessly against the local Django backend.
2. **M10 (Chrome Mobile QA):** Boot the Flutter Web environment via Chrome DevTools and test breakpoints (320px -> 768px) to fix layout overflows and touch-target sizing.
3. **M11 - M18 (Advanced Screens):** Add Dashboard statistics, filtering, search, and navigation bars once core is verified in Chrome.
4. **M19 - M27 (Cross-platform and Final QA):** Verify bidirectional persistence between Next.js and Flutter instances. Compile final documentation and submit tests.

## Testing Strategy
- **Phase 1 (Visual/Layout):** Use `flutter run -d chrome` with DevTools Device Emulation to validate CSS-like constraints (Flex overflows, unbounded lists).
- **Phase 2 (Integration):** Verify `POST` and `GET` state mutations sync instantly with the Web Client without server restarts.
- **Phase 3 (Unit/Lint):** Execute `flutter analyze` and `flutter test`.

## Known Constraints
- The backend relies on SQLite and runs locally (`127.0.0.1:8000`). Flutter web requests must route to `127.0.0.1` and handle CORS correctly if needed.
- Real-time WebSockets are not explicitly required by the rubric; optimistic UI updates followed by refresh triggers will be used to maintain state synchronization.
