import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Briefcase, Users, User, TrendingUp, Network } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface AccessPermissions {
  business_access: boolean;
  family_access: boolean;
  personal_access: boolean;
  influence_access: boolean;
  network_access: boolean;
}

interface EditConnectionPermissionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  friendName: string;
  currentPermissions: AccessPermissions;
  onSave: (permissions: AccessPermissions) => Promise<void>;
}

export const EditConnectionPermissionsDialog = ({
  open,
  onOpenChange,
  friendName,
  currentPermissions,
  onSave,
}: EditConnectionPermissionsDialogProps) => {
  const { t } = useLanguage();
  const [permissions, setPermissions] = useState<AccessPermissions>(currentPermissions);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setPermissions(currentPermissions);
    }
  }, [open, currentPermissions]);

  const handlePermissionChange = (key: keyof AccessPermissions) => {
    setPermissions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await onSave(permissions);
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving permissions:', error);
    } finally {
      setSaving(false);
    }
  };

  const permissionItems = [
    {
      key: "business_access" as keyof AccessPermissions,
      label: t('business') || "Business",
      description: t('permissionBusinessDesc') || "Accès aux informations professionnelles",
      icon: Briefcase,
    },
    {
      key: "family_access" as keyof AccessPermissions,
      label: t('family') || "Family",
      description: t('permissionFamilyDesc') || "Accès aux informations familiales",
      icon: Users,
    },
    {
      key: "personal_access" as keyof AccessPermissions,
      label: t('personal') || "Personal",
      description: t('permissionPersonalDesc') || "Accès aux informations personnelles",
      icon: User,
    },
    {
      key: "influence_access" as keyof AccessPermissions,
      label: t('influence') || "Influence",
      description: t('permissionInfluenceDesc') || "Accès aux informations d'influence",
      icon: TrendingUp,
    },
    {
      key: "network_access" as keyof AccessPermissions,
      label: t('network') || "Network",
      description: t('permissionNetworkDesc') || "Accès aux informations de réseau",
      icon: Network,
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-background border-gold/20 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-gold">
            {t('editPermissions') || "Modifier les permissions"}
          </DialogTitle>
          <DialogDescription className="text-gold/60">
            {(t('editPermissionsDesc') || 'Choisissez les sections que {name} pourra consulter').replace('{name}', friendName)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {permissionItems.map(({ key, label, description, icon: Icon }) => (
            <div key={key} className="flex items-start space-x-3">
              <Checkbox
                id={key}
                checked={permissions[key]}
                onCheckedChange={() => handlePermissionChange(key)}
                className="mt-1"
              />
              <div className="flex-1">
                <Label
                  htmlFor={key}
                  className="flex items-center gap-2 text-gold cursor-pointer"
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Label>
                <p className="text-sm text-gold/60">{description}</p>
              </div>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-gold/30 text-gold/70 hover:bg-gold/10"
            disabled={saving}
          >
            {t('cancel') || "Annuler"}
          </Button>
          <Button
            onClick={handleSave}
            className="bg-gold/20 hover:bg-gold/30 text-gold border border-gold/40"
            disabled={saving}
          >
            {saving ? (t('saving') || "Enregistrement...") : (t('save') || "Enregistrer")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

