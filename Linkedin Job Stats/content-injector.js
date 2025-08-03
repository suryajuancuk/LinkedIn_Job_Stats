// This script runs at document_start to inject our interceptor as early as possible
(function() {
    'use strict';
    
    console.log('🔧 Content Injector: Loading interceptor script...');
    
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('linkedin-interceptor.js');
    script.onload = function() {
        console.log('✅ Interceptor script loaded successfully');
    };
    script.onerror = function() {
        console.error('❌ Failed to load interceptor script');
    };
    
    (document.head || document.documentElement).appendChild(script);
})();
