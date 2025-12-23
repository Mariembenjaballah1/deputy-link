import { useState, useEffect, useRef } from 'react';
import { Loader2, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useLocations } from '@/hooks/useLocations';
import type { MP } from '@/types';

interface MPFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editMP?: MP | null;
}

export function MPFormModal({ isOpen, onClose, onSuccess, editMP }: MPFormModalProps) {
  const { wilayas, dairas, getDairasByWilaya } = useLocations();
  const [isSaving, setIsSaving] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    name: '',
    wilayaId: '',
    dairaId: '',
    bloc: '',
    phone: '',
    email: '',
    bio: '',
    image: '',
  });

  useEffect(() => {
    if (editMP) {
      const cleanPhone = editMP.phone?.replace('+216', '') || '';
      setFormData({
        name: editMP.name,
        wilayaId: editMP.wilayaId || '',
        dairaId: editMP.dairaId || '',
        bloc: editMP.bloc || '',
        phone: cleanPhone ? '+216' + cleanPhone : '',
        email: editMP.email || '',
        bio: editMP.bio || '',
        image: editMP.image || '',
      });
      setImagePreview(editMP.image || null);
    } else {
      setFormData({
        name: '',
        wilayaId: '',
        dairaId: '',
        bloc: '',
        phone: '',
        email: '',
        bio: '',
        image: '',
      });
      setImagePreview(null);
    }
    setImageFile(null);
  }, [editMP, isOpen]);

  const filteredDairas = formData.wilayaId 
    ? getDairasByWilaya(formData.wilayaId)
    : [];

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('حجم الصورة يجب أن يكون أقل من 5 ميجابايت');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setFormData({ ...formData, image: '' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return formData.image || null;
    
    setIsUploading(true);
    try {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `mp-${Date.now()}.${fileExt}`;
      const filePath = `mps/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, imageFile);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('خطأ في رفع الصورة');
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('الاسم مطلوب');
      return;
    }
    if (!formData.wilayaId) {
      toast.error('الولاية مطلوبة');
      return;
    }

    setIsSaving(true);
    try {
      const imageUrl = await uploadImage();
      const wilaya = wilayas.find(w => w.id === formData.wilayaId);
      const daira = dairas.find(d => d.id === formData.dairaId);

      const mpData = {
        name: formData.name,
        wilaya: wilaya?.name || '',
        wilaya_id: formData.wilayaId,
        daira_id: formData.dairaId || null,
        daira: daira?.name || null,
        bloc: formData.bloc || null,
        phone: formData.phone || null,
        email: formData.email || null,
        bio: formData.bio || null,
        image: imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name)}&background=random`,
      };

      if (editMP) {
        const { error } = await supabase
          .from('mps')
          .update(mpData)
          .eq('id', editMP.id);

        if (error) throw error;
        toast.success('تم تحديث بيانات النائب');
      } else {
        const { error } = await supabase
          .from('mps')
          .insert({ ...mpData, complaints_count: 0, response_rate: 0 });

        if (error) throw error;
        toast.success('تم إضافة النائب بنجاح');
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving MP:', error);
      toast.error('خطأ في حفظ البيانات');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editMP ? 'تعديل بيانات النائب' : 'إضافة نائب جديد'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Photo Upload */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">الصورة</label>
            <div className="flex items-center gap-4">
              {imagePreview ? (
                <div className="relative">
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="w-20 h-20 rounded-full object-cover border-2 border-border"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/80"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center border-2 border-dashed border-border">
                  <Upload className="w-6 h-6 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  id="mp-image-upload"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <Loader2 className="w-4 h-4 animate-spin ml-2" />
                  ) : (
                    <Upload className="w-4 h-4 ml-2" />
                  )}
                  اختر صورة
                </Button>
                <p className="text-xs text-muted-foreground mt-1">PNG, JPG (أقصى حجم 5MB)</p>
              </div>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">الاسم الكامل *</label>
            <Input
              placeholder="اسم النائب"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">الولاية *</label>
            <select
              value={formData.wilayaId}
              onChange={(e) => setFormData({ ...formData, wilayaId: e.target.value, dairaId: '' })}
              className="w-full p-2 border border-border rounded-lg bg-background text-foreground"
            >
              <option value="">اختر الولاية</option>
              {wilayas.map(wilaya => (
                <option key={wilaya.id} value={wilaya.id}>{wilaya.code} - {wilaya.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">الدائرة</label>
            <select
              value={formData.dairaId}
              onChange={(e) => setFormData({ ...formData, dairaId: e.target.value })}
              className="w-full p-2 border border-border rounded-lg bg-background text-foreground"
              disabled={!formData.wilayaId}
            >
              <option value="">اختر الدائرة</option>
              {filteredDairas.map(daira => (
                <option key={daira.id} value={daira.id}>{daira.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">الكتلة البرلمانية</label>
            <Input
              placeholder="اسم الكتلة"
              value={formData.bloc}
              onChange={(e) => setFormData({ ...formData, bloc: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                الهاتف (للدخول)
                <span className="text-xs text-muted-foreground mr-1">8 أرقام</span>
              </label>
              <div className="flex gap-2" dir="ltr">
                <div className="bg-muted rounded-lg px-3 py-2 text-muted-foreground text-sm">
                  +216
                </div>
                <Input
                  placeholder="00000000"
                  value={formData.phone.replace('+216', '')}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, '').slice(0, 8);
                    setFormData({ ...formData, phone: digits ? '+216' + digits : '' });
                  }}
                  className="flex-1"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">البريد الإلكتروني</label>
              <Input
                placeholder="email@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">نبذة</label>
            <Textarea
              placeholder="نبذة عن النائب..."
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              className="min-h-[80px]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={isSaving}>
            إلغاء
          </Button>
          <Button onClick={handleSubmit} disabled={isSaving || isUploading}>
            {(isSaving || isUploading) && <Loader2 className="w-4 h-4 animate-spin ml-2" />}
            {editMP ? 'تحديث' : 'إضافة'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
