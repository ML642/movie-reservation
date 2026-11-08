# Movie Reservation System

Full-stack movie-booking application designed around secure authentication and safe seat allocation.

Browse the movie catalog, save favorites, leave comments, select seats, and manage reservations with QR tickets. Built with React, TypeScript, Express, MongoDB, and RabbitMQ.

[Live demo](https://movie-reservation-1-4uao.onrender.com)

## Architecture

The gateway is the public entry point. It forwards identity traffic by default, `/api/likes` and `/api/comments` to Engagement, and `/api/reservation` to Reservation.

Each backend module follows Ports and Adapters:

```text
Presentation -> Application -> Domain
                    ^
                    |
             Infrastructure
```

Composition roots assemble Express controllers, application services, ports, and MongoDB adapters. Domain and application code do not import Express or Mongoose directly.

| Service | Responsibility | Port |
| --- | --- | ---: |
| Gateway | Routing, CORS, upstream failures | 5000 |
| Identity | Accounts, JWTs, refresh tokens, OAuth | 5001 |
| Engagement | Likes and comments | 5002 |
| Reservation | Availability, booking, cancellation | 5003 |

## Key guarantees

- Access tokens expire after 15 minutes. Refresh tokens expire after 30 days, are stored as HttpOnly cookies, hashed with bcrypt in MongoDB, and atomically rotated to prevent replay.
- Google and GitHub OAuth use authorization-code exchange and an HttpOnly state cookie validated with a timing-safe comparison.
- The Identity service publishes `identity.user.registered` through an `EventPublisher` port; RabbitMQ is used when `RABBITMQ_URL` is configured.
- A MongoDB unique index on `{ showKey: 1, seatId: 1 }` is the final authority for seat ownership. Concurrent requests for the same seat yield one success and one `409 Conflict`.
- On replica sets, seat locks and reservations are written in a transaction. On standalone MongoDB, failed reservation creation removes the locks it created; the unique index still prevents double booking.

## Local run

Prerequisites: Docker Compose, Node.js 20+, and npm.

Run the commands below from the repository root (the directory containing this README). Copy `.env.example` to `.env` and set a random `JWT_SECRET`:

```bash
cp .env.example .env
```

On PowerShell, use `Copy-Item .env.example .env`. The file contains these settings:

```env
JWT_SECRET=replace-with-a-long-random-secret
GOOGLE_OAUTH_CLIENT_ID=
GOOGLE_OAUTH_CLIENT_SECRET=
GOOGLE_OAUTH_REDIRECT_URI=http://localhost:5000/api/oauth/google/callback
GITHUB_OAUTH_CLIENT_ID=
GITHUB_OAUTH_CLIENT_SECRET=
GITHUB_OAUTH_REDIRECT_URI=http://localhost:5000/api/oauth/github/callback
```

Start the backend:

```bash
docker compose up --build
```

Start the frontend in another terminal:

```bash
cd frontend
cp .env_example .env
npm ci
npm start
```

Before `npm start`, set `REACT_APP_TMDB_API_KEY` in `frontend/.env` to your TMDB API key. Keep `REACT_APP_API_URL=http://localhost:5000`. On PowerShell, copy the file with `Copy-Item .env_example .env`.

The frontend runs at `http://localhost:3000`; the gateway is at `http://localhost:5000`. Frontend environment variables are included in the browser bundle; never put backend credentials there.

OAuth is optional for local development. When enabling it, register the gateway callback URLs with Google and GitHub. Set the callback environment variables to the public gateway URL when deploying.

## Tests

```bash
cd server
npm ci
npm test
```

The test command builds the TypeScript modules, then runs gateway, unit, and presentation tests. MongoDB integration tests are skipped unless `TEST_MONGODB_URI` is set. Use a dedicated test database: these tests delete records from their collections.

To check the frontend:

```bash
cd frontend
npm ci
npm test -- --watchAll=false
npm run build
```

## Demo scope

This is a portfolio project. Reservations and QR tickets demonstrate the booking flow; there is no payment processing or connection to a real cinema ticketing system. The demo backend may need time to wake up on the hosting free tier.

## Repository layout

```text
frontend/              React client
server/gateway.js      HTTP gateway
server/services/       Independently runnable service entry points
server/src/modules/    Identity, Engagement, and Reservation modules
docker-compose.yml     Local service topology
```
