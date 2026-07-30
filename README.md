# One Love Tech VTU Backend — Setup

This small server holds your VTpass keys safely and does the real purchase.
Your app talks to this server; this server talks to VTpass.

## 1. Get your keys from VTpass
Log in to vtpass.com → Profile → API Keys tab → generate your API key,
public key, and secret key (secret key is shown only once — copy it).

## 2. Deploy for free (Render.com)
1. Create a free account at render.com
2. New → Web Service → connect this folder (upload as a GitHub repo, or use Render's "Upload" option)
3. Build command: `npm install`
4. Start command: `npm start`
5. Under Environment, add:
   - `VTPASS_API_KEY` = your api key
   - `VTPASS_SECRET_KEY` = your secret key
   - `VTPASS_PUBLIC_KEY` = your public key
   - `VTPASS_ENV` = `sandbox` (use `live` only once you've tested and are ready for real transactions)
6. Deploy. Render gives you a URL like `https://olt-vtu-backend.onrender.com`

## 3. Test in sandbox first
Sandbox has test phone numbers that simulate success/failure without real money.
Use those (from VTpass sandbox docs) before switching VTPASS_ENV to "live".

## 4. Point your app at it
In the app's JSX, replace the simulated `runTransaction` function with a real
fetch call to your backend, e.g.:

```js
const res = await fetch("https://olt-vtu-backend.onrender.com/purchase-airtime", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ network: network.id, phone, amount: Number(amount) }),
});
const result = await res.json();
```

Use `result.ok` to decide whether to show the receipt or an error.

## Notes
- Never put VTPASS_SECRET_KEY inside the app itself — only in this server's environment variables.
- Switch VTPASS_ENV to "live" only after real sandbox testing succeeds.
