class ArtQuiz {
    constructor() {
        this.questions = [];
        this.currentQuestionIndex = 0;
        this.correctAnswers = 0;
        this.totalAnswered = 0;
        this.isPaused = false;

        // DOM elements
        this.questionCounter = document.querySelector('.question-counter');
        this.questionDisplay = document.querySelector('.question-display');
        this.answersGrid = document.querySelector('.answers-grid');
        this.pauseButton = document.getElementById('pause-button');
        this.nextButton = document.getElementById('next-button');

        // Initialize
        this.loadQuestions();
        this.setupEventListeners();
        this.loadHighScores();
        this.loadPastQuizzes();

        // Start with landing page
        this.showLandingPage();
    }

    showLandingPage() {
        const container = document.querySelector('.main-content');
        container.innerHTML = `
            <div class="daily-quiz">
                <h2>Daily Quiz</h2>
                
                <div class="quiz-info">
                    <p>Test your knowledge of art theory and critical theory! 
                       Try to get 10 questions correct to complete today's challenge.</p>
                </div>

                <div class="quiz-rules">
                    <h3>QUIZ RULES:</h3>
                    <ul>
                        <li>Answer questions from art theory and critical theory</li>
                        <li>Try to get 10 correct answers</li>
                        <li>Your score will be added to the daily leaderboard</li>
                    </ul>
                </div>

                <button class="continue-quiz" onclick="quiz.startQuiz()">Continue Quiz</button>

                <div class="submit-question">
                    <p>Have a question you would like to see in the Daily Quiz? Submit below!</p>
                    <button class="submit-button">Submit a question</button>
                </div>
            </div>
        `;

        // Add event listener for the continue button
        const continueButton = container.querySelector('.continue-quiz');
        continueButton.addEventListener('click', () => this.startQuiz());
    }

    startQuiz() {
        // Clear landing page and start quiz
        this.loadQuestions();
        this.setupEventListeners();
    }

