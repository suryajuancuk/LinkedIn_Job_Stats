// Content script to handle UI and data from interceptor
(function() {
    'use strict';
    console.log('LinkedIn Job Stats content script loaded');
    
    let currentJobId = null;
    let lastStats = null;
    let debounceTimer = null;
    
    // Cache system for job stats
    const jobStatsCache = new Map();
    const CACHE_TTL = 5 * 60 * 1000; // 5 minutes TTL
    const DEBOUNCE_DELAY = 300; // 300ms debounce
    
    // LRU Cache with TTL
    class JobStatsCache {
        constructor(maxSize = 50, ttl = CACHE_TTL) {
            this.cache = new Map();
            this.maxSize = maxSize;
            this.ttl = ttl;
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
    
    const cache = new JobStatsCache();
    
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
                    <span>LinkedIn Job Stats</span>
                    <button class="close-btn" id="job-stats-close-btn" aria-label="Close">&times;</button>
                </div>
                <div class="stats-content">
                    <div>Select a job to see stats.</div>
                </div>
                <div class="footer">&copy; Made by evin</div>
            `;
            
            popup.style.cssText = `
                position: fixed;
                top: 80px;
                right: 20px;
                width: 240px;
                min-height: 140px;
                border-radius: 20px;
                cursor: grab;
                isolation: isolate;
                touch-action: none;
                box-shadow: 0px 6px 24px rgba(0, 0, 0, 0.2);
                z-index: 10000;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Helvetica Neue", sans-serif;
                font-size: 13px;
                transition: opacity 0.3s ease, transform 0.3s ease;
                opacity: 0;
                transform: translateX(20px) scale(1.25);
                display: flex;
                flex-direction: column;
            `;
            
            document.body.appendChild(popup);
            this.injectStyles();
            
            // Add close button event listener
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
                <div class="stat-item"><span>Views:</span><span>${stats.views !== undefined ? stats.views.toLocaleString() : 'N/A'}</span></div>
                <div class="stat-item"><span>Applicants:</span><span>${stats.applies !== undefined ? stats.applies.toLocaleString() : 'N/A'}</span></div>
                <div class="job-info">Job ID: ${stats.jobId || "N/A"}</div>
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
                    background-color: rgba(255, 255, 255, 0.175);
                }
                
                #linkedin-job-stats-popup::after {
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
                
                #linkedin-job-stats-popup .stats-header {
                    background: transparent;
                    color: #1d1d1f;
                    padding: 8px 12px 4px 14px;
                    border-radius: 20px 20px 0 0;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-bottom: 1px solid rgba(237, 237, 237, 0.3);
                    position: relative;
                    z-index: 1;
                    text-align: center;
                }
                
                #linkedin-job-stats-popup .stats-header span {
                    flex: 1;
                    text-align: center;
                    font-size: 16px;
                    font-weight: 700;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
                    letter-spacing: -0.2px;
                    color: #1c1c1e;
                }
                
                #linkedin-job-stats-popup .close-btn {
                    background: none;
                    border: none;
                    color: #808080;
                    font-size: 20px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    padding: 0 0 0 6px;
                    margin: 0;
                    line-height: 1;
                    font-weight: 400;
                    transition: color 0.2s ease;
                }
                
                #linkedin-job-stats-popup .close-btn:hover {
                    color: #666;
                }
                
                #linkedin-job-stats-popup .stats-content {
                    flex: 1 1 auto;
                    padding: 10px 14px 0 14px;
                    font-size: 14px;
                    overflow-y: auto;
                    color: #2c2c2e;
                    position: relative;
                    z-index: 1;
                }
                
                #linkedin-job-stats-popup .stat-item {
                    display: flex;
                    justify-content: space-between;
                    margin: 6px 0;
                    font-weight: 600;
                    padding: 4px 0;
                }
                
                #linkedin-job-stats-popup .stat-label {
                    font-weight: 600;
                }
                
                #linkedin-job-stats-popup .stat-value {
                    font-weight: 600;
                }
                
                #linkedin-job-stats-popup .job-info {
                    font-size: 11px;
                    text-align: center;
                    color: #757575;
                    padding-top: 3px;
                }
                
                #linkedin-job-stats-popup .footer {
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
                
                #linkedin-job-stats-popup .stat-loading {
                    text-align: center;
                    color: #757575;
                    font-style: italic;
                    padding: 1em;
                }
                
                #linkedin-job-stats-popup .stats-content > div:not(.stat-item):not(.job-info) {
                    text-align: center;
                    color: #757575;
                    font-style: italic;
                    padding: 1em;
                }
            `;
            
            document.head.appendChild(style);
            
            // Add SVG filter for glass distortion effect
            if (!document.getElementById('glass-distortion')) {
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
