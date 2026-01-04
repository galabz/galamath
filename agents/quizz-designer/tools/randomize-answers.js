const fs = require('fs');
const path = require('path');

// Fisher-Yates shuffle that returns the new index of a tracked element
function shuffleWithTracking(array, trackIndex) {
  const result = [...array];
  let newIndex = trackIndex;

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];

    // Track where our correct answer moved
    if (newIndex === i) newIndex = j;
    else if (newIndex === j) newIndex = i;
  }

  return { shuffled: result, newIndex };
}

function randomizeQuizFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const quiz = JSON.parse(content);

  let changedCount = 0;

  quiz.questions = quiz.questions.map(q => {
    const { shuffled, newIndex } = shuffleWithTracking(q.answers, q.correct);

    if (newIndex !== q.correct) changedCount++;

    return {
      ...q,
      answers: shuffled,
      correct: newIndex
    };
  });

  fs.writeFileSync(filePath, JSON.stringify(quiz, null, 2) + '\n');
  console.log(`${path.basename(filePath)}: ${changedCount}/${quiz.questions.length} answers repositioned`);
}

// Get all quiz files
const dataDir = path.join(__dirname, '..', 'src', 'data');
const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.json'));

console.log('Randomizing answer positions...\n');

files.forEach(file => {
  randomizeQuizFile(path.join(dataDir, file));
});

console.log('\nDone!');