    async loadQuestions() {
        try {
            console.log('Attempting to load questions...');
            const response = await fetch('/data/art-questions.json');
            console.log('Response status:', response.status);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Questions loaded:', data.questions.length);
            
            this.questions = this.shuffleArray(data.questions);
            this.displayQuestion();
        } catch (error) {
            console.error('Error loading questions:', error);
            console.error('Error details:', {
                message: error.message,
                stack: error.stack
            });
            this.questionDisplay.innerHTML = `Error loading questions: ${error.message}. Please refresh and try again.`;
        }
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    setupEventListeners() {
        this.pauseButton.addEventListener('click', () => this.togglePause());
        this.nextButton.addEventListener('click', () => this.nextQuestion());
        this.answersGrid.addEventListener('click', (e) => {
            if (e.target.classList.contains('answer-option')) {
                this.handleAnswer(e.target);
            }
        });
    }

    displayQuestion() {
        const question = this.questions[this.currentQuestionIndex];
        this.questionCounter.textContent = `${this.totalAnswered + 1} / 100`;
        this.questionDisplay.textContent = question.question;

        this.answersGrid.innerHTML = question.answers.map((answer, index) => `
            <div class="answer-option" data-index="${index}">
                ${answer.answer}
            </div>
        `).join('');
    }

    handleAnswer(answerElement) {
        if (this.isPaused) return;

        const answerIndex = parseInt(answerElement.dataset.index);
        const question = this.questions[this.currentQuestionIndex];
        const isCorrect = question.answers[answerIndex].correct;

        // Visual feedback
        answerElement.classList.add(isCorrect ? 'correct' : 'incorrect');

        // Update scores
        this.totalAnswered++;
        if (isCorrect) this.correctAnswers++;

        // Disable further answers
        this.answersGrid.querySelectorAll('.answer-option').forEach(option => {
            option.style.pointerEvents = 'none';
            if (question.answers[option.dataset.index].correct) {
                option.classList.add('correct');
            }
        });

        // Save progress
        this.saveProgress();

        // Check if we've reached 10 correct answers
        if (this.correctAnswers >= 10) {
            this.endQuiz();
        }
    }

    nextQuestion() {
        if (this.isPaused) return;
        
        this.currentQuestionIndex++;
        if (this.currentQuestionIndex >= this.questions.length) {
            this.currentQuestionIndex = 0; // Loop back to start
        }
        this.displayQuestion();
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        this.pauseButton.textContent = this.isPaused ? '▶️' : '⏸️';
        this.answersGrid.style.pointerEvents = this.isPaused ? 'none' : 'auto';
    }

    endQuiz() {
        const score = Math.round((this.correctAnswers / this.totalAnswered) * 100);
        this.updateHighScores(score);
        this.savePastQuiz(score);

        // Show summary screen
        const container = document.querySelector('.main-content');
        container.innerHTML = `
            <div class="quiz-summary">
                <h2>Quiz Complete!</h2>
                
                <div class="summary-stats">
                    <div class="stat-item">
                        <label>Questions Attempted:</label>
                        <span>${this.totalAnswered}</span>
                    </div>
                    <div class="stat-item">
                        <label>Correct Answers:</label>
                        <span>${this.correctAnswers}</span>
                    </div>
                    <div class="stat-item">
                        <label>Accuracy:</label>
                        <span>${score}%</span>
                    </div>
                </div>

                <div class="summary-message">
                    ${this.correctAnswers >= 10 
                        ? `<p class="success">Congratulations! You've completed today's challenge by getting ${this.correctAnswers} answers correct.</p>`
                        : `<p class="encouragement">Keep trying! You need ${10 - this.correctAnswers} more correct answers to complete the challenge.</p>`
                    }
                </div>

                <div class="summary-actions">
                    <button class="play-again" onclick="location.reload()">Try Again</button>
                    <button class="view-leaderboard">View Leaderboard</button>
                </div>
            </div>
        `;

        // Add CSS for the summary page
        const style = document.createElement('style');
        style.textContent = `
            .quiz-summary {
                text-align: center;
                padding: 2rem;
                max-width: 600px;
                margin: 0 auto;
            }

            .summary-stats {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 1rem;
                margin: 2rem 0;
                padding: 1rem;
                background: #f8f9fa;
                border-radius: 8px;
            }

            .stat-item {
                display: flex;
                flex-direction: column;
                gap: 0.5rem;
            }

            .stat-item label {
                font-size: 0.9rem;
                color: #666;
            }

            .stat-item span {
                font-size: 1.5rem;
                font-weight: bold;
                color: #333;
            }

            .summary-message {
                margin: 2rem 0;
                padding: 1rem;
                border-radius: 8px;
            }

            .success {
                color: #28a745;
                font-weight: bold;
            }

            .encouragement {
                color: #007bff;
                font-weight: bold;
            }

            .summary-actions {
                display: flex;
                gap: 1rem;
                justify-content: center;
                margin-top: 2rem;
            }

            .summary-actions button {
                padding: 0.75rem 1.5rem;
                border: none;
                border-radius: 4px;
                font-weight: bold;
                cursor: pointer;
                transition: background-color 0.2s;
            }

            .play-again {
                background: #28a745;
                color: white;
            }

            .view-leaderboard {
                background: #007bff;
                color: white;
            }
        `;
        document.head.appendChild(style);
    }

    loadHighScores() {
        const todayScores = JSON.parse(localStorage.getItem('todayScores') || '[]');
        const overallScores = JSON.parse(localStorage.getItem('overallScores') || '[]');

        document.getElementById('today-scores').innerHTML = this.formatScores(todayScores);
        document.getElementById('overall-scores').innerHTML = this.formatScores(overallScores);
    }

    updateHighScores(score) {
        const today = new Date().toLocaleDateString();
        const todayScores = JSON.parse(localStorage.getItem('todayScores') || '[]');
        const overallScores = JSON.parse(localStorage.getItem('overallScores') || '[]');

        todayScores.push({ score, date: today });
        overallScores.push({ score, date: today });

        todayScores.sort((a, b) => b.score - a.score);
        overallScores.sort((a, b) => b.score - a.score);

        localStorage.setItem('todayScores', JSON.stringify(todayScores.slice(0, 10)));
        localStorage.setItem('overallScores', JSON.stringify(overallScores.slice(0, 10)));

        this.loadHighScores();
    }

    loadPastQuizzes() {
        const pastQuizzes = JSON.parse(localStorage.getItem('pastQuizzes') || '[]');
        document.getElementById('past-quizzes').innerHTML = this.formatPastQuizzes(pastQuizzes);
    }

    savePastQuiz(score) {
        const pastQuizzes = JSON.parse(localStorage.getItem('pastQuizzes') || '[]');
        pastQuizzes.unshift({
            date: new Date().toLocaleDateString(),
            score
        });
        localStorage.setItem('pastQuizzes', JSON.stringify(pastQuizzes.slice(0, 10)));
        this.loadPastQuizzes();
    }

    formatScores(scores) {
        return scores.map(score => `
            <div class="score-entry">
                <span>${score.date}</span>
                <span>${score.score}%</span>
            </div>
        `).join('');
    }

    formatPastQuizzes(quizzes) {
        return quizzes.map(quiz => `
            <div class="quiz-entry">
                <span class="quiz-date">${quiz.date}</span>
                <span class="quiz-score">${quiz.score}%</span>
            </div>
        `).join('');
    }

    saveProgress() {
        localStorage.setItem('quizProgress', JSON.stringify({
            correctAnswers: this.correctAnswers,
            totalAnswered: this.totalAnswered,
            currentQuestionIndex: this.currentQuestionIndex
        }));
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.quiz = new ArtQuiz();
});