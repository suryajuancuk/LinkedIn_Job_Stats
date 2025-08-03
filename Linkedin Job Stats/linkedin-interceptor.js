(function() {
    'use strict';
    
    console.log('🌐 LinkedIn Job Stats: Voyager API interceptor loaded');
    
    // Function to check if URL is a job posting endpoint
    function isJobPostingEndpoint(url) {
        return url && url.includes('voyager/api/jobs/jobPostings/');
    }
    
    // Function to extract job ID from URL
    function extractJobId(url) {
        const match = url.match(/jobPostings\/(\d+)\?/);
        return match ? match[1] : null;
    }
    
    // Process API data
    function processApiData(jobId, data) {
        if (data && data.data) {
            const { applies, views } = data.data;
            if (applies !== undefined || views !== undefined) {
                console.log(`📦 Found job stats - Job ID: ${jobId}, Applies: ${applies}, Views: ${views}`);
                
                const eventData = {
                    type: 'LINKEDIN_JOB_API_DATA',
                    jobId: jobId,
                    applies: applies,
                    views: views,
                    timestamp: Date.now()
                };
                
                // Send via postMessage
                window.postMessage(eventData, '*');
                
                // Store in global array
                window.linkedInJobStats = window.linkedInJobStats || [];
                window.linkedInJobStats.push(eventData);
                
                // Dispatch custom event
                const customEvent = new CustomEvent('LinkedInJobStatsData', {
                    detail: eventData
                });
                document.dispatchEvent(customEvent);
            } else {
                console.log('⚠️ API response missing applies or views for job:', jobId);
            }
        } else {
            console.log('⚠️ Invalid API response structure');
        }
    }
    
    // Intercept XMLHttpRequest
    (function() {
        const originalOpen = XMLHttpRequest.prototype.open;
        const originalSend = XMLHttpRequest.prototype.send;
        
        XMLHttpRequest.prototype.open = function(method, url) {
            this._url = url;
            return originalOpen.apply(this, arguments);
        };
        
        XMLHttpRequest.prototype.send = function() {
            if (isJobPostingEndpoint(this._url)) {
                console.log('🎯 Intercepted XHR job posting:', this._url);
                
                this.addEventListener('load', async () => {
                    try {
                        const jobId = extractJobId(this._url);
                        let responseText;
                        
                        if (this.responseType === 'blob' && this.response instanceof Blob) {
                            // Handle blob response
                            responseText = await this.response.text();
                        } else if (this.responseType === '' || this.responseType === 'text') {
                            responseText = this.responseText;
                        } else {
                            console.log('⚠️ Unsupported responseType:', this.responseType);
                            return;
                        }
                        
                        const jsonData = JSON.parse(responseText);
                        processApiData(jobId, jsonData);
                    } catch (e) {
                        console.error('Error parsing XHR response:', e);
                    }
                });
            }
            return originalSend.apply(this, arguments);
        };
    })();
    
    // Intercept fetch (keep this for completeness, as some calls may use fetch)
    if (typeof window.fetch !== 'undefined') {
        const originalFetch = window.fetch;
        window.fetch = function(...args) {
            const url = typeof args[0] === 'string' ? args[0] : args[0]?.url;
            
            if (isJobPostingEndpoint(url)) {
                console.log('🎯 Intercepted fetch job posting:', url);
                
                return originalFetch.apply(this, args).then(async response => {
                    try {
                        const clonedResponse = response.clone();
                        const jsonData = await clonedResponse.json();
                        const jobId = extractJobId(url);
                        processApiData(jobId, jsonData);
                    } catch (e) {
                        console.error('Error parsing fetch response:', e);
                    }
                    return response;
                });
            }
            
            return originalFetch.apply(this, args);
        };
    }
    
    // Function to get recent job stats
    window.getLinkedInJobStats = function() {
        const stats = window.linkedInJobStats || [];
        const recent = stats.filter(item => Date.now() - item.timestamp < 30000);
        return recent;
    };
    
    // Function to get stats for a specific job ID
    window.getLinkedInJobStatsById = function(jobId) {
        const stats = window.linkedInJobStats || [];
        const jobStats = stats.filter(item => 
            item.jobId === jobId && (Date.now() - item.timestamp < 60000)
        );
        return jobStats.length > 0 ? jobStats[jobStats.length - 1] : null;
    };
    
    console.log('✅ Voyager API interceptor setup complete');
})();
