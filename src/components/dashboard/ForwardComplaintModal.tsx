import { useState, useEffect } from 'react';
import { X, Send, MessageSquare, Loader2, User, Phone, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { wilayas, dairas } from '@/data/mockData';
import { Complaint, categoryLabels } from '@/types';

interface LocalDeputy {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  wilaya_id: string;
  daira_id: string;
  whatsapp_number: string | null;
  image: string | null;
}

interface ForwardComplaintModalProps {
  complaint: Complaint;
  mpName: string;
  onClose: () => void;
  onForwarded: () => void;
}

export function ForwardComplaintModal({ complaint, mpName, onClose, onForwarded }: ForwardComplaintModalProps) {
  const [deputies, setDeputies] = useState<LocalDeputy[]>([]);
  const [selectedDeputy, setSelectedDeputy] = useState<LocalDeputy | null>(null);
  const [forwardingMethod, setForwardingMethod] = useState<'system' | 'whatsapp'>('system');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isForwarding, setIsForwarding] = useState(false);

  useEffect(() => {
    loadDeputies();
  }, [complaint.wilayaId]);

  const loadDeputies = async () => {
    try {
      const { data, error } = await supabase
        .from('local_deputies')
        .select('*')
        .eq('wilaya_id', complaint.wilayaId)
        .eq('is_active', true);

      if (error) throw error;
      setDeputies(data || []);
    } catch (error) {
      console.error('Error loading deputies:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateWhatsAppMessage = () => {
    const wilaya = wilayas.find(w => w.id === complaint.wilayaId)?.name || '';
    const daira = dairas.find(d => d.id === complaint.dairaId)?.name || '';
    
    return `*شكوى محوّلة من نائب الشعب*

📋 *رقم الشكوى:* ${complaint.id.slice(0, 8)}
📁 *التصنيف:* ${categoryLabels[complaint.category]}
📍 *الولاية:* ${wilaya}
🏢 *البلدية:* ${daira}

📝 *نص الشكوى:*
${complaint.content}

${notes ? `💬 *ملاحظات:*\n${notes}` : ''}

---
_محوّلة من: ${mpName}_
_التاريخ: ${new Date().toLocaleDateString('ar-TN')}_`;
  };

  const handleForwardViaSystem = async () => {
    if (!selectedDeputy) {
      toast.error('يرجى اختيار نائب الجهة');
      return;
    }

    setIsForwarding(true);
    try {
      // Update complaint
      const { error: updateError } = await supabase
        .from('complaints')
        .update({
          forwarded_to_deputy_id: selectedDeputy.id,
          forwarded_to: selectedDeputy.name,
          forwarded_at: new Date().toISOString(),
          forwarding_method: 'system',
          status: 'forwarded',
          assigned_to: 'local_deputy',
          local_deputy_id: selectedDeputy.id,
        })
        .eq('id', complaint.id);

      if (updateError) throw updateError;

      // Add audit log
      await supabase.from('complaint_audit_log').insert({
        complaint_id: complaint.id,
        action: 'forwarded_to_deputy',
        action_by: mpName,
        action_by_role: 'mp',
        new_value: { 
          deputy_id: selectedDeputy.id, 
          deputy_name: selectedDeputy.name,
          method: 'system'
        },
        notes,
      });

      toast.success(`تم تحويل الشكوى إلى ${selectedDeputy.name}`);
      onForwarded();
      onClose();
    } catch (error) {
      console.error('Error forwarding complaint:', error);
      toast.error('خطأ في تحويل الشكوى');
    } finally {
      setIsForwarding(false);
    }
  };

  const handleForwardViaWhatsApp = async () => {
    if (!selectedDeputy) {
      toast.error('يرجى اختيار نائب الجهة');
      return;
    }

    const whatsappNumber = selectedDeputy.whatsapp_number || selectedDeputy.phone;
    if (!whatsappNumber) {
      toast.error('لا يوجد رقم WhatsApp لهذا النائب');
      return;
    }

    setIsForwarding(true);
    try {
      // Record the forwarding
      await supabase
        .from('complaints')
        .update({
          forwarded_to_deputy_id: selectedDeputy.id,
          forwarded_to: selectedDeputy.name,
          forwarded_at: new Date().toISOString(),
          forwarding_method: 'whatsapp',
          status: 'forwarded',
        })
        .eq('id', complaint.id);

      // Add audit log
      await supabase.from('complaint_audit_log').insert({
        complaint_id: complaint.id,
        action: 'forwarded_via_whatsapp',
        action_by: mpName,
        action_by_role: 'mp',
        new_value: { 
          deputy_id: selectedDeputy.id, 
          deputy_name: selectedDeputy.name,
          method: 'whatsapp',
          phone: whatsappNumber
        },
        notes,
      });

      // Open WhatsApp
      const message = encodeURIComponent(generateWhatsAppMessage());
      const cleanNumber = whatsappNumber.replace(/\D/g, '');
      window.open(`https://wa.me/${cleanNumber}?text=${message}`, '_blank');

      toast.success('تم فتح WhatsApp لإرسال الشكوى');
      onForwarded();
      onClose();
    } catch (error) {
      console.error('Error:', error);
      toast.error('خطأ في تسجيل التحويل');
    } finally {
      setIsForwarding(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-foreground/50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto"
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-foreground">تحويل الشكوى البلدية</h3>
            <button onClick={onClose}>
              <X className="w-6 h-6 text-muted-foreground" />
            </button>
          </div>

          {/* Complaint Summary */}
          <div className="bg-muted/50 rounded-xl p-4 mb-6">
            <p className="text-sm text-muted-foreground mb-2">رقم الشكوى: {complaint.id.slice(0, 8)}</p>
            <p className="text-foreground line-clamp-2">{complaint.content}</p>
            <div className="flex gap-2 mt-2">
              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                {categoryLabels[complaint.category]}
              </span>
              <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded">
                {wilayas.find(w => w.id === complaint.wilayaId)?.name}
              </span>
            </div>
          </div>

          {/* Select Deputy */}
          <div className="mb-6">
            <label className="text-sm font-medium text-foreground mb-3 block">اختر نائب الجهة</label>
            
            {isLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : deputies.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                <Building2 className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p>لا يوجد نواب جهة مسجلين لهذه الولاية</p>
                <p className="text-xs mt-1">يمكنك إضافة نواب من لوحة الإدارة</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {deputies.map((deputy) => (
                  <button
                    key={deputy.id}
                    onClick={() => setSelectedDeputy(deputy)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all ${
                      selectedDeputy?.id === deputy.id 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:bg-muted/50'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                      {deputy.image ? (
                        <img src={deputy.image} alt={deputy.name} className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 text-right">
                      <p className="font-medium text-foreground">{deputy.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {dairas.find(d => d.id === deputy.daira_id)?.name}
                      </p>
                    </div>
                    {deputy.whatsapp_number && (
                      <Phone className="w-4 h-4 text-green-500" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="mb-6">
            <label className="text-sm font-medium text-foreground mb-2 block">ملاحظات (اختياري)</label>
            <Textarea
              placeholder="أضف ملاحظات للنائب..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[80px]"
            />
          </div>

          {/* Forwarding Method */}
          <div className="mb-6">
            <label className="text-sm font-medium text-foreground mb-3 block">طريقة التحويل</label>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant={forwardingMethod === 'system' ? 'default' : 'outline'}
                className="gap-2"
                onClick={() => setForwardingMethod('system')}
              >
                <Send className="w-4 h-4" />
                داخل النظام
              </Button>
              <Button
                variant={forwardingMethod === 'whatsapp' ? 'default' : 'outline'}
                className="gap-2"
                onClick={() => setForwardingMethod('whatsapp')}
              >
                <MessageSquare className="w-4 h-4" />
                WhatsApp
              </Button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              إلغاء
            </Button>
            <Button 
              className="flex-1 gap-2"
              onClick={forwardingMethod === 'system' ? handleForwardViaSystem : handleForwardViaWhatsApp}
              disabled={!selectedDeputy || isForwarding}
            >
              {isForwarding ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : forwardingMethod === 'system' ? (
                <Send className="w-4 h-4" />
              ) : (
                <MessageSquare className="w-4 h-4" />
              )}
              تحويل
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
