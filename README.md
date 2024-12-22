# Critical Theory Quiz

A quiz application testing knowledge of art theory, critical theory, and digital aesthetics.

## Features

- Interactive quiz with timed questions
- Password-protected access
- High score tracking (daily and all-time)
- Historical reference guide
- LLM Art Framework integration
- Pause and skip functionality
- Responsive design

## Technical Details

### Built With
- Node.js
- Express
- Puppeteer (for testing)
- Claude 3.5 Sonnet (for content generation and assistance)

### Project Structure

```
critical-theory-quiz/
src/
  server.js
  frontend/
    app.js
    styles.css
    art-questions.json
    StartScreen.js
scripts/
  build-reference.js
  validate-references.js
tests/
  citation-test.js
public/
  critical-theory-reference.html
test-screenshots/
```

### Key Components

#### Quiz Engine
- Randomized question selection
- Answer validation
- Score tracking
- Timer functionality
- Pause/Skip controls

#### Reference Guide
- Historical data of theorists
- Active periods
- Major works
- Interactive filtering
- Search functionality

#### Authentication
- Password protection
- Input validation
- Session management

### Testing

#### Automated Tests

npm run test           # Run all tests
npm run test:citations # Test citations and UI
npm run validate:refs  # Validate references

Our test suite includes:
- Citation verification
- UI interaction testing
- Reference data validation
- Screenshot capture
- Random theorist name generation

### Development

# Install dependencies
npm install

# Start development server
npm run dev

# Build reference page
npm run build:reference

# Run tests
npm test

## Content Attribution

- Questions curated from historical sources and LLM Art Framework
- Built with assistance from Claude 3.5 Sonnet (anthropic-ai/claude-3-sonnet@20240229)
- Reference data validated against academic sources

## Features in Detail

### Quiz Interface
- Dynamic question loading
- Visual feedback for answers
- Progress tracking
- Timer with pause function
- Skip option for difficult questions

### Reference Guide
- Searchable theorist database
- Period filtering
- Work chronology
- Category organization
- Interactive filtering

### High Scores
- Daily leaderboard
- All-time records
- Score persistence
- Reset functionality

## Contributing

1. Fork the repository
2. Create your feature branch
3. Run tests: `npm test`
4. Submit pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Claude 3.5 Sonnet for development assistance
- LLM Art Framework for conceptual questions
- Art theory community for validation