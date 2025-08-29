// Debug patch for JWT validator - adds extensive logging

const originalConsoleLog = console.log;
const originalConsoleError = console.error;

// Enhanced logging with timestamps
console.log = (...args) => {
    const timestamp = new Date().toISOString();
    originalConsoleLog(`[${timestamp}] DEBUG:`, ...args);
};

console.error = (...args) => {
    const timestamp = new Date().toISOString(); 
    originalConsoleError(`[${timestamp}] ERROR:`, ...args);
};

// Add debug function
global.debugLog = (section, data) => {
    console.log(`🔍 [${section}]`, JSON.stringify(data, null, 2));
};
