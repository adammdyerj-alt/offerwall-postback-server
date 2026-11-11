const express = require('express');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// Secret key from your offerwall provider dashboard (Store securely in Render Environment Variables)
const OFFERWALL_SECRET_KEY = process.env.OFFERWALL_SECRET_KEY || 'your_default_secret_key_here';

// Middleware to parse JSON and URL-encoded form data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// In-memory storage for processed transaction IDs to prevent double crediting
// Note: In production with high traffic, replace this with a database (e.g., MongoDB, PostgreSQL, Redis)
const processedTransactions = new Set();

// Health check route so Render knows your service is live
app.get('/', (req, res) => {
  res.status(200).send('Offerwall Postback Server is live and operational!');
});

// Offerwall Callback / Postback Endpoint
// Supports both GET and POST requests depending on your offerwall network configuration
app.all('/callback', (req, res) => {
  // Extract parameters from query string (GET) or request body (POST)
  const params = req.method === 'GET' ? req.query : req.body;
  
  const {
    user_id,          // Unique user identifier from your platform
    amount,           // Virtual currency amount to reward
    payout,           // USD cash payout value (optional)
    transaction_id,   // Unique transaction token for duplicate prevention
    signature         // Security signature/hash sent by the offerwall
  } = params;

  console.log(`[${new Date().toISOString()}] Received Postback:`, params);

  // 1. Validate required parameters
  if (!user_id || !amount || !transaction_id) {
    console.error('Missing required parameters in postback request.');
    return res.status(400).send('ERROR: Missing required parameters');
  }

  // 2. Check for duplicate transactions (Deduplication)
  if (processedTransactions.has(transaction_id)) {
    console.warn(`Duplicate transaction caught and ignored: ${transaction_id}`);
    // Always return 200 OK so the offerwall stops retrying duplicate webhooks
    return res.status(200).send('OK: Duplicate transaction already processed');
  }

  // 3. Optional Signature Verification (Security check)
  // Check your specific offerwall provider's documentation for their exact hashing formula (e.g., MD5 vs SHA256)
  if (signature) {
    const expectedString = `${user_id}${transaction_id}${OFFERWALL_SECRET_KEY}`;
    const calculatedSignature = crypto.createHash('md5').update(expectedString).digest('hex');

    if (signature !== calculatedSignature) {
      console.error('Security Warning: Invalid postback signature mismatch.');
      return res.status(403).send('ERROR: Invalid signature');
    }
  }

  // 4. Credit the User in your Database
  try {
    // TODO: Insert your database connection and credit logic here:
    // e.g., await db.query('UPDATE users SET balance = balance + $1 WHERE id = $2', [amount, user_id]);
    
    console.log(`SUCCESS: Credited user [${user_id}] with [${amount}] coins. TxID: ${transaction_id}`);

    // Mark this transaction ID as processed
    processedTransactions.add(transaction_id);

    // 5. Respond with HTTP 200 OK to confirm success to the offerwall network
    return res.status(200).send('OK');
  } catch (error) {
    console.error('Database error while crediting user:', error);
    // Return a 500 error status code if credit fails so the offerwall automatically retries
    return res.status(500).send('ERROR: Internal server error');
  }
});

// Start listening on Render's assigned port or default port 3000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
