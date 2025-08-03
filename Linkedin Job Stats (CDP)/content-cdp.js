// Content script to display the UI with glassmorphism design
let currentStats = null;
let currentJobId = null;
let debounceTimer = null;

const CONFIG = {
    POPUP_ID: 'linkedin-job-stats-popup-definitive',
    STYLE_ID: 'linkedin-job-stats-dynamic-styles-definitive',
    SVG_FILTER_ID: 'linkedin-job-stats-svg-filter-definitive',
    PROCESSED_ATTRIBUTE: 'data-linkedin-job-stats-processed-v50'
};

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'JOB_STATS_UPDATE') {
    currentStats = message.stats;
    updateUI(message.stats);
  }
});

const UI = {
    ICONS: {
        views: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" width="16" height="16"><path d="M8 3a5 5 0 015 5 5 5 0 01-5 5 5 5 0 01-5-5 5 5 0 015-5m0-2a7 7 0 00-7 7 7 7 0 007 7 7 7 0 007-7 7 7 0 00-7-7z"></path><path d="M8 5a3 3 0 113 3 3 3 0 01-3 3 3 3 0 01-3-3 3 3 0 013-3m0-2a5 5 0 00-5 5 5 5 0 005 5 5 5 0 005-5 5 5 0 00-5-5z"></path></svg>',
        applicants: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" width="16" height="16"><path d="M12 1H4a1 1 0 00-1 1v12a1 1 0 001 1h8a1 1 0 001-1V2a1 1 0 00-1-1zM4 0h8a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V2a2 2 0 012-2zm4 6a2 2 0 11-2 2 2 2 0 012-2zM8 5a3 3 0 103 3 3 3 0 00-3-3zm5 9H3v-1a3 3 0 013-3h2a3 3 0 013 3z"></path></svg>'
    },
    
    injectGlobalStyles: function() {
        if (document.getElementById(CONFIG.STYLE_ID)) return;
        const style = document.createElement('style');
        style.id = CONFIG.STYLE_ID;
        style.innerHTML = `
            #${CONFIG.POPUP_ID} {
                position: fixed;
                top: 80px;
                right: 20px;
                width: 250px;
                border-radius: 20px;
                box-shadow: 0px 8px 32px rgba(0, 0, 0, 0.25);
                z-index: 999999999;
                transition: opacity 0.3s ease, transform 0.3s ease;
                opacity: 0;
                transform: translateX(20px);
                isolation: isolate;
                touch-action: none;
            }
            
            #${CONFIG.POPUP_ID}::before {
                content: '';
                position: absolute;
                inset: 0;
                z-index: 0;
                border-radius: 20px;
                box-shadow: inset 0 0 20px -5px rgba(255, 255, 255, 0.8);
                background-color: rgba(255, 255, 255, 0.4);
            }
            
            #${CONFIG.POPUP_ID}::after {
                content: '';
                position: absolute;
                inset: 0;
                z-index: -1;
                border-radius: 20px;
                backdrop-filter: blur(2px) saturate(180%);
                -webkit-backdrop-filter: blur(2px) saturate(180%);
                filter: url(#${CONFIG.SVG_FILTER_ID});
                isolation: isolate;
            }
            
            .job-stats-content {
                position: relative;
                z-index: 1;
                padding: 16px;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Helvetica Neue", sans-serif;
            }
        `;
        document.head.appendChild(style);
    },
    
    injectSvgFilter: function() {
        if (document.getElementById(CONFIG.SVG_FILTER_ID)) return;
        const svgContainer = document.createElement('div');
        svgContainer.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" id="${CONFIG.SVG_FILTER_ID}" style="position:absolute; height:0; width:0; overflow:hidden;">
                <defs>
                    <filter id="${CONFIG.SVG_FILTER_ID}" x="0%" y="0%" width="100%" height="100%">
                        <feTurbulence type="fractalNoise" baseFrequency="0.02 0.02" numOctaves="2" seed="92" result="noise" />
                        <feGaussianBlur in="noise" stdDeviation="2" result="blurred" />
                        <feDisplacementMap in="SourceGraphic" in2="blurred" scale="77" xChannelSelector="R" yChannelSelector="G" />
                    </filter>
                </defs>
            </svg>
        `;
        document.body.appendChild(svgContainer);
    },
    
    create: function() {
        if (document.getElementById(CONFIG.POPUP_ID)) return;
        const popup = document.createElement('div');
        popup.id = CONFIG.POPUP_ID;
        const contentWrapper = document.createElement('div');
        contentWrapper.className = 'job-stats-content';
        popup.appendChild(contentWrapper);
        document.body.appendChild(popup);
        popup.addEventListener('click', (e) => { 
            if (e.target.closest('#job-stats-close-btn')) this.remove(); 
        });
        setTimeout(() => { 
            popup.style.opacity = '1'; 
            popup.style.transform = 'translateX(0)'; 
        }, 50);
        this.setWaiting();
    },
    
    setWaiting: function() {
        const contentWrapper = document.querySelector(`#${CONFIG.POPUP_ID} .job-stats-content`);
        if (!contentWrapper) return;
        contentWrapper.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                <span style="font-weight: 600; color: #1d1d1f; font-size: 16px; text-shadow: 0 1px 1px rgba(255,255,255,0.5);">Job Stats (CDP)</span>
                <button id="job-stats-close-btn" style="background:none; border:none; font-size:20px; cursor:pointer; color:#3c3c43; opacity: 0.6; padding:0; line-height:1;">×</button>
            </div>
            <div style="text-align: center; padding: 10px; color: #3c3c43; opacity: 0.8; font-style: italic; text-shadow: 0 1px 1px rgba(255,255,255,0.3);">Select a job to see stats.</div>
        `;
    },
    
    update: function(stats) {
        console.log('🎨 Updating UI with stats:', stats);
        const contentWrapper = document.querySelector(`#${CONFIG.POPUP_ID} .job-stats-content`);
        if (!contentWrapper) return;
        
        const viewsText = stats.views !== null && stats.views !== undefined ? stats.views.toLocaleString() : '<em>Not Available</em>';
        const applicantsText = stats.applies !== null && stats.applies !== undefined ? stats.applies.toLocaleString() : '<em>Not Available</em>';
        
        contentWrapper.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border-bottom: 1px solid rgba(60, 60, 67, 0.15); padding-bottom: 8px;">
                <span style="font-weight: 600; color: #1d1d1f; font-size: 16px; text-shadow: 0 1px 1px rgba(255,255,255,0.5);">Job Stats (CDP)</span>
                <button id="job-stats-close-btn" style="background:none; border:none; font-size:20px; cursor:pointer; color:#3c3c43; opacity: 0.6; padding:0; line-height:1;">×</button>
    </div>
            <div style="display: flex; align-items: center; margin-bottom: 8px; font-size: 14px; color: #1d1d1f; text-shadow: 0 1px 1px rgba(255,255,255,0.3);">
                <span style="color: #3c3c43; opacity: 0.9; margin-right: 8px; display: flex; align-items: center;">${this.ICONS.views}</span>
                <span>Views:</span>
                <span style="font-weight: 600; margin-left: auto;">${viewsText}</span>
      </div>
            <div style="display: flex; align-items: center; font-size: 14px; color: #1d1d1f; text-shadow: 0 1px 1px rgba(255,255,255,0.3);">
                <span style="color: #3c3c43; opacity: 0.9; margin-right: 8px; display: flex; align-items: center;">${this.ICONS.applicants}</span>
                <span>Applicants:</span>
                <span style="font-weight: 600; margin-left: auto;">${applicantsText}</span>
      </div>
            <div style="font-size: 12px; color: #3c3c43; opacity: 0.7; text-align: center; margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(60, 60, 67, 0.15);">
                Job ID: ${stats.jobId || 'N/A'}
    </div>
  `;
    },
    
    remove: function() {
        const popup = document.getElementById(CONFIG.POPUP_ID);
        if (popup) {
            popup.style.opacity = '0';
            popup.style.transform = 'translateX(20px)';
            setTimeout(() => popup.remove(), 300);
        }
    }
};

function updateUI(stats) {
    if (!stats) {
        UI.setWaiting();
        return;
    }
    
    // Check if this is a new job
    if (stats.jobId && stats.jobId !== currentJobId) {
        console.log(`🆔 Detected new job ID: ${stats.jobId}`);
        currentJobId = stats.jobId;
        currentStats = stats;
        UI.update(stats);
    } else if (stats.jobId === currentJobId) {
        // Update existing job stats
        currentStats = stats;
        UI.update(stats);
    }
}

function initialize() {
    console.log('🚀 Initializing Job Stats CDP with glassmorphism design...');
    
    UI.injectGlobalStyles();
    UI.injectSvgFilter();
    UI.create();
    
    // Set initial waiting state
    UI.setWaiting();
    
    console.log('✅ Initialization complete');
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
} else {
    setTimeout(initialize, 100);
}

// Manual refresh with Ctrl+Shift+R
document.addEventListener('keydown', function(event) {
    if (event.ctrlKey && event.shiftKey && event.key === 'R') {
        console.log('🔄 Manual refresh triggered');
        currentStats = null;
        currentJobId = null;
        UI.setWaiting();
    }
});

console.log('🎉 LinkedIn Job Stats CDP with glassmorphism design loaded!');
