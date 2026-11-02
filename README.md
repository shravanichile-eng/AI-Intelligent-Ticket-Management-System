## 💻 Installation and Setup Guide (Windows)

Follow these steps to download, configure, and run the AI Help Desk Ticketing System on your local laptop.

## 📸 Application Screenshots

### 1. Application Screen 1
![Application Screen 1](<screenshots/Screenshot 2026-10-15 150517.png>)

### 2. Application Screen 2
![Application Screen 2](<screenshots/Screenshot 2026-10-15 145132.png>)

### 3. Application Screen 3
![Application Screen 3](<screenshots/Screenshot 2026-10-15 145206.png>)

### Step 1: Install the Prerequisites

Before running the application, install the following software:

1. **Git:** Used to download the project from GitHub.
   - Download: https://git-scm.com/downloads

2. **Docker Desktop:** Used to run the frontend, backend, and PostgreSQL database.
   - Download: https://www.docker.com/products/docker-desktop/

3. **Visual Studio Code (Optional):** Recommended for viewing and editing the project source code.
   - Download: https://code.visualstudio.com/

After installing Docker Desktop, open it and make sure the Docker engine is running.

### Step 2: Download the Project

Open PowerShell or Command Prompt.

Run the following command:

```bash
git clone https://github.com/YOUR-USERNAME/ai-ticketing-portal.git
```

Replace `YOUR-USERNAME` with the GitHub username that owns the repository.

### Step 3: Open the Project Folder

Navigate to the downloaded project:

```bash
cd ai-ticketing-portal
```

You can also open the folder in Visual Studio Code:

```bash
code .
```

### Step 4: Configure Environment Variables

Check the project for an example environment file such as `.env.example`.

If one is provided, copy it to `.env` and configure the required values according to the project's setup instructions.

Do not upload your actual `.env` file or private credentials to GitHub.

### Step 5: Build and Start the Application

Make sure Docker Desktop is running.

Execute the following command from the main project directory:

```powershell
docker compose up --build
```

This command builds the required application images and starts the configured services.

Wait until the services have started successfully.

### Step 6: Access the Application

Open your web browser and visit:

**Frontend Application:**

http://localhost:5173

**Backend API Documentation:**

http://localhost:8000/docs

The backend documentation URL assumes the project exposes FastAPI on port 8000.

### Step 7: Login to the Application

Use the following demo credentials to explore the application:

| Role | Username | Password |
|---|---|---|
| Admin | admin1 | admin123 |
| Agent | support_agent | agent123 |
| User | user1 | user123 |

These are development demo credentials. Change them before any public or production deployment.

### Step 8: Configure AI Integration (Optional)

The application can run without an external AI API key using its built-in fallback functionality.

To enable a local AI model using Ollama:

1. Download and install Ollama from https://ollama.com/
2. Download the required model:

```bash
ollama pull llama3.2
```

3. Configure the AI environment variables:

```env
AI_BASE_URL=http://host.docker.internal:11434/v1
AI_MODEL=llama3.2
```

4. Ensure Ollama is running and accessible from the application containers.
5. Restart the application after changing its configuration.

Other compatible AI providers can also be configured using the appropriate endpoint and credentials.

### Step 9: Stop the Application

To stop the running application, open the terminal where Docker Compose is running and press:

```text
Ctrl + C
```

To stop and remove the application containers, run:

```bash
docker compose down
```

**Note:** This command does not normally remove named database volumes. Do not use `docker compose down -v` unless you intentionally want to delete the stored database volume and its data.

### Step 10: Restart the Application

To start the application again after the initial setup:

```bash
docker compose up
```

### Troubleshooting

**Problem: Docker is not running**

Solution: Open Docker Desktop and wait until the Docker engine is ready.

**Problem: Port 5173 or 8000 is already in use**

Solution: Stop the application using the conflicting port or change the configured port mapping.

**Problem: Application cannot connect to the database**

Solution: Check that the PostgreSQL container is running and verify the database environment settings.

**Problem: AI features are not responding**

Solution: Check the AI provider URL, model name, API configuration, and backend logs. The application may still run using its fallback functionality.

**Problem: Changes are not visible**

Solution: Rebuild the application if required:

```bash
docker compose up --build
```

---

## ⚠️ Important Notes

- PostgreSQL is the primary source of truth.
- Google Sheets and Google Drive are optional integrations.
- AI features can use a local fallback when no AI provider is configured.
- Email notifications default to console mode.
- Never publish API keys, database passwords, JWT secrets, or private environment files.
- Change demo credentials and security secrets before production deployment.
