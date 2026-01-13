import { useState, useEffect, useRef } from "react";
import { Mail, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TwoFactorVerificationProps {
  userId: string;
  email: string;
  onVerified: () => void;
  onCancel: () => void;
}

export const TwoFactorVerification = ({ 
  userId, 
  email, 
  onVerified, 
  onCancel 
}: TwoFactorVerificationProps) => {
  const { t, language } = useLanguage();
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Send code on mount
  useEffect(() => {
    sendCode();
  }, []);

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const sendCode = async () => {
    if (sending || countdown > 0) return;
    
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-2fa-code", {
        body: { userId, email, language }
      });
      console.log("data:", data);
      console.log("error:", error);
      if (error) {
        console.error("2FA send error:", error);
        throw error;
      }

      if (data?.error) {
        console.error("2FA send error from function:", data.error);
        throw new Error(data.error);
      }

      toast.success(t("twoFactorCodeSent"));
      setCountdown(60); // 60 seconds cooldown
    } catch (error: any) {
      console.error("Error sending 2FA code:", error);
      const errorMessage = error?.message || error?.error || t("twoFactorSendError");
      toast.error(errorMessage);
    } finally {
      setSending(false);
    }
  };

  const handleInputChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when complete
    if (value && index === 5) {
      const fullCode = newCode.join("");
      if (fullCode.length === 6) {
        verifyCode(fullCode);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6);
    if (/^\d+$/.test(pastedData)) {
      const newCode = pastedData.split("").concat(Array(6 - pastedData.length).fill(""));
      setCode(newCode.slice(0, 6));
      if (pastedData.length === 6) {
        verifyCode(pastedData);
      }
    }
  };

  const verifyCode = async (fullCode: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("verify-2fa-code", {
        body: { userId, code: fullCode }
      });

      if (error || !data?.valid) {
        toast.error(t("twoFactorInvalidCode"));
        setCode(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
        return;
      }

      toast.success(t("twoFactorVerified"));
      onVerified();
    } catch (error: any) {
      console.error("Error verifying 2FA code:", error);
      toast.error(t("twoFactorVerifyError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-6 p-6 bg-black/40 border border-gold/20 rounded-lg">
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-gold/10 rounded-full">
            <Mail className="w-8 h-8 text-gold" />
          </div>
        </div>
        <h2 className="text-xl font-serif text-gold mb-2">
          {t("twoFactorTitle")}
        </h2>
        <p className="text-sm text-gold/60">
          {t("twoFactorDescription").replace("{email}", email.replace(/(.{3}).*(@.*)/, "$1***$2"))}
        </p>
      </div>

      <div className="flex justify-center gap-2">
        {code.map((digit, index) => (
          <Input
            key={index}
            ref={(el) => (inputRefs.current[index] = el)}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleInputChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            disabled={loading}
            className="w-12 h-14 text-center text-2xl font-bold bg-black border-gold/30 text-gold focus:border-gold"
          />
        ))}
      </div>

      <div className="flex flex-col gap-3">
        <Button
          onClick={() => verifyCode(code.join(""))}
          disabled={loading || code.join("").length !== 6}
          className="w-full bg-gold hover:bg-gold/90 text-black font-medium"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {t("verifying")}
            </>
          ) : (
            t("verify")
          )}
        </Button>

        <Button
          variant="ghost"
          onClick={sendCode}
          disabled={sending || countdown > 0}
          className="w-full text-gold/60 hover:text-gold hover:bg-gold/10"
        >
          {sending ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-2" />
          )}
          {countdown > 0 
            ? `${t("resendCode")} (${countdown}s)` 
            : t("resendCode")
          }
        </Button>

        <Button
          variant="ghost"
          onClick={onCancel}
          className="w-full text-gold/40 hover:text-gold/60 hover:bg-transparent"
        >
          {t("cancel")}
        </Button>
      </div>
    </div>
  );
};