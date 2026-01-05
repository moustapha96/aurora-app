import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, Mail, Phone, MessageSquare, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/Header";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { Captcha, useCaptchaConfig } from "@/components/Captcha";

const Contact = () => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const { siteKey, isEnabled } = useCaptchaConfig('contact');
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    subject: "",
    category: "",
    message: "",
    email: "",
    phone: "",
  });

  const categories = [
    { value: "general", label: t('generalQuestion') },
    { value: "technical", label: t('technicalIssue') },
    { value: "account", label: t('accountManagement') },
    { value: "billing", label: t('billing') },
    { value: "partnership", label: t('partnership') },
    { value: "feedback", label: t('suggestionFeedback') },
    { value: "other", label: t('other') },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.subject || !formData.category || !formData.message) {
      toast({
        title: t('requiredFields'),
        description: t('fillAllRequiredFields'),
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Envoyer le message via la fonction edge
      // Le token d'authentification sera automatiquement inclus par Supabase
      const { data, error } = await supabase.functions.invoke('send-contact-email', {
        body: {
          subject: formData.subject,
          category: formData.category,
          message: formData.message,
          email: formData.email,
          phone: formData.phone,
        },
      });

      if (error) throw error;

      toast({
        title: t('messageSent'),
        description: t('messageSentDesc'),
      });

      setFormData({
        subject: "",
        category: "",
        message: "",
        email: "",
        phone: "",
      });
    } catch (error: any) {
      console.error('Error sending contact message:', error);
      toast({
        title: t('error'),
        description: error.message || t('errorSendingMessage'),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Large horizontal banner with phone and email */}
      <div className="w-full bg-primary/10 border-b border-primary/20 pt-20">
        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16">
            <a href="tel:+33123456789" className="flex items-center gap-4 group">
              <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors">
                <Phone className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('phone')}</p>
                <p className="text-xl font-medium text-foreground group-hover:text-primary transition-colors">
                  +33 1 23 45 67 89
                </p>
              </div>
            </a>
            
            <div className="hidden md:block w-px h-16 bg-primary/20" />
            
            <a href="mailto:contact@aurorasociety.ch" className="flex items-center gap-4 group">
              <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('email')}</p>
                <p className="text-xl font-medium text-foreground group-hover:text-primary transition-colors">
                  contact@aurorasociety.ch
                </p>
              </div>
            </a>
          </div>
        </div>
      </div>

      {/* Message form section */}
      <div className="container mx-auto px-4 py-12 max-w-2xl">

        <Card>
          <CardHeader className="text-center pb-8">
            <CardTitle className="text-2xl flex items-center justify-center gap-3">
              <MessageSquare className="h-6 w-6 text-primary" />
              {t('sendUsMessage')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">{t('category')} *</Label>
                  <Select 
                    value={formData.category} 
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger id="category">
                      <SelectValue placeholder={t('selectCategory')} />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="subject">{t('subject')} *</Label>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder={t('subjectPlaceholder')}
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">{t('emailOptional')}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder={t('emailPlaceholderContact')}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">{t('phoneOptional')}</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+33 ..."
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">{t('message')} *</Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder={t('messagePlaceholder')}
                  className="min-h-[150px]"
                />
              </div>

              {isEnabled && siteKey && (
                <div className="mt-4">
                  <Captcha
                    siteKey={siteKey}
                    onVerify={(token) => {
                      setCaptchaToken(token);
                    }}
                    onError={(error) => {
                      toast({
                        title: error || t('captchaError'),
                        variant: "destructive",
                      });
                    }}
                    action="contact"
                  />
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full h-9 sm:h-10 px-2 sm:px-4" 
                disabled={isSubmitting || (isEnabled && siteKey && !captchaToken)}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 sm:mr-2 animate-spin" />
                    <span className="hidden sm:inline">{t('sendingInProgress')}</span>
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">{t('sendMessageBtn')}</span>
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Contact;
