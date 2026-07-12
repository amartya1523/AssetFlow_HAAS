# AssetFlow - Detailed Development Task Breakdown

This file converts the AssetFlow problem statement and provided wireframes into a build-ready execution plan with 20 ordered tasks, clear acceptance criteria, and one recommended Git commit message per task.

The sequencing is intentional:
- first foundation and schema
- then backend workflows
- then frontend screens on top of those workflows
- then cross-cutting reporting, notifications, and final polish

This version is intentionally biased toward **architecture-heavy evaluation**:
- clear database modeling
- clean backend layering
- transactional business workflows
- auditable activity tracking
- scalable API structure
- consistent UI system on the frontend

## Product Scope Covered

This breakdown covers all visible and implied modules from the problem statement and wireframes:
- Authentication
- Dashboard
- Organization Setup
- Asset Registration and Directory
- Allocation and Transfer
- Resource Booking
- Maintenance
- Audit
- Reports and Analytics
- Notifications and Activity Feed

## Wireframe Coverage

The task file is based on both:
- the written AssetFlow problem statement
- the 10 wireframes/screens you shared for Login, Dashboard, Organization Setup, Assets, Allocation & Transfer, Resource Booking, Maintenance, Audit, Reports, and Notifications

Where the wireframes gave stronger product direction than the text, that detail has been treated as the source of truth. Examples:
- exact sidebar structure
- transfer request reason field
- expected location in audit
- unified notifications screen
- dashboard quick actions and recent activity layout

## Delivery Conventions

- One branch per task: `task-01-project-setup`, `task-02-prisma-schema`, etc.
- One focused PR per task.
- Use Conventional Commits.
- Backend base route: `/api/v1`
- Protected routes use `Authorization: Bearer <token>`
- Standard success shape: `{ "success": true, "data": ... }`
- Standard error shape: `{ "success": false, "message": "...", "errors": [...] }`

## AI Agent Sync Rules

This task file is meant to be safe for **different AI agents or developers to pick up individual tasks without breaking overall sync**.

Each task should be executed with these rules:
- do not rename core entities, enums, routes, or modules defined in earlier tasks
- do not duplicate business logic that belongs to an earlier shared service
- consume existing APIs and shared utilities instead of rebuilding parallel versions
- preserve the response shapes, auth model, and RBAC rules already established
- if a task depends on earlier data models or route contracts, follow those contracts exactly
- if a later task needs cross-module events, extend the shared service instead of creating local hacks

## Task Dependency Contract

Every task in this file assumes the previous tasks are the source of truth.

- Tasks 1-3 define structure and backend conventions
- Tasks 4-7 define auth, RBAC, and master data contracts
- Tasks 9, 11, 13, 15, 17 define core business workflows
- Tasks 10, 12, 14, 16, 18, 20 must consume the backend contracts created earlier
- Task 19 is the cross-module sync task that connects notifications, logs, KPIs, and recent activity

If an AI agent starts from a middle task, it must first verify:
- what routes already exist
- what enums and schema fields already exist
- what shared services already exist
- what UI shell and design tokens already exist
- what earlier acceptance criteria must remain true

## Per-Task Handoff Expectation

For every task completion, the implementing agent should leave the project in a state where the next agent can continue without guessing.

Minimum handoff standard per task:
- code follows the module and naming conventions from earlier tasks
- any new route, service, schema field, or shared component is discoverable in the expected folder
- README or task notes are updated if setup or contracts changed
- no hidden hardcoded frontend data when the source is supposed to come from backend master data
- no breaking changes to existing contracts without updating dependent tasks

## Recommended Architecture

To score well on architecture, the build should follow a **modular monolith** approach instead of a flat Express app.

**Backend layers**
- `routes/`: HTTP routing only
- `controllers/`: request parsing and response formatting
- `services/`: business rules and workflow orchestration
- `repositories/` or Prisma-access services: database queries only
- `middleware/`: auth, RBAC, validation, error handling
- `utils/`: shared helpers

**Module boundaries**
- `auth`
- `organization`
- `assets`
- `allocation`
- `booking`
- `maintenance`
- `audit`
- `notifications`
- `dashboard`
- `reports`

