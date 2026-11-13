# CineReserve ? Movie Reservation System

[![CI](https://github.com/ML642/movie-reservation/actions/workflows/ci.yml/badge.svg)](https://github.com/ML642/movie-reservation/actions/workflows/ci.yml)

A full-stack cinema booking demo with a React interface and a multi-service Node.js backend. Browse movies, choose seats, and manage reservations with MongoDB enforcing seat uniqueness for each screening.

[Live demo](https://movie-reservation-1-4uao.onrender.com) ? [Architecture](docs/architecture.md) ? [Development guide](docs/development.md)

> The hosted demo uses free hosting and may be unavailable during service startup or rate limiting. Follow the local setup below for development.

## Features

- Movie catalog with search, genre filters, and TMDB movie details.
- Email/username sign-in and Google/GitHub OAuth 2.0.
- Seat selection, booking, cancellation, and QR reservation tickets.
- Favorites, movie comments, and user profiles.
- Database-level seat conflict protection using a compound unique index.
- RabbitMQ registration events handled by a separate logging worker.

## Stack

| Layer | Technologies |
| --- | --- |
| Frontend | React, JavaScript/JSX, React Router, TanStack Query |
| Backend | Node.js, Express, TypeScript domain modules |
| Data | MongoDB, Mongoose |
| Messaging | RabbitMQ |
| Tooling | Docker Compose, GitHub Actions, Jest, React Testing Library |

## Quick start

Use Node.js 24 (the version used in CI), npm, and Docker with Compose. Run commands from the directory containing this README. Install dependencies in `frontend/` and `server/`; the root package is not an npm workspace.

### 1. Configure the backend

```bash
cp .env.example .env
```

On PowerShell, use `Copy-Item .env.example .env`.

Edit `.env` and replace `JWT_SECRET` with a random secret. You can generate one with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

OAuth credentials are optional for password-based local sign-in. Callback URLs and provider configuration are covered in the [development guide](docs/development.md#oauth).

### 2. Start backend services

```bash
docker compose up --build
```

The gateway is available at `http://localhost:5000`. MongoDB, RabbitMQ, and the registration worker run alongside the API services.

### 3. Start the frontend

In another terminal:

```bash
cd frontend
cp .env_example .env
```

On PowerShell, use `Copy-Item .env_example .env`. Set `REACT_APP_TMDB_API_KEY` in this file to your TMDB API key for live movie data. Keep `REACT_APP_API_URL=http://localhost:5000`.

```bash
npm ci
npm start
```

Open **http://localhost:3000**. During `npm start`, the interface opens without waiting for backend readiness. Authentication and booking still require running backend services. Browser environment variables are public; never place backend credentials in them.

## Checks

Run these commands from the repository root:

```bash
npm ci --prefix server
npm test --prefix server
npm ci --prefix frontend
npm test --prefix frontend -- --watchAll=false --runInBand
npm run build --prefix frontend
```

Backend tests compile the TypeScript modules first. MongoDB integration tests require `TEST_MONGODB_URI` pointing to a dedicated test database; otherwise they are skipped. They delete records from their collections.

[GitHub Actions](.github/workflows/ci.yml) runs backend builds and tests with MongoDB 7, plus frontend tests and a strict production build. RabbitMQ tests use mocks. No production credentials are required.

## Project layout

```text
frontend/               React client and UI tests
server/gateway.js       Public API gateway
server/services/        API service and registration worker entry points
server/src/modules/     Identity, Engagement, and Reservation
server/src/shared/      Shared infrastructure
.github/workflows/      Continuous integration
docs/                   Architecture and development notes
docker-compose.yml      Local backend topology
```

## Scope and limitations

This is a portfolio/demo project, not a real cinema ticketing integration. It does not process payments; QR tickets demonstrate the reservation flow.

Refresh-token sessions are implemented, but replay protection requires hardening before production use. The RabbitMQ worker logs registrations; it does not send email or maintain a persistent audit database. See the [architecture notes](docs/architecture.md#implementation-limits) for delivery and persistence limitations.

No repository-wide LICENSE file is included. The server package currently declares ISC; movie artwork and third-party assets have separate rights and attribution requirements.
