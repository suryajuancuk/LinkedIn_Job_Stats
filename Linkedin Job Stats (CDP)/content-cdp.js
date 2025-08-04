let currentStats = null;
let currentJobId = null;
let lastRenderedStats = null;
let debounceTimer = null;

const CONFIG = {
  POPUP_ID: "linkedin-job-stats-popup",
  STYLE_ID: "linkedin-job-stats-styles",
  DEBOUNCE_DELAY: 120
};

function injectStyles() {
  if (document.getElementById(CONFIG.STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = CONFIG.STYLE_ID;
  style.textContent = `
    #${CONFIG.POPUP_ID} {
      position: fixed;
      top: 85px;
      right: 20px;
      width: 240px;
      min-height: 140px;
      border-radius: 20px;
      z-index: 2147483647;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
                   Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      color: #202124;
      display: flex;
      flex-direction: column;
      padding: 0;
      box-sizing: border-box;
      user-select: none;
      overflow: hidden;
      opacity: 0;
      transform: translateX(20px);
      transition: opacity 0.3s ease, transform 0.3s ease;
      cursor: grab;
      isolation: isolate;
      touch-action: none;
      box-shadow: 0px 6px 24px rgba(0, 0, 0, 0.2);
    }
    #${CONFIG.POPUP_ID}::before {
      content: '';
      position: absolute;
      inset: 0;
      z-index: 0;
      border-radius: 20px;
      box-shadow: inset 0 0 20px -5px rgba(255, 255, 255, 0.7);
      background-color: rgba(255, 255, 255, 0.175);
    }
    #${CONFIG.POPUP_ID}::after {
      content: '';
      position: absolute;
      inset: 0;
      z-index: -1;
      border-radius: 20px;
      backdrop-filter: blur(2px);
      filter: url(#glass-distortion);
      isolation: isolate;
      -webkit-backdrop-filter: blur(2px);
      -webkit-filter: url("#glass-distortion");
    }
    #${CONFIG.POPUP_ID}.visible {
      opacity: 1;
      transform: none;
    }
    #${CONFIG.POPUP_ID} .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 12px 4px 14px;
      background: transparent;
      border-bottom: 1px solid rgba(237, 237, 237, 0.3);
      font-weight: 700;
      font-size: 16px;
      color: #1c1c1e;
      letter-spacing: -0.2px;
      user-select: none;
      position: relative;
      z-index: 1;
    }
    
    #${CONFIG.POPUP_ID} .header span {
      flex: 1;
      text-align: center;
      font-size: 16px;
      font-weight: 700;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      letter-spacing: -0.2px;
      color: #1c1c1e;
    }
    #${CONFIG.POPUP_ID} .header .close-btn {
      background: none;
      border: none;
      font-size: 20px;
      color: #808080;
      cursor: pointer;
      display: flex;
      align-items: center;
      padding: 0 0 0 6px;
      margin: 0;
      line-height: 1;
      font-weight: 400;
      transition: color 0.2s ease;
    }
    #${CONFIG.POPUP_ID} .header .close-btn:hover {
      color: #666;
    }
    #${CONFIG.POPUP_ID} .job-stats-content {
      flex: 1 1 auto;
      padding: 10px 14px 0 14px;
      font-size: 14px;
      overflow-y: auto;
      color: #2c2c2e;
      position: relative;
      z-index: 1;
    }
    #${CONFIG.POPUP_ID} .stat-item {
      display: flex;
      justify-content: space-between;
      margin: 6px 0;
      font-weight: 600;
      padding: 4px 0;
    }
    #${CONFIG.POPUP_ID} .job-id {
      font-size: 11px;
      text-align: center;
      color: #757575;
      padding-top: 3px;
    }
    #${CONFIG.POPUP_ID} .footer {
      font-size: 10px;
      text-align: center;
      color: #8e8e93;
      margin: 5px 0 6px 0;
      flex-shrink: 0;
      border-top: 1px solid rgba(237, 237, 237, 0.3);
      padding: 3px 0 0 0;
      background: transparent;
      letter-spacing: 0.2px;
      font-weight: 500;
      user-select: none;
      position: relative;
      z-index: 1;
    }
  `;
  document.head.appendChild(style);
  
  // Add SVG filter for glass distortion effect
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  svg.style.position = "absolute";
  svg.style.overflow = "hidden";
  svg.style.width = "0";
  svg.style.height = "0";
  
  svg.innerHTML = `
    <defs>
      <filter id="glass-distortion" x="0%" y="0%" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.008 0.008" numOctaves="1" seed="92" result="noise" />
        <feGaussianBlur in="noise" stdDeviation="2" result="blurred" />
        <feDisplacementMap in="SourceGraphic" in2="blurred" scale="77" xChannelSelector="R" yChannelSelector="G" />
      </filter>
    </defs>
  `;
  
  document.body.appendChild(svg);
}

function createPopup() {
  if (document.getElementById(CONFIG.POPUP_ID)) return;
  const popup = document.createElement("div");
  popup.id = CONFIG.POPUP_ID;

  popup.innerHTML = `
    <div class="header">
      <span>LinkedIn Job Stats (CDP)</span>
      <button class="close-btn" id="job-stats-close-btn" aria-label="Close">&times;</button>
    </div>
    <div class="job-stats-content">
      <div>Select a job to see stats.</div>
    </div>
    <div class="footer">&copy; Made by evin</div>
  `;

  // Default positioning via CSS (top/right)
  popup.style.left = "";
  popup.style.top = "";
  popup.style.right = "20px";
  popup.style.bottom = "auto";

  document.body.appendChild(popup);
  setTimeout(() => popup.classList.add("visible"), 40);

  // Close button event
  const closeBtn = popup.querySelector("#job-stats-close-btn");
  closeBtn.addEventListener("click", () => UI.remove());

  // --- Draggable anywhere on the popup (except the close button) ---
  let isDragging = false, offsetX = 0, offsetY = 0;

  popup.addEventListener('mousedown', (e) => {
    if (e.target === closeBtn) return;
    isDragging = true;
    popup.style.transition = "none";
    offsetX = e.clientX - popup.getBoundingClientRect().left;
    offsetY = e.clientY - popup.getBoundingClientRect().top;
    popup.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';
    e.preventDefault();
  });

  window.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      popup.style.transition = "";
      popup.style.cursor = 'grab';
      document.body.style.userSelect = '';
    }
  });

  window.addEventListener('mousemove', e => {
    if (!isDragging) return;
    let newX = e.clientX - offsetX;
    let newY = e.clientY - offsetY;
    // Clamp to viewport
    newX = Math.max(0, Math.min(window.innerWidth - popup.offsetWidth, newX));
    newY = Math.max(0, Math.min(window.innerHeight - popup.offsetHeight, newY));
    popup.style.left = `${newX}px`;
    popup.style.top = `${newY}px`;
    popup.style.right = "auto";
    popup.style.bottom = "auto";
  });
}

