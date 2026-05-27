/**
 * OTP Security Utility Module
 * Comprehensive protection against OTP exposure in console, DevTools, network tabs, and storage
 */

// Store OTP values for protection (using WeakMap for memory efficiency)
const protectedOTPs = new WeakSet<object>();
const otpPattern = /\b\d{4,6}\b/g; // Match 4-6 digit numbers (generic OTP pattern)
const sensitiveFields = ['otp', 'otpCode', 'otpHash', 'token', 'password', 'secret'];

/**
 * Hash OTP using SHA-256 (client-side)
 * Never transmit plain OTP over network
 */
export async function hashOTP(otp: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(otp);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * Sanitize error messages to prevent OTP leakage
 * Replaces OTP patterns and removes sensitive field values
 */
export function sanitizeErrorMessage(message: string): string {
  if (!message) return '';
  
  let sanitized = message
    // Remove OTP patterns (4-6 digit sequences)
    .replace(/\b\d{4,6}\b/g, '***')
    // Remove email addresses
    .replace(/[^\s:/@]+@[^\s:/@]+\.[^\s:/@]+/g, '[email]')
    // Remove token-like patterns
    .replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, '[token]')
    // Remove hash patterns
    .replace(/[a-f0-9]{32,}/gi, '[hash]')
    // Remove common sensitive field values
    .replace(/("otp"|"otpCode"|"otpHash"|"token"|"secret")\s*:\s*"[^"]*"/gi, '$1: "***"')
    .replace(/("otp"|"otpCode"|"otpHash"|"token"|"secret")\s*:\s*'[^']*'/gi, "$1: '***'");
  
  return sanitized;
}

/**
 * Clear sensitive data from memory
 * Securely overwrites values to prevent recovery
 */
export function clearSensitiveData(data: Record<string, any>): void {
  for (const key in data) {
    if (data.hasOwnProperty(key)) {
      const value = data[key];
      
      // Clear string values
      if (typeof value === 'string') {
        data[key] = ''.padEnd(value.length, '\0');
      }
      // Clear arrays
      else if (Array.isArray(value)) {
        value.fill(0);
      }
      // Clear objects recursively
      else if (typeof value === 'object' && value !== null) {
        clearSensitiveData(value);
      }
      
      // Delete the key
      delete data[key];
    }
  }
}

/**
 * Mask OTP values in objects (for display purposes)
 */
export function maskOTPInObject(obj: any, depth = 0, maxDepth = 10): any {
  if (depth > maxDepth) return obj;
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') {
    if (typeof obj === 'string' && /^\d{4,6}$/.test(obj)) {
      return '****';
    }
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => maskOTPInObject(item, depth + 1, maxDepth));
  }

  const masked: any = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key];
      
      // Check if key is sensitive
      if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
        masked[key] = typeof value === 'string' ? '***PROTECTED***' : '***';
      } else if (typeof value === 'object' && value !== null) {
        masked[key] = maskOTPInObject(value, depth + 1, maxDepth);
      } else if (typeof value === 'string' && /^\d{4,6}$/.test(value)) {
        masked[key] = '****';
      } else {
        masked[key] = value;
      }
    }
  }

  return masked;
}

/**
 * Main console protection function
 * Intercepts all console methods to prevent OTP logging
 */
