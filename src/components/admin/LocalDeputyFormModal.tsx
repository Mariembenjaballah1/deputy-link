import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { wilayas, dairas } from '@/data/mockData';

interface LocalDeputy {
  id: string;
  name: string;
  wilaya_id: string;
  daira_id: string;
  phone: string | null;
  whatsapp_number: string | null;
  email: string | null;
  bio: string | null;
  image: string | null;
  is_active: boolean;
}

interface LocalDeputyFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editDeputy?: LocalDeputy | null;
}

export function LocalDeputyFormModal({ isOpen, onClose, onSuccess, editDeputy }: LocalDeputyFormModalProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    wilayaId: '',
    dairaId: '',
    phone: '',
    whatsappNumber: '',
    email: '',
    bio: '',
  });

  useEffect(() => {
    if (editDeputy) {
      setFormData({
        name: editDeputy.name,
        wilayaId: editDeputy.wilaya_id || '',
        dairaId: editDeputy.daira_id || '',
        phone: editDeputy.phone || '',
        whatsappNumber: editDeputy.whatsapp_number || '',
        email: editDeputy.email || '',
        bio: editDeputy.bio || '',
      });
    } else {
      setFormData({
        name: '',
        wilayaId: '',
        dairaId: '',
        phone: '',
        whatsappNumber: '',
        email: '',
        bio: '',
      });
    }
  }, [editDeputy, isOpen]);

  const filteredDairas = formData.wilayaId 
    ? dairas.filter(d => d.wilayaId === formData.wilayaId)
    : [];

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('الاسم مطلوب');
      return;
    }
    if (!formData.wilayaId) {
      toast.error('الولاية مطلوبة');
      return;
    }
    if (!formData.dairaId) {
      toast.error('الدائرة مطلوبة');
      return;
    }

    setIsSaving(true);
    try {
      const deputyData = {
        name: formData.name,
        wilaya_id: formData.wilayaId,
        daira_id: formData.dairaId,
        phone: formData.phone || null,
        whatsapp_number: formData.whatsappNumber || null,
        email: formData.email || null,
        bio: formData.bio || null,
        image: editDeputy?.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name)}&background=random`,
      };

      if (editDeputy) {
        const { error } = await supabase
          .from('local_deputies')
          .update(deputyData)
          .eq('id', editDeputy.id);

        if (error) throw error;
        toast.success('تم تحديث بيانات نائب الجهة');
      } else {
        const { error } = await supabase
          .from('local_deputies')
          .insert(deputyData);

        if (error) throw error;
        toast.success('تم إضافة نائب الجهة بنجاح');
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving local deputy:', error);
      toast.error('خطأ في حفظ البيانات');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editDeputy ? 'تعديل بيانات نائب الجهة' : 'إضافة نائب جهة جديد'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">الاسم الكامل *</label>
            <Input
              placeholder="اسم نائب الجهة"
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
            <label className="text-sm font-medium text-foreground mb-2 block">الدائرة *</label>
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">الهاتف</label>
              <Input
                placeholder="+216..."
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">واتساب</label>
              <Input
                placeholder="+216..."
                value={formData.whatsappNumber}
                onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
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

          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">نبذة</label>
            <Textarea
              placeholder="نبذة عن نائب الجهة..."
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
          <Button onClick={handleSubmit} disabled={isSaving}>
            {isSaving && <Loader2 className="w-4 h-4 animate-spin ml-2" />}
            {editDeputy ? 'تحديث' : 'إضافة'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
