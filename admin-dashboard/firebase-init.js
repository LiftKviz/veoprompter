// Firebase initialization with error handling
const firebaseConfig = {
  apiKey: "AIzaSyCDsAJx-JUCuKC1-YR16N7APYpTh--SSLo",
  authDomain: "videoprompter-d6a18.firebaseapp.com",
  projectId: "videoprompter-d6a18",
  storageBucket: "videoprompter-d6a18.firebasestorage.app",
  messagingSenderId: "43646976330",
  appId: "1:43646976330:web:6d57b38a3f6c98d4c2c1b3"
};

// Initialize Firebase with error handling
try {
  firebase.initializeApp(firebaseConfig);
  console.log('Firebase initialized successfully');
} catch (error) {
  console.error('Firebase initialization error:', error);
  document.getElementById('message-area').innerHTML = `
    <div class="error">
      <strong>Firebase initialization failed!</strong><br>
      ${error.message}
    </div>
  `;
}

// Check if we're on localhost or production
const isLocalhost = window.location.hostname === 'localhost' || 
                   window.location.hostname === '127.0.0.1';

// Log current domain for debugging
console.log('Current domain:', window.location.hostname);
console.log('Is localhost:', isLocalhost);