// Script to clear Clerk session data for testing
// Run this in the browser console to clear all Clerk-related data

console.log('🧹 Clearing Clerk Session Data');
console.log('==============================');

// Clear all Clerk-related localStorage items
const clerkKeys = [];
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  if (key && key.includes('clerk')) {
    clerkKeys.push(key);
    localStorage.removeItem(key);
  }
}

// Clear all Clerk-related sessionStorage items
const clerkSessionKeys = [];
for (let i = 0; i < sessionStorage.length; i++) {
  const key = sessionStorage.key(i);
  if (key && key.includes('clerk')) {
    clerkSessionKeys.push(key);
    sessionStorage.removeItem(key);
  }
}

// Clear Clerk cookies
const cookies = document.cookie.split(';');
const clerkCookies = [];
cookies.forEach(cookie => {
  const [name] = cookie.split('=');
  if (name.trim().includes('clerk') || name.trim().includes('__clerk') || name.trim().includes('__session')) {
    clerkCookies.push(name.trim());
    document.cookie = `${name.trim()}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  }
});

console.log('✅ Cleared localStorage items:', clerkKeys);
console.log('✅ Cleared sessionStorage items:', clerkSessionKeys);
console.log('✅ Cleared cookies:', clerkCookies);
console.log('\n🔄 Please refresh the page to test the sign-up flow again.'); 