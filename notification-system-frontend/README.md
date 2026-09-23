# Pulse notification frontend

React/Vite frontend for the real-time notification REST and Socket.IO API.

## Setup

```bash
cd notification-system-frontend
npm install
copy .env.example .env
npm run dev
```

Set `VITE_API_URL` in `.env` if the API is not running at `http://localhost:4001`.

The backend worker process must also be running for queued notification deliveries (including in-app and email channels) to happen. The frontend fetches the inbox and unread count through REST on every page load, while Socket.IO provides live updates and connection status.
