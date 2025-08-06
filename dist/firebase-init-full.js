// Firebase SDK initialization for Chrome Extension
// Load Firebase SDK from CDN
(function() {
  // Firebase configuration
  const firebaseConfig = {
    apiKey: "AIzaSyCDsAJx-JUCuKC1-YR16N7APYpTh--SSLo",
    authDomain: "videoprompter-d6a18.firebaseapp.com",
    projectId: "videoprompter-d6a18",
    storageBucket: "videoprompter-d6a18.firebasestorage.app",
    messagingSenderId: "43646976330",
    appId: "1:43646976330:web:6d57b38a3f6c98d4c2c1b3"
  };

  // Create script tags for Firebase SDK
  const scripts = [
    'https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js',
    'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore-compat.js',
    'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth-compat.js'
  ];

  // Function to load scripts sequentially
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  // Load all Firebase scripts
  Promise.all(scripts.map(src => loadScript(src)))
    .then(() => {
      // Initialize Firebase
      if (typeof firebase !== 'undefined') {
        firebase.initializeApp(firebaseConfig);
        console.log('Firebase initialized successfully');
        
        // Make Firebase globally available
        window.firebase = firebase;
        window.firebaseConfig = firebaseConfig;
        
        // Dispatch event to notify other scripts
        window.dispatchEvent(new Event('firebaseReady'));
      }
    })
    .catch(error => {
      console.error('Failed to load Firebase SDK:', error);
    });
})();