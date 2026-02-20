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

Last Updated 2/17/2026
- I have only recently started to learn React and this application uses it for the UI. I had Claude create it all following the best practices that I could find online, but I don't know for certain that everything is correct. As I learn more I know I will end up refactoring that code.

## Features

- **Custom Ranking Algorithm**: Evaluates teams based on wins, strength of schedule, and margin of victory
- **Team Details**: Drill into individual teams to see schedule with opponent rankings, clickable opponent links, and expandable record breakdowns by location and opponent tier
- **Historical Data**: Access rankings from 2002 to present
- **Interactive UI**: Sortable rankings table with team logos and colors
- **Admin Dashboard**: JWT-authenticated admin panel to calculate, preview, and publish rankings with a two-step draft/publish workflow
- **Excel Export**: Download rankings as Excel spreadsheets with rating breakdowns
- **SQLite Persistence**: Rankings snapshots stored in SQLite for fast retrieval without redundant API calls
- **REST API**: Full API with Swagger documentation
- **Caching**: SQLite + GZip persistent cache with per-component storage to reduce external API calls

## Tech Stack

### Backend
- ASP.NET Core 10.0 Web API
- SQLite via Microsoft.Data.Sqlite
- JWT authentication
- EPPlus for Excel export
- College Football Data API integration
- Swagger/OpenAPI documentation

### Frontend
- React 19 with TypeScript
- Vite build tooling
- TanStack Query for data fetching
- TanStack Table for sortable tables
- Tailwind CSS for styling
- React Router for navigation
- Zod for runtime response validation

## Project Structure

```
CFBPoll/
├── CFBPoll.sln
├── src/
│   ├── CFBPoll.API/           # ASP.NET Core Web API (presentation layer)
│   ├── CFBPoll.Core/          # Business logic, models, interfaces (domain layer)
│   └── cfbpoll-web/           # React frontend
└── tests/
    ├── CFBPoll.API.Tests/     # Controller/middleware tests
    └── CFBPoll.Core.Tests/    # Module/service tests
```

## Architecture

The backend enforces a strict layered architecture: **Controllers &rarr; Modules &rarr; Data Layer**.

```
Controllers (Presentation)         Modules (Business Logic)          Data Layer
-----------------------------      --------------------------        ----------
AuthController                     AuthModule
  -> IAuthModule                     -> IOptions<AuthOptions>

RankingsController                 RankingsModule
  -> ICFBDataService                 -> IRankingsData               RankingsData
  -> IRankingsModule                 -> ISeasonModule                 -> SQLite
  -> IRatingModule
                                   CacheModule (IPersistentCache)    CacheData
                                     -> ICacheData                     -> SQLite
TeamsController                    TeamsModule
  -> ITeamsModule                    -> ICFBDataService
                                     -> IRankingsModule
                                     -> IRatingModule

AdminController                    AdminModule
  -> IAdminModule                    -> ICFBDataService
                                     -> IExcelExportModule
                                     -> IPersistentCache
                                     -> IRankingsModule
                                     -> IRatingModule
```

Only `RankingsModule` has a direct dependency on `IRankingsData`, and only `CacheModule` has a direct dependency on `ICacheData`. Controllers never reference data-layer interfaces.

## Prerequisites

- [.NET 10.0 SDK](https://dotnet.microsoft.com/download)
- [Node.js 18+](https://nodejs.org/)
- [College Football Data API Key](https://collegefootballdata.com/key)

## Setup

### 1. Clone the repository

```bash
git clone https://github.com/taylorleprechaun/CFBPollUI.git
cd CFBPollUI
```

### 2. Configure API Key

Create `src/CFBPoll.API/appsettings-private.json`:

```json
{
  "CollegeFootballData": {
    "ApiKey": "your-api-key-here"
  },
  "Auth": {
    "Username": "admin",
    "PasswordHash": "your-bcrypt-hash-here",
    "Secret": "your-jwt-secret-at-least-32-characters-long",
    "Issuer": "CFBPoll",
    "ExpirationMinutes": 480
  }
}
```

Generate a bcrypt password hash for the `PasswordHash` field (e.g., using an online bcrypt generator or `BCrypt.Net.BCrypt.HashPassword("your-password")`).

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

### Public

| Endpoint | Description |
|----------|-------------|
| `GET /api/v1/conferences` | Returns FBS conferences |
| `GET /api/v1/rankings?season={s}&week={w}` | Returns ranked teams for the specified week |
| `GET /api/v1/rankings/available-weeks?season={s}` | Returns published weeks for a season |
| `GET /api/v1/seasons` | Returns available seasons (2002 to present) |
| `GET /api/v1/seasons/{season}/weeks` | Returns all weeks for a season |
| `GET /api/v1/teams/{teamName}?season={s}&week={w}` | Returns team details including schedule and record breakdowns |

### Authentication

| Endpoint | Description |
|----------|-------------|
| `POST /api/v1/auth/login` | Authenticate with username/password, returns JWT |

### Admin (JWT required)

| Endpoint | Description |
|----------|-------------|
| `POST /api/v1/admin/calculate` | Calculate rankings for a season/week and save as draft |
| `POST /api/v1/admin/snapshots/{season}/{week}/publish` | Publish a draft snapshot |
| `DELETE /api/v1/admin/snapshots/{season}/{week}` | Delete a snapshot |
| `GET /api/v1/admin/persisted-weeks` | List all persisted snapshots |
| `GET /api/v1/admin/export?season={s}&week={w}` | Download rankings as Excel |

## Testing

The project includes 643 unit and integration tests across backend and frontend.

### Running Tests

```bash
# Backend tests (389 tests)
dotnet test

# Run with coverage
dotnet test --collect:"XPlat Code Coverage"

# Frontend tests (254 tests)
cd src/cfbpoll-web
npm test
```

### Coverage Summary

![Backend Tests](https://img.shields.io/badge/Backend_Tests-389-blue)
![Frontend Tests](https://img.shields.io/badge/Frontend_Tests-254-blue)
![Core Coverage](https://img.shields.io/badge/Core_Coverage-99%25-brightgreen)
![API Coverage](https://img.shields.io/badge/API_Coverage-100%25-brightgreen)
![Web Coverage](https://img.shields.io/badge/Web_Coverage-98%25-brightgreen)

| Project | Line Coverage | Branch Coverage |
|---------|---------------|-----------------|
| CFBPoll.Core | 99% | 90% |
| CFBPoll.API | 100% | 94% |
| cfbpoll-web | 98% | 91% |

**Excluded from coverage:**
- `RatingModule` - Proprietary rating algorithm, not included in the repository. Tests are maintained locally.
- `CFBDataService` - Makes HTTP calls to the external College Football Data API. Better suited for integration tests.
- `Program.cs` - ASP.NET Core startup configuration code.
