// Subscriptions Admin Dashboard
// Firebase should already be initialized by firebase-init.js
const auth = firebase.auth();
const db = firebase.firestore();

// State
let currentUser = null;
let subscriptions = [];

// DOM Elements
const authBtn = document.getElementById('auth-btn');
const authStatus = document.getElementById('auth-status');
const mainContent = document.getElementById('main-content');
const noAuthMessage = document.getElementById('no-auth-message');
const subscriptionsContent = document.getElementById('subscriptions-content');

// Stats elements
const totalUsersEl = document.getElementById('total-users');
const activeSubscribersEl = document.getElementById('active-subscribers');
const freeUsersEl = document.getElementById('free-users');
const conversionRateEl = document.getElementById('conversion-rate');

// Authentication
authBtn.addEventListener('click', async () => {
  if (currentUser) {
    await auth.signOut();
  } else {
    await signIn();
  }
});

async function signIn() {
  const provider = new firebase.auth.GoogleAuthProvider();
  try {
    await auth.signInWithPopup(provider);
  } catch (error) {
    console.error('Auth error:', error);
    
    if (error.code === 'auth/unauthorized-domain') {
      showError('This domain is not authorized. Please contact the administrator.');
    } else if (error.code === 'auth/popup-blocked') {
      try {
        await auth.signInWithRedirect(provider);
      } catch (redirectErr) {
        showError('Authentication failed: ' + redirectErr.message);
      }
    } else {
      showError('Authentication failed: ' + error.message);
    }
  }
}

auth.onAuthStateChanged(async (user) => {
  currentUser = user;
  if (user) {
    // Check if user is admin
    if (user.email !== 'nemanja@leaded.pro') {
      showError('Access denied. Admin privileges required.');
      await auth.signOut();
      return;
    }
    
    authStatus.textContent = `Signed in as ${user.email}`;
    authBtn.textContent = 'Sign Out';
    mainContent.style.display = 'block';
    noAuthMessage.style.display = 'none';
    
    // Load subscription data
    await loadSubscriptions();
  } else {
    authStatus.textContent = 'Not authenticated';
    authBtn.textContent = 'Sign In';
    mainContent.style.display = 'none';
    noAuthMessage.style.display = 'block';
  }
});

// Load subscriptions data
async function loadSubscriptions() {
  try {
    subscriptionsContent.innerHTML = '<div class="loading">Loading subscriptions...</div>';
    
    console.log('📊 Loading subscriptions data...');
    
    // Get all subscriptions
    const subscriptionsSnapshot = await db.collection('subscriptions')
      .orderBy('updatedAt', 'desc')
      .get();
    
    subscriptions = [];
    subscriptionsSnapshot.forEach((doc) => {
      subscriptions.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    console.log(`✅ Loaded ${subscriptions.length} subscriptions`);
    
    // Update stats
    updateStats();
    
    // Render subscriptions table
    renderSubscriptions();
    
  } catch (error) {
    console.error('❌ Failed to load subscriptions:', error);
    showError('Failed to load subscription data: ' + error.message);
  }
}

// Update statistics
function updateStats() {
  const totalUsers = subscriptions.length;
  const activeSubscribers = subscriptions.filter(s => s.paid && s.subscriptionStatus === 'active').length;
  const freeUsers = subscriptions.filter(s => !s.paid || s.plan === 'free').length;
  const conversionRate = totalUsers > 0 ? ((activeSubscribers / totalUsers) * 100).toFixed(1) : '0';
  
  totalUsersEl.textContent = totalUsers;
  activeSubscribersEl.textContent = activeSubscribers;
  freeUsersEl.textContent = freeUsers;
  conversionRateEl.textContent = conversionRate + '%';
}

// Render subscriptions table
function renderSubscriptions() {
  if (subscriptions.length === 0) {
    subscriptionsContent.innerHTML = `
      <div class="loading">
        No subscription data found.<br>
        <small>Users need to sign in to the extension for their data to appear here.</small>
      </div>
    `;
    return;
  }
  
  const tableHTML = `
    <table>
      <thead>
        <tr>
          <th>User</th>
          <th>Plan</th>
          <th>Status</th>
          <th>Paid At</th>
          <th>Installed</th>
          <th>Last Sync</th>
        </tr>
      </thead>
      <tbody>
        ${subscriptions.map(subscription => `
          <tr>
            <td>
              <div>
                <strong>${escapeHtml(subscription.email || 'Unknown')}</strong>
                <div class="date">ID: ${subscription.userId || subscription.id}</div>
              </div>
            </td>
            <td>
              <span class="plan-badge plan-${subscription.plan || 'free'}">
                ${(subscription.plan || 'free').toUpperCase()}
              </span>
            </td>
            <td>
              <span class="status-badge status-${subscription.subscriptionStatus || 'free'}">
                ${formatStatus(subscription.subscriptionStatus)}
              </span>
            </td>
            <td>
              ${subscription.paidAt ? 
                `<div class="date">${formatDate(subscription.paidAt)}</div>` : 
                '<span style="color: #999;">Never</span>'
              }
            </td>
            <td>
              <div class="date">
                ${subscription.installedAt ? formatDate(subscription.installedAt) : 'Unknown'}
              </div>
            </td>
            <td>
              <div class="date">
                ${subscription.lastSync ? formatDate(subscription.lastSync) : 'Never'}
              </div>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
  
  subscriptionsContent.innerHTML = tableHTML;
}

// Helper functions
function formatStatus(status) {
  const statusMap = {
    'active': 'Active',
    'free': 'Free',
    'past_due': 'Past Due',
    'canceled': 'Canceled',
    'unpaid': 'Unpaid'
  };
  return statusMap[status] || status || 'Free';
}

function formatDate(dateValue) {
  if (!dateValue) return 'Unknown';
  
  let date;
  if (dateValue.toDate && typeof dateValue.toDate === 'function') {
    // Firestore timestamp
    date = dateValue.toDate();
  } else if (dateValue instanceof Date) {
    date = dateValue;
  } else if (typeof dateValue === 'string') {
    date = new Date(dateValue);
  } else {
    return 'Invalid Date';
  }
  
  if (isNaN(date.getTime())) {
    return 'Invalid Date';
  }
  
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function showError(message) {
  const errorHTML = `
    <div class="error">
      ❌ ${escapeHtml(message)}
    </div>
  `;
  
  if (subscriptionsContent) {
    subscriptionsContent.innerHTML = errorHTML;
  } else {
    console.error('Error:', message);
    alert('Error: ' + message);
  }
}

// Auto-refresh every 5 minutes
setInterval(() => {
  if (currentUser) {
    console.log('🔄 Auto-refreshing subscription data...');
    loadSubscriptions();
  }
}, 5 * 60 * 1000);