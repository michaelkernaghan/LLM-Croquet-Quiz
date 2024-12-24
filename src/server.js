const express = require('express');
const path = require('path');
const app = express();
const port = 3000;

// Serve static files from the frontend directory
app.use(express.static(path.join(__dirname, 'frontend')));

// Basic route for the main page
app.get('/', (req, res) => {
    console.log('Received request for homepage');
    res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// Start the server
const server = app.listen(port, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${port}`);
    console.log(`Current directory: ${__dirname}`);
    console.log(`Looking for frontend files in: ${path.join(__dirname, 'frontend')}`);
}).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.log(`Port ${port} is already in use. Please stop other servers or use a different port.`);
        process.exit(1);
    } else {
        console.error('Server error:', err);
    }
});