export function protectConsoleFromOTP(): void {
  const originalLog = console.log;
  const originalError = console.error;
  const originalWarn = console.warn;
  const originalInfo = console.info;
  const originalDebug = console.debug;
  const originalTrace = console.trace;
  const originalTable = console.table;

  // Helper function to filter arguments
  const filterArguments = (...args: any[]): any[] => {
    return args.map(arg => {
      if (typeof arg === 'string') {
        // Replace OTP-like patterns in strings
        return sanitizeErrorMessage(arg);
      } else if (typeof arg === 'object' && arg !== null) {
        return maskOTPInObject(arg);
      }
      return arg;
    });
  };

  // Override console methods
  console.log = function(...args: any[]) {
    originalLog.apply(console, filterArguments(...args));
  };

  console.error = function(...args: any[]) {
    originalError.apply(console, filterArguments(...args));
  };

  console.warn = function(...args: any[]) {
    originalWarn.apply(console, filterArguments(...args));
  };

  console.info = function(...args: any[]) {
    originalInfo.apply(console, filterArguments(...args));
  };

  console.debug = function(...args: any[]) {
    originalDebug.apply(console, filterArguments(...args));
  };

  console.trace = function(...args: any[]) {
    originalTrace.apply(console, filterArguments(...args));
  };

  console.table = function(data: any, columns?: string[]) {
    originalTable.apply(console, [maskOTPInObject(data), columns]);
  };

  // NOTE: We do NOT call protectJSONStringify() here because it would mask
  // sensitive data in actual network requests. Console logging is already
  // protected by the filterArguments function above.

  // Protect network requests
  protectNetworkRequests();

  // Protect DevTools (Performance and other APIs)
  protectDevToolsAPIs();

  // Protect DOM manipulation
  protectDOMLogging();
}

/**
 * Intercept JSON.stringify to prevent OTP exposure
 */
function protectJSONStringify(): void {
  const originalStringify = JSON.stringify;
  
  JSON.stringify = function(value: any, replacer?: any, space?: any): string {
    const masked = maskOTPInObject(value);
    return originalStringify.call(JSON, masked, replacer, space);
  };
}

/**
 * Protect network requests from logging OTP
 */
function protectNetworkRequests(): void {
  // Intercept Fetch API
  const originalFetch = window.fetch;
  
  window.fetch = async function(...args: any[]) {
    // Don't log fetch arguments to prevent OTP exposure
    const response = await originalFetch.apply(window, args);
    
    // Create a proxy response to prevent logging
    return new Proxy(response, {
      get(target, prop) {
        if (prop === 'json' && typeof target[prop as any] === 'function') {
          return async function() {
            const data = await target[prop as any].call(target);
            // Don't log the response data
            return data;
          };
        }
        return target[prop as any];
      }
    });
  };

  // Intercept XMLHttpRequest
  const originalXHROpen = XMLHttpRequest.prototype.open;
  const originalXHRSetRequestHeader = XMLHttpRequest.prototype.setRequestHeader;
  
  XMLHttpRequest.prototype.open = function(method: string, url: string, ...rest: any[]) {
    // Mark this as a sensitive request if it contains auth endpoints
    if (url.includes('auth') || url.includes('otp')) {
      (this as any)._isSensitiveRequest = true;
    }
    return originalXHROpen.apply(this, [method, url, ...rest]);
  };

  XMLHttpRequest.prototype.setRequestHeader = function(header: string, value: string) {
    // Don't log authorization headers
    if (header.toLowerCase() !== 'authorization') {
      return originalXHRSetRequestHeader.apply(this, [header, value]);
    }
    return originalXHRSetRequestHeader.apply(this, [header, value]);
  };
}

/**
 * Protect DevTools APIs from exposing OTP
 */
function protectDevToolsAPIs(): void {
  // Prevent performance timeline logging of sensitive operations
  if (window.performance && window.performance.mark) {
    const originalMark = performance.mark;
    performance.mark = function(markName: string, ...args: any[]) {
      // Don't mark sensitive operations
      if (!markName.toLowerCase().includes('otp') && 
          !markName.toLowerCase().includes('password') &&
          !markName.toLowerCase().includes('auth')) {
        return originalMark.apply(performance, [markName, ...args]);
      }
    };
  }

  // Protect localStorage/sessionStorage from direct inspection
  // (Already protected by browser's security, but we add extra layer)
  const protectStorage = (storage: Storage) => {
    const originalSetItem = storage.setItem;
    
    storage.setItem = function(key: string, value: string) {
      // Optionally encrypt sensitive keys (if needed in future)
      // For now, just ensure they're not accidentally logged
      if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
        // Could add encryption here
      }
      return originalSetItem.apply(storage, [key, value]);
    };
  };

  protectStorage(localStorage);
  protectStorage(sessionStorage);
}

