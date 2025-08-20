exports.handler = async (event, context) => {
  // Handle CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { code, redirectUri } = JSON.parse(event.body);

    if (!code) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Authorization code required' })
      };
    }

    // Exchange code for access token using client secret
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        client_id: '374428444834-b7m6bvo4uv5bo4gkib44g858g6cl2feb.apps.googleusercontent.com',
        client_secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET, // Store this in Netlify env vars
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri || 'https://veoprompter.netlify.app/oauth-redirect'
      })
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Token exchange failed:', errorData);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Failed to exchange code for token', details: errorData })
      };
    }

    const tokenData = await tokenResponse.json();
    
    // Get user info using the access token
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`
      }
    });

    if (!userResponse.ok) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Failed to get user info' })
      };
    }

    const userInfo = await userResponse.json();
    
    return {
      statusCode: 200,
      headers,
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
    console.error('OAuth exchange error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error', details: error.message })
    };
  }
};