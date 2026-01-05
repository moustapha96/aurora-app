import { useState } from "react";
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
import { Briefcase, Users, User, TrendingUp } from "lucide-react";

interface AccessPermissions {
  business_access: boolean;
  family_access: boolean;
  personal_access: boolean;
  influence_access: boolean;
}

interface AccessPermissionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requesterName: string;
  onConfirm: (permissions: AccessPermissions) => void;
}

export const AccessPermissionsDialog = ({
  open,
  onOpenChange,
  requesterName,
  onConfirm,
}: AccessPermissionsDialogProps) => {
  const [permissions, setPermissions] = useState<AccessPermissions>({
    business_access: true,
    family_access: true,
    personal_access: true,
    influence_access: true,
  });

  const handlePermissionChange = (key: keyof AccessPermissions) => {
    setPermissions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleConfirm = () => {
    onConfirm(permissions);
    onOpenChange(false);
  };

  const permissionItems = [
    {
      key: "business_access" as keyof AccessPermissions,
      label: "Business",
      description: "Accès aux informations professionnelles",
      icon: Briefcase,
    },
    {
      key: "family_access" as keyof AccessPermissions,
      label: "Family",
      description: "Accès aux informations familiales",
      icon: Users,
    },
    {
      key: "personal_access" as keyof AccessPermissions,
      label: "Personal",
      description: "Accès aux informations personnelles",
      icon: User,
    },
    {
      key: "influence_access" as keyof AccessPermissions,
      label: "Influence",
      description: "Accès aux informations d'influence",
      icon: TrendingUp,
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-lg mx-auto max-h-[90vh] overflow-y-auto bg-[#1a1a1a] border border-gold/30 p-4 sm:p-6" data-scroll>
        <DialogHeader>
          <DialogTitle className="text-gold">
            Autoriser l'accès à votre profil
          </DialogTitle>
          <DialogDescription className="text-gold/60">
            Choisissez les sections que {requesterName} pourra consulter
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
          >
            Annuler
          </Button>
          <Button
            onClick={handleConfirm}
            className="bg-gold/20 hover:bg-gold/30 text-gold border border-gold/40"
          >
            Confirmer la connexion
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
