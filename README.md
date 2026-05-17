# Flashcard Learning App

A single-page web application for spaced flashcard study. Students register an
account, build their own private decks, study cards with a flip-and-grade flow,
and search their library in real time. Every study result is recorded as
**learning history**, and an **admin** can review the learning history of every
user — useful for a tutor tracking class progress.

> **Problem it solves:** self-study tools rarely keep an honest record of what a
> learner actually knows. This app turns each review into a tracked event
> (*knew it* / *forgot*) so progress is visible to the learner and, for an
> admin, across all learners.

---

## Core Features (three conceptual entities)

| Entity | Operations | Notes |
|--------|-----------|-------|
| **User** | register, login, session | Passwords hashed with bcrypt; stateless **JWT** auth; roles `user` / `admin` (role-based access control) |
| **Flashcard** | create, read, update, delete | Private to the owning user; **live search** filters by question / answer / deck as you type |
| **History** | create, read, delete; admin read-all | A study result per card; admins view **all users' learning history** |

Full CRUD is exercised across all three entities, and the UI never reloads the
page — it is a true SPA driven by a single `index.html`.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + Vite (single-page app, no router — view state in React) |
| Styling | Plain CSS (custom dark theme, CSS variables) |
| Backend | FastAPI (Python), Uvicorn ASGI server |
| Auth | JWT (PyJWT, HS256) + bcrypt password hashing |
| Database | MongoDB via Motor (async driver) |
| API | REST — JSON over HTTP |

**Dependencies** are pinned in `backend/requirements.txt` (Python) and
`frontend/package.json` (Node).

---

## Folder Structure

```
Assignment_2/
├── README.md               # this file
├── flashcards.json          # starter deck used by the seed script
├── db_export/               # MongoDB export of the three collections
│   ├── users.json
│   ├── flashcards.json
│   └── history.json
├── backend/                 # FastAPI service
│   ├── main.py              # API routes (auth, flashcards, history, admin)
│   ├── auth.py              # bcrypt hashing, JWT, auth/admin dependencies
│   ├── models.py            # Pydantic request/response schemas
│   ├── database.py          # MongoDB connection + collection handles
│   ├── seed.py              # creates demo accounts + loads starter deck
│   ├── requirements.txt     # pinned Python dependencies
│   └── .env.example         # config template (.env is gitignored)
└── frontend/                # React + Vite single-page app
    ├── index.html           # the one and only HTML file
    └── src/
        ├── App.jsx           # root: auth gate, study view, admin toggle
        ├── App.css           # all styles / theme variables
        ├── main.jsx          # entry; wraps app in AuthProvider
        ├── api/              # fetch wrappers
        │   ├── client.js     # base fetch + bearer token + 401 handling
        │   ├── auth.js       # register / login / me
        │   ├── flashcards.js # flashcard CRUD
        │   └── history.js    # history + admin endpoints
        ├── context/
        │   ├── AuthContext.jsx  # AuthProvider component
        │   └── auth-context.js  # context object + useAuth hook
        └── components/
            ├── AuthPage.jsx     # login / register screen
            ├── SearchBar.jsx    # live search input
            ├── Flashcard.jsx    # flip card + knew-it / forgot grading
            ├── CardModal.jsx    # create / edit modal form
            └── AdminPanel.jsx   # all-users learning-history view
```

---

## Running Locally

Prerequisites: **Python 3.9+**, **Node 18+**, and **MongoDB** running on
`localhost:27017`.

**1. Backend**

```bash
cd backend
cp .env.example .env          # then edit JWT_SECRET
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python seed.py                # demo accounts + starter deck
uvicorn main:app --reload --port 8000
```

**2. Frontend** (new terminal)

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173**.

**Demo accounts** (created by `seed.py`):

| Username | Password | Role |
|----------|----------|------|
| `admin` | `admin123` | admin — can view every user's history |
| `student` | `student123` | user — owns the 8-card starter deck |

> The very first account ever registered also becomes an admin, so a fresh
> database is never locked out.

---

## Database Export

`db_export/` contains a JSON export of the three collections
(`users`, `flashcards`, `history`). Re-import with:

```bash
mongoimport --db flashcard_db --collection users      --file db_export/users.json      --jsonArray
mongoimport --db flashcard_db --collection flashcards --file db_export/flashcards.json --jsonArray
mongoimport --db flashcard_db --collection history    --file db_export/history.json    --jsonArray
```

(`users.json` stores only **bcrypt password hashes** — no plaintext secrets.)

---

## Design Notes

- **State management:** `useState` for local UI state; **`useContext`** (an
  `AuthProvider`) for the cross-cutting auth session so any component can read
  the user/role; **`useMemo`** for the live-search filter so it recomputes only
  when the query, deck, or card list changes.
- **Security:** passwords are bcrypt-hashed with a per-password salt; the JWT
  secret is read from the environment and never committed; protected endpoints
  require a valid token and admin routes additionally enforce the `admin` role.
- **Error handling:** the API returns meaningful HTTP codes (400/401/403/404/409)
  with messages; the frontend surfaces them in a dismissible banner and never
  shows a blank screen on API failure.
- **SPA:** one `index.html`; navigation between login, study, and admin views is
  pure React state — no page reloads.

---

## Author & Workload

**Solo submission** — all files written by:

| Name | Student ID |
|------|-----------|
| Arsh Mansuri | 25522436 |

This is an individual project; the entire stack (backend API & auth, database
model, React frontend, integration, and documentation) was implemented by the
sole author. Per-file authorship is also traceable through the repository's
commit history.
