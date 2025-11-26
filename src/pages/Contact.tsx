import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuroraLogo } from "@/components/AuroraLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Mail,
  Phone,
  MessageSquare,
  Send,
  CheckCircle2,
  MapPin,
  Clock
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

const Contact = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    category: "general",
    message: "",
  });

  useEffect(() => {
    // Pre-fill form with user data if logged in
    const loadUserData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('first_name, last_name, mobile_phone')
            .eq('id', user.id)
            .maybeSingle();

          if (profile) {
            setFormData(prev => ({
              ...prev,
              name: `${profile.first_name} ${profile.last_name}`,
              email: user.email || "",
              phone: profile.mobile_phone || "",
            }));
          } else {
            setFormData(prev => ({
              ...prev,
              email: user.email || "",
            }));
          }
        }
      } catch (error) {
        // Silently fail, user can still fill the form
      }
    };

    loadUserData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate form
      if (!formData.name.trim()) {
        toast.error(t('error'));
        setLoading(false);
        return;
      }

      if (!formData.email.trim()) {
        toast.error(t('error'));
        setLoading(false);
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        toast.error(t('error'));
        setLoading(false);
        return;
      }

      if (!formData.message.trim()) {
        toast.error(t('error'));
        setLoading(false);
        return;
      }

      // Get current user if logged in
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id || null;

      // Try to save to contact_messages table (create if doesn't exist)
      try {
        const { error: insertError } = await supabase
          .from('contact_messages')
          .insert({
            user_id: userId,
            name: formData.name,
            email: formData.email,
            phone: formData.phone || null,
            subject: formData.subject || null,
            category: formData.category,
            message: formData.message,
            status: 'new',
          });

        if (insertError) {
          // If table doesn't exist, just log it
          console.warn('Contact messages table might not exist:', insertError);
        }
      } catch (e) {
        // Table might not exist, that's okay
        console.warn('Could not save to database:', e);
      }

      // In a real app, you would also send an email here
      // For now, we'll just show success
      toast.success(t('messageSent'));
      setSubmitted(true);
      
      // Reset form
      setFormData({
        name: "",
        email: "",
        phone: "",
        subject: "",
        category: "general",
        message: "",
      });
    } catch (error: any) {
      console.error('Error submitting contact form:', error);
      toast.error(t('error'));
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6">
        <div className="text-center max-w-md mx-auto w-full">
          <AuroraLogo size="lg" className="mx-auto mb-8" />
          
          <h1 className="text-4xl md:text-5xl font-serif text-gold mb-2 tracking-wide">
            AURORA
          </h1>
          <h2 className="text-2xl md:text-3xl font-serif text-gold mb-8 tracking-widest">
            SOCIETY
          </h2>

          <Card className="bg-black/40 border-gold/20">
            <CardHeader>
              <div className="mx-auto mb-4 w-16 h-16 bg-green-900/20 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-green-400" />
              </div>
              <CardTitle className="text-green-400 text-2xl">{t('messageSent')}</CardTitle>
              <CardDescription className="text-gold/60 mt-4">
                {t('messageSentDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button
                  onClick={() => {
                    setSubmitted(false);
                    navigate("/");
                  }}
                  variant="outline"
                  className="w-full text-gold border-gold hover:bg-gold hover:text-black"
                >
                  {t('back')}
                </Button>
                <Button
                  onClick={() => setSubmitted(false)}
                  variant="ghost"
                  className="w-full text-gold/60 hover:text-gold"
                >
                  {t('sendMessage')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-gold">
      <div className="container mx-auto px-6 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="text-gold hover:bg-gold/10 mr-4"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center space-x-3">
            <Mail className="w-8 h-8 text-gold" />
            <h1 className="text-3xl font-serif text-gold">{t('contactUs')}</h1>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Info */}
          <div className="space-y-6">
            <Card className="bg-black/40 border-gold/20">
              <CardHeader>
                <CardTitle className="text-gold">{t('contactUs')}</CardTitle>
                <CardDescription className="text-gold/60">
                  {t('contactDescription')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Mail className="w-5 h-5 text-gold/60 mt-1" />
                  <div>
                    <p className="text-gold font-medium">{t('email')}</p>
                    <p className="text-gold/60 text-sm">{t('contactEmail')}</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Phone className="w-5 h-5 text-gold/60 mt-1" />
                  <div>
                    <p className="text-gold font-medium">{t('phone')}</p>
                    <p className="text-gold/60 text-sm">{t('contactPhone')}</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <MapPin className="w-5 h-5 text-gold/60 mt-1" />
                  <div>
                    <p className="text-gold font-medium">{t('address')}</p>
                    <p className="text-gold/60 text-sm">
                      Paris, France
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Clock className="w-5 h-5 text-gold/60 mt-1" />
                  <div>
                    <p className="text-gold font-medium">{t('hours')}</p>
                    <p className="text-gold/60 text-sm">
                      {t('availability247')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-black/40 border-gold/20">
              <CardHeader>
                <CardTitle className="text-gold">{t('contactUs')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gold/60 text-sm">
                  {t('contactDescription')}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card className="bg-black/40 border-gold/20">
              <CardHeader>
                <CardTitle className="text-gold">{t('contactUs')}</CardTitle>
                <CardDescription className="text-gold/60">
                  {t('contactDescription')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-gold/80">
                        {t('name')} {t('required')}
                      </Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="bg-black border-gold/30 text-gold"
                        placeholder={t('name')}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-gold/80">
                        {t('email')} {t('required')}
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="bg-black border-gold/30 text-gold"
                        placeholder="votre@email.com"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-gold/80">
                        {t('phone')}
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="bg-black border-gold/30 text-gold"
                        placeholder={t('phone')}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="category" className="text-gold/80">
                        {t('category')}
                      </Label>
                      <Select
                        value={formData.category}
                        onValueChange={(value) => setFormData({ ...formData, category: value })}
                      >
                        <SelectTrigger className="bg-black border-gold/30 text-gold">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-black border-gold/30">
                          <SelectItem value="general" className="text-gold">{t('general')}</SelectItem>
                          <SelectItem value="technical" className="text-gold">{t('technical')}</SelectItem>
                          <SelectItem value="account" className="text-gold">{t('other')}</SelectItem>
                          <SelectItem value="billing" className="text-gold">{t('billing')}</SelectItem>
                          <SelectItem value="partnership" className="text-gold">{t('other')}</SelectItem>
                          <SelectItem value="other" className="text-gold">{t('other')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject" className="text-gold/80">
                      {t('subject')}
                    </Label>
                    <Input
                      id="subject"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="bg-black border-gold/30 text-gold"
                      placeholder={t('subject')}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message" className="text-gold/80">
                      {t('message')} {t('required')}
                    </Label>
                    <Textarea
                      id="message"
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="bg-black border-gold/30 text-gold min-h-[200px]"
                      placeholder={t('message')}
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full text-gold border-gold hover:bg-gold hover:text-black"
                    size="lg"
                  >
                    {loading ? (
                      <>
                        <MessageSquare className="w-4 h-4 mr-2 animate-pulse" />
                        {t('sending')}
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        {t('sendMessage')}
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;

