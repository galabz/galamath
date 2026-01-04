---
name: quizz-designer
description: Create and edit math quiz JSON files with proper answer distribution and hints
---

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

All quiz JSON files must conform to this schema:

### JSON Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["theme", "themeId", "level", "questions"],
  "properties": {
    "theme": {
      "type": "string",
      "description": "Display name of the quiz theme"
    },
    "themeId": {
      "type": "string",
      "pattern": "^[a-z0-9-]+$",
      "description": "URL-friendly identifier matching the filename prefix"
    },
    "level": {
      "type": "string",
      "enum": ["easy", "medium", "hard"]
    },
    "totalTimeMinutes": {
      "type": "integer",
      "default": 90
    },
    "questionTimeMinutes": {
      "type": "integer",
      "default": 2
    },
    "questions": {
      "type": "array",
      "minItems": 40,
      "maxItems": 40,
      "items": {
        "type": "object",
        "required": ["id", "question", "answers", "correct", "hint"],
        "properties": {
          "id": {
            "type": "integer",
            "minimum": 1
          },
          "question": {
            "type": "string",
            "description": "The question text"
          },
          "svg": {
            "type": "string",
            "description": "Optional SVG markup for visual questions"
          },
          "answers": {
            "type": "array",
            "items": { "type": "string" },
            "minItems": 4,
            "maxItems": 4,
            "description": "Exactly 4 answer options"
          },
          "correct": {
            "type": "integer",
            "minimum": 0,
            "maximum": 3,
            "description": "Index of correct answer (0-3)"
          },
          "hint": {
            "type": "string",
            "description": "A hint that guides thinking WITHOUT revealing the answer"
          }
        }
      }
    }
  }
}
```

### Example Question

```json
{
  "id": 1,
  "question": "What is 3 + 4 × 2?",
  "answers": ["14", "11", "10", "9"],
  "correct": 1,
  "hint": "Remember PEMDAS! Multiplication comes before addition."
}
```

## Checklist Before Submitting Quiz

- [ ] Correct answers distributed across positions A, B, C, D (~25% each)
- [ ] All wrong answers are plausible (common mistakes, close values)
- [ ] Explanations hint at the method without revealing the answer
- [ ] No obvious patterns in answer positions
- [ ] Difficulty is consistent with the stated level
