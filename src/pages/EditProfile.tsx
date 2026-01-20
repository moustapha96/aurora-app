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
  const [uploadedAvatarUrl, setUploadedAvatarUrl] = useState<string>(""); // Store the uploaded URL separately
  const [imageError, setImageError] = useState(false);
  const [identityVerified, setIdentityVerified] = useState(false);
  const [userEmail, setUserEmail] = useState<string>("");
  const [accountNumber, setAccountNumber] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  useEffect(() => {
    loadProfile();
  }, []);

  // Listen for avatar updates from other components
  useEffect(() => {
    const handleAvatarUpdate = async (event: CustomEvent<{ avatarUrl: string; userId: string }>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && user.id === event.detail.userId) {
        try {
          const { cleanAvatarUrl, getAvatarDisplayUrl } = await import('@/lib/avatarUtils');
          const cleanUrl = cleanAvatarUrl(event.detail.avatarUrl);
          
          // Store clean URL
          setUploadedAvatarUrl(cleanUrl);
          
          // Add cache-buster for display only
          const avatarUrlWithCache = getAvatarDisplayUrl(cleanUrl) || cleanUrl;
          setAvatarUrl(avatarUrlWithCache);
          setImageError(false);
        } catch (error) {
          // Fallback if import fails
          const cleanUrl = event.detail.avatarUrl.split('?')[0];
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

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      // Revoke any blob URLs when component unmounts
      if (avatarUrl && avatarUrl.startsWith('blob:')) {
        URL.revokeObjectURL(avatarUrl);
      }
    };
  }, [avatarUrl]);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        navigate("/login");
        return;
      }

      // Store user email (read-only)
      setUserEmail(user.email || "");

      // Load public profile data
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error) throw error;

      // Load private data (phone, wealth)
      const { data: privateData } = await supabase
        .from('profiles_private')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data) {
        const profileData = {
          firstName: data.first_name || "",
          lastName: data.last_name || "",
          honorificTitle: data.honorific_title || "",
          mobilePhone: privateData?.mobile_phone || "",
          jobFunction: data.job_function || "",
          activityDomain: data.activity_domain || "",
          country: data.country || "",
          personalQuote: data.personal_quote || "",
          wealthAmount: privateData?.wealth_amount || "",
          wealthUnit: privateData?.wealth_unit || "Md",
          wealthCurrency: privateData?.wealth_currency || "EUR",
        };
        setFormData(profileData);
        setInitialData(profileData);
        // Clean and store avatar URL using utility
        let avatarUrlWithCache = "";
        if (data.avatar_url) {
          try {
            const { cleanAvatarUrl, getAvatarDisplayUrl } = await import('@/lib/avatarUtils');
            const cleanUrl = cleanAvatarUrl(data.avatar_url);
            setUploadedAvatarUrl(cleanUrl);
            avatarUrlWithCache = getAvatarDisplayUrl(cleanUrl) || cleanUrl;
          } catch (error) {
            // Fallback
            console.warn('Error processing avatar URL:', error);
            const cleanUrl = data.avatar_url.split('?')[0];
            setUploadedAvatarUrl(cleanUrl);
            avatarUrlWithCache = `${cleanUrl}?t=${Date.now()}`;
          }
        } else {
          setUploadedAvatarUrl("");
        }
        setAvatarUrl(avatarUrlWithCache);
        setImageError(false); // Reset error state when loading new profile
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

  const isFieldModified = (fieldName: keyof typeof formData) => {
    return formData[fieldName] !== initialData[fieldName];
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Revoke previous blob URL if it exists
    if (avatarUrl && avatarUrl.startsWith('blob:')) {
      URL.revokeObjectURL(avatarUrl);
    }

    setAvatarFile(file);
    setUploading(true);
    resetVerification();
    
    // Create object URL for preview (not base64 to avoid saving it accidentally)
    const previewUrl = URL.createObjectURL(file);
    setAvatarUrl(previewUrl);
    
    // Read as base64 ONLY for verification API
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      
      // Trigger verification with base64
      const result = await verifyImage(base64);
      
      // If verification passed or warning, immediately upload and update profile
      if (result?.isValid || (result?.hasFace && result?.isAppropriate) || canProceed) {
        await uploadAndUpdateAvatar(file);
      } else if (result === null) {
        // Verification service unavailable - allow user to proceed but don't auto-upload
        // User can still save manually
        setUploading(false);
        // Keep preview URL so user can see the image and save it manually
      } else {
        // Verification failed - revoke preview and reset
        URL.revokeObjectURL(previewUrl);
        setAvatarUrl(uploadedAvatarUrl ? `${uploadedAvatarUrl}?t=${Date.now()}` : "");
        setAvatarFile(null);
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const uploadAndUpdateAvatar = async (file: File) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setUploading(false);
        return;
      }

      const { uploadAvatar, dispatchAvatarUpdate, getAvatarDisplayUrl } = await import('@/lib/avatarUtils');
      
      const cleanAvatarUrl = await uploadAvatar(user.id, file);
      
      if (!cleanAvatarUrl) {
        toast.error(t('avatarUploadError'));
        setUploading(false);
        return;
      }

      // Update profile in database immediately with clean URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: cleanAvatarUrl })
        .eq('id', user.id);

      if (updateError) {
        console.error('Error updating avatar:', updateError);
        toast.error(t('profileUpdateError'));
        setUploading(false);
        return;
      }

      // Store the uploaded URL
      setUploadedAvatarUrl(cleanAvatarUrl);
      
      // Add cache-buster for display
      const displayAvatarUrl = getAvatarDisplayUrl(cleanAvatarUrl) || cleanAvatarUrl;
      setAvatarUrl(displayAvatarUrl);
      setImageError(false);
      
      // Revoke the preview object URL if it exists
      if (avatarUrl.startsWith('blob:')) {
        URL.revokeObjectURL(avatarUrl);
      }
      
      setAvatarFile(null);
      
      // Dispatch custom event for real-time sync
      dispatchAvatarUpdate(cleanAvatarUrl, user.id);
      
      toast.success(t('profilePhotoUpdated'));
      setUploading(false);
    } catch (error) {
      console.error('Error in uploadAndUpdateAvatar:', error);
      toast.error(t('photoUpdateError'));
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login");
        return;
      }

      let finalAvatarUrl = uploadedAvatarUrl; // Use the already uploaded URL if available

      // Upload avatar if a new file was selected and not already uploaded
      if (avatarFile) {
        const { uploadAvatar, getAvatarDisplayUrl } = await import('@/lib/avatarUtils');
        
        finalAvatarUrl = await uploadAvatar(user.id, avatarFile);
        
        if (!finalAvatarUrl) {
          toast.error(t('avatarUploadError'));
          setSaving(false);
          return;
        }
        
        setUploadedAvatarUrl(finalAvatarUrl);
        
        // Revoke preview object URL if it exists
        if (avatarUrl.startsWith('blob:')) {
          URL.revokeObjectURL(avatarUrl);
        }
        
        // Update display URL with cache-buster
        const displayAvatarUrl = getAvatarDisplayUrl(finalAvatarUrl) || finalAvatarUrl;
        setAvatarUrl(displayAvatarUrl);
        setImageError(false);
        setAvatarFile(null);
      }

      // Calculate wealth in billions of euros
      let wealthInBillions = null;
      if (formData.wealthAmount) {
        const amount = parseFloat(formData.wealthAmount);
        const { convertToEuros } = await import("@/lib/currencyConverter");
        wealthInBillions = convertToEuros(amount, formData.wealthCurrency, formData.wealthUnit as "M" | "Md").toString();
      }

      // Round wealth amount to remove decimals for display
      const displayAmount = formData.wealthAmount ? Math.round(parseFloat(formData.wealthAmount)).toString() : "";

      // Update public profile data
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
          avatar_url: finalAvatarUrl || null,
        })
        .eq('id', user.id);

      if (error) throw error;

      // Update private data (phone, wealth)
      const { error: privateError } = await supabase
        .from('profiles_private')
        .upsert({
          user_id: user.id,
          mobile_phone: formData.mobilePhone,
          wealth_billions: wealthInBillions,
          wealth_currency: formData.wealthCurrency,
          wealth_unit: formData.wealthUnit,
          wealth_amount: displayAmount,
        }, { onConflict: 'user_id' });

      if (privateError) throw privateError;
      // Update avatar URL with cache-buster for display if we have a final URL
      if (finalAvatarUrl) {
        const displayAvatarUrl = `${finalAvatarUrl}?t=${Date.now()}`;
        setAvatarUrl(displayAvatarUrl);
        setUploadedAvatarUrl(finalAvatarUrl);
        
        // Dispatch avatar update event
        // Send clean URL so other components can add their own cache-buster
        window.dispatchEvent(new CustomEvent('avatar-updated', { 
          detail: { avatarUrl: finalAvatarUrl, userId: user.id } 
        }));
      }
      toast.success(t('profileUpdated'));
      navigate("/member-card");
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(t('profileUpdateError'));
    } finally {
      setSaving(false);
    }
  };

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

  return (
    <>
      <Header />
      <PageNavigation to="/member-card" />
      <div className="min-h-screen bg-black text-gold px-4 sm:px-6 pt-32 sm:pt-36 pb-8 safe-area-all">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
            <h1 className="text-xl sm:text-2xl md:text-4xl font-serif text-gold tracking-wide">{t('editProfileTitle')}</h1>
          
          {/* Language Selector */}
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

        {/* Form */}
        <div className="space-y-6 bg-black/50 border border-gold/20 rounded-lg p-8">
          {/* Avatar Upload */}
          <div className="space-y-4">
            <Label className="text-gold/80">{t('profilePhoto')}</Label>
            <div className="flex flex-col items-center gap-4">
              <div className="relative w-32 h-32 sm:w-40 sm:h-40">
                <div
                  className="w-full h-full rounded-full border-2 border-gold overflow-hidden cursor-pointer group"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {avatarUrl && !imageError ? (
                    <img
                      src={avatarUrl}
                      alt={t('avatarPreview')}
                      className="w-full h-full object-cover group-hover:opacity-80 transition-opacity"
                      onError={() => {
                        // Marquer l'erreur mais ne pas supprimer l'URL immédiatement
                        // Cela permet de réessayer si l'URL change
                        setImageError(true);
                      }}
                      onLoad={() => {
                        // Réinitialiser l'erreur si l'image charge avec succès
                        setImageError(false);
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

                {/* Camera Button - Always visible */}
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

                {/* Identity Verified Badge - Bottom right */}
                {/* <IdentityVerifiedBadge 
                  isVerified={identityVerified} 
                  className="absolute -bottom-1 -right-1"
                /> */}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleAvatarChange}
                  disabled={isVerifying || uploading}
                  className="hidden"
                />
              </div>

              <div className="w-full space-y-2 text-center">
                <p className="text-xs text-gold/60">{t('photoFormatsHint')}</p>
                
                {/* Verification Status */}
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

          {/* Email - Read Only */}
          <div>
            <Label htmlFor="email" className="text-gold/80">{ userEmail} </Label>
            {/* <Input
              id="email"
              value={userEmail}
              disabled
              readOnly
              className="bg-black/30 border-gold/10 text-gold/60 cursor-not-allowed"
            />
            <p className="text-xs text-gold/40 mt-1">{t('emailCannotBeChanged')}</p> */}
          </div>

          {/* Account Number - Read Only with Copy */}
          {/* {accountNumber && (
            <div>
              <Label htmlFor="accountNumber" className="text-gold/80">{t('accountNumber')}</Label>
              <div className="relative">
                <Input
                  id="accountNumber"
                  value={accountNumber}
                  disabled
                  readOnly
                  className="bg-black/30 border-gold/10 text-gold/60 cursor-not-allowed font-mono tracking-wider pr-10"
                />
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(accountNumber);
                    toast.success(t('accountNumberCopied'));
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded hover:bg-gold/10 transition-colors"
                  title={t('clickToCopy')}
                >
                  <Copy className="w-4 h-4 text-gold/60 hover:text-gold" />
                </button>
              </div>
              <p className="text-xs text-gold/40 mt-1">{t('accountNumberCannotBeChanged')}</p>
            </div>
          )} */}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName" className="text-gold/80">{t('firstName')}</Label>
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
              <Label htmlFor="lastName" className="text-gold/80">{t('lastName')}</Label>
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

          <div>
            <Label htmlFor="honorificTitle" className="text-gold/80">{t('honorificTitleOptional')}</Label>
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
            <Label htmlFor="mobilePhone" className="text-gold/80">{t('mobileNumber')}</Label>
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
            <Label htmlFor="jobFunction" className="text-gold/80">{t('jobFunctionOptional')}</Label>
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
            <Label htmlFor="activityDomain" className="text-gold/80">{t('activityDomainOptional')}</Label>
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

          <div>
            <Label htmlFor="country" className="text-gold/80">{t('countryOptional')}</Label>
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
            <Label className="text-gold/80 mb-2 block">{t('wealthLevel')}</Label>
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
            <Label htmlFor="personalQuote" className="text-gold/80">{t('personalQuoteOptional')}</Label>
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


          <div className="flex gap-4 pt-4">
            <Button
              variant="outline"
              onClick={() => navigate("/member-card")}
              className="flex-1 border-gold/40 text-gold hover:bg-gold/10">
              {t('cancel')}
              
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-gold text-black hover:bg-gold/90"
            >
              {saving ? t('saving') : t('save')}
            </Button>
          </div>
        </div>

        {/* Associated Accounts Dialog */}
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
