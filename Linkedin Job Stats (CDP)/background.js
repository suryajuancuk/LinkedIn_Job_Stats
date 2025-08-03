// Background service worker for CDP operations
let debuggeeTabId = null;
let jobStats = new Map();

chrome.debugger.onEvent.addListener((debuggeeId, message, params) => {
  if (message === 'Network.responseReceived') {
    handleNetworkResponse(debuggeeId, params);
  }
});

async function handleNetworkResponse(debuggeeId, params) {
  const { requestId, response } = params;
  
  if (isJobPostingEndpoint(response.url)) {
    try {
      const responseBody = await chrome.debugger.sendCommand(
        debuggeeId,
        'Network.getResponseBody',
        { requestId }
      );
      
      const jobData = JSON.parse(responseBody.body);
      const jobId = extractJobId(response.url);
      
      if (jobData.data && (jobData.data.applies !== undefined || jobData.data.views !== undefined)) {
        const stats = {
          jobId,
          applies: jobData.data.applies,
          views: jobData.data.views,
          timestamp: Date.now()
        };
        
        jobStats.set(jobId, stats);
        
        // Send to content script
        chrome.tabs.sendMessage(debuggeeId.tabId, {
          type: 'JOB_STATS_UPDATE',
          stats
        });
      }
    } catch (error) {
      console.log('Error getting response body:', error);
    }
  }
}

function isJobPostingEndpoint(url) {
  return url && url.includes('voyager/api/jobs/jobPostings/');
}

function extractJobId(url) {
  const match = url.match(/jobPostings\/(\d+)\?/);  
  return match ? match[1] : null;
}

// Listen for tab activation to attach debugger
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  const tab = await chrome.tabs.get(activeInfo.tabId);
  if (tab.url && tab.url.includes('linkedin.com/jobs')) {
    attachDebugger(activeInfo.tabId);
  }
});

async function attachDebugger(tabId) {
  if (debuggeeTabId === tabId) return;
  
  try {
    await chrome.debugger.attach({ tabId }, "1.3");
    await chrome.debugger.sendCommand({ tabId }, "Network.enable");
    debuggeeTabId = tabId;
    console.log('CDP attached to tab:', tabId);
  } catch (error) {
    console.log('Error attaching debugger:', error);
  }
}
