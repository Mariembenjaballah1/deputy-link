import { useState } from 'react';
import { X, Edit, Trash2, Save, Loader2, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Complaint, categoryLabels, statusLabels } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ComplaintDetailModalProps {
  complaint: Complaint | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
  canEdit?: boolean;
  canDelete?: boolean;
}

export function ComplaintDetailModal({
  complaint,
  isOpen,
  onClose,
  onUpdate,
  canEdit = false,
  canDelete = false,
}: ComplaintDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!complaint) return null;

  const handleEdit = () => {
    setEditContent(complaint.content);
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!editContent.trim()) {
      toast.error('محتوى الطلب مطلوب');
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('complaints')
        .update({ content: editContent })
        .eq('id', complaint.id);

      if (error) throw error;

      toast.success('تم تحديث الطلب بنجاح');
      setIsEditing(false);
      onUpdate();
    } catch (error) {
      console.error('Error updating complaint:', error);
      toast.error('خطأ في تحديث الطلب');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('complaints')
        .delete()
        .eq('id', complaint.id);

      if (error) throw error;

      toast.success('تم حذف الطلب بنجاح');
      onClose();
      onUpdate();
    } catch (error) {
      console.error('Error deleting complaint:', error);
      toast.error('خطأ في حذف الطلب');
    } finally {
      setIsDeleting(false);
    }
  };

  const statusStyles: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700',
    viewed: 'bg-blue-100 text-blue-700',
    replied: 'bg-green-100 text-green-700',
    forwarded: 'bg-purple-100 text-purple-700',
    out_of_scope: 'bg-red-100 text-red-700',
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>تفاصيل الطلب</span>
            <span className={cn("text-xs px-3 py-1 rounded-full", statusStyles[complaint.status])}>
              {statusLabels[complaint.status]}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">رقم الطلب</p>
            <p className="text-sm font-mono text-foreground">#{complaint.id.slice(0, 8)}</p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-1">التصنيف</p>
            <span className="text-sm bg-primary/10 text-primary px-2 py-1 rounded">
              {categoryLabels[complaint.category]}
            </span>
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-1">المحتوى</p>
            {isEditing ? (
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="min-h-[120px]"
              />
            ) : (
              <p className="text-sm text-foreground bg-muted/50 p-3 rounded-lg">{complaint.content}</p>
            )}
          </div>

          {complaint.images && complaint.images.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-2">الصور المرفقة</p>
              <div className="flex gap-2 flex-wrap">
                {complaint.images.map((img, i) => (
                  <img 
                    key={i} 
                    src={img} 
                    alt={`صورة ${i + 1}`}
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                ))}
              </div>
            </div>
          )}

          {complaint.reply && (
            <div className="bg-secondary/10 p-3 rounded-lg border border-secondary/20">
              <p className="text-xs font-medium text-secondary mb-1">رد النائب:</p>
              <p className="text-sm text-foreground">{complaint.reply}</p>
            </div>
          )}

          <div>
            <p className="text-xs text-muted-foreground mb-1">تاريخ الإنشاء</p>
            <p className="text-sm text-foreground">
              {new Date(complaint.createdAt).toLocaleDateString('ar-DZ', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col gap-3 sm:flex-col">
          {/* Create Correspondence Button */}
          <Button 
            variant="outline" 
            className="w-full gap-2 border-accent/30 bg-accent/5 hover:bg-accent/10 hover:border-accent/50"
            onClick={() => {
              // TODO: Implement correspondence creation
              toast.info('قريباً - إنشاء مراسلة');
            }}
          >
            <Mail className="w-4 h-4 text-accent" />
            إنشاء مراسلة
          </Button>

          <div className="flex gap-2 w-full justify-end">
            {isEditing ? (
              <>
                <Button variant="ghost" onClick={() => setIsEditing(false)} disabled={isSaving}>
                  إلغاء
                </Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 ml-2" />}
                  حفظ
                </Button>
              </>
            ) : (
              <>
                {canEdit && complaint.status === 'pending' && (
                  <Button variant="outline" onClick={handleEdit}>
                    <Edit className="w-4 h-4 ml-2" />
                    تعديل
                  </Button>
                )}
                {canDelete && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" disabled={isDeleting}>
                        {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4 ml-2" />}
                        حذف
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
                        <AlertDialogDescription>
                          سيتم حذف هذا الطلب نهائياً ولا يمكن استرجاعه.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>إلغاء</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                          حذف
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
