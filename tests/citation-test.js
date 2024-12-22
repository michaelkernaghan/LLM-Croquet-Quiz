const puppeteer = require('puppeteer');
const assert = require('assert');
const { spawn } = require('child_process');
const { historicalData } = require('../fix-duplicate-answers.js');

function getRandomTheoristFirstName() {
    const theorists = Object.keys(historicalData);
    const randomTheorist = theorists[Math.floor(Math.random() * theorists.length)];
    // Get first name (everything before the first space)
    const firstName = randomTheorist.split(' ')[0];
    return firstName;
}

async function startServer() {
    return new Promise((resolve) => {
        const server = spawn('node', ['src/server.js']);
        
        server.stdout.on('data', (data) => {
            console.log(`Server: ${data}`);
            if (data.toString().includes('Server running')) {
                resolve(server);
            }
        });

        server.stderr.on('data', (data) => {
            console.error(`Server Error: ${data}`);
        });
    });
}

async function testQuizAndCitations() {
    // Ensure screenshots directory exists
    const fs = require('fs');
    const screenshotsDir = './test-screenshots';
    if (!fs.existsSync(screenshotsDir)){
        fs.mkdirSync(screenshotsDir);
    }
    
    console.log('Starting server...');
    const server = await startServer();
    console.log('Server started, waiting for warmup...');
    await new Promise(resolve => setTimeout(resolve, 1000));

    const browser = await puppeteer.launch({ 
        headless: 'new',  // Use new headless mode
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    
    try {
        // Wait for server to be ready
        let retries = 5;
        while (retries > 0) {
            try {
                await page.goto('http://localhost:3000', {
                    waitUntil: 'networkidle0',
                    timeout: 5000
                });
                // Enable console log from the page
                page.on('console', msg => console.log('Browser:', msg.text()));
                
                // Debug: Log page content
                const content = await page.content();
                console.log('\nPage HTML:', content);
                break;
            } catch (e) {
                console.log(`Retrying connection... (${retries} attempts left)`);
                retries--;
                if (retries === 0) throw e;
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        console.log('🚀 Starting UI test...');

        // Test citation info first
        console.log('\n📝 Checking citations...');
        await testCitationInfo(page);
        
        // Start the quiz
        console.log('\n🎯 Testing quiz interaction...');
        const playerName = getRandomTheoristFirstName();
        await page.type('#player-name', playerName);
        console.log(`Entered username: ${playerName}`);
        
        await page.type('#password-input', 'banksy');
        console.log('Entered password');
        
        // Wait for button to be enabled
        console.log('Waiting for start button to be enabled...');
        await page.waitForFunction(() => {
            const button = document.querySelector('#start-button');
            return !button.disabled;
        }, { timeout: 5000 });
        
        // Debug: Check button state
        const buttonState = await page.evaluate(() => {
            const button = document.querySelector('#start-button');
            return {
                disabled: button.disabled,
                text: button.textContent,
                classes: button.className
            };
        });
        console.log('Button state:', buttonState);
        
        // Ensure password validation happened
        await page.waitForFunction(() => {
            const error = document.querySelector('#password-error');
            return !error || !error.textContent;
        }, { timeout: 5000 });
        
        await page.click('#start-button');
        await page.waitForSelector('.question-display');
        
        // Take a screenshot of each step
        await page.screenshot({ 
            path: './test-screenshots/quiz-start.png',
            fullPage: true 
        });
        
        // Answer some questions
        let score = 0;
        for (let i = 0; i < 3; i++) {
            console.log(`\nQuestion ${i + 1}:`);
            
            // Get question text
            const questionText = await page.$eval('.question-display', el => el.textContent);
            console.log(`- ${questionText}`);
            
            // Take screenshot of each question
            await page.screenshot({ 
                path: `./test-screenshots/question-${i+1}.png`,
                fullPage: true 
            });
            
            // Check for LLM Art bonus
            const hasBonus = await page.evaluate(() => {
                return !!document.querySelector('.bonus-note');
            });
            if (hasBonus) {
                console.log('  ⭐ LLM Art Bonus Available');
            }
            
            // Select an answer (first correct one we find)
            const buttons = await page.$$('.answers-grid button');
            if (buttons.length === 0) {
                throw new Error('No answer buttons found');
            }
            
            let answered = false;
            for (const button of buttons) {
                if (!answered) {
                    // Wait for button to be clickable
                    await page.waitForFunction(
                        button => !button.disabled,
                        { timeout: 2000 },
                        button
                    );
                    
                    await button.click();
                    // Wait to see if it was correct
                    const isCorrect = await page.evaluate(btn => !btn.classList.contains('incorrect'), button);
                    if (isCorrect) {
                        score++;
                        console.log('  ✅ Correct answer selected');
                    } else {
                        console.log('  ❌ Incorrect answer selected');
                    }
                    answered = true;
                }
            }
            
            if (!answered) {
                throw new Error('Failed to answer question');
            }
            
            // Wait for next question to appear
            if (i < 2) { // Don't wait after last question
                await page.waitForFunction(
                    (prevQ) => {
                        const counter = document.querySelector('#current-question');
                        // Check if counter has increased from previous question
                        return counter && parseInt(counter.textContent) > prevQ;
                    },
                    { timeout: 5000 },
                    i + 1  // Previous question number
                );
                
                // Wait a bit for animations to complete
                await new Promise(resolve => setTimeout(resolve, 500));
                
                // Verify new question is loaded
                const newQuestionText = await page.$eval('.question-display', el => el.textContent);
                console.log(`  ➡️ Next question loaded: ${newQuestionText.substring(0, 50)}...`);
            }
        }
        
        console.log(`\n📊 Final Score: ${score}/3`);
        console.log('✅ Quiz interaction test completed successfully!');
        
    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        if (page) {
            await page.screenshot({ 
                path: './test-screenshots/error-state.png',
                fullPage: true 
            });
        }
        throw error;
    } finally {
        if (browser) await browser.close();
        if (server) server.kill();
        console.log('Server stopped');
    }
}

async function testCitationInfo(page) {
    // Wait for all citation elements to be present
    await page.waitForSelector('.app-footer');
    await page.waitForSelector('.version');
    await page.waitForSelector('.attribution');

    console.log('Found all citation elements');

    // Check version info
    const versionInfo = await page.evaluate(() => {
        const el = document.querySelector('.version');
        return el ? el.textContent : '';
    });
    assert(versionInfo.includes('1.0.0'), 'Version information not found');
    console.log('✓ Version info verified');
    
    // Check Claude citation
    const claudeInfo = await page.evaluate(() => {
        const el = document.querySelector('.attribution');
        return el ? el.textContent : '';
    });
    assert(
        claudeInfo.includes('Claude 3') && 
        claudeInfo.includes('Sonnet'),
        'Assistant information not found'
    );
    console.log('✓ Assistant info verified');
    
    // Check LLM art framework citation
    const sourceLink = await page.evaluate(() => {
        const el = document.querySelector('.git-info a');
        return el ? {
            text: el.textContent.trim(),
            href: el.href
        } : null;
    });
    assert(sourceLink, 'Source link not found');
    assert(
        sourceLink.text.includes('Source') &&
        sourceLink.href.includes('github.com'),
        'Source link incorrect'
    );
    console.log('✓ Source link verified');
}

// Run the tests
testQuizAndCitations();

module.exports = { testQuizAndCitations }; 