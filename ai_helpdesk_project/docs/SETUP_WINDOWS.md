# Windows setup

## Docker Desktop route (recommended)

1. Install Docker Desktop.
2. Start Docker Desktop.
3. Open PowerShell in the project folder.
4. Run `docker compose up --build`.
5. Open http://localhost:5173.
6. API docs: http://localhost:8000/docs.

## Stop
`docker compose down`

## Reset database
`docker compose down -v` then `docker compose up --build`

## Optional Ollama AI
Install Ollama on Windows, pull a chat model, then set in `.env`:

AI_BASE_URL=http://host.docker.internal:11434/v1
AI_MODEL=your-model-name

Restart:
`docker compose up --build`

The application still works without Ollama because local fallback logic is included.
