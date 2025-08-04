// background.js - Manifest V3 service worker for LinkedIn Job Stats (CDP)

const JOB_STATS_CACHE_MAX_SIZE = 100;
const JOB_STATS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes TTL
const DEBOUNCE_DELAY_MS = 350;

let debuggeeTabId = null;
let jobDebounceTimer = null;

class JobStatsCache {
  constructor(maxSize, ttl) {
    this.maxSize = maxSize;
    this.ttl = ttl;
    this.cache = new Map();
  }

  get(jobId) {
    const entry = this.cache.get(jobId);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(jobId);
      return null;
    }
    // Refresh LRU position
    this.cache.delete(jobId);
    this.cache.set(jobId, entry);
    return entry.stats;
  }

  set(jobId, stats) {
    if (this.cache.has(jobId)) {
      this.cache.delete(jobId);
    } else if (this.cache.size >= this.maxSize) {
      // Evict oldest entry (LRU)
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
    this.cache.set(jobId, { stats, timestamp: Date.now() });
  }

  clear() {
    this.cache.clear();
  }
}

const jobStatsCache = new JobStatsCache(JOB_STATS_CACHE_MAX_SIZE, JOB_STATS_CACHE_TTL);

// Utility: Extract job ID from URL
function extractJobId(url) {
  const regex = /jobPostings\/(\d+)/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

// Filter URLs relevant for job stats fetching
function isJobPostingEndpoint(url) {
  return url && url.includes("voyager/api/jobs/jobPostings/");
}

// Debounce wrapper for job updates
function debounceUpdate(jobId, callback) {
  clearTimeout(jobDebounceTimer);
  jobDebounceTimer = setTimeout(() => callback(jobId), DEBOUNCE_DELAY_MS);
}

// Send stats reliably to content script
async function sendStats(tabId, stats) {
  try {
    await chrome.tabs.sendMessage(tabId, { type: "JOB_STATS_UPDATE", stats });
  } catch (err) {
    if (err.message && !err.message.includes("Receiving end does not exist")) {
      console.error("Error sending job stats:", err);
    }
  }
}

// Process network response for job posting stats
async function processJobResponse(debuggeeId, params) {
  const { requestId, response } = params;
  try {
    if (!isJobPostingEndpoint(response.url)) return;

    const jobId = extractJobId(response.url);
    if (!jobId) return;

    // Check cache for instant response
    const cachedStats = jobStatsCache.get(jobId);
    if (cachedStats) {
      await sendStats(debuggeeId.tabId, cachedStats);
      return;
    }

    debounceUpdate(jobId, async (debouncedJobId) => {
      try {
        const responseBody = await chrome.debugger.sendCommand(
          debuggeeId,
          "Network.getResponseBody",
          { requestId }
        );

        // Defer parsing asynchronously to keep thread responsive
        setTimeout(() => {
          let jobData;
          try {
            jobData = JSON.parse(responseBody.body);
          } catch (parseError) {
            console.warn("Failed to parse job posting JSON:", parseError);
            return;
          }

          if (jobData.data && (jobData.data.views !== undefined || jobData.data.applies !== undefined)) {
            const stats = {
              jobId: debouncedJobId,
              views: jobData.data.views ?? null,
              applies: jobData.data.applies ?? null,
              timestamp: Date.now(),
            };
            jobStatsCache.set(debouncedJobId, stats);
            sendStats(debuggeeId.tabId, stats);
          }
        }, 0);
      } catch (netErr) {
        console.warn("Failed to get job stats response body:", netErr);
      }
    });
  } catch (err) {
    console.error("Error in processJobResponse:", err);
  }
}

// Attach debugger and enable network monitoring on tabs
async function attachDebugger(tabId) {
  if (debuggeeTabId === tabId) return;
  try {
    await chrome.debugger.attach({ tabId }, "1.3");
    await chrome.debugger.sendCommand({ tabId }, "Network.enable");
    debuggeeTabId = tabId;
    console.log(`[LinkedIn Job Stats] Debugger attached to tab ${tabId}`);
  } catch (err) {
    console.error(`[LinkedIn Job Stats] Failed to attach debugger:`, err);
  }
}

// Listeners

chrome.debugger.onEvent.addListener((debuggeeId, message, params) => {
  if (message === "Network.responseReceived") {
    processJobResponse(debuggeeId, params).catch(console.error);
  }
});

chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (tab.url.includes("linkedin.com/jobs")) {
      attachDebugger(activeInfo.tabId);
    }
  } catch (err) {
    console.error("Error during tab activation:", err);
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  if (debuggeeTabId === tabId) {
    debuggeeTabId = null;
    jobStatsCache.clear();
  }
});

chrome.runtime.onSuspend.addListener(() => jobStatsCache.clear());
