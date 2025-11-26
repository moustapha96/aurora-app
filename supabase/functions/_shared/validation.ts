/**
 * Server-side validation and sanitization utilities
 */

/**
 * Sanitize a string input to prevent XSS and injection attacks
 */
export const sanitizeString = (input: string | null | undefined, maxLength: number = 1000): string => {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  // Remove null bytes
  let sanitized = input.replace(/\0/g, '');
  
  // Trim whitespace
  sanitized = sanitized.trim();
  
  // Limit length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  
  // Remove potentially dangerous characters (but keep basic punctuation)
  // This is a basic sanitization - adjust based on your needs
  sanitized = sanitized.replace(/[<>]/g, '');
  
  return sanitized;
};

/**
 * Validate email format
 */
export const validateEmail = (email: string | null | undefined): boolean => {
  if (!email || typeof email !== 'string') {
    return false;
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim()) && email.length <= 255;
};

/**
 * Validate password strength (strict)
 */
export const validatePasswordStrength = (password: string | null | undefined): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!password || typeof password !== 'string') {
    return { valid: false, errors: ['Password is required'] };
  }
  
  if (password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one digit');
  }
  
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  if (password.length > 128) {
    errors.push('Password must be less than 128 characters');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Validate password for admin creation (less strict - minimum 6 characters)
 */
export const validatePasswordForAdmin = (password: string | null | undefined): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!password || typeof password !== 'string') {
    return { valid: false, errors: ['Password is required'] };
  }
  
  if (password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }
  
  if (password.length > 128) {
    errors.push('Password must be less than 128 characters');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Validate username format
 */
export const validateUsername = (username: string | null | undefined): { valid: boolean; error?: string } => {
  if (!username || typeof username !== 'string') {
    return { valid: false, error: 'Username is required' };
  }
  
  const trimmed = username.trim();
  
  if (trimmed.length < 3) {
    return { valid: false, error: 'Username must be at least 3 characters long' };
  }
  
  if (trimmed.length > 50) {
    return { valid: false, error: 'Username must be less than 50 characters' };
  }
  
  // Allow alphanumeric, underscore, hyphen
  if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
    return { valid: false, error: 'Username can only contain letters, numbers, underscores, and hyphens' };
  }
  
  return { valid: true };
};

/**
 * Validate phone number format (basic validation)
 */
export const validatePhone = (phone: string | null | undefined): boolean => {
  if (!phone || typeof phone !== 'string') {
    return false;
  }
  
  // Basic phone validation - accepts international format
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  
  return phoneRegex.test(cleaned) && cleaned.length <= 20;
};

/**
 * Validate and sanitize registration data
 */
export interface RegistrationData {
  email?: string;
  password?: string;
  first_name?: string;
  last_name?: string;
  username?: string;
  mobile_phone?: string;
  [key: string]: any;
}

export const validateRegistrationData = (data: any, isAdmin: boolean = false): { valid: boolean; errors: string[]; sanitized?: RegistrationData } => {
  const errors: string[] = [];
  const sanitized: RegistrationData = {};
  
  // Validate email
  if (data.email) {
    if (!validateEmail(data.email)) {
      errors.push('Invalid email format');
    } else {
      sanitized.email = data.email.trim().toLowerCase();
    }
  }
  
  // Validate password (less strict for admin creation)
  if (data.password) {
    const passwordValidation = isAdmin 
      ? validatePasswordForAdmin(data.password)
      : validatePasswordStrength(data.password);
    if (!passwordValidation.valid) {
      errors.push(...passwordValidation.errors);
    } else {
      sanitized.password = data.password; // Don't sanitize password, just validate
    }
  }
  
  // Validate and sanitize names
  if (data.first_name) {
    const firstName = sanitizeString(data.first_name, 100);
    if (firstName.length < 1) {
      errors.push('First name is required');
    } else if (firstName.length > 100) {
      errors.push('First name is too long');
    } else {
      sanitized.first_name = firstName;
    }
  }
  
  if (data.last_name) {
    const lastName = sanitizeString(data.last_name, 100);
    if (lastName.length < 1) {
      errors.push('Last name is required');
    } else if (lastName.length > 100) {
      errors.push('Last name is too long');
    } else {
      sanitized.last_name = lastName;
    }
  }
  
  // Validate username
  if (data.username) {
    const usernameValidation = validateUsername(data.username);
    if (!usernameValidation.valid) {
      errors.push(usernameValidation.error || 'Invalid username');
    } else {
      sanitized.username = data.username.trim();
    }
  }
  
  // Validate phone
  if (data.mobile_phone) {
    if (!validatePhone(data.mobile_phone)) {
      errors.push('Invalid phone number format');
    } else {
      sanitized.mobile_phone = sanitizeString(data.mobile_phone, 20);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    sanitized: errors.length === 0 ? sanitized : undefined,
  };
};

