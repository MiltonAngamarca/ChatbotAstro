# hello-genai

This is a chatbot application that uses a GenAI Model. The application is built with Node.js (Astro).

## Environment Variables

The application uses the following environment variables defined in the `.env` file:

- `LLM_BASE_URL`: The base URL of the LLM API
- `LLM_MODEL_NAME`: The model name to use

To change these settings, simply edit the `.env` file in the root directory of the project.

## Quick Start

1. Clone the repository:

   ```bash
   git clone https://github.com/docker/hello-genai
   cd hello-genai
   ```

2. Install dependencies for the Astro application:

   ```bash
   cd node-genai/astro-app
   npm install
   cd ../..
   ```

3. Run the application using the script:

   ```bash
   ./run.sh
   ```

4. Open your browser and visit the following links:

   http://localhost:8080 for the GenAI Application in Node (Astro)

## Requirements

- macOS (recent version)
- Either:
  - Docker and Docker Compose (preferred)
  - Go 1.21 or later
- Local LLM server

If you're using a different LLM server configuration, you may need to modify the`.env` file.

## Project Structure

```
.env
.gitignore
Dockerfile
LICENSE
README.md
docker-compose.yml
node-genai\
│   ├── .env
│   ├── Dockerfile
│   ├── app.js
│   ├── astro-app\
│   │   ├── .gitignore
│   │   ├── .vscode\
│   │   ├── README.md
│   │   ├── astro.config.mjs
│   │   ├── package-lock.json
│   │   ├── package.json
│   │   ├── public\
│   │   ├── src\
│   │   └── tsconfig.json
│   ├── package.json
│   └── views\
└── run.sh
```
