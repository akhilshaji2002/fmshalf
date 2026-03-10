# Deploy Full App (Frontend + Backend + MongoDB Atlas)

## 1) MongoDB Atlas

1. Create a free Atlas project and cluster.
2. Create a database user (username/password).
3. In Network Access, allow your backend host IP (or `0.0.0.0/0` for quick setup).
4. Copy connection string and set DB name to `fms`:
   - `mongodb+srv://<user>:<pass>@<cluster>/<db>?retryWrites=true&w=majority`

## 2) Deploy Backend (Render)

1. Create a new **Web Service** from `server` folder.
2. Build command:
   - `npm install`
3. Start command:
   - `npm start`
4. Add environment variables:
   - `NODE_ENV=production`
   - `PORT=5000`
   - `MONGODB_URI=<your atlas uri>`
   - `JWT_SECRET=<long random secret>`
   - `GEMINI_API_KEY=<your key>`
   - `CLIENT_URL=https://akhilshaji2002.github.io`
5. Deploy and copy backend URL, for example:
   - `https://fms-api.onrender.com`

## 3) Point Frontend to Backend

In `client`, create `.env`:

```
VITE_API_URL=https://fms-api.onrender.com
```

## 4) Rebuild and republish GitHub Pages

From project root:

1. Build client with API URL:
   - PowerShell:
     - `$env:VITE_API_URL='https://fms-api.onrender.com'`
     - `$env:GITHUB_ACTIONS='true'`
     - `npm run build --prefix client`
2. Publish `client/dist` to `gh-pages` branch (same method used in this repo).

## 5) Verify

1. Open:
   - `https://akhilshaji2002.github.io/fmshalf/`
2. Login should call your deployed backend URL (not localhost).
3. Check in browser devtools -> Network that `/api/auth/login` is going to Render URL.
