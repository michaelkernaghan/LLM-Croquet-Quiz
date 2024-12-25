let allQuestions = [];
let currentQuestions = [];
let currentQuestionIndex = 0;
let score = 0;
const QUESTIONS_PER_GAME = 10;
let questionsLoaded = false;

// Add color scheme for different achievement levels
const achievementColors = {
    'Robert Fulford': '#FFD700',    // Gold
    'Reg Bamford': '#C0C0C0',       // Silver
    'John Solomon': '#CD7F32',      // Bronze
    'Keith Wylie': '#90EE90',       // Light green
    'Chris Clarke': '#87CEEB',      // Sky blue
    'John Prince': '#DDA0DD',       // Plum
    'Pat Cotter': '#F0E68C',        // Khaki
    'David Openshaw': '#FFB6C1'     // Light pink
};

// Fetch questions from JSON file
fetch('croquet-questions.json')
    .then(response => response.json())
    .then(data => {
        allQuestions = data.questions;
        questionsLoaded = true;
        console.log(`Loaded ${allQuestions.length} total questions`);
    })
    .catch(error => {
        console.error('Error loading questions:', error);
        alert('Error loading questions. Please refresh the page.');
    });

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function selectRandomQuestions() {
    if (!questionsLoaded || !allQuestions.length) {
        console.error('Questions not loaded yet');
        return [];
    }
    let shuffledQuestions = [...allQuestions];
    shuffleArray(shuffledQuestions);
    return shuffledQuestions.slice(0, QUESTIONS_PER_GAME);
}

function startQuiz() {
    const nameInput = document.getElementById('nameInput').value;

    if (!nameInput) {
        alert('Please enter your name');
        return;
    }

    if (!questionsLoaded) {
        alert('Please wait for questions to load');
        return;
    }

    // Select random questions for this game
    currentQuestions = selectRandomQuestions();
    if (!currentQuestions.length) {
        alert('Error loading questions. Please refresh the page.');
        return;
    }

    currentQuestionIndex = 0;
    score = 0;
    
    // Reset score display
    document.getElementById('currentScore').textContent = '0';
    document.getElementById('currentTotal').textContent = '0';

    document.getElementById('startQuiz').style.display = 'none';
    document.getElementById('quizContent').style.display = 'block';
    showQuestion();
}

function showQuestion() {
    if (!currentQuestions[currentQuestionIndex]) {
        console.error('No question available at index:', currentQuestionIndex);
        return;
    }

    const questionContainer = document.getElementById('questionContainer');
    const answerButtons = document.querySelectorAll('.answer-button');
    const nextButton = document.getElementById('nextButton');

    // Update question counter
    document.getElementById('currentQuestion').textContent = currentQuestionIndex + 1;
    document.getElementById('totalQuestions').textContent = QUESTIONS_PER_GAME;

    // Show question
    const currentQuestion = currentQuestions[currentQuestionIndex];
    console.log('Current question:', currentQuestion); // Debug log
    questionContainer.textContent = currentQuestion.question;

    // Reset and populate answer buttons
    const answers = currentQuestion.answers;
    console.log('Answers:', answers); // Debug log

    answerButtons.forEach((button, index) => {
        const answer = answers[index];
        if (!answer) {
            console.error('No answer available at index:', index);
            button.style.display = 'none';
            return;
        }
        
        // Set button text and properties
        button.textContent = answer.answer;
        button.style.display = 'flex';
        button.style.visibility = 'visible';
        button.style.opacity = '1';
        button.disabled = false;
        button.className = 'answer-button';
        
        // Add click handler
        button.onclick = () => selectAnswer(answer.correct);
        
        console.log(`Button ${index + 1} text:`, button.textContent); // Debug log
    });

    nextButton.style.display = 'none';
}

function selectAnswer(isCorrect) {
    if (isCorrect) {
        score++;
        // Update running score
        document.getElementById('currentScore').textContent = score;
    }
    document.getElementById('currentTotal').textContent = currentQuestionIndex + 1;

    const currentQuestion = currentQuestions[currentQuestionIndex];
    const buttons = document.querySelectorAll('.answer-button');
    const correctAnswer = currentQuestion.answers.find(a => a.correct);

    buttons.forEach(button => {
        button.disabled = true;
        if (button.innerText === correctAnswer.answer) {
            button.classList.add('correct');
            // Show explanation for all questions
            const explanationDiv = document.createElement('div');
            explanationDiv.className = 'answer-explanation';
            
            // Build explanation text
            let explanationText = `Source: ${currentQuestion.citation}`;
            
            // Add theory explanation if available
            if (currentQuestion.correctTheory && currentQuestion.correctTheory.summary) {
                explanationText += `\n\n${currentQuestion.correctTheory.summary}`;
            }
            
            explanationDiv.innerText = explanationText;
            button.appendChild(explanationDiv);
        } else if (button.innerText === event.target.innerText && !isCorrect) {
            button.classList.add('incorrect');
        }
    });

    document.getElementById('nextButton').style.display = 'block';
}