**Architecture principles**
- keep controllers thin
- keep business logic in services
- isolate Prisma calls from UI-driven code
- use transactions for asset-state-changing workflows
- avoid direct status mutation from random endpoints
- centralize notifications and activity logging
- use DTO-style response shaping where needed

## Database Design Standards

To keep the database architecture strong and evaluator-friendly:
- use PostgreSQL as primary relational database
- normalize master data like departments, categories, users, and assets
- use enums for lifecycle states to avoid inconsistent strings
- add foreign keys for every relationship
- add unique constraints for `email`, `assetTag`, and other natural identifiers
- add indexes for frequent filters such as `assetTag`, `status`, `departmentId`, `categoryId`, `startTime`, `endTime`, and `createdAt`
- use audit tables like `ActivityLog` and user-facing `Notification` separately
- capture history through dedicated entities, not overwritten columns
- prefer soft status changes over destructive deletes for business entities
- keep migrations clean and incremental

## Recommended Tech Stack

**Backend**
- Node.js
- Express.js
- Prisma ORM
- PostgreSQL
- JWT authentication
- bcryptjs
- express-validator or Zod
- multer for local upload handling

**Frontend**
- React with Vite
- React Router
- Axios
- Zustand or Context API
- Framer Motion
- Recharts
- CSS Modules or structured `styles/` architecture

**Why this stack fits the marks criteria**
- PostgreSQL + Prisma gives a strong relational data model and clean migration story
- Express modular backend is easy to explain in viva/demo
- React + Vite keeps frontend fast while still allowing high-fidelity UI
- Framer Motion and Recharts help the product look polished without overcomplicating the stack

## High-Fidelity Frontend Standards

Every frontend task below should be treated as production-grade UI work, not low-fi CRUD screens.

- Visual direction: clean enterprise product with premium admin-dashboard feel, soft surfaces, purposeful spacing, and clear hierarchy.
- Typography: use a non-default pairing such as `Manrope` or `Sora` for headings and `Inter`/`DM Sans` for body copy.
- Color system: define reusable tokens for background, card, border, text, success, warning, danger, info, and active-nav states.
- Motion: Framer Motion should be used intentionally for page transitions, tab indicators, drawers, toasts, KPI counters, and status changes.
- Components: use consistent cards, pills, empty states, skeletons, modal shells, filter bars, tables, and form controls across all screens.
- Responsiveness: desktop-first but clean on tablet and mobile widths; sidebar should collapse gracefully.
- States: every page must include loading, empty, success, inline validation, and API-error states.
- Tables and analytics should feel polished: sticky headers where useful, clear row hover, readable density, and visual grouping.
- Charts, alerts, banners, and badges must be visually consistent across Dashboard, Reports, Audit, and Notifications.

## Task 1 - Project Scaffolding and Monorepo Setup

**Objective:** Create the initial project structure for backend and frontend so later tasks plug in cleanly.

**What to do**
1. Create `backend/` and `frontend/` directories.
2. Backend: initialize Node project and install `express`, `cors`, `dotenv`, `nodemon`, `prisma`, `@prisma/client`, `bcryptjs`, `jsonwebtoken`, `express-validator`, `multer`.
3. Frontend: initialize Vite React app and install `react-router-dom`, `axios`, `zustand`, `framer-motion`, `recharts`.
4. Create backend `src/server.js` with Express app, JSON parsing, CORS, and `GET /api/v1/health`.
5. Add backend `.env.example` with `DATABASE_URL`, `JWT_SECRET`, `PORT`.
6. Add root `README.md` with local run steps.
7. Add `.gitignore` for `node_modules`, `.env`, `dist`, `build`, uploads, coverage.
8. Create architecture-first backend structure such as:
   - `src/modules/auth`
   - `src/modules/organization`
   - `src/modules/assets`
   - `src/modules/allocation`
   - `src/modules/booking`
   - `src/modules/maintenance`
   - `src/modules/audit`
   - `src/modules/notifications`
   - `src/modules/dashboard`
   Each module can contain `controller`, `service`, `route`, and `validation` files.

**Acceptance criteria**
- Backend starts and `/api/v1/health` returns 200.
- Frontend starts and renders a placeholder route.
- Folder structure is ready for all later modules.
- Project structure itself reflects clean architecture, not a single crowded `controllers/` folder.

