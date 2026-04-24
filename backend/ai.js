const fetch = require('node-fetch');
require('dotenv').config({ path: '../.env' });

async function callOpenRouter(systemPrompt, userMessage) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5';

  if (!apiKey || apiKey === 'your_openrouter_api_key_here') {
    return {
      success: false,
      result: 'OpenRouter API key not configured. Please add your API key to the .env file.',
      model: model,
      usage: null
    };
  }

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'AI Permit & Zoning Compliance'
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    });

    const data = await response.json();

    if (data.error) {
      return {
        success: false,
        result: data.error.message || 'AI request failed',
        model: model,
        usage: null
      };
    }

    return {
      success: true,
      result: data.choices[0].message.content,
      model: data.model || model,
      usage: data.usage || null,
      id: data.id
    };
  } catch (error) {
    return {
      success: false,
      result: `AI service error: ${error.message}`,
      model: model,
      usage: null
    };
  }
}

module.exports = { callOpenRouter };
