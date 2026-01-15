import React, { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  FolderKanban, Upload, X, Loader2, Plus, Trash2, ChevronLeft, ChevronRight, Edit2, Check 
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

interface Project {
  id: string;
  title: string;
  description?: string;
  status?: string;
  image_url?: string;
  images?: string[];
  display_order?: number;
}

interface BusinessProjectsGalleryProps {
  projects: Project[];
  editable?: boolean;
  onAdd: (project: Partial<Project>) => Promise<void>;
  onEdit: (project: Project) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const MAX_IMAGES = 10;
const MAX_SIZE_MB = 2;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

export const BusinessProjectsGallery: React.FC<BusinessProjectsGalleryProps> = ({
  projects,
  editable = true,
  onAdd,
  onEdit,
  onDelete,
}) => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [formData, setFormData] = useState({ title: "", description: "", status: "ongoing" });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const compressImage = async (file: File): Promise<File> => {
    return new Promise((resolve) => {
      if (!file.type.startsWith("image/")) {
        resolve(file);
        return;
      }

      const img = new Image();
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      img.onload = () => {
        let { width, height } = img;
        const maxDim = 1600;
        
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = (height * maxDim) / width;
            width = maxDim;
          } else {
            width = (width * maxDim) / height;
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(new File([blob], file.name, { type: "image/jpeg", lastModified: Date.now() }));
            } else {
              resolve(file);
            }
          },
          "image/jpeg",
          0.85
        );
      };

      img.onerror = () => resolve(file);
      img.src = URL.createObjectURL(file);
    });
  };

  const handleOpenProject = (project: Project) => {
    setSelectedProject(project);
    setFormData({ 
      title: project.title, 
      description: project.description || "", 
      status: project.status || "ongoing" 
    });
    setCurrentImageIndex(0);
    setEditMode(false);
    setIsAdding(false);
    setIsDialogOpen(true);
  };

  const handleAddNew = () => {
    setSelectedProject(null);
    setFormData({ title: "", description: "", status: "ongoing" });
    setIsAdding(true);
    setEditMode(true);
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast({ title: t("error"), description: t("businessProjectTitleRequired"), variant: "destructive" });
      return;
    }

    try {
      if (isAdding) {
        await onAdd(formData);
        toast({ title: t("businessProjectAdded") });
      } else if (selectedProject) {
        await onEdit({ ...selectedProject, ...formData });
        toast({ title: t("businessProjectUpdated") });
      }
      setIsDialogOpen(false);
    } catch (error) {
      toast({ title: t("error"), variant: "destructive" });
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !selectedProject) return;

    const currentImages = selectedProject.images || [];
    const remainingSlots = MAX_IMAGES - currentImages.length;

    if (remainingSlots <= 0) {
      toast({
        title: t("error"),
        description: t("businessMaxImagesReached").replace("{max}", MAX_IMAGES.toString()),
        variant: "destructive",
      });
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remainingSlots);
    
    // Validate sizes
    for (const file of filesToUpload) {
      if (file.size > MAX_SIZE_BYTES) {
        toast({
          title: t("error"),
          description: t("businessImageTooLarge").replace("{size}", MAX_SIZE_MB.toString()),
          variant: "destructive",
        });
        return;
      }
    }

    setIsUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error(t("notAuthenticated"));

      const uploadedUrls: string[] = [];

      for (const file of filesToUpload) {
        const compressedFile = await compressImage(file);
        const filePath = `${user.id}/business/projects/${selectedProject.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;

        const { error: uploadError } = await supabase.storage
          .from("personal-content")
          .upload(filePath, compressedFile, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("personal-content")
          .getPublicUrl(filePath);

        uploadedUrls.push(publicUrl);
      }

      const newImages = [...currentImages, ...uploadedUrls];
      const updatedProject = { ...selectedProject, images: newImages };
      
      await onEdit(updatedProject);
      setSelectedProject(updatedProject);
      
      toast({ title: t("businessImagesUploaded") });
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: t("error"),
        description: error.message || t("uploadError"),
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveImage = async (index: number) => {
    if (!selectedProject) return;

    const images = [...(selectedProject.images || [])];
    images.splice(index, 1);
    
    const updatedProject = { ...selectedProject, images };
    await onEdit(updatedProject);
    setSelectedProject(updatedProject);
    
    if (currentImageIndex >= images.length && images.length > 0) {
      setCurrentImageIndex(images.length - 1);
    }
    
    toast({ title: t("businessImageRemoved") });
  };

  const handleDeleteProject = async () => {
    if (!selectedProject) return;
    
    if (window.confirm(t("businessConfirmDeleteProject"))) {
      await onDelete(selectedProject.id);
      setIsDialogOpen(false);
      toast({ title: t("businessProjectDeleted") });
    }
  };

  const allImages = selectedProject ? [selectedProject.image_url, ...(selectedProject.images || [])].filter(Boolean) as string[] : [];

  return (
    <>
      <Card className="module-card rounded-xl">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-gradient-to-br from-gold/20 to-gold/5 border border-gold/20">
              <FolderKanban className="w-5 h-5 text-gold" />
            </div>
            <div>
              <CardTitle className="text-lg font-serif text-gold">{t("businessProjects")}</CardTitle>
              <p className="text-sm text-gold/60">{t("businessProjectsSubtitle")}</p>
            </div>
          </div>
          {editable && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddNew}
              className="border-gold/30 text-gold hover:bg-gold/10"
            >
              <Plus className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">{t("add")}</span>
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {projects.length === 0 ? (
            <p className="text-gold/50 text-sm italic">{t("businessNoProjects")}</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {projects.map((project) => {
                const thumbnail = project.image_url || project.images?.[0];
                return (
                  <button
                    key={project.id}
                    onClick={() => handleOpenProject(project)}
                    className="relative group aspect-square rounded-lg overflow-hidden border border-gold/20 bg-black/50 hover:border-gold/50 transition-all"
                  >
                    {thumbnail ? (
                      <img src={thumbnail} alt={project.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gold/5">
                        <FolderKanban className="w-8 h-8 text-gold/30" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-2">
                      <span className="text-white text-xs font-medium truncate w-full">{project.title}</span>
                    </div>
                    {project.images && project.images.length > 0 && (
                      <div className="absolute top-1 right-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                        +{project.images.length}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-background border-gold/20">
          <DialogHeader>
            <DialogTitle className="text-xl font-serif text-gold flex items-center justify-between">
              <span>{isAdding ? t("businessAddProject") : formData.title}</span>
              {editable && !isAdding && (
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditMode(!editMode)}
                    className="text-gold/60 hover:text-gold"
                  >
                    {editMode ? <Check className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDeleteProject}
                    className="text-red-500/60 hover:text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Image Gallery */}
            {!isAdding && allImages.length > 0 && (
              <div className="relative">
                <div className="aspect-video rounded-lg overflow-hidden bg-black">
                  <img
                    src={allImages[currentImageIndex]}
                    alt={formData.title}
                    className="w-full h-full object-contain"
                  />
                </div>
                
                {allImages.length > 1 && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setCurrentImageIndex((i) => (i - 1 + allImages.length) % allImages.length)}
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setCurrentImageIndex((i) => (i + 1) % allImages.length)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </Button>
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                      {currentImageIndex + 1} / {allImages.length}
                    </div>
                  </>
                )}

                {editable && currentImageIndex > 0 && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleRemoveImage(currentImageIndex - 1)}
                    className="absolute top-2 right-2 bg-red-600/80 hover:bg-red-600 text-white border-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            )}

            {/* Thumbnails */}
            {!isAdding && allImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {allImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={`flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 transition-all ${
                      idx === currentImageIndex ? "border-gold" : "border-transparent opacity-60 hover:opacity-100"
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Upload Button */}
            {editable && !isAdding && selectedProject && (
              <div className="flex items-center gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleImageUpload}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading || allImages.length >= MAX_IMAGES + 1}
                  className="border-gold/30 text-gold hover:bg-gold/10"
                >
                  {isUploading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4 mr-2" />
                  )}
                  {t("businessAddPhotos")}
                </Button>
                <span className="text-gold/50 text-xs">
                  {allImages.length}/{MAX_IMAGES + 1} {t("businessPhotos")}
                </span>
              </div>
            )}

            {/* Form */}
            {(editMode || isAdding) && (
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-gold/70 mb-1 block">{t("title")}</label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder={t("businessProjectTitlePlaceholder")}
                    className="bg-black/50 border-gold/20 text-white"
                  />
                </div>
                <div>
                  <label className="text-sm text-gold/70 mb-1 block">{t("description")}</label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder={t("businessProjectDescPlaceholder")}
                    className="bg-black/50 border-gold/20 text-white min-h-[100px]"
                  />
                </div>
                <Button
                  onClick={handleSave}
                  className="w-full bg-gold text-black hover:bg-gold/90"
                >
                  {isAdding ? t("add") : t("save")}
                </Button>
              </div>
            )}

            {/* View Mode */}
            {!editMode && !isAdding && formData.description && (
              <p className="text-gold/70 whitespace-pre-line">{formData.description}</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
