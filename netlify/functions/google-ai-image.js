// Netlify Function: Google AI Image Generation proxy
// Calls Google Generative AI API for image generation with server-side API key

const { GoogleGenerativeAI } = require('@google/generative-ai');
const admin = require('firebase-admin');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

// Initialize Firebase Admin only once
let db;
try {
  if (!admin.apps.length) {
    // Use environment variable for service account
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');
    
    if (serviceAccount.project_id) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      db = admin.firestore();
    }
  } else {
    db = admin.firestore();
  }
} catch (error) {
  console.error('Firebase initialization error:', error);
  // Continue without Firebase - fallback to no rate limiting
}

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
    const { prompt, userId, action } = body;
    
    // Handle usage check request
    if (action === 'checkUsage') {
      if (!userId) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: { message: 'userId is required' } })
        };
      }
      
      if (db) {
        try {
          const userRef = db.collection('users').doc(userId);
          const userDoc = await userRef.get();
          
          const now = new Date();
          const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
          
          let userData = userDoc.exists ? userDoc.data() : {};
          let imageUsage = userData.imageUsage || {};
          
          // Reset if new month
          if (imageUsage.month !== currentMonth) {
            imageUsage = { month: currentMonth, count: 0 };
          }
          
          const userTier = userData.tier || 'free';
          const monthlyLimit = userTier === 'paid' || userData.email === 'nemanja@leaded.pro' ? 125 : 0;
          const remaining = Math.max(0, monthlyLimit - (imageUsage.count || 0));
          
          return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
            body: JSON.stringify({ 
              usage: { 
                remaining: remaining,
                limit: monthlyLimit,
                used: imageUsage.count || 0,
                tier: userTier
              }
            })
          };
        } catch (error) {
          console.error('Failed to check usage:', error);
          return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({ error: { message: 'Failed to check usage' } })
          };
        }
      } else {
        // No Firebase, return default
        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
          body: JSON.stringify({ 
            usage: { remaining: 125, limit: 125, used: 0, tier: 'unknown' }
          })
        };
      }
    }

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

    // Server-side rate limiting with Firebase
    if (db) {
      try {
        const userRef = db.collection('users').doc(userId);
        const userDoc = await userRef.get();
        
        const now = new Date();
        const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        
        let userData = userDoc.exists ? userDoc.data() : {};
        let imageUsage = userData.imageUsage || {};
        
        // Reset if new month
        if (imageUsage.month !== currentMonth) {
          imageUsage = {
            month: currentMonth,
            count: 0,
            lastGenerated: null
          };
        }
        
        // Check limit (125 per month for premium, 0 for free)
        const userTier = userData.tier || 'free';
        const monthlyLimit = userTier === 'paid' || userData.email === 'nemanja@leaded.pro' ? 125 : 0;
        
        if (imageUsage.count >= monthlyLimit) {
          return {
            statusCode: 429,
            headers: corsHeaders,
            body: JSON.stringify({ 
              error: { 
                message: `Monthly limit reached (${monthlyLimit} images). ${userTier === 'free' ? 'Upgrade to Premium for 125 images/month.' : 'Resets next month.'}`,
                remaining: 0,
                limit: monthlyLimit
              } 
            })
          };
        }
        
        // Will increment after successful generation
        console.log(`User ${userId} has used ${imageUsage.count}/${monthlyLimit} generations this month`);
        
      } catch (error) {
        console.error('Rate limiting check failed:', error);
        // Continue without rate limiting on error
      }
    } else {
      console.log('Firebase not configured - rate limiting disabled');
    }

    // Initialize Google AI
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Get the Gemini model for image generation
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-image-preview" });

    console.log('Generating image for prompt:', prompt.substring(0, 100) + '...');

    // Enhanced prompt for first frame generation
    const enhancedPrompt = `Create a cinematic first frame preview image that captures the essence of this video prompt: ${prompt}. Focus on the main subject, scene, and visual style described. Make it visually striking and representative of what the opening frame of this video would look like.`;

    // Generate image using Gemini
    const result = await model.generateContent([enhancedPrompt]);
    const response = await result.response;
    
    console.log('Google AI response received');
    
    // Get the generated image data
    const candidates = response.candidates;
    if (!candidates || candidates.length === 0) {
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ error: { message: 'No image generated by Google AI' } })
      };
    }

    // For Gemini image generation, the response structure includes parts with inline data
    const candidate = candidates[0];
    if (!candidate.content || !candidate.content.parts) {
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ error: { message: 'Invalid response structure from Google AI' } })
      };
    }

    // Find the image part in the response
    const imagePart = candidate.content.parts.find(part => part.inlineData && part.inlineData.mimeType && part.inlineData.mimeType.startsWith('image/'));
    
    if (!imagePart || !imagePart.inlineData || !imagePart.inlineData.data) {
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ error: { message: 'No image data found in response' } })
      };
    }

    // Convert base64 image to data URL
    const imageData = imagePart.inlineData.data;
    const mimeType = imagePart.inlineData.mimeType;
    const dataUrl = `data:${mimeType};base64,${imageData}`;

    console.log(`Image generated successfully, size: ${imageData.length} bytes, type: ${mimeType}`);

    // Increment usage count in Firebase after successful generation
    let remaining = null;
    if (db) {
      try {
        const userRef = db.collection('users').doc(userId);
        const now = new Date();
        const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        
        // Get current data again to ensure accuracy
        const userDoc = await userRef.get();
        let userData = userDoc.exists ? userDoc.data() : {};
        let imageUsage = userData.imageUsage || { month: currentMonth, count: 0 };
        
        // Increment count
        imageUsage.count = (imageUsage.count || 0) + 1;
        imageUsage.lastGenerated = admin.firestore.FieldValue.serverTimestamp();
        imageUsage.month = currentMonth;
        
        // Update user document
        await userRef.set({
          imageUsage: imageUsage,
          lastActivity: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        
        const userTier = userData.tier || 'free';
        const monthlyLimit = userTier === 'paid' || userData.email === 'nemanja@leaded.pro' ? 125 : 0;
        remaining = Math.max(0, monthlyLimit - imageUsage.count);
        
        console.log(`Updated usage for ${userId}: ${imageUsage.count}/${monthlyLimit} (${remaining} remaining)`);
      } catch (error) {
        console.error('Failed to update usage count:', error);
        // Don't fail the request if we can't update the count
      }
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
      body: JSON.stringify({ 
        success: true,
        imageUrl: dataUrl,
        prompt: prompt,
        mimeType: mimeType,
        usage: {
          remaining: remaining
        }
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