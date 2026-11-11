const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON and URL-encoded bodies (supports incoming postbacks & API calls)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware for monitoring traffic
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} request received at ${req.path}`);
    next();
});

// Root health-check endpoint
app.get('/', (req, res) => {
    res.status(200).json({
        status: 'online',
        service: 'Gemk Website Backend',
        timestamp: new Date().toISOString()
    });
});

// Postback endpoint (supports both GET and POST requests commonly used by ad networks and tracking pixels)
app.all('/api/postback', (req, res) => {
    const postbackData = req.method === 'GET' ? req.query : req.body;
    
    console.log('--- Postback Received ---');
    console.log(JSON.stringify(postbackData, null, 2));

    // TODO: Insert your conversion tracking, database logging, or CRM update logic here

    res.status(200).json({
        success: true,
        message: 'Postback received and processed successfully',
        data: postbackData
    });
});

// Call handling endpoint (for incoming call webhooks or telephony updates)
app.post('/api/call', (req, res) => {
    const callData = req.body;

    console.log('--- Call Event Received ---');
    console.log(JSON.stringify(callData, null, 2));

    // TODO: Insert your call handling, status updates, or automated routing logic here

    res.status(200).json({
        success: true,
        message: 'Call payload recorded successfully',
        data: callData
    });
});

// Global Error Handling Middleware
app.use((err, req, res, next) => {
    console.error('Unhandled server error:', err.stack);
    res.status(500).json({
        success: false,
        error: 'Internal Server Error'
    });
});

// Initialize server listening on specified port
app.listen(PORT, () => {
    console.log(`Gemk server is running successfully on port ${PORT}`);
});