**Git commit message**
```txt
chore(setup): scaffold backend and frontend project structure
```

---

## Task 2 - Database Schema Design with Prisma

**Objective:** Model the full AssetFlow domain before writing business logic.

**Core models**
- `User`
- `Department`
- `AssetCategory`
- `Asset`
- `Allocation`
- `Transfer`
- `Booking`
- `MaintenanceRequest`
- `AuditCycle`
- `AuditCycleAuditor`
- `AuditItem`
- `Notification`
- `ActivityLog`

**Important schema rules**
- `User.role`: `EMPLOYEE`, `DEPARTMENT_HEAD`, `ASSET_MANAGER`, `ADMIN`
- `Asset.status`: `AVAILABLE`, `ALLOCATED`, `RESERVED`, `UNDER_MAINTENANCE`, `LOST`, `RETIRED`, `DISPOSED`
- `Transfer.reason` is required text
- `AuditItem.expectedLocation` stores a snapshot at cycle-creation time
- `Notification.category`: `ALERT`, `APPROVAL`, `BOOKING`, `GENERAL`
- Asset tag must be unique and generated server-side
- Add Prisma indexes for high-traffic fields and join/filter fields
- Add `createdAt` and `updatedAt` where operationally useful
- Prefer nullable foreign keys only where business flow genuinely requires them

**Acceptance criteria**
- `prisma migrate dev` runs successfully.
- All relationships are correctly linked.
- All status enums needed by the product are present.
- Schema is explainable as a normalized relational design in review/demo.

**Git commit message**
```txt
feat(db): define complete Prisma schema for all AssetFlow entities
```

---

## Task 3 - Express Architecture and Global Middleware

**Objective:** Build reusable backend plumbing for all routes.

**What to do**
1. Add centralized error handler.
2. Add `asyncHandler` wrapper.
3. Add validation middleware.
4. Add Prisma singleton utility.
5. Add API response helpers.
6. Wire middleware order in `server.js`.
7. Add 404 fallback.
8. Establish a service-layer pattern so complex workflows in later tasks do not live inside controllers.
9. Add request logging and environment-aware config management.

**Acceptance criteria**
- Route errors return the standard error shape.
- Controllers do not repeat boilerplate try/catch patterns.
- Business logic location is consistent and reusable across modules.

**Git commit message**
```txt
feat(backend): add core middleware, error handling, and response utils
```

---

## Task 4 - Authentication APIs

**Objective:** Implement secure auth with non-self-elevating signup flow.

