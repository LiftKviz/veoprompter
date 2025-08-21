// Netlify Function: GPT proxy
// Calls OpenAI Chat Completions with server-side API key and returns simplified response

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

exports.handler = async (event) => {
  console.log('Function called with:', {
    path: event.path,
    queryStringParameters: event.queryStringParameters,
    httpMethod: event.httpMethod
  });

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: corsHeaders,
      body: ''
    };
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch (e) {
    body = {};
  }
  
  // Handle OAuth exchange requests FIRST
  console.log('Debug OAuth check:', {
    queryOauth: event.queryStringParameters?.oauth,
    bodyOauth: body.oauth,
    bodyKeys: Object.keys(body),
    method: event.httpMethod
  });
  
  if (event.queryStringParameters?.oauth === 'exchange' || body.oauth === 'exchange') {
    console.log('OAuth exchange detected - processing');
    try {
      const { code, redirectUri } = body;

      if (!code) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Authorization code required' })
        };
      }

      const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
      if (!clientSecret) {
        console.error('GOOGLE_OAUTH_CLIENT_SECRET not configured');
        return {
          statusCode: 500,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Server configuration error' })
        };
      }

      // Exchange code for access token
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          client_id: '374428444834-b7m6bvo4uv5bo4gkib44g858g6cl2feb.apps.googleusercontent.com',
          client_secret: clientSecret,
          code: code,
          grant_type: 'authorization_code',
          redirect_uri: redirectUri || 'https://veoprompter.netlify.app/oauth-redirect'
        })
      });

      const tokenData = await tokenResponse.json();

      if (!tokenResponse.ok) {
        console.error('Token exchange failed:', tokenData);
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ 
            error: 'Failed to exchange code for token', 
            details: tokenData 
          })
        };
      }
      
      // Get user info using the access token
      const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`
        }
      });

      if (!userResponse.ok) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Failed to get user info' })
        };
      }

      const userInfo = await userResponse.json();
      
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          success: true,
          user: {
            email: userInfo.email,
            name: userInfo.name,
            picture: userInfo.picture,
            id: userInfo.id
          },
          token: {
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token,
            expires_at: Date.now() + (tokenData.expires_in * 1000)
          }
        })
      };

    } catch (error) {
      console.error('OAuth error:', error);
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ 
          error: 'Internal server error', 
          message: error.message 
        })
      };
    }
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
    const { model = 'gpt-4o', systemPrompt, prompt, instruction, temperature = 0.7, maxTokens = 800 } = body;

    if (!instruction || typeof instruction !== 'string') {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: { message: 'instruction is required' } })
      };
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


