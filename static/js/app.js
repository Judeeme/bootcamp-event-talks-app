// Application State
let allUpdates = [];
let activeFilter = 'all';
let searchQuery = '';
let selectedUpdate = null;

// DOM Elements
const refreshBtn = document.getElementById('refresh-btn');
const refreshIcon = document.getElementById('refresh-icon');
const lastUpdatedTime = document.getElementById('last-updated-time');
const searchInput = document.getElementById('search-input');
const filterButtons = document.querySelectorAll('.filter-btn');
const feedContainer = document.getElementById('feed-container');
const exportCsvBtn = document.getElementById('export-csv-btn');
const themeToggleBtn = document.getElementById('theme-toggle-btn');
const themeIcon = document.getElementById('theme-icon');

// Counter Elements
const countTotal = document.getElementById('count-total');
const countFeatures = document.getElementById('count-features');
const countChanges = document.getElementById('count-changes');
const countIssues = document.getElementById('count-issues');

// Modal Elements
const tweetModal = document.getElementById('tweet-modal');
const modalClose = document.getElementById('modal-close');
const tweetTextArea = document.getElementById('tweet-text-area');
const charCountVal = document.getElementById('char-count-val');
const charCountProgress = document.getElementById('char-count-progress');
const cancelTweetBtn = document.getElementById('cancel-tweet-btn');
const submitTweetBtn = document.getElementById('submit-tweet-btn');

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  setupEventListeners();
  fetchReleaseNotes();
});

// Event Listeners Setup
function setupEventListeners() {
  // Refresh Button
  refreshBtn.addEventListener('click', fetchReleaseNotes);

  // Export CSV Button
  exportCsvBtn.addEventListener('click', exportToCSV);

  // Theme Toggle Button
  themeToggleBtn.addEventListener('click', toggleTheme);

  // Search Input
  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value.toLowerCase().trim();
    renderFeed();
  });

  // Filter Buttons
  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      filterButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeFilter = btn.dataset.filter.toLowerCase();
      renderFeed();
    });
  });

  // Modal Actions
  modalClose.addEventListener('click', closeTweetModal);
  cancelTweetBtn.addEventListener('click', closeTweetModal);
  
  // Close modal on clicking overlay
  tweetModal.addEventListener('click', (e) => {
    if (e.target === tweetModal) {
      closeTweetModal();
    }
  });

  // Live Character Counter for Tweet Area
  tweetTextArea.addEventListener('input', () => {
    updateCharacterCount();
  });

  // Tweet Submission
  submitTweetBtn.addEventListener('click', shareOnTwitter);
}

