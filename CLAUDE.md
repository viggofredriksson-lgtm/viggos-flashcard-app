Flashcard App — Project Brief

What We're Building

An AI-powered flashcard learning system for personal use. The app implements
scientifically-backed spaced repetition algorithms to optimize long-term
memory retention.

Core Architecture (Cost-Free Design)

The user has a Claude Max subscription. Instead of paying for API calls:

1. Card Creation: User takes learning material → pastes it into a normal
Claude chat with a prompt → Claude generates a CSV file of question/answer
pairs
2. Import System: The app reads CSV files and converts them into flashcards in
 the database
3. Learning Engine: Pure math-based spaced repetition algorithm schedules
reviews — no AI needed at runtime

Zero API costs. All AI work happens through the existing Claude Max
subscription outside the app.

Learning Algorithms to Implement

- SM-2 Algorithm — The gold standard for spaced repetition. Calculates optimal
 review intervals based on difficulty ratings (0-5 scale). Adjusts the
"easiness factor" per card.
- Ebbinghaus Forgetting Curve — Models memory decay over time. Use this to
predict when a card is about to be forgotten and schedule it just before that
point.
- Leitner System — Box-based progression. Cards move to higher boxes (longer
intervals) on correct answers, drop back to box 1 on mistakes. Good for visual
 progress feedback.
- Active Recall — The app should always require the user to actively produce
the answer before revealing it (not multiple choice).
- Interleaving — Mix cards from different topics/decks in a single study
session rather than studying one topic at a time. This strengthens connections
 between concepts.

The ideal approach: combine SM-2's interval math with Leitner's visual
progression and interleaving across decks.

Key Features

- CSV import (question, answer, optional tags/deck)
- Deck organization with tags
- Study session engine driven by spaced repetition scheduling
- Progress tracking and statistics (retention rate, cards due, streak)
- Clean, minimal UI

User Context

- This is a personal learning tool (not a SaaS product)
- The user is learning to code with AI — explain concepts and patterns as you
build. Teach the "why" behind decisions, not just the "what."
- The user is taking a course about Claude Code and wants to learn through
building this project

Tech Preferences

- Keep it simple — this is a personal tool, not an enterprise app
- No unnecessary abstractions or over-engineering
- The user is familiar with Next.js, React, TypeScript, Tailwind CSS, Prisma +
 SQLite from a previous project