**Endpoints**
- `POST /api/v1/auth/signup`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/forgot-password`
- `POST /api/v1/auth/reset-password`
- `GET /api/v1/auth/me`

**Rules**
- Signup always creates `EMPLOYEE`
- Passwords hashed with bcrypt
- JWT payload includes `userId` and `role`
- `forgot-password` may use a console stub for email

**Acceptance criteria**
- Client cannot assign itself admin or manager roles.
- Invalid login returns 401.
- `GET /auth/me` validates session correctly.

**Git commit message**
```txt
feat(auth): implement signup, login, session validation and password reset
```

---

## Task 5 - Frontend Auth Screens and Persistent App Shell

**Objective:** Build the login experience and the reusable authenticated layout.

**Screens**
- Login
- Signup
- Forgot Password
- Reset Password

**Layout requirements**
- Match Screen 1 copy and layout closely
- Circular `AF` identity mark
- Inline animated error states
- Auth persistence via local storage plus `/auth/me` revalidation

**App shell requirements**
- Persistent sidebar with these 9 items in exact order:
  - Dashboard
  - Organization Setup
  - Assets
  - Allocation & Transfer
  - Resource Booking
  - Maintenance
  - Audit
  - Reports
  - Notifications
- Active item highlight should animate with Framer Motion
- Role-based visibility should already be wired
- Top bar area should be reserved for page title and notification shortcut

**High-fi notes**
- Use strong card styling, polished spacing, refined form controls, and smooth route transitions.
- Avoid generic default Vite look.

**Acceptance criteria**
- Signup and login work end-to-end.
- Refresh keeps the user signed in.
- Authenticated placeholder page renders inside the App Shell.

**Git commit message**
```txt
feat(frontend): build login, signup, password reset screens and persistent app shell with sidebar navigation
```

---

## Task 6 - Role-Based Access Control

**Objective:** Protect backend actions by role before feature APIs expand.

**What to do**
1. Add `protect` middleware for JWT auth.
2. Add `authorize(...roles)` middleware.
3. Add permissions matrix utility.
4. Add department scoping helper for Department Heads.

**Acceptance criteria**
- Unauthorized roles receive 403.
- Permissions map covers every action from all product modules.

**Git commit message**
```txt
feat(auth): add role-based access control middleware and permissions matrix
```

---

## Task 7 - Organization Setup APIs

**Objective:** Build master-data APIs for departments, categories, and employees.

**Endpoints**
- Departments: `GET/POST/PUT/DELETE /api/v1/departments`
- Categories: `GET/POST/PUT/DELETE /api/v1/categories`
- Employees: `GET /api/v1/employees`
- Role update: `PUT /api/v1/employees/:id/role`

**Important rules**
- Only Admin can access these endpoints
- Department list becomes the single source of truth for later frontend pickers
- Role update endpoint is the only place where user roles can change
- Activity log entries should be created for department and role changes

**Acceptance criteria**
- Non-admin users are blocked.
- Department, category, and employee data is usable by later modules.

**Git commit message**
```txt
feat(org): implement department, category, and employee directory APIs
```

---

## Task 8 - Organization Setup Frontend

**Objective:** Build Screen 3 with admin-only management tabs.

**UI requirements**
- Three tabs: `Departments`, `Categories`, `Employee`
- `+ Add` button changes behavior based on active tab
- Department table columns: `Department`, `Head`, `Parent Dept`, `Status`
- Inline role update experience for employees
- Animated tab indicator using Framer Motion

**High-fi notes**
- Use polished management-table layouts, rounded status pills, and smooth create/edit modals.
- Make admin actions feel premium and responsive, not purely functional.

**Acceptance criteria**
- All three tabs work with live backend data.
- Employee promotion updates UI immediately.

**Git commit message**
```txt
feat(frontend): build organization setup screen with department, category, and employee tabs
```

---

## Task 9 - Asset Registration and Directory APIs

**Objective:** Build core asset CRUD, search, filtering, and history APIs.

**Endpoints**
- `POST /api/v1/assets`
- `GET /api/v1/assets`
- `GET /api/v1/assets/:id`
- `PUT /api/v1/assets/:id`
- `GET /api/v1/assets/:id/history`

**Rules**
- Asset tag auto-generated as `AF-XXXX`
- Tag generation must be transaction-safe
- Search should match tag, serial number, and name
- Direct asset status edits should be blocked here because lifecycle modules control status

**Acceptance criteria**
- Sequential tag generation works reliably.
- Filters and search return expected results.

**Git commit message**
```txt
feat(assets): implement asset registration, search/filter, and history APIs
```

---

## Task 10 - Asset Registration and Directory Frontend

**Objective:** Build Screen 4.

**UI requirements**
- Search input with placeholder: `Search by tag, serial, or QR code`
- Filter controls for `Category`, `Status`, `Department`
- Top-right `+ Register Asset` button
- Table columns: `Tag`, `Name`, `Category`, `Status`, `Location`
- Create and edit modal with photo preview and dynamic category fields
- Asset detail page with merged history timeline

**High-fi notes**
- This screen should feel like a strong operations dashboard: clean filter rail, elegant table density, expressive badges, and refined detail panel.
- Add skeleton loaders and polished empty states.

**Acceptance criteria**
- Search and combined filters update results correctly.
- Asset detail shows sorted lifecycle history.

**Git commit message**
```txt
feat(frontend): build asset registration, directory, and detail screens
```

---

## Task 11 - Allocation and Transfer APIs

**Objective:** Implement the most critical workflow: single active allocation plus transfer handling.

**Endpoints**
- `POST /api/v1/allocations`
- `POST /api/v1/transfers`
- `PUT /api/v1/transfers/:id/approve`
- `PUT /api/v1/transfers/:id/reject`
- `PUT /api/v1/allocations/:id/return`

**Business rules**
- Do not allow double allocation
- On conflict, return `409` with current holder information
- Transfer requests only allowed for currently allocated assets
- Approval must close old allocation and create new allocation in one transaction
- Overdue state should be derived or reported consistently

**Acceptance criteria**
- A second active allocation can never be created for the same asset.
- Transfer approval preserves history and keeps asset state in sync.

**Git commit message**
```txt
feat(allocation): implement allocation, conflict detection, and transfer workflow
```

---

## Task 12 - Allocation and Transfer Frontend

**Objective:** Build Screen 5 and make the conflict UX demo-ready.

**UI requirements**
- Asset picker for allocation flow
- On `409`, show inline red conflict banner
- Banner copy pattern:
  - `Already allocated to [Name] ([Department]). Direct re-allocation is blocked - submit a transfer request below.`
- Inline transfer request block with:
  - `From`
  - `To`
  - `Reason`
- Allocation history panel below the form
- Transfer approval panel for Asset Manager and Department Head
- Return flow with condition notes

**High-fi notes**
- The conflict reveal should animate in smoothly and feel intentional.
- History and approval UI should be clear enough for demo storytelling.

**Acceptance criteria**
- Full allocate -> conflict -> transfer request -> approve -> return flow works in UI.

**Git commit message**
```txt
feat(frontend): build allocation, conflict handling, and transfer approval UI
```

---

## Task 13 - Resource Booking APIs

**Objective:** Build time-slot booking with overlap protection.

**Endpoints**
- `POST /api/v1/bookings`
- `GET /api/v1/bookings?assetId=...`
- `PUT /api/v1/bookings/:id/cancel`
- `PUT /api/v1/bookings/:id/reschedule`

**Rules**
- Only bookable assets can be scheduled
- Overlap logic: `newStart < existingEnd && newEnd > existingStart`
- A booking starting exactly when another ends is allowed
- Status can be derived on read

**Acceptance criteria**
- The Room B2 example from the problem statement passes exactly:
  - `9:00-10:00` booked
  - `9:30-10:30` rejected
  - `10:00-11:00` accepted

**Git commit message**
```txt
feat(booking): implement resource booking with time-slot overlap validation
```

---

## Task 14 - Resource Booking Frontend

**Objective:** Build Screen 6 with a custom timeline-style booking interface.

**UI requirements**
- Resource dropdown at top
- Vertical hourly grid
- Existing bookings render as solid blocks
- Overlapping attempted booking renders as dashed conflict overlay before submit
- `Book a slot` button below grid
- Cancel and reschedule interactions with modal confirmation

**High-fi notes**
- Do not use a generic-looking calendar if it breaks the wireframe feel.
- The booking grid should feel crisp, spatial, and easy to understand at a glance.

**Acceptance criteria**
- The Room B2 conflict scenario is clearly reproducible in the UI.
- UI blocks bad slots before API submission where possible.

**Git commit message**
```txt
feat(frontend): build resource booking screen with calendar and overlap UX
```

---

## Task 15 - Maintenance Management APIs

**Objective:** Implement approval-gated maintenance workflow tied to asset status.

**Endpoints**
- `POST /api/v1/maintenance`
- `PUT /api/v1/maintenance/:id/approve`
- `PUT /api/v1/maintenance/:id/reject`
- `PUT /api/v1/maintenance/:id/assign-technician`
- `PUT /api/v1/maintenance/:id/start`
- `PUT /api/v1/maintenance/:id/resolve`

**Rules**
- Request creation does not change asset status
- Approval changes asset to `UNDER_MAINTENANCE`
- Resolve changes asset back to `AVAILABLE`
- Invalid transitions should be blocked

**Acceptance criteria**
- Status changes occur only at valid transition points.
- Invalid transitions return 400.

**Git commit message**
```txt
feat(maintenance): implement maintenance request workflow with status-gated transitions
```

---

## Task 16 - Maintenance Frontend

**Objective:** Build Screen 7 as a Kanban-style workflow board.

**UI requirements**
- Columns in exact order:
  - `Pending`
  - `Approved`
  - `Technician Assigned`
  - `In Progress`
  - `Resolved`
- Cards show asset tag plus issue summary
- Resolved cards get success tint
- Persistent footer note:
  - `Approving a card moves the asset to Under Maintenance; resolving returns it to Available.`
- Raise-request form with priority and photo

**High-fi notes**
- This board should feel especially polished: animated card movement, strong column hierarchy, and clear status transitions.

**Acceptance criteria**
- Cards move through lifecycle correctly and stay synced with backend states.

**Git commit message**
```txt
feat(frontend): build maintenance management board with workflow visualization
```

---

## Task 17 - Asset Audit APIs

**Objective:** Build structured audit cycles with discrepancy reporting.

**Endpoints**
- `POST /api/v1/audit-cycles`
- `GET /api/v1/audit-cycles/:id`
- `PUT /api/v1/audit-items/:id`
- `GET /api/v1/audit-cycles/:id/discrepancy-report`
- `PUT /api/v1/audit-cycles/:id/close`

**Rules**
- Cycle creation auto-generates scoped audit items
- Each audit item copies current asset location into `expectedLocation`
- Closed cycle cannot be edited
- Closing cycle should mark missing assets appropriately

**Acceptance criteria**
- Discrepancy report only includes non-verified items.
- Closed cycles reject later edits.

**Git commit message**
```txt
feat(audit): implement audit cycle creation, item verification, and discrepancy reporting
```

---

## Task 18 - Asset Audit Frontend

**Objective:** Build Screen 8.

**UI requirements**
- Audit cycle list plus create modal
- Detail header with cycle name, date range, and auditors
- Checklist table columns:
  - `Asset`
  - `Expected Location`
  - `Verification`
- Verification options should be strong visual pills:
  - Verified
  - Missing
  - Damaged
- Live progress bar
- Discrepancy banner with live count
- Irreversible close-cycle confirmation modal

**High-fi notes**
- The discrepancy banner and progress feedback should feel clear, serious, and audit-friendly.
- This screen should balance data density with readability.

**Acceptance criteria**
- Auditors can complete full cycle flows and see live discrepancy updates.

**Git commit message**
```txt
feat(frontend): build audit cycle management and discrepancy reporting screens
```

---

## Task 19 - Notifications, Activity Logs, and Dashboard KPI APIs

**Objective:** Build cross-module data aggregation after all workflows exist.

**What to add**
- Notification service
- Activity log service
- `GET /api/v1/notifications`
- `PUT /api/v1/notifications/:id/read`
- `GET /api/v1/activity-logs`
- `GET /api/v1/dashboard/kpis`
- `GET /api/v1/dashboard/recent-activity`

**Category mapping**
- `ALERT`: overdue returns, audit discrepancy
- `APPROVAL`: maintenance and transfer decisions
- `BOOKING`: confirmed, changed, cancelled bookings
- `GENERAL`: assignments and other useful updates

**Important integration rule**
- Go back into allocation, booking, maintenance, and audit controllers and actually call notification and activity-log services.
- This is the sync step that makes dashboard and notifications believable.
- Keep the logging and notification concerns centralized so the architecture remains clean and easy to explain.

**Acceptance criteria**
- Workflow events create both notification and activity log rows.
- KPI endpoint returns everything needed for the dashboard in one call.

**Git commit message**
```txt
feat(notifications): implement categorized notification service, activity logging, and dashboard KPI/recent-activity aggregation
```

---

## Task 20 - Dashboard, Reports, Unified Notifications Screen, and Final Polish

**Objective:** Build Screens 2, 9, and 10, then finish product-level polish.

### Dashboard

**UI requirements**
- Header: `Today's Overview`
- Six KPI cards:
  - Available
  - Allocated
  - Maintenance
  - Active Bookings
  - Pending Transfers
  - Upcoming Returns
