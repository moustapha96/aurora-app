import React, { useState } from "react";
import { AuroraLogo } from "@/components/AuroraLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Shield, CheckCircle2, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { validatePassword, getPasswordRequirements } from "@/lib/passwordValidator";
import { useLanguage } from "@/contexts/LanguageContext";

const CreateAdmin = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    first_name: "Admin",
    last_name: "User",
    username: "",
    mobile_phone: "+0000000000",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      // Validate form
      if (formData.password !== formData.confirmPassword) {
        toast.error(t('error'));
        setLoading(false);
        return;
      }

      // Validate password strength
      const passwordValidation = validatePassword(formData.password);
      if (!passwordValidation.isValid) {
        toast.error(passwordValidation.errors[0] || t('error'));
        setLoading(false);
        return;
      }

      // Validate email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        toast.error(t('error'));
        setLoading(false);
        return;
      }

      // Call Edge Function to create admin
      const { data, error } = await supabase.functions.invoke('create-admin', {
        body: {
          email: formData.email,
          password: formData.password,
          first_name: formData.first_name,
          last_name: formData.last_name,
          username: formData.username || formData.email.split('@')[0],
          mobile_phone: formData.mobile_phone,
        }
      });

      if (error) {
        console.error('Error creating admin:', error);
        
        // Try to extract detailed error message
        let errorMessage = t('error');
        if (error.message) {
          errorMessage = error.message;
        } else if (error.context?.body) {
          try {
            const errorBody = typeof error.context.body === 'string' 
              ? JSON.parse(error.context.body) 
              : error.context.body;
            if (errorBody.message) {
              errorMessage = errorBody.message;
            } else if (errorBody.errors && Array.isArray(errorBody.errors)) {
              errorMessage = errorBody.errors.join(', ');
            } else if (errorBody.error) {
              errorMessage = errorBody.error;
            }
          } catch (e) {
            // If parsing fails, use default message
          }
        }
        
        toast.error(errorMessage);
        setResult({ error: errorMessage });
        setLoading(false);
        return;
      }

      setResult(data);
      toast.success(t('adminCreated'));
      
      // Reset form
      setFormData({
        email: "",
        password: "",
        confirmPassword: "",
        first_name: "Admin",
        last_name: "User",
        username: "",
        mobile_phone: "+0000000000",
      });
    } catch (error: any) {
      console.error('Error creating admin user:', error);
      const errorMessage = error.message || error.error || t('error');
      toast.error(errorMessage);
      setResult({ error: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-gold">
      <div className="container mx-auto px-6 py-8 max-w-2xl">
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
            <Shield className="w-8 h-8 text-gold" />
            <h1 className="text-3xl font-serif text-gold">{t('createAdmin')}</h1>
          </div>
        </div>

        {/* Warning Card */}
        <Card className="bg-yellow-900/20 border-yellow-600/30 mb-6">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-yellow-400" />
              <CardTitle className="text-yellow-400">{t('error')}</CardTitle>
            </div>
            <CardDescription className="text-yellow-200/80">
              {t('createAdminDescription')}
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Form Card */}
        <Card className="bg-black/40 border-gold/20">
          <CardHeader>
            <CardTitle className="text-gold">{t('createAdmin')}</CardTitle>
            <CardDescription className="text-gold/60">
              {t('createAdminDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name" className="text-gold/80">
                    {t('firstName')}
                  </Label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="bg-black border-gold/30 text-gold"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name" className="text-gold/80">
                    {t('lastName')}
                  </Label>
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className="bg-black border-gold/30 text-gold"
                    required
                  />
                </div>
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
                  placeholder="admin@aurora.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="username" className="text-gold/80">
                  {t('username')}
                </Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="bg-black border-gold/30 text-gold"
                  placeholder={t('username')}
                />
                <p className="text-xs text-gold/40">
                  {t('optional')}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mobile_phone" className="text-gold/80">
                  {t('mobilePhone')}
                </Label>
                <Input
                  id="mobile_phone"
                  value={formData.mobile_phone}
                  onChange={(e) => setFormData({ ...formData, mobile_phone: e.target.value })}
                  className="bg-black border-gold/30 text-gold"
                  placeholder={t('phone')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-gold/80">
                  {t('newPassword')} {t('required')}
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="bg-black border-gold/30 text-gold"
                  placeholder={t('newPassword')}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-gold/80">
                  {t('confirmPassword')} {t('required')}
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="bg-black border-gold/30 text-gold"
                  placeholder={t('confirmPassword')}
                  required
                />
              </div>

              <div className="text-xs text-gold/60 space-y-1">
                <p className="font-medium">{t('required')}</p>
                <ul className="list-disc list-inside space-y-0.5 ml-2">
                  {getPasswordRequirements().map((req, index) => (
                    <li key={index}>{req}</li>
                  ))}
                </ul>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full text-gold border-gold hover:bg-gold hover:text-black"
              >
                {loading ? t('loading') : t('createNewAdmin')}
              </Button>
            </form>

            {/* Result Display */}
            {result && (
              <div className="mt-6 pt-6 border-t border-gold/20">
                {result.error ? (
                  <div className="flex items-start space-x-3 p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
                    <div>
                      <p className="text-red-400 font-medium">{t('error')}</p>
                      <p className="text-red-200/80 text-sm">{result.error}</p>
                    </div>
                  </div>
                ) : result.success ? (
                  <div className="flex items-start space-x-3 p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
                    <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-green-400 font-medium">{t('success')}</p>
                      <p className="text-green-200/80 text-sm mb-2">
                        {t('adminCreated')}
                      </p>
                      <div className="text-green-200/60 text-xs space-y-1">
                        <p><strong>{t('email')}:</strong> {result.email}</p>
                        <p><strong>ID:</strong> {result.userId}</p>
                      </div>
                      <Button
                        onClick={() => navigate("/login")}
                        variant="outline"
                        className="mt-4 text-gold border-gold/30 hover:bg-gold/10"
                      >
                        {t('login')}
                      </Button>
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreateAdmin;

