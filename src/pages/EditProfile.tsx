
import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ArrowLeft, Globe, Upload, Users, Loader2, CheckCircle, AlertTriangle, XCircle, User, Shield, ImageIcon, Copy, Camera } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useLanguage, languages } from "@/contexts/LanguageContext";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { INDUSTRIES } from "@/lib/industries";
import { COUNTRIES } from "@/lib/countries";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/Header";
import { PageNavigation } from "@/components/BackButton";
import { useProfileImageVerification } from "@/hooks/useProfileImageVerification";
import { IdentityVerifiedBadge } from "@/components/VerificationBadge";

const EditProfile = () => {
  const navigate = useNavigate();
  const { language, setLanguage, t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const [uploadedAvatarUrl, setUploadedAvatarUrl] = useState<string>("");
  const [profileImageBase64, setProfileImageBase64] = useState<string>(""); // image de profil en base64
  const [imageError, setImageError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [identityVerified, setIdentityVerified] = useState(false);
  const [userEmail, setUserEmail] = useState<string>("");
  const [accountNumber, setAccountNumber] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const ignoreAvatarUpdatedForUrlRef = useRef<string | null>(null);
  const { verificationStatus, verificationResult, verifyImage, resetVerification, isVerifying, canProceed } = useProfileImageVerification();
  const [showAssociatedAccountsDialog, setShowAssociatedAccountsDialog] = useState(false);
  const [showAssociatedAccountForm, setShowAssociatedAccountForm] = useState(false);
  const [associatedAccountData, setAssociatedAccountData] = useState({
    firstName: "",
    lastName: "",
    relationType: ""
  });
  const [initialData, setInitialData] = useState({
    firstName: "",
    lastName: "",
    honorificTitle: "",
    mobilePhone: "",
    jobFunction: "",
    activityDomain: "",
    country: "",
    personalQuote: "",
    wealthAmount: "",
    wealthUnit: "Md",
    wealthCurrency: "EUR",
  });
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    honorificTitle: "",
    mobilePhone: "",
    jobFunction: "",
    activityDomain: "",
    country: "",
    personalQuote: "",
    wealthAmount: "",
    wealthUnit: "Md",
    wealthCurrency: "EUR",
  });

  // Chargement du profil utilisateur
  useEffect(() => {
    loadProfile();
  }, []);

  // Écoute des mises à jour d'avatar
  useEffect(() => {
    const handleAvatarUpdate = async (event: CustomEvent<{ avatarUrl: string; userId: string }>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && user.id === event.detail.userId) {
        const url = event.detail.avatarUrl;
        // If it's a base64 string (from MemberCard), update directly
        if (url.startsWith('data:')) {
          setProfileImageBase64(url);
          setAvatarUrl(url);
          setUploadedAvatarUrl("");
          setImageError(false);
          return;
        }
        try {
          const { cleanAvatarUrl, getSignedAvatarDisplayUrl, getAvatarDisplayUrl } = await import('@/lib/avatarUtils');
          const cleanUrl = cleanAvatarUrl(url);

          if (ignoreAvatarUpdatedForUrlRef.current === cleanUrl) {
            ignoreAvatarUpdatedForUrlRef.current = null;
            return;
          }

          setUploadedAvatarUrl(cleanUrl);
          const signed = await getSignedAvatarDisplayUrl(cleanUrl);
          const avatarUrlWithCache = signed || getAvatarDisplayUrl(cleanUrl) || cleanUrl;
          setAvatarUrl(avatarUrlWithCache);
          setImageError(false);
        } catch (error) {
          const cleanUrl = url.split('?')[0];
          setUploadedAvatarUrl(cleanUrl);
          setAvatarUrl(`${cleanUrl}?t=${Date.now()}`);
        }
      }
    };

    window.addEventListener('avatar-updated', handleAvatarUpdate as EventListener);
    return () => {
      window.removeEventListener('avatar-updated', handleAvatarUpdate as EventListener);
    };
  }, []);

  // Nettoyage des Blob URLs
  useEffect(() => {
    return () => {
      if (avatarUrl && avatarUrl.startsWith('blob:')) {
        URL.revokeObjectURL(avatarUrl);
      }
    };
  }, [avatarUrl]);

  // Chargement du profil
  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login");
        return;
      }

      setUserEmail(user.email || "");

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error) throw error;

      const { data: privateData } = await supabase
        .from('profiles_private')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      let decryptedPrivateData = privateData;
      if (privateData) {
        try {
          const { decryptValue } = await import('@/lib/encryption');
          decryptedPrivateData = {
            ...privateData,
            mobile_phone: privateData.mobile_phone ? await decryptValue(privateData.mobile_phone) : privateData.mobile_phone,
            wealth_amount: privateData.wealth_amount ? await decryptValue(privateData.wealth_amount) : privateData.wealth_amount,
          };
        } catch (e) {
          console.warn('Decryption not available:', e);
        }
      }

      if (data) {
        const profileData = {
          firstName: data.first_name || "",
          lastName: data.last_name || "",
          honorificTitle: data.honorific_title || "",
          mobilePhone: decryptedPrivateData?.mobile_phone || "",
          jobFunction: data.job_function || "",
          activityDomain: data.activity_domain || "",
          country: data.country || "",
          personalQuote: data.personal_quote || "",
          wealthAmount: decryptedPrivateData?.wealth_amount || "",
          wealthUnit: decryptedPrivateData?.wealth_unit || "Md",
          wealthCurrency: decryptedPrivateData?.wealth_currency || "EUR",
        };
        setFormData(profileData);
        setInitialData(profileData);
        // Priorité à la version base64 si elle existe déjà en base
        if ((data as any).profile_image_base64) {
          const base64 = (data as any).profile_image_base64 as string;
          setProfileImageBase64(base64);
          setAvatarUrl(base64);
          setUploadedAvatarUrl("");
        } else {
          let avatarUrlWithCache = "";
          if (data.avatar_url) {
            try {
              const { cleanAvatarUrl, getSignedAvatarDisplayUrl, getAvatarDisplayUrl } = await import('@/lib/avatarUtils');
              const cleanUrl = cleanAvatarUrl(data.avatar_url);
              setUploadedAvatarUrl(cleanUrl);
              const signed = await getSignedAvatarDisplayUrl(cleanUrl);
              avatarUrlWithCache = signed || getAvatarDisplayUrl(cleanUrl) || cleanUrl;
            } catch (error) {
              const cleanUrl = data.avatar_url.split('?')[0];
              setUploadedAvatarUrl(cleanUrl);
              avatarUrlWithCache = `${cleanUrl}?t=${Date.now()}`;
            }
          } else {
            setUploadedAvatarUrl("");
          }
          setAvatarUrl(avatarUrlWithCache);
        }
        setImageError(false);
        setIdentityVerified(data.identity_verified || false);
        setAccountNumber(data.account_number || "");
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error(t('errorLoadingProfile'));
    } finally {
      setLoading(false);
    }
  };

  // Vérification des modifications
  const isFieldModified = (fieldName: keyof typeof formData) => {
    return formData[fieldName] !== initialData[fieldName];
  };

  // Gestion du changement d'avatar (même logique que MemberCard / FamilyCloseMembers)
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (avatarUrl && avatarUrl.startsWith('blob:')) {
      URL.revokeObjectURL(avatarUrl);
    }

    setAvatarFile(file);
    setUploading(true);
    resetVerification();
    setImageError(false);

    const previewUrl = URL.createObjectURL(file);
    setAvatarUrl(previewUrl);

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      const result = await verifyImage(base64);

      const shouldAccept = result === null || result?.isValid || (result?.hasFace && result?.isAppropriate);
      if (shouldAccept) {
        // Compression + redimensionnement via canvas avant sauvegarde en base64
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const img = new Image();

        img.onload = () => {
          canvas.width = 400;
          canvas.height = 400;
          ctx?.drawImage(img, 0, 0, 400, 400);
          const compressedBase64 = canvas.toDataURL("image/jpeg", 0.7);
          setProfileImageBase64(compressedBase64);
          setAvatarUrl(compressedBase64);
          setUploadedAvatarUrl("");
          setUploading(false);
        };

        img.src = base64;
      } else {
        URL.revokeObjectURL(previewUrl);
        if (uploadedAvatarUrl) {
          const { getAvatarDisplayUrl } = await import('@/lib/avatarUtils');
          const restoredUrl = getAvatarDisplayUrl(uploadedAvatarUrl) || uploadedAvatarUrl;
          setAvatarUrl(restoredUrl);
        } else {
          setAvatarUrl("");
        }
        setAvatarFile(null);
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Sauvegarde du profil
  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login");
        return;
      }

      let wealthInBillions = null;
      if (formData.wealthAmount) {
        const amount = parseFloat(formData.wealthAmount);
        const { convertToEuros } = await import("@/lib/currencyConverter");
        wealthInBillions = convertToEuros(amount, formData.wealthCurrency, formData.wealthUnit as "M" | "Md").toString();
      }

      const displayAmount = formData.wealthAmount ? Math.round(parseFloat(formData.wealthAmount)).toString() : "";

      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: formData.firstName,
          last_name: formData.lastName,
          honorific_title: formData.honorificTitle || null,
          job_function: formData.jobFunction || null,
          activity_domain: formData.activityDomain || null,
          country: formData.country || null,
          personal_quote: formData.personalQuote || null,
          // on privilégie désormais le stockage base64 pour la photo de profil
          profile_image_base64: profileImageBase64 || null,
          avatar_url: profileImageBase64 ? null : (uploadedAvatarUrl || null),
        })
        .eq('id', user.id);

      if (error) throw error;

      let encryptedPhone = formData.mobilePhone;
      let encryptedWealth = displayAmount;
      try {
        const { encryptValue } = await import('@/lib/encryption');
        if (formData.mobilePhone) {
          encryptedPhone = await encryptValue(formData.mobilePhone);
        }
        if (displayAmount) {
          encryptedWealth = await encryptValue(displayAmount);
        }
      } catch (e) {
        console.warn('Encryption not available:', e);
      }

      const { error: privateError } = await supabase
        .from('profiles_private')
        .upsert({
          user_id: user.id,
          mobile_phone: encryptedPhone,
          wealth_billions: wealthInBillions,
          wealth_currency: formData.wealthCurrency,
          wealth_unit: formData.wealthUnit,
          wealth_amount: encryptedWealth,
        }, { onConflict: 'user_id' });

      if (privateError) throw privateError;

      toast.success(t('profileUpdated'));
      navigate("/member-card");
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(t('profileUpdateError'));
    } finally {
      setSaving(false);
    }
  };

  // Affichage du chargement
  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-black text-gold p-6 pt-32 sm:pt-36 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-gold/30 border-t-gold rounded-full animate-spin" />
        </div>
      </>
    );
  }

  // JSX principal
  return (
    <>
      <Header />
      <PageNavigation to="/member-card" />
      <div className="min-h-screen bg-black text-gold px-4 sm:px-6 pt-32 sm:pt-36 pb-8 safe-area-all">
        <div className="max-w-2xl mx-auto">
          {/* En-tête */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
            <h1 className="text-xl sm:text-2xl md:text-4xl font-serif text-gold tracking-wide">{t('editProfileTitle')}</h1>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-gold hover:bg-gold/10 border border-gold/20">
                  <Globe className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-black border-gold/20">
                {languages.map((lang) => (
                  <DropdownMenuItem
                    key={lang.code}
                    onClick={() => setLanguage(lang.code)}
                    className={language === lang.code ? "bg-gold/20 text-gold" : "text-gold hover:bg-gold/10"}
                  >
                    <span className="mr-2">{lang.flag}</span>
                    {lang.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Formulaire */}
          <div className="space-y-6 bg-black/50 border border-gold/20 rounded-lg p-4 sm:p-6 md:p-8">
            {/* Upload de l'avatar */}
            <div className="space-y-4">
              <Label className="text-gold/80 text-sm sm:text-base">{t('profilePhoto')}</Label>
              <div className="flex flex-col items-center gap-4">
                
                <div className="relative w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48">
                 
                 
                  <div
                    className="w-full h-full rounded-full border-2 border-gold overflow-hidden cursor-pointer group"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    

                    {avatarUrl && !imageError ? (
                      <img
                        src={avatarUrl}
                        alt={t('avatarPreview')}
                        className="w-full h-full object-cover group-hover:opacity-80 transition-opacity"
                        loading="eager"
                        crossOrigin={avatarUrl.startsWith('http') ? 'anonymous' : undefined}
                        referrerPolicy={avatarUrl.startsWith('http') ? 'no-referrer' : undefined}
                        onError={async () => {
                          if (retryCount < 1 && uploadedAvatarUrl && !uploadedAvatarUrl.startsWith('blob:') && !uploadedAvatarUrl.startsWith('data:')) {
                            try {
                              const { getAvatarDisplayUrl } = await import('@/lib/avatarUtils');
                              const retryUrl = getAvatarDisplayUrl(uploadedAvatarUrl);
                              if (retryUrl) {
                                setRetryCount((prev) => prev + 1);
                                setTimeout(() => setAvatarUrl(retryUrl), 300);
                                return;
                              }
                            } catch (error) {
                              console.error('Erreur retry avatar:', error);
                            }
                          }
                          setImageError(true);
                        }}
                        onLoad={() => {
                          setImageError(false);
                          setRetryCount(0);
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gold/20 to-gold/5 flex items-center justify-center group-hover:from-gold/30 group-hover:to-gold/10 transition-all">
                        <span className="text-4xl sm:text-5xl font-serif text-gold">
                          {formData.firstName?.[0]?.toUpperCase() || formData.lastName?.[0]?.toUpperCase() || 'A'}
                        </span>
                      </div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 rounded-full pointer-events-none">
                      <Camera className="w-8 h-8 sm:w-10 sm:h-10 text-gold" />
                    </div>
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isVerifying || uploading}
                    className="absolute -bottom-1 right-1/2 translate-x-1/2 bg-gold text-black rounded-full p-2 sm:p-2.5 shadow-lg hover:bg-gold/90 transition-colors disabled:opacity-50"
                  >
                    {isVerifying || uploading ? (
                      <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                    ) : (
                      <Camera className="w-4 h-4 sm:w-5 sm:h-5" />
                    )}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png, image/jpeg, image/jpg"
                    capture="environment"
                    onChange={handleAvatarChange}
                    disabled={isVerifying || uploading}
                    className="hidden"
                  />
                </div>
                <div className="w-full space-y-2 text-center max-w-md mx-auto">
                  <p className="text-xs sm:text-sm text-gold/60">{t('photoFormatsHint')}</p>
                  {verificationStatus !== 'idle' && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-center gap-2">
                        {verificationStatus === 'verifying' && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
                        {verificationStatus === 'valid' && <CheckCircle className="w-4 h-4 text-green-500" />}
                        {verificationStatus === 'warning' && <AlertTriangle className="w-4 h-4 text-yellow-500" />}
                        {verificationStatus === 'invalid' && <XCircle className="w-4 h-4 text-red-500" />}
                        <span className="text-xs text-gold/80">
                          {verificationStatus === 'verifying' && t('analysisInProgress')}
                          {verificationStatus === 'valid' && t('photoValidated')}
                          {verificationStatus === 'warning' && t('partialValidation')}
                          {verificationStatus === 'invalid' && t('photoInvalid')}
                        </span>
                      </div>
                      {verificationResult && (
                        <div className="space-y-1">
                          <p className="text-xs text-gold/60">{verificationResult.reason}</p>
                          <div className="flex flex-wrap justify-center gap-1">
                            <Badge variant={verificationResult.hasFace ? "default" : "destructive"} className="text-xs">
                              <User className="w-3 h-3 mr-1" />
                              {verificationResult.hasFace ? t('faceDetected') : t('noFaceDetected')}
                            </Badge>
                            <Badge variant={verificationResult.isAppropriate ? "default" : "destructive"} className="text-xs">
                              <Shield className="w-3 h-3 mr-1" />
                              {verificationResult.isAppropriate ? t('appropriatePhoto') : t('inappropriatePhoto')}
                            </Badge>
                            <Badge variant={verificationResult.qualityOk ? "default" : "secondary"} className="text-xs">
                              <ImageIcon className="w-3 h-3 mr-1" />
                              {verificationResult.qualityOk ? t('qualityOk') : t('lowQuality')}
                            </Badge>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Email (lecture seule) */}
            <div>
              <Label htmlFor="email" className="text-gold/80">{userEmail}</Label>
            </div>

            {/* Champs du formulaire */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName" className="text-gold/80 text-sm sm:text-base">{t('firstName')}</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className={`bg-black/50 border-gold/20 ${
                    isFieldModified('firstName')
                      ? 'bg-[hsl(var(--navy-blue))]/30 border-[hsl(var(--navy-blue-light))]'
                      : 'text-gold'
                  }`}
                />
              </div>
              <div>
                <Label htmlFor="lastName" className="text-gold/80 text-sm sm:text-base">{t('lastName')}</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className={`bg-black/50 border-gold/20 ${
                    isFieldModified('lastName')
                      ? 'bg-[hsl(var(--navy-blue))]/30 border-[hsl(var(--navy-blue-light))]'
                      : 'text-gold'
                  }`}
                />
              </div>
            </div>

            {/* Autres champs (honorificTitle, mobilePhone, jobFunction, etc.) */}
            <div>
              <Label htmlFor="honorificTitle" className="text-gold/80 text-sm sm:text-base">{t('honorificTitleOptional')}</Label>
              <Input
                id="honorificTitle"
                value={formData.honorificTitle}
                onChange={(e) => setFormData({ ...formData, honorificTitle: e.target.value })}
                className={`bg-black/50 border-gold/20 ${
                  isFieldModified('honorificTitle')
                    ? 'bg-[hsl(var(--navy-blue))]/30 border-[hsl(var(--navy-blue-light))]'
                    : 'text-gold'
                }`}
              />
            </div>

            <div>
              <Label htmlFor="mobilePhone" className="text-gold/80 text-sm sm:text-base">{t('mobileNumber')}</Label>
              <Input
                id="mobilePhone"
                value={formData.mobilePhone}
                onChange={(e) => setFormData({ ...formData, mobilePhone: e.target.value })}
                className={`bg-black/50 border-gold/20 ${
                  isFieldModified('mobilePhone')
                    ? 'bg-[hsl(var(--navy-blue))]/30 border-[hsl(var(--navy-blue-light))]'
                    : 'text-gold'
                }`}
              />
            </div>

            <div>
              <Label htmlFor="jobFunction" className="text-gold/80 text-sm sm:text-base">{t('jobFunctionOptional')}</Label>
              <Input
                id="jobFunction"
                value={formData.jobFunction}
                onChange={(e) => setFormData({ ...formData, jobFunction: e.target.value })}
                className={`bg-black/50 border-gold/20 ${
                  isFieldModified('jobFunction')
                    ? 'bg-[hsl(var(--navy-blue))]/30 border-[hsl(var(--navy-blue-light))]'
                    : 'text-gold'
                }`}
              />
            </div>

            <div>
              <Label htmlFor="activityDomain" className="text-gold/80 text-sm sm:text-base">{t('activityDomainOptional')}</Label>
              <Select
                value={formData.activityDomain}
                onValueChange={(value) => setFormData({ ...formData, activityDomain: value })}
              >
                <SelectTrigger className={`bg-black/50 border-gold/20 ${
                  isFieldModified('activityDomain')
                    ? 'bg-[hsl(var(--navy-blue))]/30 border-[hsl(var(--navy-blue-light))] text-gold'
                    : 'text-gold'
                }`}>
                  <SelectValue placeholder={t('selectSector')} />
                </SelectTrigger>
                <SelectContent className="bg-black border-gold/20">
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

            {/* Autres champs (country, wealth, personalQuote) */}
            <div>
              <Label htmlFor="country" className="text-gold/80 text-sm sm:text-base">{t('countryOptional')}</Label>
              <Select
                value={formData.country}
                onValueChange={(value) => setFormData({ ...formData, country: value })}
              >
                <SelectTrigger className={`bg-black/50 border-gold/20 ${
                  isFieldModified('country')
                    ? 'bg-[hsl(var(--navy-blue))]/30 border-[hsl(var(--navy-blue-light))] text-gold'
                    : 'text-gold'
                }`}>
                  <SelectValue placeholder={t('selectCountry')} />
                </SelectTrigger>
                <SelectContent className="bg-black border-gold/20 max-h-[300px]">
                  {COUNTRIES.map((country) => (
                    <SelectItem
                      key={country}
                      value={country}
                      className="text-gold hover:bg-gold/10 focus:bg-gold/10"
                    >
                      {country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-gold/80 mb-2 block text-sm sm:text-base">{t('wealthLevel')}</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder={t('amount')}
                  value={formData.wealthAmount}
                  onChange={(e) => setFormData({ ...formData, wealthAmount: e.target.value })}
                  className={`flex-1 bg-black/50 border-gold/20 ${
                    isFieldModified('wealthAmount')
                      ? 'bg-[hsl(var(--navy-blue))]/30 border-[hsl(var(--navy-blue-light))]'
                      : 'text-gold'
                  }`}
                />
                <Select
                  value={formData.wealthUnit}
                  onValueChange={(value) => setFormData({ ...formData, wealthUnit: value })}
                >
                  <SelectTrigger className="bg-black/50 border-gold/20 text-gold w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-black border-gold/20">
                    <SelectItem value="M" className="text-gold">M (Millions)</SelectItem>
                    <SelectItem value="Md" className="text-gold">Md (Milliards)</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={formData.wealthCurrency}
                  onValueChange={(value) => setFormData({ ...formData, wealthCurrency: value })}
                >
                  <SelectTrigger className="bg-black/50 border-gold/20 text-gold w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-black border-gold/20">
                    <SelectItem value="EUR" className="text-gold">EUR (€)</SelectItem>
                    <SelectItem value="USD" className="text-gold">USD ($)</SelectItem>
                    <SelectItem value="GBP" className="text-gold">GBP (£)</SelectItem>
                    <SelectItem value="CHF" className="text-gold">CHF (Fr)</SelectItem>
                    <SelectItem value="JPY" className="text-gold">JPY (¥)</SelectItem>
                    <SelectItem value="CNY" className="text-gold">CNY (¥)</SelectItem>
                    <SelectItem value="AED" className="text-gold">AED (د.إ)</SelectItem>
                    <SelectItem value="SAR" className="text-gold">SAR (﷼)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="personalQuote" className="text-gold/80 text-sm sm:text-base">{t('personalQuoteOptional')}</Label>
              <Textarea
                id="personalQuote"
                value={formData.personalQuote}
                onChange={(e) => setFormData({ ...formData, personalQuote: e.target.value })}
                className={`bg-black/50 border-gold/20 ${
                  isFieldModified('personalQuote')
                    ? 'bg-[hsl(var(--navy-blue))]/30 border-[hsl(var(--navy-blue-light))]'
                    : 'text-gold'
                }`}
                rows={3}
              />
            </div>

            {/* Boutons d'action */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4">
              <Button
                variant="outline"
                onClick={() => navigate("/member-card")}
                className="w-full sm:flex-1 border-gold/40 text-gold hover:bg-gold/10 text-sm sm:text-base"
              >
                {t('cancel')}
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="w-full sm:flex-1 bg-gold text-black hover:bg-gold/90 text-sm sm:text-base"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t('saving')}
                  </>
                ) : (
                  t('save')
                )}
              </Button>
            </div>
          </div>

          {/* Dialogue des comptes associés */}
          <Dialog open={showAssociatedAccountsDialog} onOpenChange={setShowAssociatedAccountsDialog}>
            <DialogContent className="bg-black border-gold/30 text-gold max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-gold font-serif text-xl">{t('associatedAccounts')}</DialogTitle>
                <DialogDescription className="text-gold/70 text-sm leading-relaxed pt-4">
                  {t('associatedAccountsDesc')}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-6">
                <Badge
                  variant="outline"
                  onClick={() => setShowAssociatedAccountForm(!showAssociatedAccountForm)}
                  className="border-gold/50 bg-gold/10 text-gold hover:bg-gold/20 cursor-pointer px-4 py-2 text-sm">
                  {t('creation')}
                </Badge>
                {showAssociatedAccountForm && (
                  <div className="space-y-4 p-4 border border-gold/30 rounded-lg bg-black/40">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="associated-firstname" className="text-gold/80">{t('firstName')}</Label>
                        <Input
                          id="associated-firstname"
                          value={associatedAccountData.firstName}
                          onChange={(e) => setAssociatedAccountData({ ...associatedAccountData, firstName: e.target.value })}
                          className="bg-black/60 border-gold/30 text-gold"
                        />
                      </div>
                      <div>
                        <Label htmlFor="associated-lastname" className="text-gold/80">{t('lastName')}</Label>
                        <Input
                          id="associated-lastname"
                          value={associatedAccountData.lastName}
                          onChange={(e) => setAssociatedAccountData({ ...associatedAccountData, lastName: e.target.value })}
                          className="bg-black/60 border-gold/30 text-gold"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="relation-type" className="text-gold/80">{t('relationType')}</Label>
                      <Select
                        value={associatedAccountData.relationType}
                        onValueChange={(value) => setAssociatedAccountData({ ...associatedAccountData, relationType: value })}
                      >
                        <SelectTrigger id="relation-type" className="bg-black/60 border-gold/30 text-gold">
                          <SelectValue placeholder={t('select')} />
                        </SelectTrigger>
                        <SelectContent className="bg-black border-gold/30">
                          <SelectItem value="spouse" className="text-gold">{t('spouse')}</SelectItem>
                          <SelectItem value="child" className="text-gold">{t('child')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </>
  );
};

export default EditProfile;