- Overdue alert banner
- Quick action row:
  - `+ Register Asset`
  - `Book Resource`
  - `Raise Requests`
- Recent Activity list

### Reports and Analytics

**UI requirements**
- `Utilization by Department` bar chart
- `Maintenance Frequency` line chart
- `Most Used Assets` list
- `Idle Assets` list
- `Assets Due for Maintenance / Nearing Retirement` list
- Optional secondary widgets:
  - department-wise allocation summary
  - booking heatmap
- `Export Report` button

### Unified Notifications Screen

**UI requirements**
- Tabs:
  - All
  - Alerts
  - Approvals
  - Bookings
- Each row shows icon, message, and relative time
- Unread state highlight
- Clicking a row marks it read
- Bell icon in top bar links to this page

### Final polish checklist

- Standardize status badge system
- Standardize route transitions with `AnimatePresence`
- Verify mobile and tablet layouts
- Verify all empty, loading, and error states
- Run full smoke flow:
  - signup
  - org setup
  - register asset
  - allocate
  - conflict and transfer
  - booking
  - maintenance
  - audit
  - dashboard and notifications reflect final state

**High-fi notes**
- This task should make the app feel cohesive and demo-ready.
- Dashboard, Reports, and Notifications need the highest visual maturity in the whole project.

**Acceptance criteria**
- Dashboard numbers match real data.
- Notifications filter correctly by tab.
- Entire app shares one consistent design language.

