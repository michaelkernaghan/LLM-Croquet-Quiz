const fs = require('fs');

function validateQuestionAnswerMatch(question, answers) {
    // Year questions
    if (question.toLowerCase().match(/^(when|which year)/)) {
        const validAnswers = answers.every(a => !isNaN(a.answer) || a.answer.match(/^\d{4}$/));
        if (!validAnswers) {
            console.log(`Question type mismatch: "${question}" expects years but has non-year answers`);
            return false;
        }
    }
    
    // Person questions
    if (question.toLowerCase().match(/^(who|which (theorist|philosopher|critic))/)) {
        const validAnswers = answers.every(a => isNaN(a.answer));
        if (!validAnswers) {
            console.log(`Question type mismatch: "${question}" expects names but has non-name answers`);
            return false;
        }
    }
    
    return true;
}

// Read questions
const questions = JSON.parse(fs.readFileSync('./src/frontend/art-questions.json'));

// Validate all questions
const invalidQuestions = questions.questions.filter(q => 
    !validateQuestionAnswerMatch(q.question, q.answers)
);

console.log('\nFound', invalidQuestions.length, 'questions with type mismatches:');
invalidQuestions.forEach(q => {
    console.log('\nQuestion:', q.question);
    console.log('Answers:', q.answers.map(a => a.answer).join(', '));
}); 