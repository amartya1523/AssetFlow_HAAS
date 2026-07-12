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
cd backend && npm install && npm run dev
```

The API starts on `http://localhost:5000`. Verify it with the health check:

```
http://localhost:5000/api/v1/health  ->  { "status": "ok" }
```

### Frontend

```bash
cd frontend && npm install && npm run dev
```

The Vite dev server starts (by default on `http://localhost:5173`) and renders the placeholder app.
