# Development guide

Start with the [quick start](../README.md#quick-start). Docker Compose starts the backend services; the frontend runs separately with npm.

## Frontend preview

```bash
cd frontend
npm ci
npm start
```

The UI is served at `http://localhost:3000`. In development it opens without the backend readiness gate, and API requests default to `http://localhost:5000` unless `REACT_APP_API_URL` overrides it. Login, favorites synchronization, comments, and reservations require the API.

Copy `frontend/.env_example` to `frontend/.env` for the full configuration. Set the TMDB key before starting the development server. Restart `npm start` after changing environment variables.

To preview the 404 page, open `http://localhost:3000/not-found`.

## OAuth

Configure providers in the root `.env` used by Compose:

| Setting | Local value |
| --- | --- |
| `GOOGLE_OAUTH_CLIENT_ID` | Provider-issued client ID |
| `GOOGLE_OAUTH_CLIENT_SECRET` | Provider-issued client secret |
| `GOOGLE_OAUTH_REDIRECT_URI` | `http://localhost:5000/api/oauth/google/callback` |
| `GITHUB_OAUTH_CLIENT_ID` | Provider-issued client ID |
| `GITHUB_OAUTH_CLIENT_SECRET` | Provider-issued client secret |
| `GITHUB_OAUTH_REDIRECT_URI` | `http://localhost:5000/api/oauth/github/callback` |

Register the same callback URLs in the provider applications. For a deployment, use the public gateway URL and configure Identity's `FRONTEND_URL` and the gateway's `CORS_ORIGINS` for the deployed frontend.

## Registration worker

Compose starts the worker automatically. After creating an account, inspect its output:

```bash
docker compose logs -f registration-worker
```

To start it directly, configure `RABBITMQ_URL` in `server/.env` and run:

```bash
cd server
npm ci
npm run start:registration-worker
```

RabbitMQ must be reachable from the host. The default Compose setup publishes its management UI on port `15672`, but not the AMQP port `5672`.

## MongoDB integration tests

Use a dedicated, disposable database. The integration tests delete records from their collections.

PowerShell:

```powershell
$env:TEST_MONGODB_URI = 'mongodb://127.0.0.1:27017/movie_reservation_test'
npm test --prefix server
```

Bash:

```bash
TEST_MONGODB_URI=mongodb://127.0.0.1:27017/movie_reservation_test npm test --prefix server
```

These commands assume MongoDB is reachable on the host. Compose does not publish MongoDB's port by default. CI starts a separate MongoDB service for the tests.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| UI opens, API calls fail locally | Start the backend and check `REACT_APP_API_URL`. A frontend-only preview cannot authenticate or book seats. |
| Movie requests fail | Configure the TMDB API key in `frontend/.env`, then restart the frontend. |
| OAuth callback fails | Match the provider's registered callback URL to the configured gateway URL. |
| Hosted requests return `429` | Inspect gateway logs for `upstream_rate_limited`. Check whether requests reach the gateway or are blocked at the hosting edge. Avoid repeated sign-in attempts while rate limited. |
| Health returns `200`, but login fails | Gateway health does not probe Identity or other upstream services. Inspect their logs separately. |
| Changes to Docker-hosted backend are missing | Rebuild with `docker compose up --build`. |

Stop the local backend with `docker compose down`. This setup does not configure database volumes; removing containers can discard their local database and queue data.

## Repository hygiene

Build output, coverage reports, dependency directories, and local `.env` files are generated locally and excluded from Git. Environment examples remain tracked. Install dependencies from the application lockfiles with `npm ci`.

[Back to README](../README.md)
