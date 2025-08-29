// Netlify Function: Google AI Image Generation proxy
// Calls Google Generative AI API for image generation with server-side API key

const { GoogleGenerativeAI } = require('@google/generative-ai');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

exports.handler = async (event) => {
  console.log('Google AI Image function called with:', {
    path: event.path,
    httpMethod: event.httpMethod
  });

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

  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: { message: 'Server misconfiguration: GOOGLE_AI_API_KEY missing' } })
    };
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch (e) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: { message: 'Invalid JSON body' } })
    };
  }

  try {
    const { prompt, userId } = body;

    if (!prompt || typeof prompt !== 'string') {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: { message: 'prompt is required and must be a string' } })
      };
    }

    if (!userId || typeof userId !== 'string') {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: { message: 'userId is required for rate limiting' } })
      };
    }

    // TODO: Implement rate limiting logic here
    // Check user's monthly usage against 125 limit
    // For now, we'll proceed without rate limiting

    // Initialize Google AI
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Get the Gemini model for image generation
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-image-preview" });

    console.log('Generating image for prompt:', prompt.substring(0, 100) + '...');

    // Generate image
    const result = await model.generateContent([
      {
        text: `Create a cinematic first frame preview image for this video prompt: ${prompt}. Make it visually striking and representative of what the video would look like.`
      }
    ]);

    // The response should contain the generated image
    const response = await result.response;
    
    // For image generation, we need to handle the response differently
    // The actual implementation depends on Google AI's image generation API structure
    // This is a placeholder structure that may need adjustment based on actual API response
    
    if (!response) {
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ error: { message: 'No response from Google AI' } })
      };
    }

    // TODO: Increment user's monthly usage count here
    // Store usage in database/storage for rate limiting

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
      body: JSON.stringify({ 
        success: true,
        imageUrl: response.imageUrl || response.url, // Adjust based on actual API response structure
        prompt: prompt
      })
    };

  } catch (err) {
    console.error('Google AI Image generation error:', err);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: { message: err.message || 'Image generation failed' } })
    };
  }
};