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

Last Updated 3/9/2026
- Add a page to view a team's history to see season results and rankings over time.

## Features

- **Custom Ranking Algorithm**: Evaluates teams based on wins, strength of schedule, and margin of victory
- **Team Details**: Drill into individual teams to see schedule with opponent rankings, clickable opponent links, and expandable record breakdowns by location and opponent tier
- **All-Time Rankings**: View the best teams, worst teams, and hardest schedules across all seasons with sortable tables
- **Season Trends**: Interactive line chart showing rank progression throughout a season, with team logos as data points, CSS-driven highlighting, and custom tooltips
- **Poll Leaders**: Scatter chart showing how frequently teams have been ranked, with team logos as data points, year range filtering, and toggleable all-weeks vs. final-only modes
- **Page Visibility Controls**: Admin toggles to enable/disable the All-Time, Poll Leaders, and Season Trends pages, with deep-link blocking for disabled pages
- **Historical Data**: Access rankings from 2002 to present
- **Mobile-Responsive UI**: Collapsible hamburger menu navigation on small screens with viewport-aware chart tooltips
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
- Recharts for chart visualization
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
AdminController                    AdminModule
  -> IAdminModule                    -> ICFBDataService
  -> IRankingsModule
                                     -> IExcelExportModule
                                     -> IPersistentCache
                                     -> IPollLeadersModule
                                     -> IRankingsModule
                                     -> IRatingModule
                                     -> ISeasonTrendsModule

AllTimeController                  AllTimeModule
  -> IAllTimeModule                  -> ICFBDataService
                                     -> IRankingsModule

AuthController                     AuthModule
  -> IAuthModule                     -> IOptions<AuthOptions>

                                   CacheModule (IPersistentCache)    CacheData
                                     -> ICacheData                     -> SQLite

PageVisibilityController           PageVisibilityModule
  -> IPageVisibilityModule           -> IPageVisibilityData           PageVisibilityData
                                                                       -> SQLite

PollLeadersController              PollLeadersModule
  -> IPollLeadersModule              -> ICFBDataService
                                     -> IPersistentCache
                                     -> IRankingsModule

SeasonTrendsController             SeasonTrendsModule
  -> ISeasonTrendsModule             -> ICFBDataService
                                     -> IPersistentCache
                                     -> IRankingsModule
                                     -> ISeasonModule

RankingsController                 RankingsModule
  -> ICFBDataService                 -> IRankingsData               RankingsData
  -> IRankingsModule                 -> ISeasonModule                 -> SQLite
  -> IRatingModule

SeasonsController
  -> ICFBDataService
  -> IRankingsModule
  -> ISeasonModule

TeamsController                    TeamsModule
  -> ITeamsModule                    -> ICFBDataService
                                     -> IRankingsModule
                                     -> IRatingModule
```

Only `RankingsModule` has a direct dependency on `IRankingsData`, only `CacheModule` has a direct dependency on `ICacheData`, and only `PageVisibilityModule` has a direct dependency on `IPageVisibilityData`. Controllers never reference data-layer interfaces.

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
| `GET /api/v1/all-time` | Returns all-time rankings: best teams, worst teams, and hardest schedules |
| `GET /api/v1/conferences` | Returns FBS conferences |
| `GET /api/v1/page-visibility` | Returns current page visibility settings |
| `GET /api/v1/poll-leaders?minSeason={min}&maxSeason={max}` | Returns per-team ranking appearance counts across published snapshots |
| `GET /api/v1/seasons/{season}/trends` | Returns season trends showing rank progression across published weeks |
| `GET /api/v1/seasons/{season}/weeks/{week}/rankings` | Returns ranked teams for the specified week |
| `GET /api/v1/seasons` | Returns available seasons (2002 to present) |
| `GET /api/v1/seasons/{season}/weeks` | Returns all weeks for a season with rankings publication status |
| `GET /api/v1/teams/{teamName}?season={s}&week={w}` | Returns team details including schedule and record breakdowns |

### Authentication

| Endpoint | Description |
|----------|-------------|
| `POST /api/v1/auth/login` | Authenticate with username/password, returns JWT |

### Admin (JWT required)

| Endpoint | Description |
|----------|-------------|
| `POST /api/v1/admin/seasons/{season}/weeks/{week}/snapshot` | Calculate rankings for a season/week and save as draft |
| `PATCH /api/v1/admin/seasons/{season}/weeks/{week}/snapshot` | Update a snapshot (currently supports publishing) |
| `DELETE /api/v1/admin/seasons/{season}/weeks/{week}/snapshot` | Delete a snapshot |
| `GET /api/v1/admin/snapshots` | List all persisted snapshots |
| `GET /api/v1/admin/seasons/{season}/weeks/{week}/snapshot/export` | Download rankings as Excel |
| `PUT /api/v1/page-visibility` | Update page visibility settings |

## Testing

The project includes 1,302 unit and integration tests across backend and frontend.

### Running Tests

```bash
# Backend tests (646 tests)
dotnet test

# Run with coverage
dotnet test --collect:"XPlat Code Coverage"

# Frontend tests (656 tests)
cd src/cfbpoll-web
npm test
```

### Coverage Summary

![Backend Tests](https://img.shields.io/badge/Backend_Tests-646-blue)
![Frontend Tests](https://img.shields.io/badge/Frontend_Tests-656-blue)
![Core Coverage](https://img.shields.io/badge/Core_Coverage-99%25-brightgreen)
![API Coverage](https://img.shields.io/badge/API_Coverage-100%25-brightgreen)
![Web Coverage](https://img.shields.io/badge/Web_Coverage-98%25-brightgreen)

| Project | Line Coverage | Branch Coverage |
|---------|---------------|-----------------|
| CFBPoll.Core | 99% | 92% |
| CFBPoll.API | 100% | 96% |
| cfbpoll-web | 98% | 92% |

**Excluded from coverage:**
- `RatingModule` - Proprietary rating algorithm, not included in the repository. Tests are maintained locally.
- `CFBDataService` - Makes HTTP calls to the external College Football Data API. Better suited for integration tests.
- `Program.cs` - ASP.NET Core startup configuration code.