function handleNext() {
    currentQuestionIndex++;
    if (currentQuestionIndex < QUESTIONS_PER_GAME) {
        showQuestion();
    } else {
        showResults();
    }
}

function showResults() {
    document.getElementById('quizContent').style.display = 'none';
    document.getElementById('results').style.display = 'block';
    
    const rating = getRating(score);
    
    // Create results HTML
    const resultsHTML = `
        <h2>Quiz Complete!</h2>
        <div class="score-display">
            <span>Your final score: </span>
            <span class="score-number">${score}/${QUESTIONS_PER_GAME}</span>
        </div>
        <div class="achievement-status">
            You have achieved ${rating} status!
        </div>
        <button onclick="restartQuiz()" class="play-again-button">Play Again</button>
    `;
    
    document.getElementById('results').innerHTML = resultsHTML;
    
    // Save score
    const name = document.getElementById('nameInput').value;
    saveScore(name, score);
    updateScoreboards();
}

function getRating(score) {
    const percentage = (score / QUESTIONS_PER_GAME) * 100;
    if (percentage >= 90) return 'Robert Fulford';      // World Champion level
    if (percentage >= 80) return 'Reg Bamford';        // Grandmaster level
    if (percentage >= 70) return 'John Solomon';       // Master level
    if (percentage >= 60) return 'Keith Wylie';        // Expert level
    if (percentage >= 50) return 'Chris Clarke';       // Advanced level
    if (percentage >= 40) return 'John Prince';        // Intermediate level
    if (percentage >= 30) return 'Pat Cotter';         // Improving level
    return 'David Openshaw';                           // Beginner level
}

function saveScore(name, score) {
    const today = new Date().toISOString().split('T')[0];
    const rating = getRating(score);
    const scoreData = {
        name,
        score,
        rating,
        date: today
    };

    // Save to today's scores
    let todayScores = JSON.parse(localStorage.getItem('croquetQuizScores')) || {};
    if (!todayScores[today]) {
        todayScores[today] = [];
    }
    todayScores[today].push(scoreData);
    localStorage.setItem('croquetQuizScores', JSON.stringify(todayScores));

    // Update all-time high scores
    let allTimeScores = JSON.parse(localStorage.getItem('croquetQuizAllTimeScores')) || [];
    allTimeScores.push(scoreData);
    allTimeScores.sort((a, b) => b.score - a.score);
    allTimeScores = allTimeScores.slice(0, 10); // Keep only top 10
    localStorage.setItem('croquetQuizAllTimeScores', JSON.stringify(allTimeScores));
}

function updateScoreboards() {
    // Update today's scores
    const today = new Date().toISOString().split('T')[0];
    const todayScores = JSON.parse(localStorage.getItem('croquetQuizScores')) || {};
    const todayScoresList = todayScores[today] || [];
    
    const todayScoresHtml = todayScoresList
        .sort((a, b) => b.score - a.score)
        .map(score => {
            const color = achievementColors[score.rating];
            return `<div style="color: ${color}; font-weight: bold;">
                ${score.name}: ${score.score}/${QUESTIONS_PER_GAME}
            </div>`;
        })
        .join('');
    
    document.getElementById('todayScores').innerHTML = todayScoresHtml || 'No scores yet today';

    // Update all-time scores
    const allTimeScores = JSON.parse(localStorage.getItem('croquetQuizAllTimeScores')) || [];
    const allTimeScoresHtml = allTimeScores
        .map(score => {
            const color = achievementColors[score.rating];
            return `<div style="color: ${color}; font-weight: bold;">
                ${score.name}: ${score.score}/${QUESTIONS_PER_GAME}
            </div>`;
        })
        .join('');
    
    document.getElementById('allTimeScores').innerHTML = allTimeScoresHtml || 'No scores yet';
}

function resetScores() {
    const today = new Date().toISOString().split('T')[0];
    let todayScores = JSON.parse(localStorage.getItem('croquetQuizScores')) || {};
    todayScores[today] = [];
    localStorage.setItem('croquetQuizScores', JSON.stringify(todayScores));
    updateScoreboards();
}

function restartQuiz() {
    // Select new random questions for the new game
    currentQuestions = selectRandomQuestions();
    currentQuestionIndex = 0;
    score = 0;
    document.getElementById('results').style.display = 'none';
    document.getElementById('startQuiz').style.display = 'block';
    // Don't clear the name input
    startQuiz(); // Automatically start the quiz since we have the name
}

// Initialize scoreboards
updateScoreboards(); 