# Quiz Generation Rules

When generating quiz questions for Galamath, follow these rules strictly:

## 1. Randomize Correct Answer Position

**NEVER place the correct answer in position A (index 0) more than 25% of the time.**

- Distribute correct answers evenly across A, B, C, D positions
- For a 40-question quiz: ~10 correct answers per position
- Shuffle the position randomly for each question

## 2. Make All Answers Plausible

**Every answer option must be believable and close to the correct answer.**

Bad example:
```
What is 3 + 4 × 2?
A. 11 (correct)
B. 1000
C. -50
D. 0
```

Good example:
```
What is 3 + 4 × 2?
A. 14  (common mistake: left-to-right calculation)
B. 11  (correct)
C. 10  (plausible miscalculation)
D. 9   (another plausible error)
```

### Guidelines for plausible wrong answers:
- Use common calculation mistakes (e.g., wrong order of operations)
- Use off-by-one errors
- Use answers that result from misreading the problem
- Keep all numbers in a similar range
- For multiplication: include answers from forgetting to carry, adding instead of multiplying
- For order of operations: include left-to-right calculation results

## 3. Explanations Should Hint, Not Reveal

**The explanation should guide the student's thinking without stating the answer directly.**

Bad explanation:
```
"The answer is 11. You multiply 4 × 2 = 8, then add 3 to get 11."
```

Good explanation:
```
"Remember PEMDAS! Multiplication comes before addition. What do you get when you multiply first?"
```

### Guidelines for explanations:
- Ask guiding questions
- Remind of the rule or concept to apply
- Point out the common mistake to avoid
- Do NOT state the final answer
- Do NOT show the complete calculation
- Keep it to 1-2 sentences

## Quiz Data Format

```json
{
  "theme": "Theme Name",
  "themeId": "theme-id",
  "level": "easy|medium|hard",
  "totalTimeMinutes": 90,
  "questionTimeMinutes": 2,
  "questions": [
    {
      "id": 1,
      "question": "What is 3 + 4 × 2?",
      "answers": ["14", "11", "10", "9"],
      "correct": 1,
      "explanation": "Remember PEMDAS! Multiplication comes before addition."
    }
  ]
}
```

## Checklist Before Submitting Quiz

- [ ] Correct answers distributed across positions A, B, C, D (~25% each)
- [ ] All wrong answers are plausible (common mistakes, close values)
- [ ] Explanations hint at the method without revealing the answer
- [ ] No obvious patterns in answer positions
- [ ] Difficulty is consistent with the stated level
