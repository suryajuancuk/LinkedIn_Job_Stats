// Popup script to display current job stats
document.addEventListener('DOMContentLoaded', function() {
    console.log('📊 LinkedIn Job Stats popup loaded');
    
    const statusEl = document.getElementById('status');
    const statsContainer = document.getElementById('stats-container');
    const viewsCount = document.getElementById('views-count');
    const appliesCount = document.getElementById('applies-count');
    const jobIdEl = document.getElementById('job-id');
    
    // Query current tab for job stats
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        if (tabs[0] && tabs[0].url && tabs[0].url.includes('linkedin.com/jobs')) {
            statusEl.textContent = 'LinkedIn Jobs Page Detected';
            statusEl.className = 'status active';
            
            // Try to get stats from storage
            chrome.storage.local.get(['currentJobStats'], function(result) {
                if (result.currentJobStats) {
                    displayStats(result.currentJobStats);
                } else {
                    statusEl.textContent = 'Waiting for Job Stats...';
                }
            });
        } else {
            statusEl.textContent = 'Navigate to LinkedIn Jobs';
            statusEl.className = 'status inactive';
        }
    });
    
    function displayStats(stats) {
        statusEl.textContent = 'Job Stats Found!';
        statusEl.className = 'status active';
        
        viewsCount.textContent = stats.views !== undefined ? stats.views.toLocaleString() : 'N/A';
        appliesCount.textContent = stats.applies !== undefined ? stats.applies.toLocaleString() : 'N/A';
        jobIdEl.textContent = stats.jobId || 'Unknown';
        
        statsContainer.className = 'stats-container visible';
    }
    
    // Listen for storage changes
    chrome.storage.onChanged.addListener(function(changes, namespace) {
        if (changes.currentJobStats) {
            displayStats(changes.currentJobStats.newValue);
        }
    });
});

// Handle messages from content script
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.type === 'UPDATE_POPUP_STATS') {
        displayStats(request.data);
    }
});
