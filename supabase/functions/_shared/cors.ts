/**
 * CORS Configuration with Domain Whitelist
 * Supports environment-based configuration (dev/prod)
 */

// Get allowed origins from environment or use defaults
const getAllowedOrigins = (): string[] => {
  const envOrigins = Deno.env.get('ALLOWED_ORIGINS');
  
  if (envOrigins) {
    // Parse comma-separated list from environment
    return envOrigins.split(',').map(origin => origin.trim());
  }
  
  // Default allowed origins: localhost (8080, 8081) and aurorasociety.ch
  return [
    'http://localhost:8080',
    'http://127.0.0.1:8080',
    'http://localhost:8081',
    'http://127.0.0.1:8081',
    'https://aurorasociety.ch',
    'https://www.aurorasociety.ch',
    'http://aurorasociety.ch',
    'http://www.aurorasociety.ch',
  ];
};

/**
 * Get CORS headers based on the request origin
 */
export const getCorsHeaders = (origin: string | null): Record<string, string> => {
  const allowedOrigins = getAllowedOrigins();
  
  // If no origin, don't set CORS headers (same-origin request)
  if (!origin) {
    return {
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      'Access-Control-Max-Age': '86400',
    };
  }
  
  // Check if origin is in whitelist
  const isAllowed = allowedOrigins.some(allowedOrigin => {
    // Exact match
    if (origin === allowedOrigin) return true;
    
    // Support wildcard subdomains (e.g., *.aurora-society.com)
    if (allowedOrigin.startsWith('*.')) {
      const domain = allowedOrigin.slice(2);
      return origin.endsWith(domain);
    }
    
    return false;
  });
  
  const allowedOrigin = isAllowed ? origin : allowedOrigins[0] || '*';
  
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400',
  };
};

/**
 * Legacy export for backward compatibility
 * @deprecated Use getCorsHeaders() instead
 */
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Max-Age': '86400',
};
