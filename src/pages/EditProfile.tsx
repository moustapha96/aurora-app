import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Globe, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useLanguage, languages } from "@/contexts/LanguageContext";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { INDUSTRIES } from "@/lib/industries";
import { COUNTRIES } from "@/lib/countries";

const EditProfile = () => {
  const navigate = useNavigate();
  const { language, setLanguage, t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string>("");
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

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login");
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        const profileData = {
          firstName: data.first_name || "",
          lastName: data.last_name || "",
          honorificTitle: data.honorific_title || "",
          mobilePhone: data.mobile_phone || "",
          jobFunction: data.job_function || "",
          activityDomain: data.activity_domain || "",
          country: data.country || "",
          personalQuote: data.personal_quote || "",
          wealthAmount: data.wealth_amount || "",
          wealthUnit: data.wealth_unit || "Md",
          wealthCurrency: data.wealth_currency || "EUR",
        };
        setFormData(profileData);
        setInitialData(profileData);
        setAvatarUrl(data.avatar_url || "");
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error(t('error'));
    } finally {
      setLoading(false);
    }
  };

  const isFieldModified = (fieldName: keyof typeof formData) => {
    return formData[fieldName] !== initialData[fieldName];
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
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

      let uploadedAvatarUrl = avatarUrl;

      // Upload avatar if a new file was selected
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        const filePath = `avatars/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, avatarFile, { upsert: true });

        if (uploadError) {
          console.error('Error uploading avatar:', uploadError);
          toast.error(t('error'));
        } else {
          const { data: urlData } = supabase.storage
            .from('avatars')
            .getPublicUrl(filePath);
          uploadedAvatarUrl = urlData.publicUrl;
        }
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

      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: formData.firstName,
          last_name: formData.lastName,
          honorific_title: formData.honorificTitle || null,
          mobile_phone: formData.mobilePhone,
          job_function: formData.jobFunction || null,
          activity_domain: formData.activityDomain || null,
          country: formData.country || null,
          personal_quote: formData.personalQuote || null,
          wealth_billions: wealthInBillions,
          wealth_currency: formData.wealthCurrency,
          wealth_unit: formData.wealthUnit,
          wealth_amount: displayAmount,
          avatar_url: uploadedAvatarUrl || null,
        })
        .eq('id', user.id);

      if (error) throw error;

      toast.success(t('success'));
      navigate("/member-card");
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(t('error'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-gold p-6 flex items-center justify-center">
        <p>{t('loading')}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-gold p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/member-card")}
              className="text-gold/60 hover:text-gold mr-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
            <h1 className="text-4xl font-serif text-gold tracking-wide">MODIFIER LE PROFIL</h1>
          </div>
          
          {/* Language Selector */}
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger className="w-[140px] bg-black/50 border-gold/20 text-gold">
              <Globe className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-black border-gold/20">
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

        {/* Form */}
        <div className="space-y-6 bg-black/50 border border-gold/20 rounded-lg p-8">
          {/* Avatar Upload */}
          <div className="space-y-2">
            <Label className="text-gold/80">Photo de Profil</Label>
            <div className="flex items-center gap-4">
              <Avatar className="h-24 w-24">
                {avatarUrl ? (
                  <AvatarImage src={avatarUrl} alt="Avatar" />
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
                  className="bg-black/50 border-gold/20 text-gold file:text-gold file:border-0 file:bg-gold/10 file:mr-4 file:py-2 file:px-4"
                />
                <p className="text-xs text-gold/60 mt-1">Format JPG, PNG ou GIF recommandé</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName" className="text-gold/80">Prénom</Label>
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
              <Label htmlFor="lastName" className="text-gold/80">Nom</Label>
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
            <Label htmlFor="honorificTitle" className="text-gold/80">Titre Honorifique (optionnel)</Label>
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
            <Label htmlFor="mobilePhone" className="text-gold/80">Téléphone Mobile</Label>
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
            <Label htmlFor="jobFunction" className="text-gold/80">Fonction (optionnel)</Label>
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
            <Label htmlFor="activityDomain" className="text-gold/80">Secteur d'activité (optionnel)</Label>
            <Select
              value={formData.activityDomain}
              onValueChange={(value) => setFormData({ ...formData, activityDomain: value })}
            >
              <SelectTrigger className={`bg-black/50 border-gold/20 ${
                isFieldModified('activityDomain') 
                  ? 'bg-[hsl(var(--navy-blue))]/30 border-[hsl(var(--navy-blue-light))] text-gold' 
                  : 'text-gold'
              }`}>
                <SelectValue placeholder="Sélectionnez un secteur" />
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
            <Label htmlFor="country" className="text-gold/80">Pays (optionnel)</Label>
            <Select
              value={formData.country}
              onValueChange={(value) => setFormData({ ...formData, country: value })}
            >
              <SelectTrigger className={`bg-black/50 border-gold/20 ${
                isFieldModified('country') 
                  ? 'bg-[hsl(var(--navy-blue))]/30 border-[hsl(var(--navy-blue-light))] text-gold' 
                  : 'text-gold'
              }`}>
                <SelectValue placeholder="Sélectionnez un pays" />
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
            <Label className="text-gold/80 mb-2 block">Niveau de Patrimoine</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Montant"
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
            <Label htmlFor="personalQuote" className="text-gold/80">Citation Personnelle (optionnel)</Label>
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
              className="flex-1 border-gold/40 text-gold hover:bg-gold/10"
            >
              Annuler
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-gold text-black hover:bg-gold/90"
            >
              {saving ? t('loading') : t('save')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditProfile;
