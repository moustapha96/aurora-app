import { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface ReferralCodeInputProps {
  value: string;
  onChange: (value: string) => void;
  onValidationChange?: (isValid: boolean, referrerName?: string) => void;
  disabled?: boolean;
  className?: string;
  label?: string;
  placeholder?: string;
}

export const ReferralCodeInput = ({
  value,
  onChange,
  onValidationChange,
  disabled = false,
  className,
  label,
  placeholder
}: ReferralCodeInputProps) => {
  const [isValidating, setIsValidating] = useState(false);
  const [validationState, setValidationState] = useState<'idle' | 'valid' | 'invalid'>('idle');
  const [referrerName, setReferrerName] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Validate referral code using SQL function
  const validateReferralCode = useCallback(async (code: string) => {
    try {
      if (!code || code.trim() === '') {
        return {
          success: false,
          error: 'Code de parrainage requis'
        };
      }

      // Use SQL function to validate code (bypasses RLS)
      const { data, error: validationError } = await (supabase.rpc as any)('validate_referral_code', {
        p_referral_code: code.toUpperCase().trim()
      });

      if (validationError) {
        console.error('Validation error:', validationError);
        return {
          success: false,
          error: validationError.message || 'Erreur lors de la validation du code',
          code: code
        };
      }

      if (!data || !data.success) {
        return {
          success: false,
          error: data?.error || 'Code de parrainage invalide',
          code: code
        };
      }

      return {
        success: true,
        referrer_id: data.referrer_id,
        referrer_name: data.referrer_name
      };
    } catch (err: any) {
      console.error('Error validating referral code:', err);
      return {
        success: false,
        error: err.message || 'Erreur lors de la validation du code'
      };
    }
  }, []);

  // Debounce validation
  useEffect(() => {
    if (!value || value.trim() === '') {
      setValidationState('idle');
      setReferrerName('');
      setErrorMessage('');
      onValidationChange?.(false);
      return;
    }

    // Only validate if code has minimum length (AUR-XXX-XXX = 11 chars)
    const trimmedCode = value.trim().toUpperCase();
    if (trimmedCode.length < 3) {
      setValidationState('idle');
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsValidating(true);
      setValidationState('idle');
      
      try {
        const result = await validateReferralCode(trimmedCode);
        
        if (result.success) {
          setValidationState('valid');
          setReferrerName(result.referrer_name || '');
          setErrorMessage('');
          onValidationChange?.(true, result.referrer_name);
        } else {
          setValidationState('invalid');
          setReferrerName('');
          setErrorMessage(result.error || 'Code invalide');
          onValidationChange?.(false);
        }
      } catch (err) {
        setValidationState('invalid');
        setErrorMessage('Erreur lors de la validation');
        onValidationChange?.(false);
      } finally {
        setIsValidating(false);
      }
    }, 800); // 800ms debounce for better UX

    return () => clearTimeout(timeoutId);
  }, [value, validateReferralCode, onValidationChange]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value.toUpperCase();
    // Allow only alphanumeric and hyphens
    newValue = newValue.replace(/[^A-Z0-9-]/g, '');
    // Auto-format: AUR-XXX-XXX
    if (newValue.length > 3 && !newValue.includes('-')) {
      newValue = newValue.slice(0, 3) + '-' + newValue.slice(3);
    }
    if (newValue.length > 7 && newValue.split('-').length === 2) {
      newValue = newValue.slice(0, 7) + '-' + newValue.slice(7);
    }
    // Limit to 12 characters (AUR-XXX-XXX)
    newValue = newValue.slice(0, 12);
    onChange(newValue);
  };

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label className="text-gold/80 text-sm font-serif">
          {label}
        </Label>
      )}
      <div className="relative">
        <Input
          value={value}
          onChange={handleChange}
          disabled={disabled || isValidating}
          placeholder={placeholder || "AUR-XXX-XXX"}
          className={cn(
            "bg-black border-gold/30 text-gold placeholder:text-gold/30 focus:border-gold pr-10",
            validationState === 'valid' && "border-green-500/50 focus:border-green-500",
            validationState === 'invalid' && "border-red-500/50 focus:border-red-500"
          )}
          maxLength={12}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {isValidating ? (
            <Loader2 className="h-4 w-4 text-gold/50 animate-spin" />
          ) : validationState === 'valid' ? (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          ) : validationState === 'invalid' ? (
            <XCircle className="h-4 w-4 text-red-500" />
          ) : null}
        </div>
      </div>
      
      {validationState === 'valid' && referrerName && (
        <div className="flex items-center gap-2 text-sm text-green-500/80">
          <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
          <span>Parrainé par : <strong className="font-semibold">{referrerName}</strong></span>
        </div>
      )}
      
      {validationState === 'invalid' && errorMessage && value.length >= 3 && (
        <div className="flex items-center gap-2 text-sm text-red-500/80">
          <XCircle className="h-4 w-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
};

