# Gamers Aposentados - AI Coding Guidelines

## Project Overview

This is a Next.js application for a gaming community ("Gamers Aposentados") where retired gamers select and track game progress. Currently frontend-only with mock data; backend is a placeholder.

## Architecture

- **Frontend**: Next.js 16 with App Router, React 19, TypeScript
- **Backend**: Not implemented (empty directory with README)
- **Monorepo Structure**: Root manages both packages via npm scripts

## Key Components & Patterns

- **Game Management**: Core entity with statuses (`SUGGESTED`, `ACTIVE`, `COMPLETED`, `DROPPED`) and quest types (`MAIN_QUEST`, `SIDE_QUEST`)
- **Responsive Grid**: 1 column mobile, 3 columns desktop (`grid grid-cols-1 md:grid-cols-3`)
- **Status Badges**: Color-coded (gray/blue/green/red) for game states
- **Quest Icons**: 🛡️ Main Quest, ⚔️ Side Quest
- **Mock Data**: Used in `page.tsx` for UI development without backend

## Development Workflow

- **Start Dev**: `npm run dev` (root) - concurrently starts frontend (and backend if exists)
- **Install All**: `npm run install:all` - installs deps for frontend/backend
- **Frontend Only**: `cd frontend && npm run dev`
- **Build**: `npm run build` (in frontend)
- **Lint**: `npm run lint` (in frontend)

## Code Conventions

- **TypeScript**: Interfaces for extensible objects (Open/Closed Principle), types for fixed unions
- **Path Aliases**: `@/*` maps to `./src/*`
- **Styling**: Tailwind CSS v4 with PostCSS
- **Language**: Portuguese comments and HTML lang="pt-BR"
- **React Compiler**: Enabled in Next.js config
- **Conditional Rendering**: Optional fields like `hltbTime` only shown if present

## Data Model

- **Game**: id, title, coverUrl, hltbTime?, status, questType, nominatedBy (string), createdAt, completedAt?
- **Player**: id, name, role ('ADMIN'|'MEMBER')
- **GamePool**: month, year, type, games[]

## File Structure Examples

- Components: `src/components/game/GameCard.tsx`
- Types: `src/types/game.ts`
- Pages: `src/app/page.tsx` (App Router)

## Current State

- UI prototype with mock games
- No API integration yet
- Services/lib directories empty (ready for backend integration)
- ESLint configured with Next.js rules
