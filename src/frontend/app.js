// Quiz state
let currentQuestion = 0;
const totalQuestions = 10;
let playerName = '';
let scores = {
    today: [],
    overall: []
};
let questions = [];  // Will be loaded from JSON

// Load questions from JSON file
fetch('art-questions.json')
    .then(response => response.json())
    .then(data => {
        questions = data.questions;
        // Shuffle questions
        questions = questions.sort(() => Math.random() - 0.5);
        console.log(`Loaded ${questions.length} questions`);
    })
    .catch(error => console.error('Error loading questions:', error));

// DOM Elements
const playerNameInput = document.getElementById('player-name');
const questionDisplay = document.querySelector('.question-display');
const answersGrid = document.querySelector('.answers-grid');
const currentQuestionSpan = document.getElementById('current-question');
const totalQuestionsSpan = document.getElementById('total-questions');
const todayScores = document.getElementById('today-scores');
const overallScores = document.getElementById('overall-scores');
const timeLeftDisplay = document.getElementById('time-left');
const pauseButton = document.getElementById('pause-button');
const skipButton = document.getElementById('skip-button');
const startScreen = document.getElementById('start-screen');
const quizScreen = document.getElementById('quiz-screen');
const startButton = document.getElementById('start-button');
const passwordInput = document.getElementById('password-input');
const passwordError = document.getElementById('password-error');
const CORRECT_PASSWORD = 'banksy';

let timer = null;
let timeLeft = 10;
let isPaused = false;

// Add current score tracking
let currentScore = 0;

// Load saved scores from localStorage
function loadSavedScores() {
    const savedScores = localStorage.getItem('artQuizScores');
    if (savedScores) {
        scores = JSON.parse(savedScores);
        
        // Clear today's scores if they're from a previous day
        const today = new Date().toDateString();
        const savedDate = localStorage.getItem('artQuizLastDate');
        if (savedDate !== today) {
            scores.today = [];
            localStorage.setItem('artQuizLastDate', today);
        }
    }
    updateScoreboards();
}

// Save scores to localStorage
function saveScores() {
    localStorage.setItem('artQuizScores', JSON.stringify(scores));
}

function startTimer() {
    timeLeft = 10;
    if (timer) clearInterval(timer);
    
    timer = setInterval(() => {
        if (!isPaused) {
            timeLeft--;
            timeLeftDisplay.textContent = timeLeft;
            
            if (timeLeft <= 0) {
                clearInterval(timer);
                handleTimeout();
            }
        }
    }, 1000);
}

function handleTimeout() {
    handleAnswer(-1, currentQuestion); // -1 indicates timeout
}

function showQuestion(index) {
    const question = questions[index];
    if (!question) return;

    questionDisplay.textContent = question.question;
    answersGrid.innerHTML = '';
    timeLeftDisplay.textContent = '10';
    isPaused = false;
    pauseButton.textContent = '⏸️';

    // Show current score
    currentQuestionSpan.textContent = `Score: ${currentScore}/10 - Question ${currentQuestion + 1}`;

    question.answers.forEach((answerObj) => {
        const button = document.createElement('button');
        button.textContent = answerObj.answer;
        button.addEventListener('click', () => handleAnswer(answerObj.correct, index, answerObj.answer));
        answersGrid.appendChild(button);
    });

    startTimer();
}

function handleAnswer(isCorrect, questionIndex, selectedAnswer) {
    clearInterval(timer);
    const question = questions[questionIndex];

    // Show feedback
    const buttons = answersGrid.querySelectorAll('button');
    buttons.forEach((button) => {
        button.disabled = true;
        const correctAnswer = question.answers.find(a => a.correct).answer;
        
        if (isCorrect && button.textContent === selectedAnswer) {
            // If answer is correct, show green background
            button.style.backgroundColor = '#4CAF50';
            button.style.color = 'white';
            currentScore++;
        } else if (!isCorrect) {
            if (button.textContent === selectedAnswer) {
                // Show wrong answer in red
                button.style.backgroundColor = '#f44336';
                button.style.color = 'white';
            }
            if (button.textContent === correctAnswer) {
                // Show correct answer in bold green text
                button.style.color = '#4CAF50';
                button.style.fontWeight = 'bold';
            }
        }
    });

    // Wait before showing next question
    setTimeout(() => {
        currentQuestion++;
        
        if (currentQuestion < Math.min(totalQuestions, questions.length)) {
            showQuestion(currentQuestion);
        } else {
            endQuiz();
        }
    }, 1500);
}

