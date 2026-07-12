# AssetFlow

AssetFlow is an Enterprise Asset & Resource Management System that helps organizations track, allocate, transfer, and maintain physical and digital assets throughout their lifecycle. It provides a central directory of assets, manages allocation and transfer workflows between employees and locations, handles resource booking, schedules maintenance, records audit trails, and surfaces insights through reports, analytics, and activity notifications.

## Tech Stack

- **Backend:** Node.js, Express, Prisma, PostgreSQL
- **Frontend:** React, Vite, React Router, Zustand, Framer Motion, Axios

## Project Structure

```
.
├── backend/      # Express API server
│   └── src/
│       └── server.js
└── frontend/     # Vite + React client
    └── src/
        ├── components/
        ├── pages/
        ├── context/
        ├── api/
        └── styles/
```

## Getting Started

### Backend

```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
```

The API starts on `http://localhost:5000`. Verify it with the health check:

```
http://localhost:5000/api/v1/health
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The Vite dev server starts on `http://localhost:5173` by default and loads the authentication flow plus the protected AssetFlow app shell.

## Current Progress

- Task 1: project scaffolding completed
- Task 2: Prisma schema aligned to the architecture-first task contract
- Task 3: Express middleware and response utilities completed
- Task 4: authentication APIs implemented
- Task 5: auth screens and protected app shell wired into routing
