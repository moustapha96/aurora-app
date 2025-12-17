import { AuroraLogo } from "@/components/AuroraLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { useLanguage, languages } from "@/contexts/LanguageContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Globe, Scan, Crown, ArrowLeft } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Upload, Users } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { INDUSTRIES } from "@/lib/industries";
import { RegistrationVerification } from "@/components/RegistrationVerification";

type RegistrationStep = 'form' | 'verification';

const Register = () => {
  const navigate = useNavigate();
  const { language, setLanguage, t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [registrationStep, setRegistrationStep] = useState<RegistrationStep>('form');
  const [verificationImages, setVerificationImages] = useState<{ idImage: string; selfieImage: string } | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>("");
  const [showAssociatedAccountsDialog, setShowAssociatedAccountsDialog] = useState(false);
  const [showAssociatedAccountForm, setShowAssociatedAccountForm] = useState(false);
  const [associatedAccountData, setAssociatedAccountData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    mobile: "",
    relationType: ""
  });
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
        toast.info("Analyse de la carte d'identité en cours...");
        
        try {
          // Convert image to base64
          const reader = new FileReader();
          reader.onloadend = async () => {
            try {
              const base64Image = reader.result as string;
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
                toast.success("Nom et prénom extraits avec succès !");
              } else {
                console.warn('No data extracted');
                toast.warning("Impossible d'extraire les informations. Veuillez les saisir manuellement.");
              }
            } catch (innerError: any) {
              console.error('Inner error:', innerError);
              toast.error(`Erreur: ${innerError.message || 'Erreur inconnue'}`);
            } finally {
              setLoading(false);
            }
          };
          
          reader.onerror = () => {
            console.error('File reader error');
            toast.error("Erreur lors de la lecture du fichier");
            setLoading(false);
          };
          
          reader.readAsDataURL(file);
        } catch (error: any) {
          console.error('Error analyzing ID card:', error);
          toast.error("Erreur lors de l'analyse de la carte. Veuillez réessayer.");
          setLoading(false);
        }
      }
    };
    fileInput.click();
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Store form data and avatar before going to verification
    sessionStorage.setItem('registrationData', JSON.stringify(formData));
    if (avatarFile) {
      sessionStorage.setItem('registrationAvatar', avatarPreview);
    }
    
    // Move to verification step
    setRegistrationStep('verification');
  };

  const handleVerificationComplete = (verificationId: string, status: string) => {
    // Store verification info
    sessionStorage.setItem('verificationId', verificationId);
    sessionStorage.setItem('verificationStatus', status);
    
    toast.success("Vérification d'identité complétée !");
    navigate("/login?mode=complete");
  };

  const handleSkipVerification = () => {
    // Allow registration without verification (limited account)
    sessionStorage.setItem('verificationStatus', 'skipped');
    toast.info("Vous pourrez vérifier votre identité plus tard dans les paramètres.");
    navigate("/login?mode=complete");
  };

  const handleBackToForm = () => {
    setRegistrationStep('form');
  };

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
          <p className="text-gold/60 text-sm tracking-widest">{t('registration')}</p>
        </div>

        {/* Quit Button */}
        <div className="flex justify-between mb-4">
          {registrationStep === 'verification' && (
            <Button
              type="button"
              variant="ghost"
              onClick={handleBackToForm}
              className="text-gold/60 hover:text-gold hover:bg-gold/10"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
          )}
          <div className="flex-1" />
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate("/login")}
            className="text-gold/60 hover:text-gold hover:bg-gold/10"
          >
            ✕ Quitter
          </Button>
        </div>

        {/* Verification Step */}
        {registrationStep === 'verification' && (
          <RegistrationVerification
            onComplete={handleVerificationComplete}
            onSkip={handleSkipVerification}
            firstName={formData.firstName}
            lastName={formData.lastName}
            email={formData.email}
          />
        )}

        {/* Registration Form */}
        {registrationStep === 'form' && (
        <form onSubmit={handleFormSubmit} className="space-y-6 bg-black/40 border border-gold/20 rounded-lg p-8">
          {/* Avatar Upload */}
          <div className="space-y-2">
            <Label className="text-gold/80 text-sm font-serif">{t('profilePhoto')}</Label>
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
              <div className="flex-1 space-y-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  id="avatar-upload"
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('avatar-upload')?.click()}
                  className="w-full border-gold/30 text-gold hover:bg-gold/10"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {avatarFile ? avatarFile.name : t('chooseFile')}
                </Button>
                <p className="text-xs text-gold/60">{t('photoFormatsHint')}</p>
              </div>
            </div>
          </div>

          {/* Referral Code */}
          <div className="space-y-2">
            <Label htmlFor="referralCode" className="text-gold/80 text-sm font-serif">
              {t('referralCode')}
            </Label>
            <Input
               id="referralCode"
               value={formData.referralCode}
               onChange={(e) => setFormData(prev => ({ ...prev, referralCode: e.target.value }))}
               className="bg-black border-gold/30 text-gold placeholder:text-gold/30 focus:border-gold"
               placeholder={t('referralCode')}
             />
          </div>

          {/* ID Scanner */}
          <div className="space-y-2">
            <Label className="text-gold/80 text-sm font-serif">{t('idCard')}</Label>
            <Button
              type="button"
              onClick={handleScanId}
              variant="outline"
              className="w-full border-gold/30 text-gold hover:bg-gold/10"
            >
              <Scan className="w-4 h-4 mr-2" />
              {t('scanId')}
            </Button>
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
              {t('honorificTitle')}
            </Label>
            <Select
              value={formData.honorificTitle}
              onValueChange={(value) => setFormData(prev => ({ ...prev, honorificTitle: value }))}
            >
              <SelectTrigger className="bg-black border-gold/30 text-gold z-40">
                <SelectValue placeholder={t('selectTitle')} />
              </SelectTrigger>
              <SelectContent className="bg-black border-gold/30 z-50 max-h-[400px]">
                <SelectItem value="dr" className="text-gold hover:bg-gold/10">Docteur (Dr.)</SelectItem>
                <SelectItem value="dre" className="text-gold hover:bg-gold/10">Docteure (Dr.)</SelectItem>
                <SelectItem value="prof" className="text-gold hover:bg-gold/10">Professeur</SelectItem>
                <SelectItem value="professeure" className="text-gold hover:bg-gold/10">Professeure</SelectItem>
                <SelectItem value="maitre" className="text-gold hover:bg-gold/10">Maître</SelectItem>
                <SelectItem value="maitresse" className="text-gold hover:bg-gold/10">Maîtresse</SelectItem>
                <SelectItem value="son_excellence_m" className="text-gold hover:bg-gold/10">Son Excellence (masc.)</SelectItem>
                <SelectItem value="son_excellence_f" className="text-gold hover:bg-gold/10">Son Excellence (fém.)</SelectItem>
                <SelectItem value="son_altesse_m" className="text-gold hover:bg-gold/10">Son Altesse (masc.)</SelectItem>
                <SelectItem value="son_altesse_f" className="text-gold hover:bg-gold/10">Son Altesse (fém.)</SelectItem>
                <SelectItem value="son_altesse_royale_m" className="text-gold hover:bg-gold/10">Son Altesse Royale (masc.)</SelectItem>
                <SelectItem value="son_altesse_royale_f" className="text-gold hover:bg-gold/10">Son Altesse Royale (fém.)</SelectItem>
                <SelectItem value="son_altesse_serenissime_m" className="text-gold hover:bg-gold/10">Son Altesse Sérénissime (masc.)</SelectItem>
                <SelectItem value="son_altesse_serenissime_f" className="text-gold hover:bg-gold/10">Son Altesse Sérénissime (fém.)</SelectItem>
                <SelectItem value="sa_majeste_m" className="text-gold hover:bg-gold/10">Sa Majesté (masc.)</SelectItem>
                <SelectItem value="sa_majeste_f" className="text-gold hover:bg-gold/10">Sa Majesté (fém.)</SelectItem>
                <SelectItem value="sa_majeste_imperiale_m" className="text-gold hover:bg-gold/10">Sa Majesté Impériale (masc.)</SelectItem>
                <SelectItem value="sa_majeste_imperiale_f" className="text-gold hover:bg-gold/10">Sa Majesté Impériale (fém.)</SelectItem>
                <SelectItem value="son_eminence_m" className="text-gold hover:bg-gold/10">Son Éminence (masc.)</SelectItem>
                <SelectItem value="son_eminence_f" className="text-gold hover:bg-gold/10">Son Éminence (fém.)</SelectItem>
                <SelectItem value="sa_saintete_m" className="text-gold hover:bg-gold/10">Sa Sainteté (masc.)</SelectItem>
                <SelectItem value="sa_saintete_f" className="text-gold hover:bg-gold/10">Sa Sainteté (fém.)</SelectItem>
                <SelectItem value="prince" className="text-gold hover:bg-gold/10">Prince</SelectItem>
                <SelectItem value="princesse" className="text-gold hover:bg-gold/10">Princesse</SelectItem>
                <SelectItem value="duc" className="text-gold hover:bg-gold/10">Duc</SelectItem>
                <SelectItem value="duchesse" className="text-gold hover:bg-gold/10">Duchesse</SelectItem>
                <SelectItem value="marquis" className="text-gold hover:bg-gold/10">Marquis</SelectItem>
                <SelectItem value="marquise" className="text-gold hover:bg-gold/10">Marquise</SelectItem>
                <SelectItem value="comte" className="text-gold hover:bg-gold/10">Comte</SelectItem>
                <SelectItem value="comtesse" className="text-gold hover:bg-gold/10">Comtesse</SelectItem>
                <SelectItem value="vicomte" className="text-gold hover:bg-gold/10">Vicomte</SelectItem>
                <SelectItem value="vicomtesse" className="text-gold hover:bg-gold/10">Vicomtesse</SelectItem>
                <SelectItem value="baron" className="text-gold hover:bg-gold/10">Baron</SelectItem>
                <SelectItem value="baronne" className="text-gold hover:bg-gold/10">Baronne</SelectItem>
                <SelectItem value="chevalier" className="text-gold hover:bg-gold/10">Chevalier (Sir)</SelectItem>
                <SelectItem value="chevaliere" className="text-gold hover:bg-gold/10">Chevalière (Dame)</SelectItem>
                <SelectItem value="emir" className="text-gold hover:bg-gold/10">Émir</SelectItem>
                <SelectItem value="emira" className="text-gold hover:bg-gold/10">Émira</SelectItem>
                <SelectItem value="sultan" className="text-gold hover:bg-gold/10">Sultan</SelectItem>
                <SelectItem value="sultane" className="text-gold hover:bg-gold/10">Sultane</SelectItem>
                <SelectItem value="cheikh" className="text-gold hover:bg-gold/10">Cheikh (Sheikh)</SelectItem>
                <SelectItem value="cheikha" className="text-gold hover:bg-gold/10">Cheikha (Sheikha)</SelectItem>
                <SelectItem value="moulay" className="text-gold hover:bg-gold/10">Moulay</SelectItem>
                <SelectItem value="lalla" className="text-gold hover:bg-gold/10">Lalla</SelectItem>
                <SelectItem value="sidi" className="text-gold hover:bg-gold/10">Sidi</SelectItem>
                <SelectItem value="empereur_japon" className="text-gold hover:bg-gold/10">Empereur 天皇 (Tennō)</SelectItem>
                <SelectItem value="imperatrice_japon" className="text-gold hover:bg-gold/10">Impératrice 皇后 (Kōgō)</SelectItem>
                <SelectItem value="prince_heritier_japon" className="text-gold hover:bg-gold/10">Prince héritier 皇太子</SelectItem>
                <SelectItem value="princesse_heritiere_japon" className="text-gold hover:bg-gold/10">Princesse héritière</SelectItem>
                <SelectItem value="samourai" className="text-gold hover:bg-gold/10">Samouraï 侍</SelectItem>
                <SelectItem value="shogun" className="text-gold hover:bg-gold/10">Shogun 将軍</SelectItem>
                <SelectItem value="daimyo" className="text-gold hover:bg-gold/10">Daimyo 大名</SelectItem>
                <SelectItem value="tsar" className="text-gold hover:bg-gold/10">Tsar Царь</SelectItem>
                <SelectItem value="tsarine" className="text-gold hover:bg-gold/10">Tsarine Царица</SelectItem>
                <SelectItem value="grand_duc" className="text-gold hover:bg-gold/10">Grand-duc</SelectItem>
                <SelectItem value="grande_duchesse" className="text-gold hover:bg-gold/10">Grande-duchesse</SelectItem>
                <SelectItem value="boyard" className="text-gold hover:bg-gold/10">Boyard Боярин</SelectItem>
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
               placeholder={t('emailPlaceholder')}
               required
             />
          </div>

          {/* Mobile */}
          <div className="space-y-2">
            <Label htmlFor="mobile" className="text-gold/80 text-sm font-serif">
              {t('mobileNumber')}
            </Label>
            <Input
              id="mobile"
              type="tel"
              value={formData.mobile}
              onChange={(e) => setFormData(prev => ({ ...prev, mobile: e.target.value }))}
              className="bg-black border-gold/30 text-gold placeholder:text-gold/30 focus:border-gold"
              placeholder="+33 6 12 34 56 78"
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
               placeholder={t('jobFunctionPlaceholder')}
             />
          </div>

          {/* Activity Domain */}
          <div className="space-y-2">
            <Label htmlFor="activityDomain" className="text-gold/80 text-sm font-serif">
              {t('activityDomain')}
            </Label>
            <Select
              value={formData.activityDomain}
              onValueChange={(value) => setFormData(prev => ({ ...prev, activityDomain: value }))}
            >
              <SelectTrigger className="bg-black border-gold/30 text-gold z-40">
                <SelectValue placeholder={t('selectActivityDomain')} />
              </SelectTrigger>
              <SelectContent className="bg-black border-gold/30 z-50 max-h-[300px]">
                {INDUSTRIES.map((industry) => (
                  <SelectItem 
                    key={industry} 
                    value={industry}
                    className="text-gold hover:bg-gold/10 focus:bg-gold/10"
                  >
                    {industry}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Wealth Level */}
          <div className="space-y-2">
            <Label htmlFor="wealthAmount" className="text-gold/80 text-sm font-serif">
              {t('wealthLevel')}
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
              {t('personalQuote')}
            </Label>
            <Input
               id="personalQuote"
               value={formData.personalQuote}
               onChange={(e) => setFormData(prev => ({ ...prev, personalQuote: e.target.value }))}
               className="bg-black border-gold/30 text-gold placeholder:text-gold/30 focus:border-gold"
               placeholder={t('personalQuotePlaceholder')}
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
                 {t('founderMember')}
               </Label>
            </div>
          </div>

          {/* Associated Accounts */}
          <div 
            className="flex items-center space-x-3 p-4 border border-gold/30 rounded-lg bg-black/40 cursor-pointer hover:bg-black/60 transition-colors"
            onClick={() => setShowAssociatedAccountsDialog(true)}
          >
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-gold" />
              <Label className="text-gold/80 text-sm font-serif cursor-pointer">
                 {t('associatedAccounts')}
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
               {t('acceptTermsPrefix')} {" "}
               <a 
                 href="/terms" 
                 target="_blank"
                 className="underline hover:text-gold"
               >
                 {t('termsAndConditions')}
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
        </form>
        )}
      </div>

      {/* Associated Accounts Dialog */}
      <Dialog open={showAssociatedAccountsDialog} onOpenChange={setShowAssociatedAccountsDialog}>
        <DialogContent className="bg-black border-gold/30 text-gold max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-gold font-serif text-xl">Comptes Associés</DialogTitle>
            <DialogDescription className="text-gold/70 text-sm leading-relaxed pt-4">
              Les personnes associées auront accès à votre section Family et à votre section Conciergerie/marketplace/metavers.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-6">
            <Badge
              variant="outline"
              onClick={() => setShowAssociatedAccountForm(!showAssociatedAccountForm)}
              className="border-gold/50 bg-gold/10 text-gold hover:bg-gold/20 cursor-pointer px-4 py-2 text-sm"
            >
              Création
            </Badge>

            {showAssociatedAccountForm && (
              <div className="space-y-4 p-4 border border-gold/30 rounded-lg bg-black/40">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="associated-firstname" className="text-gold/80">Prénom</Label>
                    <Input
                      id="associated-firstname"
                      value={associatedAccountData.firstName}
                      onChange={(e) => setAssociatedAccountData({ ...associatedAccountData, firstName: e.target.value })}
                      className="bg-black/60 border-gold/30 text-gold"
                    />
                  </div>
                  <div>
                    <Label htmlFor="associated-lastname" className="text-gold/80">Nom</Label>
                    <Input
                      id="associated-lastname"
                      value={associatedAccountData.lastName}
                      onChange={(e) => setAssociatedAccountData({ ...associatedAccountData, lastName: e.target.value })}
                      className="bg-black/60 border-gold/30 text-gold"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="associated-email" className="text-gold/80">Mail de la personne</Label>
                    <Input
                      id="associated-email"
                      type="email"
                      value={associatedAccountData.email}
                      onChange={(e) => setAssociatedAccountData({ ...associatedAccountData, email: e.target.value })}
                      className="bg-black/60 border-gold/30 text-gold"
                    />
                  </div>
                  <div>
                    <Label htmlFor="associated-mobile" className="text-gold/80">Téléphone portable de la personne</Label>
                    <Input
                      id="associated-mobile"
                      type="tel"
                      value={associatedAccountData.mobile}
                      onChange={(e) => setAssociatedAccountData({ ...associatedAccountData, mobile: e.target.value })}
                      className="bg-black/60 border-gold/30 text-gold"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="relation-type" className="text-gold/80">Type de relation</Label>
                  <Select
                    value={associatedAccountData.relationType}
                    onValueChange={(value) => setAssociatedAccountData({ ...associatedAccountData, relationType: value })}
                  >
                    <SelectTrigger id="relation-type" className="bg-black/60 border-gold/30 text-gold">
                      <SelectValue placeholder="Sélectionner..." />
                    </SelectTrigger>
                    <SelectContent className="bg-black border-gold/30">
                      <SelectItem value="spouse" className="text-gold">Époux/Épouse</SelectItem>
                      <SelectItem value="child" className="text-gold">Fils/Fille</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="pt-2">
                  <p className="text-gold/70 text-sm">Envoi d'un lien de rattachement</p>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Register;
