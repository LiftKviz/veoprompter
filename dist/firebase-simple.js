// Simple Firebase integration without external SDKs
const firebaseConfig = {
  apiKey: "AIzaSyCDsAJx-JUCuKC1-YR16N7APYpTh--SSLo",
  authDomain: "videoprompter-d6a18.firebaseapp.com",
  projectId: "videoprompter-d6a18",
  storageBucket: "videoprompter-d6a18.firebasestorage.app",
  messagingSenderId: "43646976330",
  appId: "1:43646976330:web:6d57b38a3f6c98d4c2c1b3"
};

class SimpleFirebaseService {
  constructor() {
    this.projectId = firebaseConfig.projectId;
    this.apiKey = firebaseConfig.apiKey;
    this.baseUrl = `https://firestore.googleapis.com/v1/projects/${this.projectId}/databases/(default)/documents`;
  }

  async isFirebaseEnabled() {
    return this.apiKey !== 'YOUR_API_KEY' && this.projectId !== 'YOUR_PROJECT_ID';
  }

  async getPrompts() {
    try {
      const url = `${this.baseUrl}/prompts?key=${this.apiKey}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Firebase error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.documents) {
        return [];
      }
      
      return data.documents.map(doc => {
        const fields = doc.fields || {};
        return {
          id: doc.name.split('/').pop(),
          category: fields.category?.stringValue || '',
          title: fields.title?.stringValue || '',
          prompt: fields.prompt?.stringValue || '',
          youtubeLink: fields.youtubeLink?.stringValue || null,
          order: fields.order?.integerValue || 0
        };
      });
    } catch (error) {
      console.error('Firebase fetch error:', error);
      throw error;
    }
  }

  async subscribeToPrompts(callback) {
    // Simple polling instead of real-time (Manifest V3 limitation)
    const pollPrompts = async () => {
      try {
        const prompts = await this.getPrompts();
        callback(prompts);
        
        // Cache for offline use
        chrome.storage.local.set({ 
          cachedPrompts: prompts,
          lastSync: Date.now()
        });
      } catch (error) {
        console.error('Error polling prompts:', error);
        // Fall back to cached prompts
        const result = await chrome.storage.local.get(['cachedPrompts']);
        if (result.cachedPrompts) {
          callback(result.cachedPrompts);
        }
      }
    };
    
    // Initial load
    await pollPrompts();
    
    // Poll every 30 seconds for updates
    setInterval(pollPrompts, 30000);
  }
}

const simpleFirebaseService = new SimpleFirebaseService();