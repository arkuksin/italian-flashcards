# GEMINI.md: Italian Flashcards Project

This document provides a comprehensive overview of the Italian Flashcards project, its architecture, and development practices to be used as instructional context for future interactions.

## Project Overview

This is a web-based flashcard application designed to help users learn Italian vocabulary from Russian. The application features a modern, responsive user interface and a robust backend for user authentication and progress tracking.

**Key Technologies:**

*   **Frontend:**
    *   React
    *   TypeScript
    *   Vite
    *   Tailwind CSS
    *   Framer Motion (for animations)
*   **Backend:**
    *   Supabase (PostgreSQL, Authentication, RLS)
*   **Testing:**
    *   Playwright (for end-to-end testing)

**Architecture:**

The application is a single-page application (SPA) built with React and Vite. It uses React Router for client-side routing and a context-based approach for managing authentication state. The backend is powered by Supabase, which provides a PostgreSQL database, user authentication, and auto-generated APIs.

## Getting Started

To run this project locally, you will need to have Node.js and npm installed.

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd italian-flashcards
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    Create a `.env` file by copying the `.env.example` file. You will need to add your Supabase project URL and anon key to this file.
    ```bash
    cp .env.example .env
    ```

4.  **Apply the database schema:**
    The database schema is defined in `supabase/schema.sql`. You can apply this schema to your Supabase project either manually through the Supabase SQL editor or by using a database migration tool.

5.  **Run the development server:**
    ```bash
    npm run dev
    ```

## Building and Running

The `package.json` file contains several scripts for building, running, and testing the application.

*   `npm run dev`: Starts the Vite development server.
*   `npm run build`: Builds the application for production.
*   `npm run lint`: Lints the codebase using ESLint.
*   `npm run test:e2e`: Runs the Playwright end-to-end tests.

## Development Conventions

**Coding Style:**

The project uses ESLint to enforce a consistent coding style. Please run `npm run lint` before committing any changes to ensure your code adheres to the project's style guidelines.

**Testing:**

End-to-end tests are written using Playwright and are located in the `e2e` directory. The tests cover user authentication, flashcard interaction, and progress tracking.

**Database:**

The database schema is managed through the `supabase/schema.sql` file. All tables use Row Level Security (RLS) to ensure that users can only access their own data.

## Backend

The backend is powered by Supabase.

**Authentication:**

The application supports email/password, Google, and GitHub authentication. The authentication logic is handled by the `AuthContext.tsx` component, which uses the `supabase-js` library to interact with the Supabase Auth API.

**Database Schema:**

The database schema consists of the following tables:

*   `words`: Contains the Italian and Russian words for the flashcards.
*   `user_progress`: Tracks each user's progress with individual words.
*   `learning_sessions`: Stores information about each user's learning sessions.
*   `user_preferences`: Stores user-specific preferences, such as dark mode and default learning direction.

All tables are protected by Row Level Security (RLS) policies to ensure data privacy.
