// OLT VTU Backend — Clubkonnect integration
// Replaces the old VTpass calls with Clubkonnect (nellobytesystems.com)

const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

const CLUBKONNECT_USERID = process.env.CLUBKONNECT_USERID; // e.g. CK101285996
const CLUBKONNECT_APIKEY = process.env.CLUBKONNECT_APIKEY;
const BASE_URL = 'https://www.nellobytesystems.com';

// Network codes confirmed from Clubkonnect's official Available Mobile Networks table
const NETWORK_CODES = {
  MTN: '01',
  GLO: '02',
  '9MOBILE': '03',
  AIRTEL: '04',
};

// Common bundles pulled from Clubkonnect's Available Data Plans table.
// Add more keys any time by copying `PlanID — description` pairs from
// your dashboard's Data bundle API page.
const DATA_PLANS = {
  MTN: {
    '500MB_Monthly': '500.00',
    '1GB_Monthly': '1000.00',
    '2GB_Monthly': '2000.00',
    '3GB_Monthly': '3000.00',
    '5GB_Monthly': '5000.00',
  },
  GLO: {
    '1GB_30days': '1000',
    '2GB_30days': '2000',
    '3GB_30days': '3000',
    '5GB_30days': '5000',
    '10GB_30days': '10000',
  },
  AIRTEL: {
    '2GB_30days': '1499.93',
    '3GB_30days': '1999.91',
    '4GB_30days': '2499.92',
    '8GB_30days': '2999.92',
    '10GB_30days': '3999.91',
    '13GB_30days': '4999.92',
    '18GB_30days': '5999.91',
    '25GB_30days': '7999.91',
  },
  '9MOBILE': {
    '500MB_30days': '500',
    '1GB_30days': '1000',
    '2GB_30days': '2000',
    '3GB_30days': '3000',
    '5GB_30days': '5000',
    '10GB_30days': '10000',
  },
};

// --- Airtime purchase ---
app.post('/api/airtime', async (req, res) => {
  try {
    const { network, phone, amount } = req.body;
    const networkCode = NETWORK_CODES[network?.toUpperCase()];
    if (!networkCode) {
      return res.status(400).json({ error: 'Unknown network' });
    }

    const requestId = `OLT${Date.now()}`;

    const response = await axios.get(`${BASE_URL}/APIAirtimeV1.asp`, {
      params: {
        UserID: CLUBKONNECT_USERID,
        APIKey: CLUBKONNECT_APIKEY,
        MobileNetwork: networkCode,
        Amount: amount,
        MobileNumber: phone,
        RequestID: requestId,
      },
    });

    res.json({ requestId, result: response.data });
  } catch (err) {
    console.error('Airtime error:', err.message);
    res.status(500).json({ error: 'Airtime purchase failed' });
  }
});

// --- Data bundle purchase ---
app.post('/api/data', async (req, res) => {
  try {
    const { network, phone, planKey } = req.body;
    const netKey = network?.toUpperCase();
    const networkCode = NETWORK_CODES[netKey];
    const dataPlanId = DATA_PLANS[netKey]?.[planKey];

    if (!networkCode) {
      return res.status(400).json({ error: 'Unknown network' });
    }
    if (!dataPlanId) {
      return res.status(400).json({ error: 'Data plan not configured yet — add its ID to DATA_PLANS' });
    }

    const requestId = `OLT${Date.now()}`;

    const response = await axios.get(`${BASE_URL}/APIDatabundleV1.asp`, {
      params: {
        UserID: CLUBKONNECT_USERID,
        APIKey: CLUBKONNECT_APIKEY,
        MobileNetwork: networkCode,
        DataPlan: dataPlanId,
        MobileNumber: phone,
        RequestID: requestId,
      },
    });

    res.json({ requestId, result: response.data });
  } catch (err) {
    console.error('Data bundle error:', err.message);
    res.status(500).json({ error: 'Data purchase failed' });
  }
});

// --- Query transaction status ---
app.get('/api/status/:orderId', async (req, res) => {
  try {
    const response = await axios.get(`${BASE_URL}/APIQueryV1.asp`, {
      params: {
        UserID: CLUBKONNECT_USERID,
        APIKey: CLUBKONNECT_APIKEY,
        OrderID: req.params.orderId,
      },
    });
    res.json(response.data);
  } catch (err) {
    console.error('Status query error:', err.message);
    res.status(500).json({ error: 'Status check failed' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`OLT VTU backend running on port ${PORT}`));
