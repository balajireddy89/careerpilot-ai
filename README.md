# CareerPilot AI

AI-powered career guidance platform for students — skill assessment, resume analysis, interview prep, placement prediction, and personalized learning roadmaps.

## Project structure

```
careerpilot-ai/
├── frontend/          # React + Vite SPA (Tailwind CSS)
│   └── src/
│       ├── pages/     # Feature screens (dashboard, interviews, coding, etc.)
│       ├── lib/       # Supabase, OpenRouter, AI & chat services
│       ├── context/   # Auth context
│       └── hooks/     # Shared React hooks
├── backend/           # Spring Boot REST API (Java)
│   └── src/main/java/com/careerpilot/
│       ├── controller/
│       ├── service/
│       └── model/
└── supabase/          # Database schema & migrations
```

## Features

- **Dashboard** — overview and quick navigation
- **Skill Assessment** — evaluate technical and soft skills
- **Career Guidance** — AI-driven career recommendations
- **Resume Analyzer** — parse and score resumes
- **Internship Engine** — internship matching
- **Placement Predictor** — placement readiness scoring
- **HR & Technical Interviews** — mock interview practice
- **Coding Platform** — coding challenges
- **Aptitude Prep** — aptitude test preparation
- **Learning Roadmap** — personalized study paths
- **Career Chatbot** — conversational career assistant
- **Admin Panel** — user and content management

## Tech stack

| Layer    | Stack                                      |
|----------|--------------------------------------------|
| Frontend | React 19, Vite, Tailwind CSS, React Router |
| Backend  | Spring Boot 2.7, Spring Security, JPA      |
| Database | PostgreSQL (Supabase)                      |
| AI       | OpenRouter API                             |
| Auth     | Supabase Auth                              |

## Getting started

### Frontend

```bash
cd frontend
cp .env.example .env.local
# Fill in VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_OPENROUTER_API_KEY
npm install
npm run dev
```

### Backend

```bash
cd backend
# Edit src/main/resources/application.properties with your DB and API keys
mvn spring-boot:run
```

### Database

Run the SQL files in `supabase/` against your Supabase project.

## Admin JSON imports

Sample import files live in `sample-data/` at the repo root:

| File | Admin tab | Format |
|------|-----------|--------|
| `hr-tcs.json` | HR Questions | `[{ "id": 1, "question": "..." }]` |
| `codingeasy.json` | Coding Practice | `[{ "id", "challenge", "test_cases": [{ "input", "output" }] }]` |
| `roadmap.json` | Learning Roadmap | `{ "roadmapTitle", "phases": [{ "phaseName", "topics": [...] }] }` |
| `pythonquestions.json` / `javaquestions.json` | Technical Interview | MCQ with `choices[]` and `answer` |
| `quantitativequestions.json` | Aptitude Prep | Same MCQ format |

The Admin Panel shows expandable JSON format guides on each content tab. Roadmap `phases` JSON auto-converts to the student `months[]` structure used in Learning Roadmap.

## Contributors

See [CONTRIBUTORS.md](CONTRIBUTORS.md).

## License

Private project — all rights reserved.