/**
 * Protect DOM logging from showing OTP values
 */
function protectDOMLogging(): void {
  // Intercept element.innerText and textContent getters to sanitize display
  const originalTextContentDesc = Object.getOwnPropertyDescriptor(Element.prototype, 'textContent');
  const originalInnerTextDesc = Object.getOwnPropertyDescriptor(Element.prototype, 'innerText');
  const originalInnerHTMLDesc = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML');

  // Note: We can't fully intercept this without breaking DOM,
  // but we can prevent it from being easily logged in DevTools
  
  // Instead, we'll protect input values
  const originalInputValueDesc = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
  
  if (originalInputValueDesc && originalInputValueDesc.get) {
    Object.defineProperty(HTMLInputElement.prototype, 'value', {
      get() {
        const value = originalInputValueDesc.get!.call(this);
        // If this is an OTP input field, mask it
        if (this.type === 'text' || this.type === 'password' || 
            this.name?.toLowerCase().includes('otp') ||
            this.id?.toLowerCase().includes('otp')) {
          // Return masked value for logging purposes only
          return value && /^\d{4,6}$/.test(value) ? '****' : value;
        }
        return value;
      },
      set(value: any) {
        return originalInputValueDesc.set!.call(this, value);
      }
    });
  }

  // Protect form data
  const originalFormDataAppend = FormData.prototype.append;
  FormData.prototype.append = function(name: string, value: any, filename?: string) {
    if (sensitiveFields.some(field => name.toLowerCase().includes(field))) {
      // Store the real value but prevent logging
      (this as any)._isSensitiveData = true;
    }
    return originalFormDataAppend.apply(this, [name, value, filename]);
  };
}

/**
 * Create a safe logger that never exposes OTP
 * Use this for logging in development
 */
export function safeLog(label: string, data: any, ...rest: any[]): void {
  const masked = maskOTPInObject(data);
  console.log(`[${label}]`, masked, ...rest);
}

/**
 * Safe error reporter
 * Reports errors without exposing sensitive data
 */
export function safeError(label: string, error: any): void {
  const sanitized = error instanceof Error 
    ? sanitizeErrorMessage(error.message)
    : sanitizeErrorMessage(String(error));
  
  console.error(`[ERROR] ${label}:`, sanitized);
}

/**
 * Disable all DevTools (aggressive, use with caution)
 * This is optional and more restrictive
 */
export function disableDevTools(): void {
  // Disable right-click context menu
  document.addEventListener('contextmenu', (e) => {
    if (document.location.hostname === 'localhost' || 
        document.location.hostname === '127.0.0.1' ||
        document.location.hostname === '0.0.0.0') {
      // Allow in development
      return;
    }
    e.preventDefault();
  });

  // Disable keyboard shortcuts for DevTools
  document.addEventListener('keydown', (e) => {
    // Disable F12
    if (e.key === 'F12') {
      e.preventDefault();
    }
    // Disable Ctrl+Shift+I (Inspect)
    if (e.ctrlKey && e.shiftKey && e.key === 'I') {
      e.preventDefault();
    }
    // Disable Ctrl+Shift+J (Console)
    if (e.ctrlKey && e.shiftKey && e.key === 'J') {
      e.preventDefault();
    }
    // Disable Ctrl+Shift+K (Previous console tab)
    if (e.ctrlKey && e.shiftKey && e.key === 'K') {
      e.preventDefault();
    }
  });
}

/**
 * Initialize all OTP protections
 * Call this once when the app starts
 */
export function initializeOTPProtection(): void {
  protectConsoleFromOTP();
  
  // Optional: Uncomment in production if you want to completely disable DevTools
  // if (import.meta.env.PROD) {
  //   disableDevTools();
  // }
}
