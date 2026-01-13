import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  fromEmail: string;
  fromName: string;
}

// Cache for SMTP config to avoid repeated environment variable reads
let smtpConfigCache: SmtpConfig | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL = 60000; // 1 minute cache

// Cache for loaded .env file
let envFileCache: Record<string, string> | null = null;

/**
 * Load environment variables from .env file (for local development)
 * This function tries to read .env file from the project root
 * Falls back to Deno.env.get() if file doesn't exist or in production
 */
async function loadEnvFile(): Promise<Record<string, string>> {
  // Return cache if available
  if (envFileCache) {
    return envFileCache;
  }

  const env: Record<string, string> = {};

  try {
    // Try multiple possible paths for .env file
    // 1. Current working directory (for local development)
    // 2. Relative paths from function directory
    const cwd = Deno.cwd();
    const possiblePaths = [
      `${cwd}/.env`,
      `${cwd}/../.env`,
      `${cwd}/../../.env`,
      `${cwd}/../../../.env`,
    ];

    let envContent: string | null = null;
    let loadedPath: string | null = null;
    
    for (const envPath of possiblePaths) {
      try {
        envContent = await Deno.readTextFile(envPath);
        loadedPath = envPath;
        console.log(`Loaded .env file from: ${envPath}`);
        break;
      } catch {
        // Try next path
        continue;
      }
    }

    if (!envContent) {
      throw new Error("No .env file found in any expected location");
    }
    
    // Parse .env file
    const lines = envContent.split("\n");
    for (const line of lines) {
      const trimmedLine = line.trim();
      // Skip empty lines and comments
      if (!trimmedLine || trimmedLine.startsWith("#")) {
        continue;
      }
      
      // Parse KEY=VALUE format
      const equalIndex = trimmedLine.indexOf("=");
      if (equalIndex > 0) {
        const key = trimmedLine.substring(0, equalIndex).trim();
        let value = trimmedLine.substring(equalIndex + 1).trim();
        
        // Remove quotes if present
        if ((value.startsWith('"') && value.endsWith('"')) || 
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        
        env[key] = value;
      }
    }
    
    envFileCache = env;
    console.log("Parsed .env file successfully");
  } catch (error) {
    // .env file not found or not accessible - this is normal in production
    // Will fall back to Deno.env.get()
    console.log("No .env file found, will use environment variables from Deno.env");
  }

  return env;
}

/**
 * Simulate import.meta.env.VITE_* behavior for Deno Edge Functions
 * This function reads from .env file and returns values like import.meta.env.VITE_* would
 * 
 * Usage: const host = await getViteEnv("SMTP_HOST"); 
 *        This is equivalent to: import.meta.env.VITE_SMTP_HOST (in Vite)
 * 
 * Priority order:
 * 1. VITE_ prefixed variable from .env file (like import.meta.env.VITE_*)
 * 2. Direct variable from .env file
 * 3. VITE_ prefixed from Deno.env (if injected)
 * 4. Direct variable from Deno.env (Supabase Edge Functions production)
 */
async function getViteEnv(key: string): Promise<string | undefined> {
  const viteKey = `VITE_${key}`;
  
  // Load .env file (like Vite does automatically with import.meta.env)
  const envFile = await loadEnvFile();
  
  // Priority 1: VITE_ prefixed variable from .env file (like import.meta.env.VITE_*)
  if (envFile[viteKey]) {
    return envFile[viteKey];
  }
  
  // Priority 2: Direct variable from .env file (fallback)
  if (envFile[key]) {
    return envFile[key];
  }
  
  // Priority 3: VITE_ prefixed from Deno.env (if injected by Supabase)
  const viteValue = Deno.env.get(viteKey);
  if (viteValue) {
    return viteValue;
  }
  
  // Priority 4: Direct variable from Deno.env (Supabase Edge Functions production)
  return Deno.env.get(key);
}

/**
 * Get SMTP configuration from environment variables
 * Reads from .env file (with VITE_ prefix support) or Supabase environment variables
 * 
 * Required environment variables:
 * - SMTP_HOST or VITE_SMTP_HOST: SMTP server hostname (e.g., mail.infomaniak.com, smtp.gmail.com)
 * - SMTP_PORT or VITE_SMTP_PORT: SMTP server port (587 for STARTTLS, 465 for SSL)
 * - SMTP_USER or VITE_SMTP_USER: SMTP username (usually your email address)
 * - SMTP_PASS or VITE_SMTP_PASS: SMTP password (or app password for Gmail)
 * 
 * Optional environment variables:
 * - SMTP_FROM_EMAIL or VITE_SMTP_FROM_EMAIL: Sender email address (defaults to SMTP_USER)
 * - SMTP_FROM_NAME or VITE_SMTP_FROM_NAME: Sender name (defaults to "Aurora Society")
 * - SMTP_SECURE or VITE_SMTP_SECURE: Force secure connection (true/false, auto-detected from port if not set)
 */
export async function getSmtpConfig(): Promise<SmtpConfig> {
  // Return cached config if still valid
  const now = Date.now();
  if (smtpConfigCache && (now - cacheTimestamp) < CACHE_TTL) {
    return smtpConfigCache;
  }

  // Read configuration from .env file using VITE_ prefix (like import.meta.env.VITE_*)
  // This simulates: import.meta.env.VITE_SMTP_HOST, import.meta.env.VITE_SMTP_PORT, etc.
  const host = await getViteEnv("SMTP_HOST");
  const portStr = await getViteEnv("SMTP_PORT");
  const user = await getViteEnv("SMTP_USER");
  const pass = await getViteEnv("SMTP_PASS");
  const fromEmail = await getViteEnv("SMTP_FROM_EMAIL");
  const fromName = await getViteEnv("SMTP_FROM_NAME");
  const secureStr = await getViteEnv("SMTP_SECURE");

  // Validate required variables
  if (!host) {
    throw new Error("SMTP_HOST environment variable is required");
  }
  if (!user) {
    throw new Error("SMTP_USER environment variable is required");
  }
  if (!pass) {
    throw new Error("SMTP_PASS environment variable is required");
  }

  // Parse port (default to 587 for STARTTLS)
  const port = portStr ? parseInt(portStr, 10) : 587;
  if (isNaN(port) || port <= 0) {
    throw new Error(`Invalid SMTP_PORT: ${portStr}. Must be a positive number.`);
  }

  // Determine secure flag
  // Port 465 = SSL (secure from start)
  // Port 587 = STARTTLS (upgrade to secure)
  // Can be overridden with SMTP_SECURE env var
  let secure: boolean;
  if (secureStr !== undefined) {
    secure = secureStr.toLowerCase() === "true";
  } else {
    secure = port === 465; // Auto-detect: port 465 uses SSL
  }

  // Build config
  const config: SmtpConfig = {
    host,
    port,
    secure,
    user,
    pass,
    fromEmail: fromEmail || user,
    fromName: fromName || "Aurora Society",
  };

  // Cache the config
  smtpConfigCache = config;
  cacheTimestamp = now;

  return config;
}

// Function to clear cache (useful after updating config)
export function clearSmtpConfigCache() {
  smtpConfigCache = null;
  cacheTimestamp = 0;
}

export function validateSmtpConfig(config: SmtpConfig): { valid: boolean; error?: string } {
  if (!config.host) {
    return { valid: false, error: "SMTP_HOST not configured" };
  }
  if (!config.user) {
    return { valid: false, error: "SMTP_USER not configured" };
  }
  if (!config.pass) {
    return { valid: false, error: "SMTP_PASS not configured" };
  }
  return { valid: true };
}

export async function sendEmail(options: {
  to: string;
  subject: string;
  html: string;
  config?: SmtpConfig;
}): Promise<{ success: boolean; error?: string }> {
  const config = options.config || await getSmtpConfig();
  
  const validation = validateSmtpConfig(config);
  if (!validation.valid) {
    console.error("SMTP validation failed:", validation.error);
    return { success: false, error: validation.error };
  }

  let client: SMTPClient | null = null;

  try {
    // Determine TLS/SSL configuration based on port
    // Port 465 = SSL/TLS (secure connection from start) - used by Infomaniak and Gmail
    // Port 587 = STARTTLS (upgrade to secure connection) - used by Gmail and Infomaniak
    // Port 25 = Usually no encryption (not recommended)
    
    // Detect server type for better configuration
    const isInfomaniak = config.host.includes("infomaniak");
    const isGmail = config.host.includes("gmail");
    
    console.log("Creating SMTP client with config:", {
      hostname: config.host,
      port: config.port,
      serverType: isInfomaniak ? "Infomaniak" : isGmail ? "Gmail" : "Other",
      username: config.user.substring(0, 3) + "***",
      fromEmail: config.fromEmail
    });

    // Configure connection based on port
    // For denomailer:
    // - tls: true means use STARTTLS (for port 587)
    // - tls: false means no encryption or SSL (for port 465, SSL is implicit)
    const connectionConfig: any = {
      hostname: config.host,
      port: config.port,
      auth: {
        username: config.user,
        password: config.pass,
      },
    };

    // Port 587: Use STARTTLS (upgrade connection to TLS)
    if (config.port === 587) {
      connectionConfig.tls = true; // Enable STARTTLS
    }
    // Port 465: Use SSL (secure from the start)
    // denomailer automatically uses SSL for port 465, so tls should be false
    else if (config.port === 465) {
      connectionConfig.tls = false; // SSL is implicit for port 465
    }
    // Other ports: use secure flag
    else {
      connectionConfig.tls = config.secure;
    }

    client = new SMTPClient({
      connection: connectionConfig,
    });

    console.log("Sending email to:", options.to);
    
    // Format the from address properly
    const fromAddress = config.fromEmail.includes("<") 
      ? config.fromEmail 
      : `${config.fromName} <${config.fromEmail}>`;

    await client.send({
      from: fromAddress,
      to: options.to,
      subject: options.subject,
      content: "auto",
      html: options.html,
    });

    console.log("Email sent successfully to:", options.to);
    return { success: true };
  } catch (error: any) {
    console.error("SMTP error:", {
      message: error?.message,
      name: error?.name,
      code: error?.code,
      host: config.host,
      port: config.port,
      user: config.user.substring(0, 3) + "***"
    });
    
    // Provide more helpful error messages
    let errorMessage = error?.message || "Unknown SMTP error";
    
    if (error?.message?.includes("authentication")) {
      errorMessage = "Erreur d'authentification SMTP. Vérifiez vos identifiants (utilisateur/mot de passe).";
    } else if (error?.message?.includes("connection") || error?.message?.includes("timeout")) {
      errorMessage = "Erreur de connexion au serveur SMTP. Vérifiez le serveur et le port.";
    } else if (error?.message?.includes("certificate") || error?.message?.includes("TLS")) {
      errorMessage = "Erreur TLS/SSL. Vérifiez la configuration du port (587 pour STARTTLS, 465 pour SSL).";
    } else if (error?.message?.includes("refused")) {
      errorMessage = "Connexion refusée par le serveur SMTP. Vérifiez le serveur et le port.";
    }
    
    return { success: false, error: errorMessage };
  } finally {
    if (client) {
      try {
        await client.close();
        console.log("SMTP connection closed");
      } catch (closeError: any) {
        console.error("Error closing SMTP connection:", closeError?.message);
      }
    }
  }
}
