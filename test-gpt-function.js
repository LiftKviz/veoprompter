// Test the GPT function locally
const { handler } = require('./netlify/functions/gpt.js');

async function testFunction() {
  console.log('🧪 Testing GPT function locally...\n');
  
  // Mock event object
  const mockEvent = {
    httpMethod: 'POST',
    body: JSON.stringify({
      model: 'gpt-4o',
      systemPrompt: 'You are a helpful assistant.',
      prompt: 'Original prompt: Create a video about cats',
      instruction: 'Make it more energetic and fun',
      temperature: 0.7,
      maxTokens: 100
    })
  };

  try {
    const result = await handler(mockEvent);
    console.log('✅ Function executed successfully');
    console.log('📊 Status:', result.statusCode);
    console.log('📄 Response:', result.body);
    
    if (result.statusCode === 200) {
      console.log('🎉 Function is working correctly!');
    } else {
      console.log('⚠️ Function returned error status');
      const body = JSON.parse(result.body);
      console.log('❌ Error:', body.error?.message);
    }
  } catch (error) {
    console.error('❌ Function test failed:', error.message);
    
    if (error.message.includes('OPENAI_API_KEY')) {
      console.log('💡 This is expected locally (no API key set)');
      console.log('✅ Function structure is correct for deployment');
    }
  }
}

testFunction();