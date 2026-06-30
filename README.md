# 🎬 Movie Reservation System

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![Express](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![Node.js](https://img.shields.io/badge/Node.js-3C873A?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)](https://jwt.io/)
[![React Router](https://img.shields.io/badge/React_Router-CA4245?style=for-the-badge&logo=react-router&logoColor=white)](https://reactrouter.com/)
[![Axios](https://img.shields.io/badge/Axios-5A29E4?style=for-the-badge&logo=axios&logoColor=white)](https://axios-http.com/)
[![Framer Motion](https://img.shields.io/badge/Framer_Motion-0055FF?style=for-the-badge&logo=framer&logoColor=white)](https://www.framer.com/motion/)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)](https://developer.mozilla.org/docs/Web/CSS)

Preview : https://movie-reservation-1-4uao.onrender.com

A full‑stack app to browse movies and book reservations. Frontend built with React (CRA). Backend built with Express. Auth uses JWT and passwords are hashed with bcrypt. Data is currently stored in‑memory for users and reservations.

## ✨ Highlights

- __Auth__: Register, Login, JWT issuance, basic profile update
- __Reservations__: Create, list, cancel, and get reservations for the logged‑in user
- __CORS__: Locked to `http://localhost:3000` and deployed origin (configurable)
- __DX__: Clear project structure with `frontend/` and `server/`

## 🗂️ Project Structure

```
movie-reservation project/
├─ frontend/
│  ├─ public/
│  └─ src/
│     ├─ components/           # UI components (hero section, header, sliders, etc.)
│     └─ pages/                # Pages (Home, Login, Registration, Profile, etc.)
└─ server/
   ├─ app.js                   # Express app, auth routes, CORS, router mounting
   ├─ reservation.js           # Reservation API routes
   └─ utils/auth.js            # JWT helper
```

## 🚀 Quick Start

### 1) Backend

```bash
cd server
npm install

# .env (create in ./server)
# JWT_SECRET=your_secret_here
# PORT=5000  # optional (defaults to 5000)

npm start
# API available at http://localhost:5000
```

### 2) Frontend

```bash
cd frontend
npm install
npm start
# App at http://localhost:3000
```

## 🔧 Environment Variables

Set up the required environment variables for both backend and frontend.

### Backend (`server/.env`)

Create a `.env` file inside the `server/` directory:

```ini
# server/.env
JWT_SECRET=your_secret_here
PORT=5000
```

Windows (PowerShell) quick setup:

```powershell
Set-Location server
"JWT_SECRET=change_me`nPORT=5000" | Out-File -Encoding ascii -NoNewline .env
Get-Content .env
```

Notes:

- `JWT_SECRET` is used to sign JSON Web Tokens.
- `PORT` is optional; defaults to 5000 if not provided.

### Frontend (`frontend/.env`)

You already have an example at `frontend/.env_example`.

Create `.env` using the example:

```powershell
Set-Location ../frontend
Copy-Item .env_example .env
Get-Content .env
```

Variables:

```ini
# frontend/.env
REACT_APP_TMDB_API_KEY=your_api_key_here
REACT_APP_API_URL=http://localhost:5000
```

Notes:

- CRA only exposes variables prefixed with `REACT_APP_` to the client.
- Keep `.env` files out of version control (already handled by `.gitignore`).
- For Render deploys, set `REACT_APP_API_URL` to your backend service URL
  (example: `https://movie-reservation-z2nv.onrender.com`) and redeploy frontend.

## 🔐 Authentication Flow

- Register or login to receive a JWT
- Include the token when calling protected endpoints:

```
Authorization: Bearer <your_jwt>
Content-Type: application/json
```

## 🧭 API Reference (current implementation)

Base URL: `http://localhost:5000`

- __Health__
  - `GET /` → `{ message: 'Movie Reservation API is running!' }`
  - `GET /api/test` → quick test response

- __Auth & User__ (in‑memory)
  - `POST /api/register` → body: `{ username, email, password }`
    - returns: `{ token, user }`
  - `POST /api/login` → body: `{ email, password }`
    - returns: `{ token, user }`
  - `POST /api/userInfo` → body: `{ userId }` (requires valid token in `Authorization` header)
  - `PATCH /api/changeInfo` → body: `{ userId, newEmail, newName }` (requires token)

- __Reservations__ (mounted at `/api/reservation`, requires token)
  - `POST /api/reservation/`
    - body: `{ movieId, theaterId, seats[], totalPrice, isLoggedIN, movieName, moviePoster, theaterName, movieDuration, movieGenre, showtime, bookingDate }`
    - creates reservation
  - `GET /api/reservation/all` → returns all reservations (debug)
  - `POST /api/reservation/id` → returns reservations for current user
  - `DELETE /api/reservation/delete/:id` → cancels reservation (sets status to `cancelled`)

## ⚙️ Scripts

- __Backend (`server/package.json`)__
  - `npm start` → `node app.js`

- __Frontend (`frontend/package.json`)__
  - `npm start` → start CRA dev server
  - `npm run build` → production build
  - `npm test` → run tests
  - `npm run eject` → eject CRA

## 🌐 CORS

Allowed origins in `server/app.js`:

```
https://movie-reservation-1.onrender.com
http://localhost:3000
```

Adjust `allowedOrigins` in `server/app.js` as needed.

## 🧩 Notes & Next Steps

- Current storage is in‑memory. Restarting the server clears users and reservations.
- Add persistent storage (MongoDB/Mongoose) and move auth to DB
- Add validation & rate limiting for production readiness
- Add .env handling in frontend for API base URL if needed

## 📄 License

MIT
