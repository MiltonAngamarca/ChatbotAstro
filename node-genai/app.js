const express = require('express');
const path = require('path');
const axios = require('axios');
const dotenv = require('dotenv');
const fs = require('fs');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// Helper functions
function getLLMEndpoint() {
  const baseUrl = process.env.LLM_BASE_URL;
  console.log(baseUrl);

  return `${baseUrl}/chat/completions`;
}

function getModelName() {
  console.log(process.env.LLM_MODEL_NAME);

  return process.env.LLM_MODEL_NAME;
}

// Middleware
app.use(express.json());

// Explicitly serve assets from the public folder first
app.use(
  '/assets',
  express.static(path.join(__dirname, 'astro-app', 'dist', 'assets'))
);

// General static files middleware
app.use(express.static(path.join(__dirname, 'astro-app', 'dist')));

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'astro-app', 'dist', 'index.html'));
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.post('/api/chat', async (req, res) => {
  const { message } = req.body;

  // Special command for model info
  if (message === '!modelinfo') {
    return res.json({ model: getModelName() });
  }

  try {
    const response = await callLLMAPI(message);
    return res.json({ response });
  } catch (error) {
    console.error('Error calling LLM API:', error.message);
    return res.status(500).json({ error: 'Failed to get response from LLM' });
  }
});

// Call the LLM API
async function callLLMAPI(userMessage) {
  const chatRequest = {
    model: getModelName(),
    messages: [
      {
        role: 'system',
        content: 'You are a helpful assistant.',
      },
      {
        role: 'user',
        content: userMessage,
      },
    ],
  };

  try {
    const response = await axios.post(getLLMEndpoint(), chatRequest, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 300000, // 30 seconds
    });

    if (
      response.data &&
      response.data.choices &&
      response.data.choices.length > 0
    ) {
      return response.data.choices[0].message.content.trim();
    }

    throw new Error('No response choices returned from API');
  } catch (error) {
    if (error.response) {
      throw new Error(
        `API returned status code ${error.response.status}: ${JSON.stringify(
          error
        )}`
      );
    }
    throw error;
  }
}

// Start the server
app.listen(PORT, () => {
  console.log(`Server starting on http://localhost:${PORT}`);
  console.log(`Using LLM endpoint: ${getLLMEndpoint()}`);
  console.log(`Using model: ${getModelName()}`);
});

// Check and create default .env file if it doesn't exist
// function checkEnvFile() {
//   if (!fs.existsSync('.env')) {
//     console.log('Creating default .env file...');
//     const defaultEnv = `# Configuration for the LLM service
// LLM_BASE_URL=http://172.17.0.1:12434/engines/llama.cpp/v1
// LLM_MODEL_NAME=ignaciolopezluna020/llama3.2:1b
// `;
//     fs.writeFileSync('.env', defaultEnv);
//   }
// }

// checkEnvFile();
