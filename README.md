# Movie Reservation System

A full-stack movie reservation application built with React, Express, JWT authentication, and MongoDB. Users can browse movies, register or sign in, reserve seats, manage reservations, like movies, and comment on movie detail pages.

Preview: https://movie-reservation-1-4uao.onrender.com

## Core Architecture

The application is split into two deployable parts:

- `frontend/`: React application created with Create React App.
- `server/`: Express API backed by MongoDB through Mongoose.

The frontend talks to the backend through `REACT_APP_API_URL` or, when that is not set, through the current browser origin. The backend exposes REST endpoints under `/api/*` and protects user-specific actions with JWT bearer tokens.

## Runtime Flow

1. A user registers or signs in through the React UI.
2. The server validates credentials, hashes passwords with bcrypt, and returns a JWT.
3. The client stores the JWT and user profile data in `localStorage`.
4. Protected API calls send `Authorization: Bearer <token>`.
5. MongoDB persists users, reservations, seat locks, liked movies, and comments.

## Data Model

### Users

Stored in MongoDB through `server/models/User.js`.

Primary responsibilities:

- Store username, email, password hash, and stable app user id.
- Support registration, login, user info, and profile updates.
- Keep the demo user with id `1` for local/demo compatibility.

### Reservations

Stored in MongoDB through `server/models/Reservation.js`.

Reservations contain the user id, movie id, theater id, selected seats, show date/time, movie metadata, status, and pricing data.

### Seat Locks

Stored in MongoDB through `server/models/BookedSeat.js`.

Seat availability is enforced with a unique index:

```js
{ showKey: 1, seatId: 1 }
```

This is the key consistency mechanism. A seat can only be inserted once for the same movie, theater, date, and showtime. If two users try to book the same seat at the same time, MongoDB allows one insert and rejects the other, and the API returns `409 Conflict`.

### Liked Movies

Stored in MongoDB through `server/models/LikedMovie.js`.

Each liked movie is keyed by `userId` and `movieKey`, with a unique index to prevent duplicates.

### Comments

Stored in MongoDB through `server/models/Comment.js`.

Comments are attached to a `movieId`, include the author id and username, and support owner-only edit/delete behavior.

## Backend Structure

```text
server/
  app.js
  config/
    mongo.js
  controllers/
    authController.js
    commentController.js
    likedMovieController.js
    reservationController.js
  middleWare/
    authMiddleware.js
  models/
    BookedSeat.js
    Comment.js
    LikedMovie.js
    Reservation.js
    User.js
  routes/
    auth.js
    comments.js
    likedMovies.js
    reservations.js
  services/
    commentService.js
    likedMovieService.js
    reservationService.js
    userService.js
  tests/
    api.test.js
  utils/
    auth.js
```

Backend layers:

- Routes map HTTP paths to controller functions.
- Controllers validate request shape and translate errors into HTTP responses.
- Services contain business logic and persistence behavior.
- Models define MongoDB schemas and indexes.
- Middleware validates JWTs and attaches `req.user`.

## Frontend Structure

```text
frontend/src/
  components/
    comments/
    custom-select/
    footer/
    header/
    Hero_Section/
    LoggedIn/
    movies-selection/
    movies-slider/
    notification/
    spinner/
  config/
    api.js
  hooks/
    useLikedMovies.js
  pages/
    Home/
    Login/
    movie_information/
    movie_list/
    NotFound/
    pricing/
    Profile/
    Registration/
    Reservation_info/
    terms_and_privacy/
  utils/
    jwtDecoder.js
```

Frontend responsibilities:

- Route-level pages live under `src/pages`.
- Reusable UI lives under `src/components`.
- `src/config/api.js` resolves the backend base URL.
- JWT decoding and auth helpers live under `src/utils`.
- Movie data is loaded from TMDB on the client.
- App-specific data is loaded from the Express API.

## Main API Endpoints

Base URL in local development:

```text
http://localhost:5000
```

### Health

```text
GET /api/test
GET /
```

### Auth and User

```text
POST  /api/register
POST  /api/login
POST  /api/userInfo
PATCH /api/changeInfo
```

### Reservations

```text
GET    /api/reservation/seats
POST   /api/reservation
GET    /api/reservation/all
POST   /api/reservation/id
DELETE /api/reservation/delete/:id
```

Important behavior:

- `GET /api/reservation/seats` returns currently booked seats for a show.
- `POST /api/reservation` creates a reservation and writes seat locks.
- If seats are already locked, the API returns `409` with `conflictingSeats`.
- Cancelling a reservation removes its seat locks, making those seats available again.

### Likes

```text
GET    /api/likes
POST   /api/likes
DELETE /api/likes
DELETE /api/likes/:movieKey
```

### Comments

```text
GET    /api/comments/:movieId
POST   /api/comments/:movieId
PATCH  /api/comments/:commentId
DELETE /api/comments/:commentId
```

Important behavior:

- Anyone can read comments.
- Only authenticated users can create comments.
- Only the comment owner can edit or delete a comment.

## Environment Variables

### Backend

Create `server/.env`:

```ini
JWT_SECRET=your_secret_here
PORT=5000
CORS_ORIGINS=https://your-frontend.example.com
MONGO_DB=mongodb+srv://...
MONGO_DB_PASSWD=your_mongo_password
```

Supported Mongo URI variable names:

```text
MONGODB_URI
MONGO_URI
MONGO_DB
MoNGO_DB
```

Supported Mongo password variable names:

```text
MONGO_DB_PASSWORD
MONGO_DB_PASSWD
MONGODB_PASSWORD
```

The Mongo config supports password placeholders like `<db_password>` or `<password>` in the URI.

### Frontend

Create `frontend/.env`:

```ini
REACT_APP_TMDB_API_KEY=your_tmdb_api_key
REACT_APP_API_URL=http://localhost:5000
```

For deployed environments, set `REACT_APP_API_URL` to the backend service URL.

## Local Development

Install and start the backend:

```bash
cd server
npm install
npm start
```

Install and start the frontend:

```bash
cd frontend
npm install
npm start
```

Default local URLs:

```text
Frontend: http://localhost:3000
Backend:  http://localhost:5000
```

## Tests

Backend integration tests:

```bash
cd server
npm test
```

Frontend build verification:

```bash
cd frontend
npm run build
```

The backend tests cover authentication, liked movies, comments, reservations, cancellation, seat conflict handling, and concurrent seat booking protection.

## CORS

Allowed origins are configured in `server/app.js`.

Current allowed origins include:

```text
https://movie-reservation-1.onrender.com
https://movie-reservation-z2nv.onrender.com
https://movie-reservation-1-4uao.onrender.com
http://localhost:3000
```

Localhost origins are also allowed through a regex for local development.
Additional origins can be supplied as a comma-separated `CORS_ORIGINS` value.

## Consistency and Failure Behavior

Reservations require MongoDB for production-safe seat booking. The important invariant is that `BookedSeat` documents cannot duplicate the same `{ showKey, seatId }`.

If MongoDB is unavailable, reservation endpoints return an error instead of silently creating unsafe in-memory reservations. This prevents multiple app instances from selling the same seat.

Likes and comments have lightweight in-memory fallbacks for local resilience, but MongoDB is the intended persistent store.

## Notes

- `server/reservation.js` is a legacy standalone reservation implementation and is not mounted by `server/app.js`.
- The active reservation API is `server/routes/reservations.js` plus `server/controllers/reservationController.js`.
- The active persistence logic is in `server/services/*Service.js` and `server/models/*.js`.
