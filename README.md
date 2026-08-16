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
- [Code Conventions](#code-conventions)
- [Testing](#testing)

## TODO

Last Updated 8/6/2026
- Performance improvements around the system
- More QoL upgrades
- Partial predictions support for bowl season / playoff rounds
- Shareable rankings card
- Ongoing algorithm updates for rating and predictions
- Head-to-head team comparisons, including across seasons
- Conference ratings
- Remaining strength of schedule
- ...and more

## Features

- **Custom Ranking Algorithm**: Evaluates teams based on wins, strength of schedule, and margin of victory
- **Team Details**: Drill into individual teams to see schedule with opponent rankings, clickable opponent links, and expandable record breakdowns by location and opponent tier
- **All-Time Rankings**: View the best teams, worst teams, and hardest schedules across all seasons with sortable tables
- **Season Trends**: Interactive line chart showing rank progression throughout a season, with team logos as data points, CSS-driven highlighting, and custom tooltips
- **Poll Leaders**: Scatter chart showing how frequently teams have been ranked, with team logos as data points, year range filtering, and toggleable all-weeks vs. final-only modes
- **Track Record**: Historical accuracy of published predictions — Winner, Spread, Over/Under, Margin RMSE, and Margin Bias — viewable all-time and by season, with color-coded quality bands on the By-Season and weekly stats, plus toggleable margin-accuracy detail
- **Team Prediction Records**: Per-team predicted vs. actual win/loss record for a season, with delta badges showing over/under-performance against predictions
- **Page Visibility Controls**: Admin toggles to enable/disable the All-Time, Poll Leaders, and Season Trends pages, with deep-link blocking for disabled pages
- **Historical Data**: Access rankings from 2002 to present
- **Mobile-Responsive UI**: Collapsible hamburger menu navigation on small screens with viewport-aware chart tooltips
- **Interactive UI**: Sortable rankings table with team logos and colors
- **Game Predictions**: Generate game predictions with spread and over/under picks using team ratings and betting line data
- **Admin Dashboard**: JWT-authenticated admin panel to calculate, preview, and publish rankings and predictions with a two-step draft/publish workflow
- **Experimental Rating Preview**: Admin-only calculation against any rating algorithm version for any season/week, without persisting or publishing — used to validate a candidate algorithm before it becomes a season's default
- **Excel Export**: Download rankings as Excel spreadsheets with rating breakdowns
- **SQLite Persistence**: Rankings and predictions snapshots stored in SQLite for fast retrieval without redundant API calls
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
  -> IRankingsModule                  -> IExcelExportModule
                                     -> IPersistentCache
                                     -> IPollLeadersModule
                                     -> IPredictionCalculatorModule
                                     -> IPredictionGradingModule
                                     -> IPredictionsModule
                                     -> IRankingsModule
                                     -> IRatingModule
                                     -> ISeasonModule
                                     -> ISeasonTrendsModule
                                     -> ITrackRecordModule

AllTimeController                  AllTimeModule
  -> IAllTimeModule                  -> ICFBDataService
                                     -> IRankingsModule

AuthController                     AuthModule
  -> IAuthModule                     -> IOptions<AuthOptions>

ConferencesController
  -> IConferenceModule
  -> ICFBDataService

                                   CacheModule (IPersistentCache)    CacheData
                                     -> ICacheData                     -> SQLite

PageVisibilityController           PageVisibilityModule
  -> IPageVisibilityModule           -> IPageVisibilityData           PageVisibilityData
                                                                       -> SQLite

PollLeadersController              PollLeadersModule
  -> IPollLeadersModule              -> ICFBDataService
                                     -> IPersistentCache
                                     -> IRankingsModule

PredictionsController              PredictionsModule
  -> IPredictionsModule              -> IPredictionsData              PredictionsData
                                                                       -> SQLite

RankingsController                 RankingsModule
  -> ICFBDataService                 -> IRankingsData                 RankingsData
  -> IRankingsModule                                                  -> SQLite
  -> IRatingModule

SeasonsController
  -> ICFBDataService
  -> IPredictionsModule
  -> IRankingsModule
  -> ISeasonModule

SeasonTrendsController             SeasonTrendsModule
  -> ISeasonTrendsModule             -> ICFBDataService
                                     -> IPersistentCache
                                     -> IRankingsModule
                                     -> ISeasonModule

TeamsController                    TeamsModule
  -> ITeamsModule                    -> ICFBDataService
                                     -> IRankingsModule
                                     -> IRatingModule

TrackRecordController              TrackRecordModule
  -> ITrackRecordModule              -> IPersistentCache
                                     -> IPredictionsModule
```

Only `RankingsModule` has a direct dependency on `IRankingsData`, only `PredictionsModule` has a direct dependency on `IPredictionsData`, only `CacheModule` has a direct dependency on `ICacheData`, and only `PageVisibilityModule` has a direct dependency on `IPageVisibilityData`. Controllers never reference data-layer interfaces. `IPredictionGradingModule` (grading logic) and `IConferenceModule` (conference data transformation) have no further module or data-layer dependencies of their own.

## Prerequisites

- [.NET 10.0 SDK](https://dotnet.microsoft.com/download)
- [Node.js 18+](https://nodejs.org/)
- [College Football Data API Key](https://collegefootballdata.com/key)

## Setup

### 1. Clone the repository

```bash
git clone https://github.com/taylorleprechaun/CFBPollUI.git
cd CFBPollUI
git submodule update --init --recursive
```

> The submodule step pulls `RatingModule.cs` and `PredictionCalculatorModule.cs` from a private repo. Most external contributors won't have access to it, so this will just leave `src/CFBPoll.Core/Modules/Proprietary/` empty — see [Implement Proprietary Modules](#4-implement-proprietary-modules) below for how to supply your own implementations instead.

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

### 4. Implement Proprietary Modules

The rating module (`RatingModule.cs`) and prediction calculator module (`PredictionCalculatorModule.cs`) live in a private repo, mounted into this one as a git submodule at `src/CFBPoll.Core/Modules/Proprietary/`. If you have access to that private repo, `git submodule update --init --recursive` (see [Clone the repository](#1-clone-the-repository)) already populated this folder and you can skip the rest of this section.

If you don't have access, the folder will be empty after cloning. Add your own files there instead — the project builds any `.cs` files it finds in that folder automatically, no `.csproj` changes needed:

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

public class PredictionCalculatorModule : IPredictionCalculatorModule
{
    public Task<IEnumerable<GamePrediction>> GeneratePredictionsAsync(
        SeasonData seasonData,
        IDictionary<string, RatingDetails> ratings,
        IEnumerable<ScheduleGame> games,
        IEnumerable<BettingLine> bettingLines)
    {
        // Your prediction algorithm here
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
| `GET /api/v1/predictions/seasons` | Returns seasons that have at least one published prediction week |
| `GET /api/v1/seasons/{season}/predictions/team-records` | Returns per-team predicted vs. actual win/loss records for the specified season |
| `GET /api/v1/seasons/{season}/weeks/{week}/predictions` | Returns published predictions for the specified season/week |
| `GET /api/v1/seasons/{season}/trends` | Returns season trends showing rank progression across published weeks |
| `GET /api/v1/seasons/{season}/weeks/{week}/rankings` | Returns ranked teams for the specified week |
| `GET /api/v1/seasons` | Returns available seasons (2002 to present) |
| `GET /api/v1/seasons/{season}/weeks` | Returns all weeks for a season with rankings and predictions publication status |
| `GET /api/v1/teams/{teamName}?season={s}&week={w}` | Returns team details including schedule and record breakdowns |
| `GET /api/v1/track-record` | Returns the all-time prediction track record (right/wrong/push per pick category, overall and by graded week) |

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
| `POST /api/v1/admin/seasons/{season}/weeks/{week}/experimental/{algorithmVersion}` | Calculate rankings using an explicitly chosen algorithm version, without persisting or publishing |
| `GET /api/v1/admin/seasons/{season}/weeks/{week}/experimental/{algorithmVersion}/export` | Download experimental rankings as Excel for a chosen algorithm version, without persisting or publishing |
| `POST /api/v1/admin/seasons/{season}/experimental/{algorithmVersion}/trends` | Calculate season trends (top-25 rank progression) live across every week of a season using an explicitly chosen algorithm version, without persisting or publishing |
| `GET /api/v1/admin/seasons/{season}/weeks/{week}/prediction` | Retrieve persisted predictions for a season/week without recalculating or re-grading |
| `POST /api/v1/admin/seasons/{season}/weeks/{week}/prediction` | Calculate predictions for a season/week and save as draft |
| `PATCH /api/v1/admin/seasons/{season}/weeks/{week}/prediction` | Update a prediction (currently supports publishing) |
| `DELETE /api/v1/admin/seasons/{season}/weeks/{week}/prediction` | Delete a prediction |
| `GET /api/v1/admin/predictions` | List all persisted prediction summaries |
| `POST /api/v1/admin/seasons/{season}/weeks/{week}/prediction/grade` | Grade predictions against actual final scores and save as draft |
| `PATCH /api/v1/admin/seasons/{season}/weeks/{week}/prediction/results` | Publish graded results, making them visible on the public predictions page |
| `POST /api/v1/admin/seasons/{season}/weeks/{week}/cache` | Clear cached CollegeFootballData API responses for a season/week without recalculating |
| `PUT /api/v1/page-visibility` | Update page visibility settings |

## Code Conventions

A few ordering/formatting conventions are worth calling out since they're enforced with varying degrees of automation rather than being self-evident from a diff:

- **C# member ordering**: Within each class, fields/constants → properties → constructor → public methods → private methods, alphabetical within each section. This is a manual/code-review convention, not automated tooling — it was applied as a one-time formatting pass and isn't re-run by a linter, since off-the-shelf tooling sorts ordinally in a way that conflicts with this project's casing conventions.
- **TypeScript/React member ordering**: Top-level `function`/`class` declarations (including exports) are sorted alphabetically, enforced automatically by [`eslint-plugin-perfectionist`](https://github.com/azat-io/eslint-plugin-perfectionist)'s `sort-modules` rule. Colocated prop `interface`/`type` declarations are excluded from sorting so an `XProps` type stays directly above the component it describes.
- **Git hooks**: A committed [Husky](https://typicode.github.io/husky/) setup runs `eslint --fix` on staged `.ts`/`.tsx` files before every commit and `tsc -b` before every push. CI re-runs `eslint .` as a backstop for local hook bypasses.
- **Test block ordering**: `describe`/`it()` blocks in Vitest test files are alphabetized — sibling `describe`s, nested `describe`s, and `it()`s within each `describe`. This is enforced by convention/code review only, since `describe`/`it()` are call expressions rather than declarations and no lint rule can safely reorder them automatically.

## Testing

The project includes 2,285 unit and integration tests across backend and frontend.

### Running Tests

```bash
# Backend tests (930 tests)
dotnet test

# Run with coverage
dotnet test --collect:"XPlat Code Coverage"

# Frontend tests (1,355 tests)
cd src/cfbpoll-web
npm test
```

### Coverage Summary

![Backend Tests](https://img.shields.io/badge/Backend_Tests-930-blue)
![Frontend Tests](https://img.shields.io/badge/Frontend_Tests-1355-blue)
![Core Coverage](https://img.shields.io/badge/Core_Coverage-99%25-brightgreen)
![API Coverage](https://img.shields.io/badge/API_Coverage-100%25-brightgreen)
![Web Coverage](https://img.shields.io/badge/Web_Coverage-100%25-brightgreen)

| Project | Line Coverage | Branch Coverage |
|---------|---------------|-----------------|
| CFBPoll.Core | 99% | 94% |
| CFBPoll.API | 100% | 97% |
| cfbpoll-web | 100% | 95% |

**Excluded from coverage:**
- `RatingModule` and `PredictionCalculatorModule` - Proprietary algorithms, kept in a private submodule rather than this repository. Tests are maintained privately alongside them.
- `CFBDataService` - Makes HTTP calls to the external College Football Data API. Better suited for integration tests.
- `Program.cs` - ASP.NET Core startup configuration code.
