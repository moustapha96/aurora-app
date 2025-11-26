/**
 * Validation de mot de passe
 * Utilise les paramètres de l'application pour valider les mots de passe
 */

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface PasswordSettings {
  minLength: number;
  requireUppercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
}

export const validatePassword = (
  password: string,
  settings?: PasswordSettings
): PasswordValidationResult => {
  const errors: string[] = [];
  
  // Default settings if not provided
  const minLength = settings?.minLength ?? 8;
  const requireUppercase = settings?.requireUppercase ?? true;
  const requireNumbers = settings?.requireNumbers ?? true;
  const requireSpecialChars = settings?.requireSpecialChars ?? true;

  // Minimum length
  if (password.length < minLength) {
    errors.push(`Le mot de passe doit contenir au moins ${minLength} caractères`);
  }

  // Au moins une majuscule (si requis)
  if (requireUppercase && !/[A-Z]/.test(password)) {
    errors.push("Le mot de passe doit contenir au moins une majuscule");
  }

  // Au moins une minuscule (toujours requis)
  if (!/[a-z]/.test(password)) {
    errors.push("Le mot de passe doit contenir au moins une minuscule");
  }

  // Au moins un chiffre (si requis)
  if (requireNumbers && !/[0-9]/.test(password)) {
    errors.push("Le mot de passe doit contenir au moins un chiffre");
  }

  // Au moins un caractère spécial (si requis)
  if (requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push("Le mot de passe doit contenir au moins un caractère spécial (!@#$%^&*...)");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const getPasswordRequirements = (): string[] => {
  return [
    "Au moins 6 caractères",
    "Au moins une majuscule (A-Z)",
    "Au moins une minuscule (a-z)",
    "Au moins un chiffre (0-9)",
    "Au moins un caractère spécial (!@#$%^&*...)",
  ];
};

export const getPasswordStrength = (password: string): "weak" | "medium" | "strong" => {
  const validation = validatePassword(password);
  
  if (validation.isValid) {
    if (password.length >= 12) {
      return "strong";
    }
    return "medium";
  }

  // Compter les critères remplis
  let criteriaMet = 0;
  if (password.length >= 6) criteriaMet++;
  if (/[A-Z]/.test(password)) criteriaMet++;
  if (/[a-z]/.test(password)) criteriaMet++;
  if (/[0-9]/.test(password)) criteriaMet++;
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) criteriaMet++;

  if (criteriaMet <= 2) return "weak";
  if (criteriaMet <= 4) return "medium";
  return "strong";
};

