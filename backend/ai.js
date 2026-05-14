const fetch = require('node-fetch');
require('dotenv').config({ path: '../.env' });

// 3-strategy JSON parser for AI responses
function parseAIJson(text) {
  // Strategy 1: direct parse
  try {
    return JSON.parse(text);
  } catch {}

  // Strategy 2: extract JSON from markdown code block
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    try {
      return JSON.parse(codeBlockMatch[1].trim());
    } catch {}
  }

  // Strategy 3: find first { ... } block
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]);
    } catch {}
  }

  return null;
}

async function callOpenRouter(systemPrompt, userMessage) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022';

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

    const rawResult = data.choices[0].message.content;
    const parsedJson = parseAIJson(rawResult);

    return {
      success: true,
      result: rawResult,
      result_json: parsedJson,
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

module.exports = { callOpenRouter, parseAIJson };
