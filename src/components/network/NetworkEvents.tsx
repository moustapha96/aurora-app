import { useState, useMemo } from "react";
import { NetworkModule } from "./NetworkModule";
import { CalendarDays, Plus, Pencil, Trash2, Loader2, Sparkles, Lock } from "lucide-react";
import { TruncatedText } from "@/components/ui/truncated-text";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

interface EventItem {
  id: string;
  title: string;
  event_type?: string;
  location?: string;
  date?: string;
  description?: string;
}

interface NetworkEventsProps {
  data: EventItem[];
  isEditable: boolean;
  onUpdate: () => void;
}

export const NetworkEvents = ({ data, isEditable, onUpdate }: NetworkEventsProps) => {
  const { t } = useLanguage();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<EventItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [formData, setFormData] = useState({
    title: "",
    event_type: "",
    location: "",
    date: "",
    description: ""
  });

  const parseEventDate = (dateStr: string): Date | null => {
    if (!dateStr) return null;
    
    // Normalize: lowercase and replace accented chars
    const normalized = dateStr.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, ''); // Remove accents
    
    const months: Record<string, number> = {
      janvier: 0, fevrier: 1, mars: 2, avril: 3, mai: 4, juin: 5,
      juillet: 6, aout: 7, septembre: 8, octobre: 9, novembre: 10, decembre: 11
    };
    
    // Match pattern with year: "25 decembre 2024"
    const matchWithYear = normalized.match(/(\d{1,2})\s+([a-z]+)\s+(\d{4})/i);
    if (matchWithYear) {
      const day = parseInt(matchWithYear[1]);
      const monthName = matchWithYear[2];
      const year = parseInt(matchWithYear[3]);
      const month = months[monthName];
      if (month !== undefined) {
        return new Date(year, month, day);
      }
    }
    
    // Match pattern without year: "25 decembre" - default to current year
    const matchNoYear = normalized.match(/(\d{1,2})\s+([a-z]+)$/i);
    if (matchNoYear) {
      const day = parseInt(matchNoYear[1]);
      const monthName = matchNoYear[2];
      const month = months[monthName];
      if (month !== undefined) {
        const currentYear = new Date().getFullYear();
        return new Date(currentYear, month, day);
      }
    }
    
    return null;
  };

  // Parse event dates for calendar highlighting - rebuild when data changes
  const eventDates = useMemo(() => {
    const dates: Date[] = [];
    data.forEach(item => {
      if (item.date) {
        const parsed = parseEventDate(item.date);
        if (parsed) {
          dates.push(parsed);
        }
      }
    });
    return dates;
  }, [data]);

  // Create a set of date strings for fast lookup
  const eventDateStrings = useMemo(() => {
    return new Set(eventDates.map(d => d.toDateString()));
  }, [eventDates]);

  // Matcher function for calendar - more reliable than passing Date array
  const hasEventMatcher = (day: Date) => eventDateStrings.has(day.toDateString());

  // Get events for selected date
  const eventsForSelectedDate = useMemo(() => {
    if (!selectedDate) return [];
    const selectedDateStr = selectedDate.toDateString();
    return data.filter(item => {
      if (!item.date) return false;
      const eventDate = parseEventDate(item.date);
      if (!eventDate) return false;
      return eventDate.toDateString() === selectedDateStr;
    });
  }, [data, selectedDate]);

  // Force calendar re-render when data changes
  const calendarKey = `calendar-${data.length}-${eventDates.map(d => d.getTime()).join('-')}`;

  const resetForm = () => {
    setFormData({ title: "", event_type: "", location: "", date: "", description: "" });
    setEditingItem(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    if (selectedDate) {
      setFormData(prev => ({ 
        ...prev, 
        date: format(selectedDate, "d MMMM yyyy", { locale: fr }) 
      }));
    }
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (item: EventItem) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      event_type: item.event_type || "",
      location: item.location || "",
      date: item.date || "",
      description: item.description || ""
    });
    setIsDialogOpen(true);
  };

  const handleAISuggest = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('network-ai-suggest', {
        body: { moduleType: 'events', context: formData.title || 'événement exclusif' }
      });
      if (error) throw error;
      
      if (data?.structuredData) {
        setFormData(prev => ({
          ...prev,
          title: data.structuredData.title || prev.title,
          event_type: data.structuredData.event_type || prev.event_type,
          location: data.structuredData.location || prev.location,
          date: data.structuredData.date || prev.date,
          description: data.structuredData.description || prev.description
        }));
        toast.success("Tous les champs ont été complétés par l'IA");
      } else if (data?.suggestion) {
        setFormData(prev => ({ ...prev, description: data.suggestion }));
        toast.success("Description générée");
      }
    } catch (error) {
      console.error('AI suggestion error:', error);
      toast.error("Erreur lors de la génération");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast.error("Le titre est requis");
      return;
    }

    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      if (editingItem) {
        const { error } = await supabase
          .from('network_events')
          .update({
            title: formData.title,
            event_type: formData.event_type,
            location: formData.location,
            date: formData.date,
            description: formData.description,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingItem.id);
        if (error) throw error;
        toast.success("Événement mis à jour");
      } else {
        const { error } = await supabase
          .from('network_events')
          .insert({
            user_id: user.id,
            title: formData.title,
            event_type: formData.event_type,
            location: formData.location,
            date: formData.date,
            description: formData.description
          });
        if (error) throw error;
        toast.success("Événement ajouté");
      }

      setIsDialogOpen(false);
      resetForm();
      onUpdate();
    } catch (error) {
      console.error('Error saving event:', error);
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('network_events').delete().eq('id', id);
      if (error) throw error;
      toast.success("Événement supprimé");
      onUpdate();
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    }
  };

  return (
    <NetworkModule title={t('eventsInvitations')} icon={CalendarDays} moduleType="events" isEditable={isEditable}>
      {/* Private invitation notice */}
      <div className="flex items-center gap-2 mb-4 p-3 bg-primary/5 border border-primary/20 rounded-lg">
        <Lock className="w-4 h-4 text-primary flex-shrink-0" />
        <p className="text-sm text-muted-foreground italic">
          {t('privateEventsNote')}
        </p>
      </div>

      {/* Premium Calendar */}
      <div className="bg-card border border-border/50 rounded-xl p-4 mb-4 shadow-sm">
        <Calendar
          key={calendarKey}
          mode="single"
          selected={selectedDate}
          onSelect={(date) => {
            setSelectedDate(date);
            if (date && isEditable) {
              resetForm();
              setFormData(prev => ({ 
                ...prev, 
                date: format(date, "d MMMM yyyy", { locale: fr }) 
              }));
              setIsDialogOpen(true);
            }
          }}
          locale={fr}
          modifiers={{
            hasEvent: hasEventMatcher
          }}
          modifiersClassNames={{
            hasEvent: "bg-primary/20 font-bold"
          }}
          className={cn("p-0 pointer-events-auto", isEditable && "cursor-pointer")}
        />
        <div className="mt-3 pt-3 border-t border-border/50">
          <p className="text-xs text-muted-foreground">
            <span className="inline-block w-3 h-3 bg-primary/20 rounded mr-1"></span>
            {t('datesWithEvents').replace('{count}', String(eventDates.length))}
          </p>
        </div>
        
        {/* Events for selected date */}
        {selectedDate && eventsForSelectedDate.length > 0 && (
          <div className="mt-3 pt-3 border-t border-border/50">
            <p className="text-xs font-medium text-foreground mb-2">
              {format(selectedDate, "d MMMM yyyy", { locale: fr })}
            </p>
            {eventsForSelectedDate.map(event => (
              <div key={event.id} className="text-xs text-muted-foreground pl-2 border-l-2 border-primary/50 mb-1">
                {event.title}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Events list */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-foreground">
          {t('allYourEvents')} ({data.length})
        </h4>
        {data.map((item) => (
          <div key={item.id} className="p-3 bg-muted/30 rounded-lg group">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h4 className="font-medium text-foreground">{item.title}</h4>
                <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                  {item.event_type && <span>{item.event_type}</span>}
                  {item.location && <span>• {item.location}</span>}
                  {item.date && <span>• {item.date}</span>}
                </div>
                {item.description && (
                  <TruncatedText text={item.description} className="mt-1" maxLines={2} />
                )}
              </div>
              {isEditable && (
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenEdit(item)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(item.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        ))}


        {data.length === 0 && (
          <p className="text-muted-foreground text-sm text-center py-4">
            {t('noEventAdded')}
          </p>
        )}

      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? "Modifier" : "Ajouter"} un événement</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Titre *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Ex: Gala de Charité Annuel"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Type d'événement</Label>
                <Input
                  value={formData.event_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, event_type: e.target.value }))}
                  placeholder="Ex: Gala, Conférence"
                />
              </div>
              <div>
                <Label>Date</Label>
                <Input
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  placeholder="Ex: 15 Juin 2024"
                />
              </div>
            </div>
            <div>
              <Label>Lieu</Label>
              <Input
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="Ex: Hôtel de Crillon, Paris"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Description de l'événement..."
              />
            </div>
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={handleAISuggest} disabled={isGenerating}>
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                Suggestion Aurora
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isGenerating}>Annuler</Button>
                <Button onClick={handleSave} disabled={isLoading || isGenerating}>
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Valider"}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </NetworkModule>
  );
};
