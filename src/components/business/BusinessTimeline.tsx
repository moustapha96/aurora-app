import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Plus, Edit, Trash2, MoreHorizontal } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguage } from "@/contexts/LanguageContext";

interface TimelineEntry {
  id: string;
  year: string;
  title: string;
  company?: string;
  description?: string;
}

interface BusinessTimelineProps {
  entries: TimelineEntry[];
  editable?: boolean;
  onAdd?: (entry: Omit<TimelineEntry, "id">) => void;
  onEdit?: (entry: TimelineEntry) => void;
  onDelete?: (id: string) => void;
}

export const BusinessTimeline: React.FC<BusinessTimelineProps> = ({
  entries,
  editable = true,
  onAdd,
  onEdit,
  onDelete,
}) => {
  const { t } = useLanguage();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimelineEntry | null>(null);
  const [formData, setFormData] = useState({
    year: "",
    title: "",
    company: "",
    description: "",
  });

  const handleOpenDialog = (entry?: TimelineEntry) => {
    if (entry) {
      setEditingEntry(entry);
      setFormData({
        year: entry.year,
        title: entry.title,
        company: entry.company || "",
        description: entry.description || "",
      });
    } else {
      setEditingEntry(null);
      setFormData({ year: "", title: "", company: "", description: "" });
    }
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (editingEntry) {
      onEdit?.({ ...editingEntry, ...formData });
    } else {
      onAdd?.(formData);
    }
    setIsDialogOpen(false);
    setFormData({ year: "", title: "", company: "", description: "" });
    setEditingEntry(null);
  };

  const sortedEntries = [...entries].sort((a, b) => b.year.localeCompare(a.year));

  return (
    <>
      <Card className="border-gold/20 bg-black/50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gold/10">
              <Calendar className="w-5 h-5 text-gold" />
            </div>
            <div>
              <CardTitle className="text-lg font-serif text-gold">{t("businessTimelineCareer")}</CardTitle>
              <p className="text-sm text-gold/60">{t("businessTimelineSubtitle")}</p>
          </div>
          </div>
        </CardHeader>

        <CardContent>
          {sortedEntries.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-gold/50 mb-4">{t("businessNoCareerStep")}</p>
              {editable && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenDialog()}
                  className="border-gold/30 text-gold hover:bg-gold/10"
                >
                  {t("fill")}
                </Button>
              )}
            </div>
          ) : (
            <div className="relative pl-6 border-l border-gold/20 space-y-6">
              {sortedEntries.map((entry) => (
                <div key={entry.id} className="relative group">
                  {/* Dot */}
                  <div className="absolute -left-[25px] w-3 h-3 rounded-full bg-gold/50 border-2 border-gold" />

                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-gold/60 text-sm font-medium">{entry.year}</div>
                      <h4 className="text-gold font-medium">{entry.title}</h4>
                      {entry.company && (
                        <p className="text-gold/70 text-sm">{entry.company}</p>
                      )}
                      {entry.description && (
                        <p className="text-gold/50 text-sm mt-1">{entry.description}</p>
                      )}
                    </div>

                    {editable && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 text-gold/60 hover:text-gold hover:bg-gold/10"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-black border-gold/20">
                          <DropdownMenuItem
                            onClick={() => handleOpenDialog(entry)}
                            className="text-gold hover:bg-gold/10 cursor-pointer"
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            {t("edit")}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onDelete?.(entry.id)}
                            className="text-red-400 hover:bg-red-500/10 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            {t("delete")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-black border-gold/20">
          <DialogHeader>
            <DialogTitle className="text-gold font-serif">
              {editingEntry ? t("businessEditStep") : t("businessAddStep")}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gold">{t("year")}</Label>
                <Input
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                  placeholder="2020"
                  className="bg-black/50 border-gold/30 text-gold placeholder:text-gold/30"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gold">{t("company")}</Label>
                <Input
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  placeholder={t("companyName")}
                  className="bg-black/50 border-gold/30 text-gold placeholder:text-gold/30"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-gold">{t("businessTitlePosition")}</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder={t("businessTitlePlaceholder")}
                className="bg-black/50 border-gold/30 text-gold placeholder:text-gold/30"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gold">{t("descriptionOptional")}</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={t("businessDescribeStep")}
                className="bg-black/50 border-gold/30 text-gold placeholder:text-gold/30"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="border-gold/30 text-gold hover:bg-gold/10"
              >
                {t("cancel")}
              </Button>
              <Button
                onClick={handleSave}
                disabled={!formData.year || !formData.title}
                className="bg-gold text-black hover:bg-gold/90"
              >
                {t("save")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
