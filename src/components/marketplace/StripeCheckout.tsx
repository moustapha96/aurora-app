import { useState, useEffect } from 'react';
import { loadStripe, Stripe, StripeElementsOptions } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
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

// Initialize Stripe
let stripePromise: Promise<Stripe | null> | null = null;

const getStripe = () => {
  if (!stripePromise) {
    const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
    if (!publishableKey) {
      console.error('VITE_STRIPE_PUBLISHABLE_KEY is not set');
      return null;
    }
    stripePromise = loadStripe(publishableKey);
  }
  return stripePromise;
};

const CheckoutForm = ({ 
  itemId, 
  itemTitle, 
  amount, 
  currency, 
  onSuccess, 
  onClose 
}: {
  itemId: string;
  itemTitle: string;
  amount: number;
  currency: string;
  onSuccess?: () => void;
  onClose: () => void;
}) => {
  const { t } = useLanguage();
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Create Payment Intent
    const createPaymentIntent = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('create-payment-intent', {
          body: {
            itemId,
            amount: Math.round(amount * 100), // Convert to cents
            currency: currency.toLowerCase(),
          },
        });

        if (error) throw error;
        if (data?.clientSecret) {
          setClientSecret(data.clientSecret);
        } else {
          throw new Error('No client secret returned');
        }
      } catch (err: any) {
        console.error('Error creating payment intent:', err);
        setError(err.message || t('paymentError'));
        toast.error(err.message || t('paymentError'));
      }
    };

    if (stripe && elements) {
      createPaymentIntent();
    }
  }, [itemId, amount, currency, stripe, elements, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const { error: submitError } = await elements.submit();
      if (submitError) {
        setError(submitError.message || t('paymentError'));
        setIsProcessing(false);
        return;
      }

      const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/marketplace?payment=success`,
        },
        redirect: 'if_required',
      });

      if (confirmError) {
        setError(confirmError.message || t('paymentError'));
        toast.error(confirmError.message || t('paymentError'));
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        toast.success(t('paymentSuccess'));
        onSuccess?.();
        onClose();
      }
    } catch (err: any) {
      console.error('Payment error:', err);
      setError(err.message || t('paymentError'));
      toast.error(err.message || t('paymentError'));
    } finally {
      setIsProcessing(false);
    }
  };

  if (!clientSecret) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      
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
          disabled={isProcessing}
        >
          {t('cancel')}
        </Button>
        <Button
          type="submit"
          className="flex-1"
          disabled={!stripe || isProcessing}
        >
          {isProcessing ? (
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
    </form>
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
  const stripe = getStripe();

  if (!stripe) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('paymentError')}</DialogTitle>
            <DialogDescription>
              {t('stripeNotConfigured')}
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  const options: StripeElementsOptions = {
    mode: 'payment',
    amount: Math.round(amount * 100),
    currency: currency.toLowerCase(),
    appearance: {
      theme: 'stripe',
    },
  };

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

        <Elements stripe={stripe} options={options}>
          <CheckoutForm
            itemId={itemId}
            itemTitle={itemTitle}
            amount={amount}
            currency={currency}
            onSuccess={onSuccess}
            onClose={() => onOpenChange(false)}
          />
        </Elements>
      </DialogContent>
    </Dialog>
  );
};
