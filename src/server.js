const express = require('express');
const path = require('path');
const app = express();
const port = 3000;

// Serve static files from the frontend directory
app.use(express.static(path.join(__dirname, 'frontend')));

// Basic route for the main page
app.get('/', (req, res) => {
    console.log('Received request for homepage');
    const template = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Art Theory Quiz</title>
            <link rel="stylesheet" href="styles.css">
        </head>
        <body>
            <div class="layout">
                <div class="sidebar-left">
                    <div class="high-scores">
                        <h2>Today's High Scores</h2>
                        <div id="today-scores"></div>
                    </div>
                </div>

                <div class="main-content">
                    <div id="start-screen">
                        <h2>Art Theory Quiz</h2>
                        <p>Enter your details to start the quiz</p>
                        <div class="name-input-section">
                            <input type="text" id="player-name" placeholder="Enter your name">
                            <input type="text" id="password-input" placeholder="Enter password">
                            <div id="password-error" class="error-message"></div>
                            <button id="start-button" disabled>Start Quiz</button>
                        </div>
                    </div>

                    <div id="quiz-screen" style="display: none;">
                        <!-- Quiz content -->
                    </div>
                </div>

                <div class="sidebar-right">
                    <h2>All-Time High Scores</h2>
                    <div id="overall-scores"></div>
                </div>
            </div>
            <footer class="app-footer">
                <div class="footer-content">
                    <span class="version">v1.0.0-alpha.3 (Dec 2023)</span>
                    <span class="separator">|</span>
                    <span class="git-info">
                        <a href="https://github.com/michaelkernaghan/critical-theory-quiz" target="_blank">
                            Source
                        </a>
                    </span>
                    <span class="separator">|</span>
                    <span class="attribution">
                        Built with Claude 3.5 Sonnet (anthropic-ai/claude-3-sonnet@20240229)
                    </span>
                    <span class="separator">|</span>
                    <span class="funding">
                        Funded by <a href="https://standardtesting.io/llm-art.html" target="_blank">
                            Language Model Conceptual Art Consortium
                        </a>
                    </span>
                </div>
            </footer>
            <script src="app.js"></script>
        </body>
        </html>
    `;
    res.send(template);
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