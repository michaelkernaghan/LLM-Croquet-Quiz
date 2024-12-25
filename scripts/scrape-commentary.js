import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'https://croquetscores.com';
const COMMENTARY_URL = `${BASE_URL}/2022/ac/macrobertson-shield/commentaries`;
const OUTPUT_DIR = path.join(__dirname, '../rag/commentary');

async function scrapeCommentaries() {
    // Create output directory if it doesn't exist
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    
    // Set longer timeout
    page.setDefaultNavigationTimeout(60000);
    page.setDefaultTimeout(60000);

    try {
        // Fetch main commentary page
        await page.goto(COMMENTARY_URL);
        await page.waitForSelector('a');

        // Extract individual commentary links
        const commentaryLinks = await page.evaluate(() => {
            const links = [];
            document.querySelectorAll('a').forEach(link => {
                const href = link.getAttribute('href');
                if (href && href.includes('commentaries') && !href.includes('create') && !href.includes('#')) {
                    links.push(href);
                }
            });
            return links;
        });

        const uniqueLinks = [...new Set(commentaryLinks)].map(link => 
            link.startsWith('http') ? link : `${BASE_URL}${link}`
        );

        console.log(`Found ${uniqueLinks.length} unique commentary links`);

        // Process each commentary
        for (const link of uniqueLinks) {
            console.log(`Processing: ${link}`);
            try {
                const commentaryData = await scrapeCommentaryPage(page, link);
                if (commentaryData && commentaryData.content.trim()) {
                    // Save to JSON file
                    const filename = `commentary-${Date.now()}.json`;
                    fs.writeFileSync(
                        path.join(OUTPUT_DIR, filename),
                        JSON.stringify(commentaryData, null, 2)
                    );
                    console.log(`Saved commentary: ${filename}`);
                } else {
                    console.log(`No content found for: ${link}`);
                }
                // Add a small delay to avoid overwhelming the server
                await new Promise(resolve => setTimeout(resolve, 2000));
            } catch (error) {
                console.error(`Error processing ${link}:`, error.message);
                continue;
            }
        }

    } catch (error) {
        console.error('Error scraping commentaries:', error);
    } finally {
        await browser.close();
    }
}

async function scrapeCommentaryPage(page, url) {
    try {
        await page.goto(url);
        await page.waitForSelector('.container');

        const data = await page.evaluate(() => {
            const title = document.querySelector('.page-header h1')?.textContent.trim() || 
                         document.querySelector('h1')?.textContent.trim() || '';
            
            // Extract author from title
            const titleMatch = title.match(/Commentary by (.+)$/);
            const author = titleMatch ? titleMatch[1] : '';
            
            // Get all paragraphs from the main content area
            const paragraphs = Array.from(document.querySelectorAll('.container .row p'))
                .map(p => p.textContent.trim())
                .filter(text => text.length > 0);
            
            const content = paragraphs.join('\n\n');

            return {
                title,
                author,
                content,
                paragraphCount: paragraphs.length
            };
        });

        return {
            ...data,
            url,
            metadata: {
                tournament: 'MacRobertson Shield',
                year: '2022',
                format: 'Association Croquet'
            }
        };
    } catch (error) {
        console.error(`Error scraping commentary page ${url}:`, error);
        return null;
    }
}

// Run the scraper
scrapeCommentaries(); 