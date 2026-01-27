import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

interface StripeCheckoutProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemId: string;
  itemTitle: string;
  amount: number;
  currency: string;
  onSuccess?: () => void;
}

const CheckoutContent = ({ 
  itemId, 
  itemTitle, 
  amount, 
  currency, 
  onClose 
}: {
  itemId: string;
  itemTitle: string;
  amount: number;
  currency: string;
  onClose: () => void;
}) => {
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: invokeError } = await supabase.functions.invoke('create-payment-intent', {
        body: {
          itemId,
          amount: amount,
          currency: currency,
        },
      });

      if (invokeError) {
        console.error('Function error:', invokeError);
        
        let errorMessage = t('paymentError');
        if (data?.message) {
          errorMessage = data.message;
        } else if (invokeError.message) {
          errorMessage = invokeError.message;
        } else if (data?.error) {
          errorMessage = data.error;
        }
        
        if (data?.code) {
          errorMessage += ` (${data.code})`;
        }
        
        setError(errorMessage);
        toast.error(errorMessage, {
          description: data?.code ? `Code d'erreur: ${data.code}` : undefined,
          duration: 5000,
        });
        setIsLoading(false);
        return;
      }

      if (data?.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      } else {
        const errorMessage = data?.message || t('paymentError');
        setError(errorMessage);
        toast.error(errorMessage);
        setIsLoading(false);
      }
    } catch (err: any) {
      console.error('Error creating checkout session:', err);
      const errorMessage = err.message || err.toString() || t('paymentError');
      setError(errorMessage);
      toast.error(errorMessage, {
        description: 'Une erreur inattendue s\'est produite',
        duration: 5000,
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-center space-y-2">
        <p className="text-sm text-muted-foreground">
          {t('redirectingToPayment') || 'Vous allez être redirigé vers la page de paiement sécurisée Stripe'}
        </p>
        <p className="text-lg font-semibold">
          {new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: currency,
          }).format(amount)}
        </p>
      </div>

      {error && (
        <div className="text-sm text-destructive bg-destructive/10 p-3 rounded">
          {error}
        </div>
      )}

      <div className="flex gap-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          className="flex-1"
          disabled={isLoading}
        >
          {t('cancel')}
        </Button>
        <Button
          type="button"
          onClick={handleCheckout}
          className="flex-1"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {t('processing')}
            </>
          ) : (
            `${t('pay')} ${new Intl.NumberFormat('fr-FR', {
              style: 'currency',
              currency: currency,
            }).format(amount)}`
          )}
        </Button>
      </div>
    </div>
  );
};

export const StripeCheckout = ({
  open,
  onOpenChange,
  itemId,
  itemTitle,
  amount,
  currency,
  onSuccess,
}: StripeCheckoutProps) => {
  const { t } = useLanguage();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-[500px] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg">
            {t('checkout')} - {itemTitle}
          </DialogTitle>
          <DialogDescription className="text-sm">
            {t('completePayment')}
          </DialogDescription>
        </DialogHeader>

        <CheckoutContent
          itemId={itemId}
          itemTitle={itemTitle}
          amount={amount}
          currency={currency}
          onClose={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
};
