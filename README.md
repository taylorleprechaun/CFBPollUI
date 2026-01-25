# CFB Poll

A college football ranking system that evaluates FBS teams based on their performance throughout the season. Features a .NET Web API backend and React frontend.

This was created using Claude Code with a lot of guidelines to follow my code style and arch preferences. You could technically call this "vibe-coding", if you were so inclined, but a lot of care was put into making this, even though almost none of the actual code was written by me.

## Table of Contents

- [TODO](#todo)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Setup](#setup)
- [Running the Application](#running-the-application)
- [API Endpoints](#api-endpoints)
- [Testing](#testing)

## TODO

Last Updated 1/24/2026
- At the time of this commit, the unit tests added are boilerplate and don't cover all the scenarios I want to include. I will need to flesh this out and make it more robust.
- I have not implemented my algorithm into this new repo yet. That is one of my next steps. The main priority was scaffolding everything and getting the base functionality of everything in place.
- I have only recently started to learn React and this application uses it for the UI. I had Claude create it all following the best practices that I could find online, but I don't know for certain that everything is correct. As I learn more I know I will end up refactoring that code.

## Features

- **Custom Ranking Algorithm**: Evaluates teams based on wins, strength of schedule, and margin of victory
- **Historical Data**: Access rankings from 2002 to present
- **Interactive UI**: Sortable rankings table with team logos
- **REST API**: Full API with Swagger documentation

## Tech Stack

### Backend
- ASP.NET Core 10.0 Web API
- College Football Data API integration
- Swagger/OpenAPI documentation

### Frontend
- React 19 with TypeScript
- Vite build tooling
- TanStack Query for data fetching
- TanStack Table for sortable tables
- Tailwind CSS for styling
- React Router for navigation

## Project Structure

```
CFBPoll/
├── CFBPoll.sln
├── src/
│   ├── CFBPoll.API/           # ASP.NET Core Web API
│   ├── CFBPoll.Core/          # Shared business logic
│   └── cfbpoll-web/           # React frontend
└── tests/
    ├── CFBPoll.API.Tests/     # API integration tests
    └── CFBPoll.Core.Tests/    # Unit tests
```

## Prerequisites

- [.NET 10.0 SDK](https://dotnet.microsoft.com/download)
- [Node.js 18+](https://nodejs.org/)
- [College Football Data API Key](https://collegefootballdata.com/key)

## Setup

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/CFBPoll.git
cd CFBPoll
```

### 2. Configure API Key

Create `src/CFBPoll.API/appsettings-private.json`:

```json
{
  "CollegeFootballData": {
    "ApiKey": "your-api-key-here"
  }
}
```

### 3. Install dependencies

```bash
# Backend
dotnet restore

# Frontend
cd src/cfbpoll-web
npm install
```

### 4. Implement Rating Module

The rating module (`src/CFBPoll.Core/Modules/RatingModule.cs`) is not included in the repository. You'll need to create your own implementation of `IRatingModule`:

```csharp
using CFBPoll.Core.Interfaces;
using CFBPoll.Core.Models;

namespace CFBPoll.Core.Modules;

public class RatingModule : IRatingModule
{
    public IDictionary<string, RatingDetails> RateTeams(SeasonData seasonData)
    {
        // Your rating algorithm here
    }
}
```

## Running the Application

### Backend API

```bash
cd src/CFBPoll.API
dotnet run
```

The API runs at `https://localhost:5001` with Swagger UI as the default page.

### Frontend

```bash
cd src/cfbpoll-web
npm run dev
```

The frontend runs at `http://localhost:5173`.

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/conferences` | Returns FBS conferences |
| `GET /api/rankings?season={season}&week={week}` | Returns ranked teams for the specified week |
| `GET /api/seasons` | Returns available seasons (2000 to present) |
| `GET /api/seasons/{season}/weeks` | Returns available weeks for a season |

## Testing

The project includes comprehensive unit and integration tests.

### Running Tests

```bash
# Backend tests
dotnet test

# Run with coverage
dotnet test --collect:"XPlat Code Coverage"

# Frontend tests
cd src/cfbpoll-web
npm test
```

### Coverage Summary

![Core Coverage](https://img.shields.io/badge/Core_Coverage-67%25-yellow)
![API Coverage](https://img.shields.io/badge/API_Coverage-67%25-yellow)
![Web Coverage](https://img.shields.io/badge/Web_Coverage-72%25-yellow)

| Project | Line Coverage | Branch Coverage |
|---------|---------------|-----------------|
| CFBPoll.Core | 67% | 48% |
| CFBPoll.API | 67% | 77% |
| cfbpoll-web | 72% | 65% |

**Why is Core coverage lower?** The `CFBDataService` class (~280 lines) makes HTTP calls to the external College Football Data API. Unit testing this would require mocking the HTTP client, which adds complexity without much value since the logic is primarily data mapping. This code is better suited for integration tests that verify the actual API contract. Excluding this class, the remaining Core code has 95%+ coverage.