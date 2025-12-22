import { useState, useEffect, useRef } from 'react';
import { 
  Phone, Building2, Calendar, FileText, Plus, Edit, Trash2, 
  Check, X, Loader2, Upload, Image, File, ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/authStore';

interface CoordinationEntry {
  id: string;
  date: string;
  entity: string;
  contact_type: string;
  contact_person: string;
  notes: string;
  documents: string[];
}

interface CoordinationLogProps {
  complaintId: string;
}

const contactTypes = [
  { value: 'phone', label: 'اتصال هاتفي' },
  { value: 'meeting', label: 'اجتماع' },
  { value: 'email', label: 'بريد إلكتروني' },
  { value: 'field_visit', label: 'زيارة ميدانية' },
  { value: 'official_letter', label: 'مراسلة رسمية' },
];

export function CoordinationLog({ complaintId }: CoordinationLogProps) {
  const { user } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [entries, setEntries] = useState<CoordinationEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    entity: '',
    contact_type: 'phone',
    contact_person: '',
    notes: '',
    documents: [] as string[],
  });

  useEffect(() => {
    loadEntries();
  }, [complaintId]);

  const loadEntries = async () => {
    try {
      // Load from audit log with coordination actions
      const { data, error } = await supabase
        .from('complaint_audit_log')
        .select('*')
        .eq('complaint_id', complaintId)
        .eq('action', 'coordination')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedEntries: CoordinationEntry[] = (data || []).map(item => ({
        id: item.id,
        date: item.created_at.split('T')[0],
        entity: (item.new_value as any)?.entity || '',
        contact_type: (item.new_value as any)?.contact_type || 'phone',
        contact_person: (item.new_value as any)?.contact_person || '',
        notes: item.notes || '',
        documents: (item.new_value as any)?.documents || [],
      }));

      setEntries(formattedEntries);
    } catch (error) {
      console.error('Error loading coordination entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const uploadedUrls: string[] = [];

    try {
      for (const file of Array.from(files)) {
        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`${file.name}: الملف كبير جداً (الحد الأقصى 10 ميغابايت)`);
          continue;
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `coord_${complaintId}_${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`;
        const filePath = `coordination/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, file);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          toast.error(`خطأ في رفع ${file.name}`);
          continue;
        }

        const { data: publicUrl } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);

        uploadedUrls.push(publicUrl.publicUrl);
      }

      if (uploadedUrls.length > 0) {
        setFormData(prev => ({
          ...prev,
          documents: [...prev.documents, ...uploadedUrls]
        }));
        toast.success(`تم رفع ${uploadedUrls.length} ملف بنجاح`);
      }
    } catch (error) {
      console.error('Error uploading files:', error);
      toast.error('خطأ في رفع الملفات');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeDocument = (index: number) => {
    setFormData(prev => ({
      ...prev,
      documents: prev.documents.filter((_, i) => i !== index)
    }));
  };

  const handleSave = async () => {
    if (!formData.entity.trim() || !formData.notes.trim()) {
      toast.error('يرجى ملء الحقول المطلوبة');
      return;
    }

    setSaving(true);
    try {
      const newValue = {
        entity: formData.entity,
        contact_type: formData.contact_type,
        contact_person: formData.contact_person,
        documents: formData.documents,
      };

      if (editingId) {
        // Update existing entry
        const { error } = await supabase
          .from('complaint_audit_log')
          .update({
            notes: formData.notes,
            new_value: newValue,
          })
          .eq('id', editingId);

        if (error) throw error;
        toast.success('تم تحديث السجل بنجاح');
      } else {
        // Add new entry
        const { error } = await supabase
          .from('complaint_audit_log')
          .insert({
            complaint_id: complaintId,
            action: 'coordination',
            action_by: user?.name || 'نائب الجهة',
            action_by_role: 'local_deputy',
            notes: formData.notes,
            new_value: newValue,
          });

        if (error) throw error;
        toast.success('تم إضافة السجل بنجاح');
      }

      resetForm();
      loadEntries();
    } catch (error) {
      console.error('Error saving coordination entry:', error);
      toast.error('خطأ في حفظ السجل');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('complaint_audit_log')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast.success('تم حذف السجل');
      loadEntries();
    } catch (error) {
      console.error('Error deleting entry:', error);
      toast.error('خطأ في حذف السجل');
    }
  };

  const startEditing = (entry: CoordinationEntry) => {
    setEditingId(entry.id);
    setFormData({
      date: entry.date,
      entity: entry.entity,
      contact_type: entry.contact_type,
      contact_person: entry.contact_person,
      notes: entry.notes,
      documents: entry.documents,
    });
    setIsAdding(true);
  };

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      entity: '',
      contact_type: 'phone',
      contact_person: '',
      notes: '',
      documents: [],
    });
    setIsAdding(false);
    setEditingId(null);
  };

  const getContactTypeLabel = (type: string) => {
    return contactTypes.find(t => t.value === type)?.label || type;
  };

  const getFileIcon = (url: string) => {
    const ext = url.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) {
      return <Image className="w-4 h-4" />;
    }
    return <File className="w-4 h-4" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-secondary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Building2 className="w-5 h-5 text-secondary" />
          التنسيق مع الجهات المحلية
        </h3>
        {!isAdding && (
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-2"
            onClick={() => setIsAdding(true)}
          >
            <Plus className="w-4 h-4" />
            إضافة
          </Button>
        )}
      </div>

      {/* Add/Edit Form */}
      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-muted/50 rounded-xl p-4 border border-border space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">الجهة المتدخلة *</label>
                  <Input
                    value={formData.entity}
                    onChange={(e) => setFormData(prev => ({ ...prev, entity: e.target.value }))}
                    placeholder="اسم البلدية أو الجهة..."
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">نوع التواصل</label>
                  <Select 
                    value={formData.contact_type}
                    onValueChange={(v) => setFormData(prev => ({ ...prev, contact_type: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {contactTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-sm text-muted-foreground mb-1 block">الشخص المتصل به</label>
                <Input
                  value={formData.contact_person}
                  onChange={(e) => setFormData(prev => ({ ...prev, contact_person: e.target.value }))}
                  placeholder="اسم الموظف أو المسؤول..."
                />
              </div>

              <div>
                <label className="text-sm text-muted-foreground mb-1 block">الملاحظات *</label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="تفاصيل التواصل والإجراءات المتخذة..."
                  className="min-h-[80px]"
                />
              </div>

              {/* Documents */}
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">المرفقات</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.documents.map((doc, index) => (
                    <div 
                      key={index}
                      className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-2"
                    >
                      {getFileIcon(doc)}
                      <a 
                        href={doc} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline truncate max-w-[150px]"
                      >
                        ملف {index + 1}
                      </a>
                      <button 
                        onClick={() => removeDocument(index)}
                        className="text-destructive hover:text-destructive/80"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  رفع ملف
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,.pdf,.doc,.docx"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2 justify-end">
                <Button variant="ghost" onClick={resetForm}>
                  إلغاء
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4 ml-2" />
                  )}
                  {editingId ? 'تحديث' : 'حفظ'}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Entries List */}
      {entries.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Building2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>لا توجد سجلات تنسيق</p>
          <p className="text-sm">أضف سجلاً جديداً لتوثيق التواصل مع الجهات المحلية</p>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <div 
              key={entry.id}
              className="bg-card rounded-xl p-4 border border-border"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-secondary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{entry.entity}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="bg-muted px-2 py-0.5 rounded">
                        {getContactTypeLabel(entry.contact_type)}
                      </span>
                      {entry.contact_person && (
                        <span>• {entry.contact_person}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(entry.date).toLocaleDateString('ar-TN')}
                  </span>
                  <Button variant="ghost" size="icon" onClick={() => startEditing(entry)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-destructive"
                    onClick={() => handleDelete(entry.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground">{entry.notes}</p>
              
              {entry.documents.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-border">
                  {entry.documents.map((doc, idx) => (
                    <a
                      key={idx}
                      href={doc}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-primary hover:underline bg-primary/10 px-2 py-1 rounded"
                    >
                      {getFileIcon(doc)}
                      مرفق {idx + 1}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
