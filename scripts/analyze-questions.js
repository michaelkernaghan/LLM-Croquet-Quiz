const fs = require('fs');
const path = require('path');

function createBarChart(data, title, maxWidth = 50) {
    const maxValue = Math.max(...Object.values(data));
    const scale = maxWidth / maxValue;

    console.log(`\n${title}:`);
    console.log('='.repeat(maxWidth + 30));
    
    Object.entries(data)
        .sort((a, b) => b[1] - a[1])
        .forEach(([label, value]) => {
            const barLength = Math.round(value * scale);
            const percentage = ((value / Object.values(data).reduce((a, b) => a + b, 0)) * 100).toFixed(1);
            const bar = '█'.repeat(barLength);
            console.log(`${label.padEnd(20)} ${bar} ${value} (${percentage}%)`);
        });
}

function createTimelineChart(data, title, maxWidth = 50) {
    const total = Object.values(data).reduce((a, b) => a + b, 0);
    const maxValue = Math.max(...Object.values(data));
    const scale = maxWidth / maxValue;

    console.log(`\n${title}:`);
    console.log('='.repeat(maxWidth + 30));
    
    Object.entries(data)
        .sort((a, b) => Number(a[0]) - Number(b[0]))
        .forEach(([decade, value]) => {
            const barLength = Math.round(value * scale);
            const percentage = ((value / total) * 100).toFixed(1);
            const bar = '█'.repeat(barLength);
            console.log(`${decade}s`.padEnd(20) + `${bar} ${value} (${percentage}%)`);
        });
}

function analyzeQuestions() {
    const mainFile = path.join(__dirname, '../src/frontend/art-questions.json');
    const backupFile = path.join(__dirname, '../src/frontend/art-questions.json.backup');
    
    // Check for duplicates
    function findDuplicates(questions) {
        const seen = new Map();
        const duplicates = [];
        
        questions.forEach((q, index) => {
            if (seen.has(q.question)) {
                duplicates.push({
                    question: q.question,
                    firstIndex: seen.get(q.question),
                    secondIndex: index
                });
            } else {
                seen.set(q.question, index);
            }
        });
        
        return duplicates;
    }
    
    console.log('\nAnalyzing main file:', mainFile);
    const mainQuestions = JSON.parse(fs.readFileSync(mainFile, 'utf8')).questions;
    
    console.log('\nAnalyzing backup file:', backupFile);
    const backupQuestions = JSON.parse(fs.readFileSync(backupFile, 'utf8')).questions;
    
    // Check for duplicates in each file
    const mainDuplicates = findDuplicates(mainQuestions);
    const backupDuplicates = findDuplicates(backupQuestions);
    
    console.log('\nDuplicates in main file:', mainDuplicates.length);
    mainDuplicates.forEach(d => {
        console.log(`Question "${d.question}" appears at indices ${d.firstIndex} and ${d.secondIndex}`);
    });
    
    console.log('\nDuplicates in backup file:', backupDuplicates.length);
    backupDuplicates.forEach(d => {
        console.log(`Question "${d.question}" appears at indices ${d.firstIndex} and ${d.secondIndex}`);
    });
    
    console.log('\nComparison:');
    console.log('Main file questions:', mainQuestions.length);
    console.log('Backup file questions:', backupQuestions.length);

    // Log raw data first
    console.log('\nRaw Data:');
    console.log('File size:', fs.statSync(mainFile).size, 'bytes');
    console.log('Questions array length:', mainQuestions.length);
    console.log('JSON structure:', Object.keys(mainQuestions[0]));
    console.log('First question:', mainQuestions[0].question);
    console.log('Last question:', mainQuestions[mainQuestions.length - 1].question);

    // Log distribution of question properties
    const propertyCount = mainQuestions.reduce((acc, q) => {
        Object.keys(q).forEach(key => {
            acc[key] = (acc[key] || 0) + 1;
        });
        return acc;
    }, {});
    console.log('\nProperty distribution:');
    Object.entries(propertyCount).forEach(([prop, count]) => {
        console.log(`${prop}: ${count} questions`);
    });

    // Check for questions without type
    const noType = mainQuestions.filter(q => !q.questionType).length;
    console.log('\nQuestions without type:', noType);

    // Show all unique question types
    const allTypes = new Set(mainQuestions.map(q => q.questionType));
    console.log('All question types:', Array.from(allTypes).sort());

    // Initialize detailed counters
    const typeCount = {};
    const categoryCount = {};
    const yearDistribution = {};
    const authorGenderCount = { male: 0, female: 0, collective: 0 };
    const decadeCount = {};
    const theoristCount = {};
    const llmCount = mainQuestions.filter(q => q.isLLMArt).length;

    // Count everything
    mainQuestions.forEach((q, index) => {
        // Log any malformed questions
        if (!q.question || !q.answers || !q.correctTheory) {
            console.log(`Warning: Malformed question at index ${index}`);
            console.log('Missing properties:', {
                question: !q.question,
                answers: !q.answers,
                correctTheory: !q.correctTheory
            });
            return;
        }

        // Check answer structure
        if (!Array.isArray(q.answers) || q.answers.length !== 4) {
            console.log(`Warning: Invalid answers array at index ${index}`);
            console.log('Answers:', q.answers);
            return;
        }

        // Question types
        typeCount[q.questionType] = (typeCount[q.questionType] || 0) + 1;

        // Categories
        if (q.category) {
            categoryCount[q.category] = (categoryCount[q.category] || 0) + 1;
        }

        // Years/Decades
        if (q.correctTheory && q.correctTheory.year) {
            const decade = Math.floor(q.correctTheory.year / 10) * 10;
            decadeCount[decade] = (decadeCount[decade] || 0) + 1;
        }

        // Theorist frequency
        if (q.correctTheory && q.correctTheory.author) {
            theoristCount[q.correctTheory.author] = (theoristCount[q.correctTheory.author] || 0) + 1;
        }
    });

    // Print analysis
    console.log('\nQuestion Analysis:');
    console.log('=================');
    console.log(`Total Questions: ${mainQuestions.length}`);
    console.log(`LLM Art Framework Questions: ${llmCount}`);
    
    createBarChart(typeCount, 'Question Types Distribution');

    createBarChart(categoryCount, 'Category Distribution');

    createTimelineChart(decadeCount, 'Timeline Distribution');

    createBarChart(
        Object.fromEntries(
            Object.entries(theoristCount)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10)
        ),
        'Top 10 Most Referenced Theorists'
    );

    // Add detailed Adorno analysis
    console.log('\nAdorno Question Analysis:');
    const adornoQuestions = mainQuestions.filter(q => 
        q.correctTheory && q.correctTheory.author === 'Theodor Adorno'
    );
    console.log(`Total Adorno questions: ${adornoQuestions.length}`);
    adornoQuestions.forEach((q, i) => {
        console.log(`${i + 1}. "${q.question}"`);
    });

    // Check for missing required fields
    console.log('\nMissing Required Fields:');
    mainQuestions.forEach((q, i) => {
        const missing = [];
        if (!q.category) missing.push('category');
        if (!q.citation) missing.push('citation');
        if (missing.length > 0) {
            console.log(`Question ${i + 1} missing: ${missing.join(', ')}`);
            console.log(`Question text: "${q.question}"`);
        }
    });

    // Show full category distribution
    const allCategories = new Set(mainQuestions.map(q => q.category).filter(Boolean));
    console.log('\nAll Categories:', Array.from(allCategories));
}

analyzeQuestions(); 