const fs = require('fs');

// Read questions file
const questions = JSON.parse(fs.readFileSync('./src/frontend/art-questions.json'));

// Analyze patterns
const analysis = {
    questionPatterns: {
        whoWrote: 0,
        whichTheory: 0,
        whichConcept: 0,
        howDidInfluence: 0
    },
    
    theoristFrequency: {},
    
    answerDistribution: {
        correctAnswers: {},
        incorrectAnswers: {}
    },
    
    questionTypes: {},
    
    conceptCoverage: new Set()
};

// Analyze and output report
function analyzeQuestions() {
    // Analyze each question
    questions.questions.forEach(q => {
        // Question patterns
        if (q.question.toLowerCase().includes('who wrote')) {
            analysis.questionPatterns.whoWrote++;
        } else if (q.question.toLowerCase().includes('which theory')) {
            analysis.questionPatterns.whichTheory++;
        } else if (q.question.toLowerCase().includes('concept')) {
            analysis.questionPatterns.whichConcept++;
        } else if (q.question.toLowerCase().includes('influence')) {
            analysis.questionPatterns.howDidInfluence++;
        }

        // Theorist frequency
        const correctAnswer = q.answers.find(a => a.correct).answer;
        analysis.theoristFrequency[correctAnswer] = (analysis.theoristFrequency[correctAnswer] || 0) + 1;

        // Answer distribution
        q.answers.forEach(a => {
            if (a.correct) {
                analysis.answerDistribution.correctAnswers[a.answer] = 
                    (analysis.answerDistribution.correctAnswers[a.answer] || 0) + 1;
            } else {
                analysis.answerDistribution.incorrectAnswers[a.answer] = 
                    (analysis.answerDistribution.incorrectAnswers[a.answer] || 0) + 1;
            }
        });

        // Question types
        analysis.questionTypes[q.questionType] = 
            (analysis.questionTypes[q.questionType] || 0) + 1;

        // Concept coverage
        if (q.correctTheory && q.correctTheory.key_concepts) {
            q.correctTheory.key_concepts.split(',').forEach(c => 
                analysis.conceptCoverage.add(c.trim())
            );
        }
    });

    // Output analysis
    console.log('\n=== Question Analysis ===');

    console.log('\nQuestion Pattern Distribution:');
    Object.entries(analysis.questionPatterns)
        .sort((a, b) => b[1] - a[1])
        .forEach(([pattern, count]) => {
            console.log(`${pattern}: ${count}`);
        });

    console.log('\nMost Common Correct Answers:');
    Object.entries(analysis.theoristFrequency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .forEach(([theorist, count]) => {
            console.log(`${theorist}: ${count} questions`);
        });

    console.log('\nQuestion Types Distribution:');
    Object.entries(analysis.questionTypes)
        .sort((a, b) => b[1] - a[1])
        .forEach(([type, count]) => {
            console.log(`Type ${type}: ${count} questions`);
        });

    console.log('\nConcept Coverage:');
    console.log(`Total unique concepts: ${analysis.conceptCoverage.size}`);
}

// Run analysis
analyzeQuestions(); 