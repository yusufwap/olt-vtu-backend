// One Love Tech VTU Backend
// Keeps your VTpass API key/secret safe on the server — never in the app.
const express = require("express");
const cors = require("cors");
const app = express();
app.use(cors());
app.use(express.json());

// Set these in your hosting provider's Environment Variables — never hardcode them here.
const VTPASS_BASE = process.env.VTPASS_ENV === "live"
  ? "https://vtpass.com/api"
  : "https://sandbox.vtpass.com/api";
const API_KEY = process.env.VTPASS_API_KEY;
const SECRET_KEY = process.env.VTPASS_SECRET_KEY;
const PUBLIC_KEY = process.env.VTPASS_PUBLIC_KEY;

function genRequestId() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const stamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}`;
  return stamp + Math.random().toString(36).slice(2, 10);
}

// Maps network id from the app to VTpass serviceID
const AIRTIME_SERVICE = { mtn: "mtn", glo: "glo", airtel: "airtel", "9mobile": "etisalat" };
const DATA_SERVICE = { mtn: "mtn-data", glo: "glo-data", airtel: "airtel-data", "9mobile": "etisalat-data" };

app.post("/purchase-airtime", async (req, res) => {
  try {
    const { network, phone, amount } = req.body;
    const serviceID = AIRTIME_SERVICE[network];
    if (!serviceID || !phone || !amount) {
      return res.status(400).json({ ok: false, error: "Missing network, phone, or amount" });
    }
    const request_id = genRequestId();
    const payload = { request_id, serviceID, amount, phone };
    console.log("Airtime request:", payload);
    const r = await fetch(`${VTPASS_BASE}/pay`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": API_KEY,
        "secret-key": SECRET_KEY,
      },
      body: JSON.stringify(payload),
    });
    const data = await r.json();
    console.log("Airtime response:", JSON.stringify(data));
    res.json({ ok: data.code === "000", requestId: request_id, data });
  } catch (e) {
    console.error("Airtime error:", e);
    res.status(500).json({ ok: false, error: e.message || String(e) });
  }
});

app.post("/purchase-data", async (req, res) => {
  try {
    const { network, phone, variation_code, amount } = req.body;
    const serviceID = DATA_SERVICE[network];
    if (!serviceID || !phone || !variation_code) {
      return res.status(400).json({ ok: false, error: "Missing network, phone, or plan" });
    }
    const request_id = genRequestId();
    const r = await fetch(`${VTPASS_BASE}/pay`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": API_KEY,
        "secret-key": SECRET_KEY,
      },
      body: JSON.stringify({
        request_id,
        serviceID,
        billersCode: phone,
        variation_code,
        phone,
        amount,
      }),
    });
    const data = await r.json();
    res.json({ ok: data.code === "000", requestId: request_id, data });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Fetch live data plans for a network (so prices/plans always match VTpass, not hardcoded)
app.get("/data-plans/:network", async (req, res) => {
  try {
    const serviceID = DATA_SERVICE[req.params.network];
    const r = await fetch(`${VTPASS_BASE}/service-variations?serviceID=${serviceID}`, {
      headers: { "api-key": API_KEY, "public-key": PUBLIC_KEY },
    });
    const data = await r.json();
    res.json(data);
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.get("/", (req, res) => res.send("One Love Tech VTU backend is running."));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
