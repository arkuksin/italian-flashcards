# Italian Flashcards

A lightweight collection of tools and data for learning Italian vocabulary using flashcards. This repository contains study decks and a small set of utilities (scripts and/or web UI) to practice, review, and track progress. Use this project to quickly create, import, and practice Italian flashcards locally or as part of a learning workflow.

<!-- Deployment test: Verifying fix after recreating SUPABASE_DB_USER environment variable -->

> Note: This README is a starter — update the sections below to reflect the actual structure of your repository (folders, commands, and technologies used).

## Features

- Ready-to-use Italian vocabulary decks (common words, verbs, phrases, themed sets).
- Deck format examples (JSON / CSV) for easy editing and sharing.
- Simple command-line and/or web-based practice tools for spaced repetition or quick review.
- Import/export support so you can move decks between other flashcard apps.

## Quick Start

1. Clone the repository:
   ```bash
   git clone https://github.com/arkuksin/italian-flashcards.git
   cd italian-flashcards
   ```

2. Inspect available decks (common locations: `decks/`, `data/`, or `cards/`):
   ```bash
   ls decks
   ```

3. Run the local practice tool
   - If the project is Node-based:
     ```bash
     npm install
     npm start
     # or
     node ./bin/practice.js --deck decks/basic-italian.json
     ```
   - If the project is Python-based:
     ```bash
     python -m venv .venv
     source .venv/bin/activate
     pip install -r requirements.txt
     python run_practice.py --deck decks/basic-italian.json
     ```

Replace the commands above with the actual startup commands used in this repository.

## Deck format

Example JSON deck (place under `decks/`):
```json
{
  "name": "Basic Italian - 1",
  "language": "it",
  "cards": [
    { "front": "ciao", "back": "hello / hi" },
    { "front": "grazie", "back": "thank you" },
    { "front": "per favore", "back": "please" }
  ]
}
```

Example CSV (first line header):
```
front,back
ciao,hello / hi
grazie,thank you
per favore,please
```

If your repository uses a different format or folder structure, update this section to match.

## Usage Examples

- Practice a deck once:
  ```bash
  # CLI example
  node ./bin/practice.js --deck decks/basic-italian.json --mode quiz
  ```

- Start a local web UI (if included):
  ```bash
  npm run dev
  # then open http://localhost:3000
  ```

- Convert CSV to JSON:
  ```bash
  node scripts/csv-to-json.js decks/italian-phrases.csv > decks/italian-phrases.json
  ```

## Contributing

Contributions are welcome! A few ways to help:

- Add new decks (organized by topic and level).
- Improve the practice algorithm (e.g., implement spaced repetition).
- Add tests, CI configuration, or improve documentation.
- Fix typos and improve translations/definitions.

Please open an issue describing your idea before sending larger changes. Follow the repository's coding conventions and add tests where applicable.

Suggested workflow:
1. Fork the repo
2. Create a feature branch
3. Add tests / update docs
4. Open a pull request

## CI/CD

The project includes automated checks to ensure code quality:

- **CI Checks** - Runs on every PR and push to main:
  - Linting (`npm run lint`) - Catches code style issues
  - Build (`npm run build`) - Ensures the project builds successfully
  - Unit tests (`npm run test`) - Runs all unit tests
  - Build artifacts are saved for debugging

- **E2E Tests** - Runs after deployment to preview environments
- **Production Smoke Tests** - Verifies production deployments:
  - Runs automatically after successful production deployments
  - Performs basic health check (site accessibility)
  - Executes critical path tests tagged with `@smoke`
  - Creates GitHub issue if tests fail
  - Completes in < 5 minutes
- **Database Migrations** - Automated validation and deployment

All CI checks must pass before code can be merged to main branch.

## Roadmap / Ideas

- Add spaced repetition (SM-2) scheduling.
- Implement progress sync with local storage or cloud.
- Provide mobile-friendly web UI or PWA.
- Add example audio pronunciation files for cards.

## CI/CD Improvements Progress

- [x] Task 04 - Add Basic CI Checks (`tasks/cicd-improvements/04-add-basic-ci-checks.md`)
- [x] Task 05 - Reduce Scheduled Triage Frequency (`tasks/cicd-improvements/05-reduce-scheduled-triage-frequency.md`)
- [x] Task 07 - Add Production Smoke Tests (`tasks/cicd-improvements/07-add-production-smoke-tests.md`)
- [x] Task 09 - Add Production Monitoring (`tasks/cicd-improvements/09-add-monitoring.md`)

## Troubleshooting

- If decks are not found, check the repository's deck folder (commonly `decks/`).
- For runtime errors, check Node/Python versions and dependencies.
- If the UI doesn't start, check environment variables and port conflicts.

## License

Specify the license here (e.g., MIT). If you don't have one yet, consider adding a LICENSE file.

## Author / Contact

Maintained by arkuksin (https://github.com/arkuksin). For questions, open an issue or submit a PR.
