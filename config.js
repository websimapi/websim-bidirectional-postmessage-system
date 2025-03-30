// Configuration options
export const config = {
    // Maximum number of iframes allowed
    maxIframes: 6,
    
    // Default iframe URL if none provided
    defaultIframeUrl: 'about:blank',
    
    // Origin validation - set to '*' to accept messages from any origin, 
    // or specify allowed origins in an array
    allowedOrigins: '*', // ['https://example.com', 'https://trusted-site.com']
    
    // Default message when an iframe is added
    welcomeMessage: 'Hello from the parent page!'
};