function initQuiz() {
    // Clear inputs on page load
    playerNameInput.value = '';
    passwordInput.value = '';
    playerName = '';
    startButton.disabled = true;
    
    loadSavedScores();

    function validateInputs() {
        const nameValid = playerNameInput.value.trim() !== '';
        const passwordValid = passwordInput.value === CORRECT_PASSWORD;
        
        if (passwordInput.value && !passwordValid) {
            passwordError.textContent = 'Incorrect password';
            passwordInput.classList.add('error');
            passwordInput.classList.remove('password-valid');
        } else if (passwordValid) {
            passwordError.textContent = '';
            passwordInput.classList.remove('error');
            passwordInput.classList.add('password-valid');
        } else {
            passwordError.textContent = '';
            passwordInput.classList.remove('error');
            passwordInput.classList.remove('password-valid');
        }
        
        startButton.disabled = !(nameValid && passwordValid);
    }

    playerNameInput.addEventListener('input', validateInputs);
    passwordInput.addEventListener('input', validateInputs);

    startButton.addEventListener('click', () => {
        if (playerName && passwordInput.value === CORRECT_PASSWORD) {
            startScreen.style.display = 'none';
            quizScreen.style.display = 'block';
            startQuiz();
        }
    });

    updateScoreboards();
    currentQuestionSpan.textContent = currentQuestion + 1;
    totalQuestionsSpan.textContent = Math.min(totalQuestions, questions.length);
}

function startQuiz() {
    currentQuestion = 0;
    currentScore = 0;  // Reset score
    showQuestion(currentQuestion);
}

// Update scoreboards and endQuiz functions remain the same
function updateScoreboards() {
    const sortedToday = [...scores.today].sort((a, b) => b.score - a.score);
    const sortedOverall = [...scores.overall].sort((a, b) => b.score - a.score);

    todayScores.innerHTML = sortedToday
        .slice(0, 5)
        .map(score => `<div class="score-entry">
            <span>${score.name}</span>
            <span>${score.score}/10</span>
        </div>`)
        .join('');

    overallScores.innerHTML = sortedOverall
        .slice(0, 5)
        .map(score => `<div class="score-entry">
            <span>${score.name}</span>
            <span>${score.score}/10</span>
        </div>`)
        .join('');
}

function endQuiz() {
    clearInterval(timer);
    questionDisplay.textContent = 'Quiz Complete!';
    answersGrid.innerHTML = `<p>Your final score: ${currentScore}/10</p>`;
    
    // Update high scores
    scores.today.push({ name: playerName, score: currentScore });
    scores.overall.push({ name: playerName, score: currentScore });
    
    // Sort and limit to top 5 scores
    scores.today.sort((a, b) => b.score - a.score);
    scores.overall.sort((a, b) => b.score - a.score);
    scores.today = scores.today.slice(0, 5);
    scores.overall = scores.overall.slice(0, 5);
    
    saveScores();
    updateScoreboards();
}

// Fix pause functionality
pauseButton.addEventListener('click', () => {
    isPaused = !isPaused;
    pauseButton.textContent = isPaused ? '▶️' : '⏸️';
    
    // Add visual feedback for paused state
    if (isPaused) {
        answersGrid.style.opacity = '0.7';
        questionDisplay.style.opacity = '0.7';
    } else {
        answersGrid.style.opacity = '1';
        questionDisplay.style.opacity = '1';
    }
});

// Add skip functionality
skipButton.addEventListener('click', () => {
    clearInterval(timer);
    currentQuestion++;
    currentQuestionSpan.textContent = currentQuestion + 1;
    
    if (currentQuestion < questions.length) {
        showQuestion(currentQuestion);
    } else {
        endQuiz();
    }
});

document.addEventListener('DOMContentLoaded', initQuiz); 