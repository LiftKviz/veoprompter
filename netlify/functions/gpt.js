// Netlify Function: GPT proxy
// Calls OpenAI Chat Completions with server-side API key and returns simplified response
// Updated to ensure environment variables are loaded - v2

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: corsHeaders,
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: { message: 'Method not allowed' } })
    };
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: { message: 'Server misconfiguration: OPENAI_API_KEY missing' } })
    };
  }

  try {
    const { model = 'gpt-4o', systemPrompt, prompt, instruction, temperature = 0.7, maxTokens = 800, userEmail, isPremium = false } = JSON.parse(event.body || '{}');

    if (!instruction || typeof instruction !== 'string') {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: { message: 'instruction is required' } })
      };
    }

    if (!userEmail || typeof userEmail !== 'string') {
      return {
        statusCode: 401,
        headers: corsHeaders,
        body: JSON.stringify({ error: { message: 'User authentication required' } })
      };
    }

    // Server-side rate limiting for free users
    if (!isPremium) {
      const today = new Date().toISOString().split('T')[0];
      const usageKey = `usage_${userEmail}_${today}`;
      
      // Simple in-memory storage for demo (in production, use Redis/Firestore)
      global.usageStore = global.usageStore || {};
      const currentUsage = global.usageStore[usageKey] || 0;
      
      if (currentUsage >= 3) {
        return {
          statusCode: 429,
          headers: {
            ...corsHeaders,
            'X-RateLimit-Limit': '3',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(Date.now() + 24*60*60*1000).toISOString()
          },
          body: JSON.stringify({ 
            error: { 
              message: '🎯 Daily limit reached! You\'ve used all 3 free modifications today. Sign up for Pro to get unlimited access.' 
            } 
          })
        };
      }
      
      // Increment usage count
      global.usageStore[usageKey] = currentUsage + 1;
    }

    const messages = [];
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    if (prompt) {
      messages.push({ role: 'user', content: `Original prompt: "${prompt}"` });
    }
    messages.push({ role: 'user', content: instruction });

    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens: maxTokens
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        statusCode: response.status,
        headers: corsHeaders,
        body: JSON.stringify({ error: data.error || { message: 'OpenAI API error' } })
      };
    }

    const content = data?.choices?.[0]?.message?.content || '';
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
      body: JSON.stringify({ content })
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: { message: err.message || 'Unexpected server error' } })
    };
  }
};