**Git commit message**
```txt
feat(frontend): build dashboard with recent activity, reports & analytics, unified notifications screen, and finalize app polish
```

---

## Quick Summary Table

| # | Task | Layer | Commit Message |
|---|------|-------|----------------|
| 1 | Project scaffolding | Setup | `chore(setup): scaffold backend and frontend project structure` |
| 2 | Prisma schema | DB | `feat(db): define complete Prisma schema for all AssetFlow entities` |
| 3 | Express architecture | Backend | `feat(backend): add core middleware, error handling, and response utils` |
| 4 | Auth APIs | Backend | `feat(auth): implement signup, login, session validation and password reset` |
| 5 | Auth screens + app shell | Frontend | `feat(frontend): build login, signup, password reset screens and persistent app shell with sidebar navigation` |
| 6 | RBAC | Backend | `feat(auth): add role-based access control middleware and permissions matrix` |
| 7 | Organization APIs | Backend | `feat(org): implement department, category, and employee directory APIs` |
| 8 | Organization screen | Frontend | `feat(frontend): build organization setup screen with department, category, and employee tabs` |
| 9 | Asset APIs | Backend | `feat(assets): implement asset registration, search/filter, and history APIs` |
| 10 | Asset screens | Frontend | `feat(frontend): build asset registration, directory, and detail screens` |
| 11 | Allocation and transfer APIs | Backend | `feat(allocation): implement allocation, conflict detection, and transfer workflow` |
| 12 | Allocation and transfer screen | Frontend | `feat(frontend): build allocation, conflict handling, and transfer approval UI` |
| 13 | Booking APIs | Backend | `feat(booking): implement resource booking with time-slot overlap validation` |
| 14 | Booking screen | Frontend | `feat(frontend): build resource booking screen with calendar and overlap UX` |
| 15 | Maintenance APIs | Backend | `feat(maintenance): implement maintenance request workflow with status-gated transitions` |
| 16 | Maintenance screen | Frontend | `feat(frontend): build maintenance management board with workflow visualization` |
| 17 | Audit APIs | Backend | `feat(audit): implement audit cycle creation, item verification, and discrepancy reporting` |
| 18 | Audit screen | Frontend | `feat(frontend): build audit cycle management and discrepancy reporting screens` |
| 19 | Notifications, logs, KPI APIs | Backend | `feat(notifications): implement categorized notification service, activity logging, and dashboard KPI/recent-activity aggregation` |
| 20 | Dashboard, reports, notifications, polish | Frontend | `feat(frontend): build dashboard with recent activity, reports & analytics, unified notifications screen, and finalize app polish` |

## Execution Notes

- Follow the task order exactly; later tasks depend on earlier ones.
- Highest-risk logic lives in Tasks 11, 13, 15, and 17.
- Keep asset-state changes centralized and transactional.
- Frontend tasks should preserve one premium visual language across the whole app.
- If the team wants, this file can be turned next into Jira-style tickets, sprint buckets, or agent prompts one by one.
- If marks are architecture-heavy, focus presentation/demo on:
  - schema quality
  - module boundaries
  - transaction safety
  - RBAC design
  - auditability
  - notification/logging centralization
