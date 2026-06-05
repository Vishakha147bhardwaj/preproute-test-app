# Preproute Test Management App

A 5-page test management application built for the Preproute Frontend Developer evaluation task.

## Live Demo

https://preproute-test-app.vercel.app

## Test Credentials

- Username: `vedant-admin`
- Password: `vedant123`

## Tech Stack

- React + TypeScript (Vite)
- Redux Toolkit — global state (auth, test, questions)
- React Hook Form + Zod — form validation
- Axios — API integration with JWT interceptor
- Tailwind CSS — styling
- React Router v6 — navigation and protected routes

## Features

- JWT authentication with persistent login
- Dashboard with test list, search, filter and sort
- Create/Edit test with cascading dropdowns (Subject → Topic → Sub-topic)
- Add MCQ questions with options, solution and difficulty settings
- Publish test with Publish Now / Schedule Publish options
- Protected routes — redirect to login if unauthenticated

## Technical Decisions

- **Redux Toolkit** over Context API for scalable state management across pages
- **Zod** for schema-based form validation — type-safe and composable
- **Axios interceptor** to auto-attach JWT token on every request and handle 401 globally
- **Cascading dropdowns** — topics fetch on subject change, sub-topics fetch on topic change
- **Feature branches** — each page developed in isolation (feature/auth, feature/dashboard, etc.)

## Project Structure

src/
├── api/ # axios instance + all API functions
├── app/ # redux store + slices (auth, test)
├── components/ # Layout (sidebar + header)
├── pages/ # Login, Dashboard, CreateTest, AddQuestions, Publish
├── routes/ # ProtectedRoute
└── types/ # TypeScript interfaces

## Run Locally

```bash
npm install
npm run dev
```
