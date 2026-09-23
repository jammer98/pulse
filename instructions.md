Build a simple, functional frontend for an existing Real-Time Notification System REST + WebSocket API. Prioritize working functionality over visual polish: a clean, plain, responsive UI is fine, no animations or heavy design.

TECH
- New folder "notification-system-frontend". React 18 + Vite, JavaScript, React Router.
- Plain CSS. No UI kit, no state library. React Context for auth AND for the socket connection/unread count, local component state elsewhere.
- fetch through one small api helper (src/api/client.js), base URL from VITE_API_URL (default http://localhost:4001).
- socket.io-client for the WebSocket connection.
- Provide a .env.example with VITE_API_URL.

AUTH
- JWT-based, same pattern as before: store token + user in localStorage, send "Authorization: Bearer <token>" on protected requests.
- On login, in addition to the token, open a Socket.IO connection: io(VITE_API_URL, { auth: { token } }). Keep this connection in a SocketContext so any page can read live events and connection status. Disconnect the socket on logout.
- On any 401 from a non-auth endpoint, clear storage, disconnect the socket, redirect to /login.
- Route guard: logged-out users redirected to /login.

REAL-TIME BEHAVIOR (this is the core of the app — get this right)
- SocketContext maintains: connection status ("connecting" | "live" | "disconnected"), and listens for "notification:new".
- On "notification:new": prepend the new notification to the inbox list state (if the inbox page is mounted), increment the unread count badge in the navbar, and show a small toast/banner ("New: <title>") that auto-dismisses after ~4 seconds.
- Show connection status somewhere small and persistent (e.g. a dot in the navbar: green = live, gray = connecting, red = disconnected). This should visibly change if the backend restarts — don't fake a static "connected" label.
- The socket is the fast path only. On page load, ALWAYS fetch the real inbox from GET /api/notifications and GET /api/notifications/unread-count — never rely on the socket alone for state, since it delivers nothing that happened while you were offline.

PAGES AND ROUTES
1. /login and /register: name, email, password (register only). After success: redirect to /.
2. / (Inbox): list of notifications, newest first, paginated (page/limit). Each row: title, body, type as a small tag, relative time, read/unread visual distinction (e.g. bold + dot for unread). Click a row (or a "Mark read" button) → PATCH /:id/read, updates it in place without a full refetch. A "Mark all read" button → PATCH /read-all, then refetch or zero out unread locally. Filter toggle: All / Unread only (uses ?unread=true).
3. /preferences: fetch GET /api/preferences. Render as a table: rows = notification type, columns = channel (in_app, email), each cell a toggle switch. Toggling calls PUT /api/preferences with { type, channel, enabled }. If the list is empty, show "You haven't received any notifications yet — preferences appear here once you have."
4. /demo (Send test event): a form with type, title, body, and a free-text JSON textarea for `data` (validate it parses as JSON before sending). ALSO needs an API key input field. Clearly label this page: "Demo only — in a real system, only backend services would call this endpoint with a server-side key, never a browser." Sends userId as the CURRENTLY LOGGED-IN user's own id (so you can demo sending a notification to yourself), with header X-API-Key set from the input. On success, show the response JSON (status, notificationId, channels) and a note like "Check the inbox — it should appear within a second."
5. Navbar (all logged-in pages): app name | Inbox | Preferences | Demo | connection-status dot | unread badge | user name | Logout.

API REFERENCE
Bodies are camelCase. Auth: Bearer JWT for user routes, X-API-Key for the demo page's event call only.

POST /api/auth/register  { name, email, password }  → 201 { user, token }
POST /api/auth/login     { email, password }         → 200 { user, token }
GET  /api/auth/me        (auth)                       → 200 { user: { id, name, email } }

GET  /api/notifications?unread=&page=&limit=   (auth)
  → 200 { notifications: [{ id, type, title, body, data, read_at, created_at }], page, limit, total, totalPages }
GET  /api/notifications/unread-count  (auth)   → 200 { count }
PATCH /api/notifications/:id/read     (auth)   → 200 { notification: { id, read_at } }
PATCH /api/notifications/read-all     (auth)   → 200 { updated: number }

GET /api/preferences  (auth)
  → 200 { preferences: [ { type, channels: [ { channel: "in_app"|"email", enabled: boolean } ] } ] }
PUT /api/preferences  (auth)  { type, channel, enabled }  → 200 { preference: { type, channel, enabled } }

POST /api/events  (X-API-Key header, NOT Bearer)
  Body: { userId: number, type: string (lowercase, digits, _.-), title, body, data?: object }
  Optional header: Idempotency-Key
  → 202 { status: "queued", notificationId, channels, duplicate: false }
  → 200 if suppressed by preferences, or if it's a replayed idempotency key

Socket.IO: connect to the base URL with { auth: { token } }. Listen for event "notification:new", payload: { id, type, title, body, data, createdAt }.

ERROR FORMAT: all errors are { "error": "message" } with an appropriate status. Show it inline near the relevant form/action.

UX RULES
- Loading, error, and empty states on every page ("No notifications yet").
- Disable submit buttons while a request is in flight.
- Responsive down to phone width.
- Format timestamps as relative time ("2m ago") where reasonable.

DEFINITION OF DONE
- npm run build succeeds.
- Verify end to end against the running backend (API on 4001, worker running separately — remind me if the worker isn't running, since email/in-app delivery won't happen without it): register, log in, watch the connection dot go green, use the Demo page to send yourself an event, confirm a toast appears AND the inbox updates live AND the unread badge increments — all without a manual refresh. Then refresh the page and confirm the same notification still shows (proves the REST fetch works independently of the socket). Toggle a preference off and confirm a new event of that type comes back with fewer channels in its response.
- Short README with setup steps and a note that the backend worker process must be running for deliveries to happen.