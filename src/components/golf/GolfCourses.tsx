import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Edit2, Trash2, MapPin, Star, Loader2, Flag, Sparkles, FileText } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { GolfCourse } from './GolfProfileModule';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';

interface GolfCoursesProps {
  userId: string;
  courses: GolfCourse[];
  isEditable: boolean;
  onUpdate: () => void;
}

const GolfCourses: React.FC<GolfCoursesProps> = ({ userId, courses, isEditable, onUpdate }) => {
  const { t } = useLanguage();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isImportingDoc, setIsImportingDoc] = useState(false);
  const docInputRef = useRef<HTMLInputElement>(null);
  const [editingCourse, setEditingCourse] = useState<GolfCourse | null>(null);
  const [formData, setFormData] = useState<Partial<GolfCourse>>({
    course_name: '',
    location: '',
    country: '',
    par: null,
    best_score: null,
    times_played: null,
    rating: '',
    description: '',
    is_favorite: false,
  });

  const resetForm = () => {
    setFormData({
      course_name: '',
      location: '',
      country: '',
      par: null,
      best_score: null,
      times_played: null,
      rating: '',
      description: '',
      is_favorite: false,
    });
    setEditingCourse(null);
  };

  const openEditDialog = (course: GolfCourse) => {
    setEditingCourse(course);
    setFormData({
      course_name: course.course_name,
      location: course.location,
      country: course.country,
      par: course.par,
      best_score: course.best_score,
      times_played: course.times_played,
      rating: course.rating,
      description: course.description,
      is_favorite: course.is_favorite,
    });
    setDialogOpen(true);
  };

  const handleAIGenerate = async () => {
    if (!formData.course_name) {
      toast.error(t('golfCoursePleaseEnterName'));
      return;
    }
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('personal-ai-suggest', {
        body: { moduleType: 'sports', context: `Golf course: ${formData.course_name} ${formData.location || ''} ${formData.country || ''}` }
      });
      if (error) throw error;
      if (data?.suggestion) {
        setFormData(prev => ({ ...prev, description: data.suggestion }));
        toast.success(t('poloAchievementSuggestionGenerated'));
      }
    } catch {
      toast.error(t('poloAchievementGenerationError'));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDocImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error(t('poloHorseFileTooLarge'));
      return;
    }

    setIsImportingDoc(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error(t('notAuthenticated'));

      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'pdf';
      const fileName = `golf-course-${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;
      
      // Ensure proper MIME type
      const mimeTypes: Record<string, string> = {
        'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'png': 'image/png',
        'gif': 'image/gif', 'webp': 'image/webp', 'pdf': 'application/pdf',
        'doc': 'application/msword', 'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      };
      const contentType = mimeTypes[fileExt] || 'application/octet-stream';
      const properFile = new File([file], file.name, { type: contentType, lastModified: Date.now() });

      const { error: uploadError } = await supabase.storage
        .from('personal-content')
        .upload(filePath, properFile, { upsert: true, contentType });

      if (uploadError) throw uploadError;
      toast.success(t('poloHorseDocumentImported'));
    } catch (error) {
      console.error(error);
      toast.error(t('poloHorseImportError'));
    } finally {
      setIsImportingDoc(false);
      if (docInputRef.current) docInputRef.current.value = '';
    }
  };

  const handleSubmit = async () => {
    if (!formData.course_name?.trim()) {
      toast.error(t('golfCourseNameRequired'));
      return;
    }

    setSaving(true);
    try {
      if (editingCourse?.id) {
        const { error } = await supabase
          .from('golf_courses')
          .update(formData)
          .eq('id', editingCourse.id);
        if (error) throw error;
        toast.success(t('golfCourseUpdated'));
      } else {
        const { error } = await supabase
          .from('golf_courses')
          .insert([{
            user_id: userId,
            course_name: formData.course_name || '',
            location: formData.location,
            country: formData.country,
            par: formData.par,
            best_score: formData.best_score,
            times_played: formData.times_played,
            rating: formData.rating,
            description: formData.description,
            is_favorite: formData.is_favorite,
            display_order: courses.length,
          }]);
        if (error) throw error;
        toast.success(t('golfCourseAdded'));
      }
      onUpdate();
      setDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving course:', error);
      toast.error(t('poloErrorSaving'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('golfCourseDeleteConfirm'))) return;
    
    try {
      const { error } = await supabase
        .from('golf_courses')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast.success(t('golfCourseDeleted'));
      onUpdate();
    } catch (error) {
      console.error('Error deleting course:', error);
      toast.error(t('golfCourseDeleteError'));
    }
  };

  const favoriteCourses = courses.filter(c => c.is_favorite);
  const otherCourses = courses.filter(c => !c.is_favorite);

  return (
    <div className="space-y-4">
      {/* Hidden document input */}
      <input
        ref={docInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
        className="hidden"
        onChange={handleDocImport}
      />

      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground">
          <Flag className="h-5 w-5" />
          🏌️ {t('golfCourseMyFavoriteCourses')}
        </h3>
        {isEditable && (
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                {t('add')}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingCourse ? t('golfCourseEditCourse') : t('golfCourseAddCourse')}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="course-name">{t('golfCourseName')} *</Label>
                  <Input
                    id="course-name"
                    placeholder={t('golfCourseNamePlaceholder')}
                    value={formData.course_name || ''}
                    onChange={(e) => setFormData({ ...formData, course_name: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="course-location">{t('golfCourseLocation')}</Label>
                    <Input
                      id="course-location"
                      placeholder={t('golfCourseCityPlaceholder')}
                      value={formData.location || ''}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="course-country">{t('golfCourseCountry')}</Label>
                    <Input
                      id="course-country"
                      placeholder={t('golfCourseCountryPlaceholder')}
                      value={formData.country || ''}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="course-par">{t('golfCoursePar')}</Label>
                    <Input
                      id="course-par"
                      type="number"
                      placeholder="72"
                      value={formData.par || ''}
                      onChange={(e) => setFormData({ ...formData, par: parseInt(e.target.value) || null })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="course-best">{t('golfCourseBestScore')}</Label>
                    <Input
                      id="course-best"
                      type="number"
                      placeholder="78"
                      value={formData.best_score || ''}
                      onChange={(e) => setFormData({ ...formData, best_score: parseInt(e.target.value) || null })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="course-times">{t('golfCourseTimesPlayed')}</Label>
                    <Input
                      id="course-times"
                      type="number"
                      placeholder="12"
                      value={formData.times_played || ''}
                      onChange={(e) => setFormData({ ...formData, times_played: parseInt(e.target.value) || null })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="course-rating">{t('golfCoursePersonalRating')}</Label>
                  <Input
                    id="course-rating"
                    placeholder={t('golfCourseRatingPlaceholder')}
                    value={formData.rating || ''}
                    onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="course-description">{t('golfCourseDescriptionMemories')}</Label>
                  <Textarea
                    id="course-description"
                    placeholder={t('golfCourseDescriptionPlaceholder')}
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="course-favorite"
                    checked={formData.is_favorite || false}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_favorite: checked })}
                  />
                  <Label htmlFor="course-favorite">{t('golfCourseFavorite')}</Label>
                </div>

                {/* IA Aurora + Import buttons */}
                <div className="flex gap-2 pt-2 border-t border-border">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAIGenerate}
                    disabled={isGenerating}
                    className="border-primary/30 text-primary hover:bg-primary/10"
                  >
                    {isGenerating ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Sparkles className="w-4 h-4 mr-1" />}
                    {t('aiAurora')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => docInputRef.current?.click()}
                    disabled={isImportingDoc}
                    className="border-primary/30 text-primary hover:bg-primary/10"
                  >
                    {isImportingDoc ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <FileText className="w-4 h-4 mr-1" />}
                    {t('import')}
                  </Button>
                </div>

                <Button 
                  onClick={handleSubmit} 
                  disabled={saving} 
                  className="w-full"
                >
                  {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {editingCourse ? t('update') : t('add')}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {courses.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-lg">
          <Flag className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>{t('golfCourseNoCourses')}</p>
          {isEditable && (
            <p className="text-sm mt-2">{t('golfCourseAddYourFavoriteCourses')}</p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {favoriteCourses.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Star className="h-4 w-4 text-primary" /> {t('golfCourseFavorites')}
              </p>
              <div className="grid gap-3">
                {favoriteCourses.map((course) => (
                  <Card key={course.id} className="border-primary/30 bg-primary/5">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Star className="h-4 w-4 text-primary fill-primary" />
                            <h4 className="font-semibold text-foreground">{course.course_name}</h4>
                          </div>
                          {(course.location || course.country) && (
                            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                              <MapPin className="h-3 w-3" />
                              {[course.location, course.country].filter(Boolean).join(', ')}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-4 mt-2 text-sm">
                            {course.par && (
                              <span className="text-muted-foreground">{t('golfCoursePar')} {course.par}</span>
                            )}
                            {course.best_score && (
                              <span className="text-primary font-medium">
                                {t('golfCourseBest')}: {course.best_score}
                              </span>
                            )}
                            {course.times_played && (
                              <span className="text-muted-foreground">
                                {course.times_played} {t('golfCourseGames')}
                              </span>
                            )}
                            {course.rating && (
                              <span className="text-muted-foreground">{course.rating}</span>
                            )}
                          </div>
                          {course.description && (
                            <p className="text-sm text-muted-foreground mt-2 italic">
                              {course.description}
                            </p>
                          )}
                        </div>
                        {isEditable && (
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditDialog(course)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(course.id!)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {otherCourses.length > 0 && (
            <div className="space-y-3">
              {favoriteCourses.length > 0 && (
                <p className="text-sm text-muted-foreground">{t('golfCourseOtherCourses')}</p>
              )}
              <div className="grid gap-3">
                {otherCourses.map((course) => (
                  <Card key={course.id} className="border-border/30">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-foreground">{course.course_name}</h4>
                          {(course.location || course.country) && (
                            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                              <MapPin className="h-3 w-3" />
                              {[course.location, course.country].filter(Boolean).join(', ')}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-4 mt-2 text-sm">
                            {course.par && (
                              <span className="text-muted-foreground">Par {course.par}</span>
                            )}
                            {course.best_score && (
                              <span className="text-primary font-medium">
                                Meilleur: {course.best_score}
                              </span>
                            )}
                            {course.times_played && (
                              <span className="text-muted-foreground">
                                {course.times_played} parties
                              </span>
                            )}
                          </div>
                        </div>
                        {isEditable && (
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditDialog(course)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(course.id!)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GolfCourses;