// Fetch Data from Flask API
async function fetchReleaseNotes() {
  setLoading(true);
  try {
    const response = await fetch('/api/release-notes');
    const data = await response.json();
    
    if (data.success && data.updates) {
      allUpdates = data.updates;
      updateCounters();
      renderFeed();
      
      // Update Timestamp
      const now = new Date();
      lastUpdatedTime.textContent = `Last updated: ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
    } else {
      showErrorState(data.error || 'Failed to fetch release notes.');
    }
  } catch (error) {
    console.error('Error fetching release notes:', error);
    showErrorState('Network error occurred. Please try again.');
  } finally {
    setLoading(false);
  }
}

// Show/Hide Loading State
function setLoading(isLoading) {
  if (isLoading) {
    refreshIcon.classList.add('spinning');
    refreshBtn.disabled = true;
    
    // Render Skeletons
    feedContainer.innerHTML = Array(4).fill(0).map(() => `
      <div class="glass-panel skeleton-card"></div>
    `).join('');
  } else {
    refreshIcon.classList.remove('spinning');
    refreshBtn.disabled = false;
  }
}

// Update Stats counters
function updateCounters() {
  countTotal.textContent = allUpdates.length;
  countFeatures.textContent = allUpdates.filter(u => u.category.toLowerCase() === 'feature').length;
  countChanges.textContent = allUpdates.filter(u => u.category.toLowerCase() === 'change').length;
  countIssues.textContent = allUpdates.filter(u => u.category.toLowerCase() === 'issue').length;
}

// Filter and Search Updates
function getFilteredUpdates() {
  return allUpdates.filter(update => {
    // 1. Filter by category
    if (activeFilter !== 'all') {
      if (update.category.toLowerCase() !== activeFilter) {
        return false;
      }
    }
    
    // 2. Filter by search query
    if (searchQuery) {
      const matchText = `${update.category} ${update.date} ${update.content_text}`.toLowerCase();
      return matchText.includes(searchQuery);
    }
    
    return true;
  });
}

// Group updates by date
function groupUpdatesByDate(updates) {
  const groups = {};
  updates.forEach(update => {
    if (!groups[update.date]) {
      groups[update.date] = [];
    }
    groups[update.date].push(update);
  });
  return groups;
}

// Render the Feed Grid/List
function renderFeed() {
  const filtered = getFilteredUpdates();
  
  if (filtered.length === 0) {
    renderEmptyState();
    return;
  }
  
  const grouped = groupUpdatesByDate(filtered);
  
  // Sort dates chronologically if needed (the feed is already sorted newest first)
  let html = '';
  
  for (const date in grouped) {
    html += `
      <div class="date-group">
        <h2 class="date-header">${date}</h2>
        <div class="date-cards">
          ${grouped[date].map(update => renderUpdateCard(update)).join('')}
        </div>
      </div>
    `;
  }
  
  feedContainer.innerHTML = html;
}

// Render Individual Update Card
function renderUpdateCard(update) {
  const categoryClass = `category-${update.category.toLowerCase()}`;
  const tagClass = `tag-${update.category.toLowerCase()}`;
  
  return `
    <div class="glass-panel update-card ${categoryClass}" id="card-${update.id}">
      <div class="card-top">
        <span class="tag ${tagClass}">${update.category}</span>
        <span class="card-date">${update.date}</span>
      </div>
      <div class="card-body">
        ${update.content_html}
      </div>
      <div class="card-actions">
        <button class="btn btn-copy" id="copy-btn-${update.id}" onclick="copyToClipboard('${update.id}')">
          <svg style="width: 14px; height: 14px; fill: currentColor; vertical-align: middle; margin-right: 4px;" viewBox="0 0 24 24">
            <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
          </svg>
          Copy
        </button>
        <button class="btn btn-tweet" onclick="openTweetModal('${update.id}')">
          <svg style="width: 14px; height: 14px; fill: currentColor; vertical-align: middle; margin-right: 4px;" viewBox="0 0 24 24">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
          </svg>
          Tweet
        </button>
      </div>
    </div>
  `;
}

// Render Empty/No Search Results State
function renderEmptyState() {
  feedContainer.innerHTML = `
    <div class="glass-panel empty-state">
      <svg viewBox="0 0 24 24">
        <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
      </svg>
      <h3>No release notes found</h3>
      <p>Try adjusting your search terms or filters.</p>
    </div>
  `;
}

// Render Error State
function showErrorState(message) {
  feedContainer.innerHTML = `
    <div class="glass-panel empty-state" style="border-color: var(--border-issue);">
      <svg viewBox="0 0 24 24" style="fill: var(--color-issue);">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
      </svg>
      <h3 style="color: var(--color-issue);">Failed to load updates</h3>
      <p>${message}</p>
      <button class="btn btn-secondary" style="margin-top: 1rem;" onclick="fetchReleaseNotes()">Try Again</button>
    </div>
  `;
}

// Open Tweet Composer Modal
window.openTweetModal = function(updateId) {
  selectedUpdate = allUpdates.find(u => u.id === updateId);
  if (!selectedUpdate) return;
  
  // Format Tweet Content
  const prefix = `BigQuery [${selectedUpdate.category}] (${selectedUpdate.date}): `;
  const suffix = ` #BigQuery #GoogleCloud`;
  const url = selectedUpdate.link;
  
  // Twitter counts URLs as 23 characters regardless of actual length
  const twitterUrlLength = 23;
  const fixedLength = prefix.length + suffix.length + twitterUrlLength + 2; // +2 for newlines/spaces
  const maxSnippetLength = 280 - fixedLength;
  
  let snippet = selectedUpdate.content_text;
  if (snippet.length > maxSnippetLength) {
    snippet = snippet.substring(0, maxSnippetLength - 3) + '...';
  }
  
  // Compose full tweet text
  const initialTweetText = `${prefix}${snippet}\n\n${url}${suffix}`;
  
  tweetTextArea.value = initialTweetText;
  updateCharacterCount();
  
  // Show Modal
  tweetModal.classList.add('active');
  tweetTextArea.focus();
  
  // Disable body scroll
  document.body.style.overflow = 'hidden';
};

// Close Tweet Composer Modal
function closeTweetModal() {
  tweetModal.classList.remove('active');
  selectedUpdate = null;
  
  // Re-enable body scroll
  document.body.style.overflow = '';
}

// Update character counter in modal
function updateCharacterCount() {
  const text = tweetTextArea.value;
  
  // Twitter-compliant character counter
  // Note: Twitter counts any HTTP/HTTPS URL as exactly 23 characters
  const urlPattern = /https?:\/\/[^\s]+/g;
  const urls = text.match(urlPattern) || [];
  
  let textLengthWithoutUrls = text;
  urls.forEach(url => {
    textLengthWithoutUrls = textLengthWithoutUrls.replace(url, '');
  });
  
  const totalLength = textLengthWithoutUrls.length + (urls.length * 23);
  charCountVal.textContent = totalLength;
  
  // Visual states based on length
  const remaining = 280 - totalLength;
  
  charCountProgress.className = 'char-counter';
  if (remaining < 0) {
    charCountProgress.classList.add('danger');
    submitTweetBtn.disabled = true;
  } else if (remaining <= 20) {
    charCountProgress.classList.add('warning');
    submitTweetBtn.disabled = false;
  } else {
    submitTweetBtn.disabled = false;
  }
}

// Share Tweet via Twitter Web Intent
function shareOnTwitter() {
  const tweetText = tweetTextArea.value;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
  
  // Open in a new tab
  window.open(twitterUrl, '_blank', 'noopener,noreferrer');
  
  closeTweetModal();
}

// Copy to Clipboard Function
window.copyToClipboard = function(updateId) {
  const update = allUpdates.find(u => u.id === updateId);
  if (!update) return;

  const copyText = `BigQuery [${update.category}] (${update.date}):\n${update.content_text}\n\nRead more: ${update.link}`;
  
  navigator.clipboard.writeText(copyText).then(() => {
    const copyBtn = document.getElementById(`copy-btn-${updateId}`);
    if (!copyBtn) return;
    
    // Save original HTML
    const originalHTML = copyBtn.innerHTML;
    
    // Change to copied state
    copyBtn.classList.add('copied');
    copyBtn.innerHTML = `
      <svg style="width: 14px; height: 14px; fill: currentColor; vertical-align: middle; margin-right: 4px;" viewBox="0 0 24 24">
        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
      </svg>
      Copied!
    `;
    
    // Revert after 2 seconds
    setTimeout(() => {
      copyBtn.classList.remove('copied');
      copyBtn.innerHTML = originalHTML;
    }, 2000);
  }).catch(err => {
    console.error('Failed to copy text: ', err);
  });
};

// Export to CSV Function
function exportToCSV() {
  const filtered = getFilteredUpdates();
  if (filtered.length === 0) {
    alert('No data available to export.');
    return;
  }
  
  // CSV Headers
  const headers = ['Date', 'Category', 'Link', 'Content'];
  
  // Escaper helper
  const escapeCSV = (text) => {
    if (text === null || text === undefined) return '';
    const stringified = String(text);
    // Escape double quotes by doubling them up and wrap in quotes
    return `"${stringified.replace(/"/g, '""')}"`;
  };
  
  // Convert rows
  const csvRows = [
    headers.join(','),
    ...filtered.map(u => [
      escapeCSV(u.date),
      escapeCSV(u.category),
      escapeCSV(u.link),
      escapeCSV(u.content_text)
    ].join(','))
  ];
  
  const csvContent = csvRows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  // Trigger download
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `bigquery_release_notes_${activeFilter}_export.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Theme Initialization
function initTheme() {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'light') {
    document.body.classList.add('light-theme');
    updateThemeIcon('light');
  } else {
    document.body.classList.remove('light-theme');
    updateThemeIcon('dark');
  }
}

// Toggle Theme Function
function toggleTheme() {
  const isLight = document.body.classList.toggle('light-theme');
  const activeTheme = isLight ? 'light' : 'dark';
  localStorage.setItem('theme', activeTheme);
  updateThemeIcon(activeTheme);
}

// Update Theme Icon Path
function updateThemeIcon(theme) {
  if (theme === 'light') {
    // Sun icon
    themeIcon.innerHTML = `
      <path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58c-.39-.39-1.03-.39-1.41 0s-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37c-.39-.39-1.03-.39-1.41 0s-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41l-1.06-1.06zm1.06-12.37c-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06c.39-.39.39-1.03 0-1.41zm-12.37 12.37c-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06c.39-.39.39-1.03 0-1.41z"/>
    `;
  } else {
    // Moon icon
    themeIcon.innerHTML = `
      <path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-2.98 0-5.4-2.42-5.4-5.4 0-1.81.89-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z"/>
    `;
  }
}