// UI rendering logic
const UI = {
  update(stats) {
    const popup = document.getElementById(CONFIG.POPUP_ID);
    if (!popup) return;
    const content = popup.querySelector(".job-stats-content");
    if (!content) return;

    const views = stats.views != null ? stats.views.toLocaleString() : "N/A";
    const applies = stats.applies != null ? stats.applies.toLocaleString() : "N/A";

    content.innerHTML = `
      <div class="stat-item"><span>Views:</span><span>${views}</span></div>
      <div class="stat-item"><span>Applicants:</span><span>${applies}</span></div>
      <div class="job-id">Job ID: ${stats.jobId || "N/A"}</div>
    `;
  },
  setWaiting() {
    const popup = document.getElementById(CONFIG.POPUP_ID);
    if (!popup) return;
    const content = popup.querySelector(".job-stats-content");
    if (!content) return;
    content.innerHTML = `<div style="padding:1em; text-align:center; font-style:italic;">Select a job to see stats.</div>`;
  },
  remove() {
    const popup = document.getElementById(CONFIG.POPUP_ID);
    if (!popup) return;
    popup.classList.remove("visible");
    setTimeout(() => popup.remove(), 300);
  }
};

function shouldUpdate(stats) {
  if (!lastRenderedStats) return true;
  return (
    lastRenderedStats.jobId !== stats.jobId ||
    lastRenderedStats.views !== stats.views ||
    lastRenderedStats.applies !== stats.applies ||
    (stats.timestamp && lastRenderedStats.timestamp !== stats.timestamp)
  );
}

function updateUI(stats) {
  if (!stats) {
    UI.setWaiting();
    return;
  }
  if (!shouldUpdate(stats)) return;
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    UI.update(stats);
    lastRenderedStats = { ...stats };
    currentStats = stats;
    currentJobId = stats.jobId;
  }, CONFIG.DEBOUNCE_DELAY);
}

chrome.runtime.onMessage.addListener(message => {
  if (message.type === "JOB_STATS_UPDATE") {
    try {
      updateUI(message.stats);
    } catch (err) {
      console.error("Error updating job stats UI:", err);
    }
  }
});

// Initialize UI on DOM ready
function initialize() {
  injectStyles();
  createPopup();
  UI.setWaiting();
}

if (document.readyState === "loading") {
  window.addEventListener("DOMContentLoaded", initialize);
} else {
  initialize();
}

// Clean up timers and state on page unload
window.addEventListener("beforeunload", () => {
  clearTimeout(debounceTimer);
  currentStats = null;
  currentJobId = null;
  lastRenderedStats = null;
});
