Gamers Aposentados root directory

## Development

- Start the frontend (and backend if present) from the repository root:

```bash
npm install
npm run dev
```

- Start only the frontend:

```bash
cd frontend
npm install
npm run dev
```

- Install dependencies for both packages from the root:

```bash
npm run install:all
```

Note: The root `dev` script runs `frontend` and will start `backend` too if `backend/package.json` exists. If you see an "Unable to acquire lock" error, make sure no other dev server is running (kill the process using port 3000).
