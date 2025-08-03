// Content script to handle UI and data from interceptor
(function() {
    'use strict';
    console.log('LinkedIn Job Stats content script loaded');
    
    let currentJobId = null;
    let lastStats = null;
    
    // Listen for job stats from interceptor (custom event)
    document.addEventListener('LinkedInJobStatsData', function(event) {
        if (event.detail && event.detail.type === 'LINKEDIN_JOB_API_DATA') {
            console.log('📡 Received job stats via custom event:', event.detail);
            handleJobStats(event.detail);
        }
    });
    
    // Listen for job stats from interceptor (postMessage)
    window.addEventListener('message', function(event) {
        if (event.source === window && event.data && 
            event.data.type === 'LINKEDIN_JOB_STATS_FROM_INTERCEPTOR') {
            console.log('📡 Received job stats via postMessage:', event.data.data);
            handleJobStats(event.data.data);
        }
    });
    
    function handleJobStats(statsData) {
        lastStats = statsData;
        updateUI(statsData);
        
        // Store in Chrome storage for popup access
        chrome.runtime.sendMessage({
            type: 'STORE_JOB_STATS',
            data: statsData
        }).catch(error => {
            console.log('Could not send to background script:', error);
        });
    }
    
    // Extract current job ID from page
    function getCurrentJobId() {
        // Try multiple selectors for job ID
        const selectors = [
            '[data-job-id]',
            '[data-entity-urn*="jobPosting"]',
            '.job-details-jobs-unified-top-card',
            '.jobs-unified-top-card'
        ];
        
        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element) {
                const jobId = element.getAttribute('data-job-id') || 
                              element.getAttribute('data-entity-urn')?.match(/(\d+)$/)?.[1];
                if (jobId) return jobId;
            }
        }
        
        // Try URL extraction
        const urlMatch = window.location.href.match(/\/view\/(\d+)\//);
        return urlMatch ? urlMatch[1] : null;
    }
    
    // UI Management
    const UI = {
        createPopup() {
            if (document.getElementById('linkedin-job-stats-popup')) return;
            
            const popup = document.createElement('div');
            popup.id = 'linkedin-job-stats-popup';
            popup.innerHTML = `
                <div class="stats-header">
                    <h3>Job Stats</h3>
                    <button class="close-btn" onclick="this.parentElement.parentElement.remove()">×</button>
                </div>
                <div class="stats-content">
                    <div class="stat-loading">Waiting for job stats...</div>
                </div>
            `;
            
            popup.style.cssText = `
                position: fixed;
                top: 80px;
                right: 20px;
                width: 220px;
                border-radius: 20px;
                cursor: move;
                isolation: isolate;
                touch-action: none;
                box-shadow: 0px 6px 24px rgba(0, 0, 0, 0.2);
                z-index: 10000;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Helvetica Neue", sans-serif;
                font-size: 13px;
                transition: opacity 0.3s ease, transform 0.3s ease;
                opacity: 0;
                transform: translateX(20px) scale(1.25);
            `;
            
            document.body.appendChild(popup);
            this.injectStyles();
            
            // Add close button event listener
            popup.addEventListener('click', (e) => {
                if (e.target.classList.contains('close-btn')) {
                    this.remove();
                }
            });
            
            // Add glass effect
            setTimeout(() => { 
                popup.style.opacity = '1'; 
                popup.style.transform = 'translateX(0) scale(1)'; 
            }, 50);
        },
        
        updateContent(stats) {
            const popup = document.getElementById('linkedin-job-stats-popup');
            if (!popup) return;
            
            const content = popup.querySelector('.stats-content');
            content.innerHTML = `
                <div class="stat-item">
                    <span class="stat-label">Views:</span>
                    <span class="stat-value">${stats.views !== undefined ? stats.views.toLocaleString() : 'N/A'}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Applies:</span>
                    <span class="stat-value">${stats.applies !== undefined ? stats.applies.toLocaleString() : 'N/A'}</span>
                </div>
                <div class="job-info">Job ID: ${stats.jobId}</div>
            `;
        },
        
        injectStyles() {
            if (document.getElementById('linkedin-stats-styles')) return;
            
            const style = document.createElement('style');
            style.id = 'linkedin-stats-styles';
            style.textContent = `
                #linkedin-job-stats-popup::before {
                    content: '';
                    position: absolute;
                    inset: 0;
                    z-index: 0;
                    border-radius: 20px;
                    box-shadow: inset 0 0 20px -5px rgba(255, 255, 255, 0.7);
                    background-color: rgba(255, 255, 255, 0.3);
                }
                
                #linkedin-job-stats-popup::after {
                    content: '';
                    position: absolute;
                    inset: 0;
                    z-index: -1;
                    border-radius: 20px;
                    backdrop-filter: blur(1px);
                    filter: url(#glass-distortion);
                    isolation: isolate;
                    -webkit-backdrop-filter: blur(1px);
                    -webkit-filter: url("#glass-distortion");
                }
                
                #linkedin-job-stats-popup .stats-header {
                    background: transparent;
                    color: #1d1d1f;
                    padding: 12px 16px 8px 16px;
                    border-radius: 20px 20px 0 0;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    border-bottom: 1px solid rgba(60, 60, 67, 0.15);
                    position: relative;
                    z-index: 1;
                    text-align: center;
                }
                
                #linkedin-job-stats-popup .stats-header h3 {
                    margin: 0;
                    font-size: 17px;
                    font-weight: 650;
                    font-family: 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
                    text-shadow: 0 1px 2px rgba(0,0,0,0.1);
                    letter-spacing: 0.5px;
                    color: #2c3e50;
                    flex: 1;
                    text-transform: uppercase;

                    text-align: center;
                }
                
                #linkedin-job-stats-popup .close-btn {
                    background: none;
                    border: none;
                    color: #3c3c43;
                    font-size: 18px;
                    cursor: pointer;
                    opacity: 0.6;
                    padding: 0;
                    line-height: 1;
                    transition: opacity 0.2s ease;
                    position: absolute;
                    right: 16px;
                }
                
                #linkedin-job-stats-popup .close-btn:hover {
                    opacity: 1;
                }
                
                #linkedin-job-stats-popup .stats-content {
                    padding: 12px 16px 16px 16px;
                    position: relative;
                    z-index: 1;
                }
                
                #linkedin-job-stats-popup .stat-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 8px;
                    font-size: 13px;
                    font-weight: 600;
                    color: #1d1d1f;
                    text-shadow: 0 1px 1px rgba(255,255,255,0.3);
                }
                
                #linkedin-job-stats-popup .stat-label {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-weight: 600;
                }
                
                #linkedin-job-stats-popup .stat-value {
                    font-weight: 700;
                    color: #1d1d1f;
                    text-shadow: 0 1px 1px rgba(255,255,255,0.3);
                }
                
                #linkedin-job-stats-popup .job-info {
                    font-size: 11px;
                    color: #3c3c43;
                    text-align: center;
                    margin-top: 6px;
                    padding-top: 6px;
                    border-top: 1px solid rgba(60, 60, 67, 0.15);
                    opacity: 0.8;
                    text-shadow: 0 1px 1px rgba(255,255,255,0.3);
                }
                
                #linkedin-job-stats-popup .stat-loading {
                    text-align: center;
                    color: #3c3c43;
                    font-style: italic;
                    opacity: 0.8;
                    text-shadow: 0 1px 1px rgba(255,255,255,0.3);
                    padding: 16px 8px;
                }
            `;
            
            document.head.appendChild(style);
            
            // Add SVG filter for glass distortion (reduced effect)
            if (!document.getElementById('glass-distortion')) {
                const svgContainer = document.createElement('div');
                svgContainer.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" style="position:absolute; height:0; width:0; overflow:hidden;"><defs><filter id="glass-distortion" x="0%" y="0%" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.008 0.008" numOctaves="1" seed="92" result="noise" /><feGaussianBlur in="noise" stdDeviation="2" result="blurred" /><feDisplacementMap in="SourceGraphic" in2="blurred" scale="0" xChannelSelector="R" yChannelSelector="G" /></filter></defs></svg>`;
                document.body.appendChild(svgContainer);
            }
        },
        
        remove() {
            const popup = document.getElementById('linkedin-job-stats-popup');
            if (popup) {
                popup.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                popup.style.opacity = '0';
                popup.style.transform = 'translateX(100px) scale(0.8)';
                setTimeout(() => popup.remove(), 500);
            }
        }
    };
    
    function updateUI(stats) {
        UI.createPopup();
        UI.updateContent(stats);
    }
    
    // Monitor page changes
    function monitorJobChanges() {
        const observer = new MutationObserver(() => {
            const newJobId = getCurrentJobId();
            if (newJobId && newJobId !== currentJobId) {
                currentJobId = newJobId;
                console.log('🆔 New job detected:', currentJobId);
                
                // Check if we have stats for this job already
                if (typeof window.getLinkedInJobStatsById === 'function') {
                    const stats = window.getLinkedInJobStatsById(currentJobId);
                    if (stats) {
                        updateUI(stats);
                    }
                }
            }
        });
        
        observer.observe(document.body, {
            childList: true, 
            subtree: true
        });
    }
    
    // Initialize
    setTimeout(() => {
        UI.createPopup();
        monitorJobChanges();
        currentJobId = getCurrentJobId();
        console.log('✅ LinkedIn Job Stats initialized, current job:', currentJobId);
    }, 1000);
})();
