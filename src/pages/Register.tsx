import { AuroraLogo } from "@/components/AuroraLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useLanguage, languages } from "@/contexts/LanguageContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Globe, Scan, Crown } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Upload } from "lucide-react";
import { useRegistration } from "@/contexts/RegistrationContext";
import { useSettings } from "@/contexts/SettingsContext";
import { HONORIFIC_TITLES } from "@/lib/honorificTitles";

const Register = () => {
  const navigate = useNavigate();
  const { language, setLanguage, t } = useLanguage();
  const { setRegistrationData, setAvatarPreview: setContextAvatarPreview, setIdCardPreview: setContextIdCardPreview } = useRegistration();
  const { settings, loading: settingsLoading } = useSettings();
  const [loading, setLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>("");
  const [idCardFile, setIdCardFile] = useState<File | null>(null);
  const [idCardPreview, setIdCardPreview] = useState<string>("");
  const [formData, setFormData] = useState({
    referralCode: "",
    firstName: "",
    lastName: "",
    honorificTitle: "",
    email: "",
    mobile: "",
    jobFunction: "",
    activityDomain: "",
    personalQuote: "",
    isFounder: false,
    wealthAmount: "",
    wealthUnit: "M",
    wealthCurrency: "EUR",
  });

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleScanId = () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.onchange = async (e: any) => {
      const file = e.target?.files?.[0];
      if (file) {
        setLoading(true);
        setIdCardFile(file);
        toast.info(t('analyzingIdCard') || t('loading'));
        
        try {
          // Convert image to base64
          const reader = new FileReader();
          reader.onloadend = async () => {
            try {
              const base64Image = reader.result as string;
              
              // Save preview for later upload
              setIdCardPreview(base64Image);
              
              console.log('Calling analyze-id-card function...');
              
              // Call edge function to analyze ID card
              const { data, error } = await supabase.functions.invoke('analyze-id-card', {
                body: { imageBase64: base64Image }
              });

              console.log('Function response:', { data, error });

              if (error) {
                console.error('Function error:', error);
                throw error;
              }

              if (data.firstName || data.lastName) {
                console.log('Extracted data:', data);
                setFormData(prev => ({
                  ...prev,
                  firstName: data.firstName || prev.firstName,
                  lastName: data.lastName || prev.lastName
                }));
                toast.success(t('success'));
              } else {
                console.warn('No data extracted');
                toast.warning(t('error'));
              }
            } catch (innerError: any) {
              console.error('Inner error:', innerError);
              toast.error(t('error'));
            } finally {
              setLoading(false);
            }
          };
          
          reader.onerror = () => {
            console.error('File reader error');
            toast.error(t('error'));
            setLoading(false);
          };
          
          reader.readAsDataURL(file);
        } catch (error: any) {
          console.error('Error analyzing ID card:', error);
          toast.error(t('error'));
          setLoading(false);
        }
      }
    };
    fileInput.click();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if registrations are allowed
    if (!settings.allowRegistrations) {
      toast.error("Les inscriptions sont actuellement désactivées.");
      return;
    }
    
    setLoading(true);

    try {
      // Store avatar in context if present
      if (avatarPreview) {
        setContextAvatarPreview(avatarPreview);
      }
      
      // Store ID card in context if present
      if (idCardPreview) {
        setContextIdCardPreview(idCardPreview);
      }
      
      // Store registration data in context for the next step
      setRegistrationData(formData);
      navigate("/login?mode=complete");
    } catch (error: any) {
      toast.error(t('error'));
    } finally {
      setLoading(false);
    }
  };

  // Show message if registrations are disabled
  if (settingsLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-gold">Chargement...</div>
      </div>
    );
  }

  if (!settings.allowRegistrations) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6 py-12">
        <Card className="bg-[hsl(var(--navy-blue-light))] border-gold/20 max-w-md w-full">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <AuroraLogo />
            </div>
            <CardTitle className="text-gold text-2xl font-serif">
              Inscriptions Désactivées
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gold/80">
              Les inscriptions sont actuellement désactivées.
            </p>
            <p className="text-gold/60 text-sm">
              Veuillez contacter l'administrateur pour plus d'informations.
            </p>
            <Button
              onClick={() => navigate("/login")}
              className="bg-gold text-black hover:bg-gold/80"
            >
              Retour à la connexion
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6 py-12">
      {/* Language Selector */}
      <div className="absolute top-6 right-6">
        <Select value={language} onValueChange={(value) => setLanguage(value as any)}>
          <SelectTrigger className="w-[180px] border-gold/30 bg-black text-gold hover:border-gold z-50">
            <Globe className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-black border-gold/30 z-50">
            {languages.map((lang) => (
              <SelectItem 
                key={lang.code} 
                value={lang.code}
                className="text-gold hover:bg-gold/10 focus:bg-gold/10"
              >
                {lang.flag} {lang.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="w-full max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <AuroraLogo size="md" className="mx-auto mb-6" />
          <h1 className="text-3xl md:text-4xl font-serif text-gold mb-2 tracking-wide">
            AURORA SOCIETY
          </h1>
          <p className="text-gold/60 text-sm tracking-widest">{t('register')?.toUpperCase() || 'INSCRIPTION'}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 bg-black/40 border border-gold/20 rounded-lg p-8">
          {/* Avatar Upload */}
          <div className="space-y-2">
            <Label className="text-gold/80 text-sm font-serif">{t('profilePhoto') || 'Photo de Profil'}</Label>
            <div className="flex items-center gap-4">
              <Avatar className="h-24 w-24">
                {avatarPreview ? (
                  <AvatarImage src={avatarPreview} alt="Avatar preview" />
                ) : (
                  <AvatarFallback className="bg-gold/10 text-gold">
                    <Upload className="w-8 h-8" />
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="flex-1">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="bg-black border-gold/30 text-gold file:text-gold file:border-0 file:bg-gold/10 file:mr-4 file:py-2 file:px-4"
                />
                <p className="text-xs text-gold/60 mt-1">{t('imageFormat') || 'Format JPG, PNG ou GIF recommandé'}</p>
              </div>
            </div>
          </div>

          {/* Referral Code */}
          <div className="space-y-2">
            <Label htmlFor="referralCode" className="text-gold/80 text-sm font-serif">
              {t('referralCode') || 'Code de Parrainage'}
            </Label>
            <Input
              id="referralCode"
              value={formData.referralCode}
              onChange={(e) => setFormData(prev => ({ ...prev, referralCode: e.target.value }))}
              className="bg-black border-gold/30 text-gold placeholder:text-gold/30 focus:border-gold"
              placeholder={t('enterCode') || t('referralCode')}
            />
          </div>

          {/* ID Scanner */}
          <div className="space-y-2">
            <Label className="text-gold/80 text-sm font-serif">{t('idCard') || 'Carte d\'Identité'}</Label>
            <div className="flex items-center gap-4">
              {idCardPreview && (
                <div className="relative">
                  <img 
                    src={idCardPreview} 
                    alt="ID Card preview" 
                    className="h-20 w-32 object-cover rounded border border-gold/30"
                  />
                </div>
              )}
              <Button
                type="button"
                onClick={handleScanId}
                variant="outline"
                className={`flex-1 border-gold/30 text-gold hover:bg-gold/10 ${idCardPreview ? '' : 'w-full'}`}
              >
                <Scan className="w-4 h-4 mr-2" />
                {idCardPreview 
                  ? (t('changeIdCard') || 'Changer la Carte d\'Identité')
                  : (t('scanIdCard') || 'Scanner la Carte d\'Identité')
                }
              </Button>
            </div>
            {idCardPreview && (
              <p className="text-xs text-gold/60">{t('idCardUploaded') || 'Carte d\'identité téléchargée'}</p>
            )}
          </div>

          {/* Name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName" className="text-gold/80 text-sm font-serif">
                {t('firstName')}
              </Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                className="bg-black border-gold/30 text-gold placeholder:text-gold/30 focus:border-gold"
                placeholder={t('firstName')}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName" className="text-gold/80 text-sm font-serif">
                {t('lastName')}
              </Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                className="bg-black border-gold/30 text-gold placeholder:text-gold/30 focus:border-gold"
                placeholder={t('lastName')}
                required
              />
            </div>
          </div>

          {/* Honorific Title */}
          <div className="space-y-2">
            <Label htmlFor="honorificTitle" className="text-gold/80 text-sm font-serif">
              {t('honorificTitle') || 'Titre Honorifique'}
            </Label>
            <Select
              value={formData.honorificTitle}
              onValueChange={(value) => setFormData(prev => ({ ...prev, honorificTitle: value }))}
            >
              <SelectTrigger className="bg-black border-gold/30 text-gold z-40">
                <SelectValue placeholder={t('selectTitle') || 'Sélectionnez votre titre'} />
              </SelectTrigger>
              <SelectContent className="bg-black border-gold/30 z-50 max-h-[300px] overflow-y-auto">
                {HONORIFIC_TITLES.map((titleKey) => (
                  <SelectItem 
                    key={titleKey} 
                    value={titleKey} 
                    className="text-gold hover:bg-gold/10"
                  >
                    {t(`title_${titleKey}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-gold/80 text-sm font-serif">
              {t('email')}
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="bg-black border-gold/30 text-gold placeholder:text-gold/30 focus:border-gold"
              placeholder="votre@email.com"
              required
            />
          </div>

          {/* Mobile */}
          <div className="space-y-2">
            <Label htmlFor="mobile" className="text-gold/80 text-sm font-serif">
              {t('mobilePhone')}
            </Label>
            <Input
              id="mobile"
              type="tel"
              value={formData.mobile}
              onChange={(e) => setFormData(prev => ({ ...prev, mobile: e.target.value }))}
              className="bg-black border-gold/30 text-gold placeholder:text-gold/30 focus:border-gold"
              placeholder={t('phone')}
              required
            />
          </div>

          {/* Job Function */}
          <div className="space-y-2">
            <Label htmlFor="jobFunction" className="text-gold/80 text-sm font-serif">
              {t('jobFunction')}
            </Label>
            <Input
              id="jobFunction"
              value={formData.jobFunction}
              onChange={(e) => setFormData(prev => ({ ...prev, jobFunction: e.target.value }))}
              className="bg-black border-gold/30 text-gold placeholder:text-gold/30 focus:border-gold"
              placeholder={t('jobFunction')}
            />
          </div>

          {/* Activity Domain */}
          <div className="space-y-2">
            <Label htmlFor="activityDomain" className="text-gold/80 text-sm font-serif">
              {t('activityDomain')}
            </Label>
            <Input
              id="activityDomain"
              value={formData.activityDomain}
              onChange={(e) => setFormData(prev => ({ ...prev, activityDomain: e.target.value }))}
              className="bg-black border-gold/30 text-gold placeholder:text-gold/30 focus:border-gold"
              placeholder={t('activityDomain')}
            />
          </div>

          {/* Wealth Level */}
          <div className="space-y-2">
            <Label htmlFor="wealthAmount" className="text-gold/80 text-sm font-serif">
              {t('wealthLevel') || 'Niveau de Patrimoine'}
            </Label>
            <div className="flex gap-2">
              <Input
                id="wealthAmount"
                type="number"
                value={formData.wealthAmount}
                onChange={(e) => setFormData(prev => ({ ...prev, wealthAmount: e.target.value }))}
                className="bg-black border-gold/30 text-gold placeholder:text-gold/30 focus:border-gold flex-1"
                placeholder="100"
              />
              <Select
                value={formData.wealthUnit}
                onValueChange={(value) => setFormData(prev => ({ ...prev, wealthUnit: value }))}
              >
                <SelectTrigger className="bg-black border-gold/30 text-gold w-32 z-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-black border-gold/30 z-50">
                  <SelectItem value="M" className="text-gold hover:bg-gold/10">M (Millions)</SelectItem>
                  <SelectItem value="Md" className="text-gold hover:bg-gold/10">Md (Milliards)</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={formData.wealthCurrency}
                onValueChange={(value) => setFormData(prev => ({ ...prev, wealthCurrency: value }))}
              >
                <SelectTrigger className="bg-black border-gold/30 text-gold w-28 z-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-black border-gold/30 z-50">
                  <SelectItem value="EUR" className="text-gold hover:bg-gold/10">EUR €</SelectItem>
                  <SelectItem value="USD" className="text-gold hover:bg-gold/10">USD $</SelectItem>
                  <SelectItem value="GBP" className="text-gold hover:bg-gold/10">GBP £</SelectItem>
                  <SelectItem value="CHF" className="text-gold hover:bg-gold/10">CHF</SelectItem>
                  <SelectItem value="JPY" className="text-gold hover:bg-gold/10">JPY ¥</SelectItem>
                  <SelectItem value="CNY" className="text-gold hover:bg-gold/10">CNY ¥</SelectItem>
                  <SelectItem value="AED" className="text-gold hover:bg-gold/10">AED</SelectItem>
                  <SelectItem value="SAR" className="text-gold hover:bg-gold/10">SAR</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Personal Quote */}
          <div className="space-y-2">
            <Label htmlFor="personalQuote" className="text-gold/80 text-sm font-serif">
              {t('personalQuote')} ({t('optional')})
            </Label>
            <Input
              id="personalQuote"
              value={formData.personalQuote}
              onChange={(e) => setFormData(prev => ({ ...prev, personalQuote: e.target.value }))}
              className="bg-black border-gold/30 text-gold placeholder:text-gold/30 focus:border-gold"
              placeholder={t('fillLater') || 'À remplir plus tard...'}
            />
          </div>

          {/* Founder Status */}
          <div className="flex items-center space-x-3 p-4 border border-gold/30 rounded-lg bg-black/40">
            <Checkbox
              id="isFounder"
              checked={formData.isFounder}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isFounder: !!checked }))}
              className="border-gold data-[state=checked]:bg-gold data-[state=checked]:text-black"
            />
            <div className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-gold" />
              <Label htmlFor="isFounder" className="text-gold/80 text-sm font-serif cursor-pointer">
                {t('founderMember') || 'Membre Fondateur'}
              </Label>
            </div>
          </div>

          {/* Terms and Conditions */}
          <div className="flex items-center space-x-3 p-4 border border-gold/30 rounded-lg bg-black/40">
            <Checkbox
              id="acceptTerms"
              required
              className="border-gold data-[state=checked]:bg-gold data-[state=checked]:text-black"
            />
            <Label htmlFor="acceptTerms" className="text-gold/80 text-sm font-serif cursor-pointer">
              {t('acceptTerms') || 'J\'accepte les'}{" "}
              <a 
                href="/terms" 
                target="_blank"
                className="underline hover:text-gold"
              >
                {t('terms') || 'Conditions Générales d\'Utilisation'}
              </a>
            </Label>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            variant="outline"
            size="lg"
            disabled={loading}
            className="w-full mt-8 text-gold border-gold hover:bg-gold hover:text-black transition-all duration-300"
          >
            {loading ? t('loading') : t('continue')}
          </Button>

          {/* Login Button */}
          <div className="mt-4 text-center">
            <Button
              type="button"
              variant="link"
              onClick={() => navigate("/login")}
              className="text-gold/60 hover:text-gold text-sm"
            >
              {t('signIn')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
