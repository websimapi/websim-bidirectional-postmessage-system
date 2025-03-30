import { config } from './config.js';

// DOM Elements
const iframeUrlInput = document.getElementById('iframe-url');
const addIframeButton = document.getElementById('add-iframe');
const iframeContainer = document.getElementById('iframe-container');
const messageContent = document.getElementById('message-content');
const sendMessageButton = document.getElementById('send-message');
const logContainer = document.getElementById('log-container');

// Track all iframes we've added
const iframes = [];

// Initialize when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', init);

function init() {
    // Set up event listeners
    addIframeButton.addEventListener('click', addIframe);
    sendMessageButton.addEventListener('click', sendMessageToAll);
    
    // Setup message listener from parent and iframes
    window.addEventListener('message', receiveMessage);
    
    // Log system initialization
    addLogEntry('System initialized and ready for communication', 'system');
}

function addIframe() {
    if (iframes.length >= config.maxIframes) {
        addLogEntry(`Maximum number of iframes (${config.maxIframes}) reached.`, 'system');
        return;
    }
    
    let url = iframeUrlInput.value.trim();
    if (!url) {
        url = config.defaultIframeUrl;
    }
    
    // Validate URL
    try {
        new URL(url);
    } catch (e) {
        addLogEntry(`Invalid URL: ${url}`, 'system');
        return;
    }
    
    // Create iframe wrapper elements
    const iframeWrapper = document.createElement('div');
    iframeWrapper.classList.add('iframe-wrapper');
    
    const iframeTitle = document.createElement('div');
    iframeTitle.classList.add('iframe-title');
    
    const titleText = document.createElement('span');
    titleText.textContent = url;
    
    const removeButton = document.createElement('button');
    removeButton.classList.add('remove-iframe');
    removeButton.textContent = 'X';
    removeButton.addEventListener('click', () => removeIframe(iframeWrapper, url));
    
    iframeTitle.appendChild(titleText);
    iframeTitle.appendChild(removeButton);
    
    // Create the iframe
    const iframe = document.createElement('iframe');
    iframe.src = url;
    iframe.title = `Embedded content from ${url}`;
    
    // Add elements to the DOM
    iframeWrapper.appendChild(iframeTitle);
    iframeWrapper.appendChild(iframe);
    iframeContainer.appendChild(iframeWrapper);
    
    // Store iframe info
    iframes.push({ iframe, url });
    
    // Clear input
    iframeUrlInput.value = '';
    
    // Log the addition
    addLogEntry(`Added iframe: ${url}`, 'system');
    
    // Send a welcome message to the newly added iframe
    setTimeout(() => {
        try {
            iframe.contentWindow.postMessage({
                type: 'welcome',
                message: config.welcomeMessage,
                from: 'parent'
            }, '*');
            
            addLogEntry(`Sent welcome message to: ${url}`, 'sent');
        } catch (e) {
            addLogEntry(`Failed to send welcome message to: ${url}`, 'system');
        }
    }, 1000); // Give iframe time to load
}

function removeIframe(wrapper, url) {
    // Remove from DOM
    wrapper.remove();
    
    // Remove from our tracking array
    const index = iframes.findIndex(item => item.url === url);
    if (index !== -1) {
        iframes.splice(index, 1);
    }
    
    // Log the removal
    addLogEntry(`Removed iframe: ${url}`, 'system');
}

function sendMessageToAll() {
    const message = messageContent.value.trim();
    if (!message) {
        addLogEntry('Please enter a message to send', 'system');
        return;
    }
    
    // Send to all iframes
    iframes.forEach(({ iframe, url }) => {
        try {
            iframe.contentWindow.postMessage({
                type: 'message',
                message: message,
                from: 'parent'
            }, '*');
            
            addLogEntry(`Sent to ${url}: ${message}`, 'sent');
        } catch (e) {
            addLogEntry(`Failed to send to ${url}: ${e.message}`, 'system');
        }
    });
    
    // Send to parent if we're in an iframe
    if (window !== window.top) {
        try {
            window.parent.postMessage({
                type: 'message',
                message: message,
                from: 'iframe',
                url: window.location.href
            }, '*');
            
            addLogEntry(`Sent to parent: ${message}`, 'sent');
        } catch (e) {
            addLogEntry(`Failed to send to parent: ${e.message}`, 'system');
        }
    }
    
    // Clear message input
    messageContent.value = '';
}

function receiveMessage(event) {
    // Check if the origin is allowed
    if (config.allowedOrigins !== '*' && 
        Array.isArray(config.allowedOrigins) && 
        !config.allowedOrigins.includes(event.origin)) {
        console.warn(`Received message from non-allowed origin: ${event.origin}`);
        return;
    }
    
    // Process the message
    const data = event.data;
    if (typeof data === 'object') {
        const source = data.from === 'parent' ? 'Parent' : 
                      (data.from === 'iframe' ? `Iframe (${data.url || 'unknown'})` : 'Unknown');
        
        addLogEntry(`Received from ${source}: ${data.message}`, 'received');
        
        // You could handle different message types here
        if (data.type === 'welcome') {
            // Handle welcome message
        } else if (data.type === 'message') {
            // Handle regular message
        }
    }
}

function addLogEntry(message, type = 'system') {
    const entry = document.createElement('div');
    entry.classList.add('log-entry', type);
    
    const timestamp = new Date().toLocaleTimeString();
    entry.textContent = `[${timestamp}] ${message}`;
    
    logContainer.appendChild(entry);
    
    // Auto-scroll to bottom
    logContainer.scrollTop = logContainer.scrollHeight;
}

// Helper code for being embedded as an iframe
if (window !== window.top) {
    // We are in an iframe
    addLogEntry('This page is embedded in an iframe', 'system');
    
    // Notify the parent that we've loaded
    setTimeout(() => {
        try {
            window.parent.postMessage({
                type: 'loaded',
                message: 'Iframe has loaded successfully',
                from: 'iframe',
                url: window.location.href
            }, '*');
        } catch (e) {
            addLogEntry(`Failed to notify parent: ${e.message}`, 'system');
        }
    }, 500);
}

