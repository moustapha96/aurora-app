import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Globe, Upload, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useLanguage, languages } from "@/contexts/LanguageContext";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { INDUSTRIES } from "@/lib/industries";
import { COUNTRIES } from "@/lib/countries";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

const EditProfile = () => {
  const navigate = useNavigate();
  const { language, setLanguage } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string>("");
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

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login");
        return;
      }

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
        setAvatarUrl(data.avatar_url || "");
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error("Erreur lors du chargement du profil");
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
          toast.error("Erreur lors de l'upload de l'avatar");
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
          avatar_url: uploadedAvatarUrl || null,
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

      toast.success("Profil mis à jour avec succès");
      navigate("/member-card");
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error("Erreur lors de la mise à jour du profil");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-gold p-6 flex items-center justify-center">
        <p>Chargement...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-gold px-4 sm:px-6 pt-6 pb-8 safe-area-all">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/member-card")}
              className="text-gold/60 hover:text-gold mr-2 sm:mr-4"
            >
              <ArrowLeft className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Retour</span>
            </Button>
            <h1 className="text-xl sm:text-2xl md:text-4xl font-serif text-gold tracking-wide">MODIFIER LE PROFIL</h1>
          </div>
          
          {/* Language Selector */}
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger className="w-full sm:w-[140px] bg-black/50 border-gold/20 text-gold">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

          {/* Associated Accounts */}
          <div 
            className="flex items-center space-x-3 p-4 border border-gold/30 rounded-lg bg-black/40 cursor-pointer hover:bg-black/60 transition-colors"
            onClick={() => setShowAssociatedAccountsDialog(true)}
          >
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-gold" />
              <Label className="text-gold/80 text-sm font-serif cursor-pointer">
                Comptes Associés
              </Label>
            </div>
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
              {saving ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>
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
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default EditProfile;
