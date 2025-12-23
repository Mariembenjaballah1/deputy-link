import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Loader2, Building2, Search, Eye, Phone, Mail, MessageCircle, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useLocations } from '@/hooks/useLocations';
import { LocalDeputyFormModal } from './LocalDeputyFormModal';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

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

export function LocalDeputiesManagement() {
  const { wilayas, getWilayaName, getDairaName } = useLocations();
  const [deputies, setDeputies] = useState<LocalDeputy[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [wilayaFilter, setWilayaFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDeputy, setEditingDeputy] = useState<LocalDeputy | null>(null);
  const [selectedDeputy, setSelectedDeputy] = useState<LocalDeputy | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  useEffect(() => {
    loadDeputies();
  }, []);

  const loadDeputies = async () => {
    try {
      const { data, error } = await supabase
        .from('local_deputies')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDeputies(data || []);
    } catch (error) {
      console.error('Error loading local deputies:', error);
      toast.error('خطأ في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('local_deputies')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setDeputies(prev => prev.filter(d => d.id !== id));
      toast.success('تم حذف نائب الجهة');
    } catch (error) {
      console.error('Error deleting local deputy:', error);
      toast.error('خطأ في حذف نائب الجهة');
    }
  };

  const handleEdit = (deputy: LocalDeputy) => {
    setEditingDeputy(deputy);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setEditingDeputy(null);
    setIsModalOpen(true);
  };

  const handleViewDetails = (deputy: LocalDeputy) => {
    setSelectedDeputy(deputy);
    setIsDetailModalOpen(true);
  };

  const filteredDeputies = deputies.filter(d => {
    if (wilayaFilter !== 'all' && d.wilaya_id !== wilayaFilter) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return d.name.toLowerCase().includes(query);
    }
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-secondary" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex items-center justify-between mb-6">
        <p className="text-muted-foreground">{deputies.length} نائب جهة مسجل</p>
        <Button variant="default" className="gap-2" onClick={handleAdd}>
          <Plus className="w-4 h-4" />
          إضافة نائب جهة
        </Button>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="بحث..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10"
          />
        </div>
        <select
          value={wilayaFilter}
          onChange={(e) => setWilayaFilter(e.target.value)}
          className="p-2 border border-border rounded-lg bg-background text-foreground text-sm"
        >
          <option value="all">جميع الولايات</option>
          {wilayas.map(wilaya => (
            <option key={wilaya.id} value={wilaya.id}>{wilaya.name}</option>
          ))}
        </select>
      </div>

      <div className="grid gap-4">
        {filteredDeputies.map((deputy) => (
          <div key={deputy.id} className="bg-card rounded-xl p-4 border border-border flex items-center gap-4">
            <img 
              src={deputy.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(deputy.name)}&background=random`} 
              alt={deputy.name} 
              className="w-12 h-12 rounded-full" 
            />
            <div className="flex-1">
              <p className="font-bold text-foreground">{deputy.name}</p>
              <p className="text-sm text-muted-foreground">
                {getWilayaName(deputy.wilaya_id)} - {getDairaName(deputy.daira_id)}
              </p>
            </div>
            <div className="text-center">
              <span className={cn(
                "text-xs px-2 py-1 rounded-full",
                deputy.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
              )}>
                {deputy.is_active ? 'نشط' : 'غير نشط'}
              </span>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" onClick={() => handleViewDetails(deputy)} title="عرض التفاصيل">
                <Eye className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => handleEdit(deputy)} title="تعديل">
                <Edit className="w-4 h-4" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
                    <AlertDialogDescription>
                      سيتم حذف نائب الجهة "{deputy.name}" نهائياً.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>إلغاء</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={() => handleDelete(deputy.id)}
                      className="bg-destructive text-destructive-foreground"
                    >
                      حذف
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        ))}

        {filteredDeputies.length === 0 && (
          <div className="bg-card rounded-xl p-8 border border-border text-center">
            <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">لا يوجد نواب جهة مسجلين</p>
          </div>
        )}
      </div>

      <LocalDeputyFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={loadDeputies}
        editDeputy={editingDeputy}
      />

      {/* Detail Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>تفاصيل نائب الجهة</DialogTitle>
          </DialogHeader>
          {selectedDeputy && (
            <div className="space-y-6">
              {/* Header with image and name */}
              <div className="flex items-center gap-4">
                <img
                  src={selectedDeputy.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedDeputy.name)}&background=random&size=128`}
                  alt={selectedDeputy.name}
                  className="w-20 h-20 rounded-full object-cover border-2 border-primary/20"
                />
                <div>
                  <h3 className="text-xl font-bold text-foreground">{selectedDeputy.name}</h3>
                  <Badge variant={selectedDeputy.is_active ? "default" : "secondary"} className="mt-1">
                    {selectedDeputy.is_active ? 'نشط' : 'غير نشط'}
                  </Badge>
                </div>
              </div>

              {/* Location */}
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <MapPin className="w-4 h-4" />
                  <span className="font-medium">الموقع</span>
                </div>
                <p className="text-foreground">
                  {getWilayaName(selectedDeputy.wilaya_id)} - {getDairaName(selectedDeputy.daira_id)}
                </p>
              </div>

              {/* Contact Info */}
              <div className="space-y-3">
                <h4 className="font-semibold text-foreground">معلومات الاتصال</h4>
                
                {selectedDeputy.phone && (
                  <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                    <Phone className="w-4 h-4 text-primary" />
                    <span className="text-foreground" dir="ltr">{selectedDeputy.phone}</span>
                  </div>
                )}
                
                {selectedDeputy.whatsapp_number && (
                  <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                    <MessageCircle className="w-4 h-4 text-green-500" />
                    <span className="text-foreground" dir="ltr">{selectedDeputy.whatsapp_number}</span>
                  </div>
                )}
                
                {selectedDeputy.email && (
                  <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                    <Mail className="w-4 h-4 text-primary" />
                    <span className="text-foreground">{selectedDeputy.email}</span>
                  </div>
                )}

                {!selectedDeputy.phone && !selectedDeputy.whatsapp_number && !selectedDeputy.email && (
                  <p className="text-muted-foreground text-sm">لا توجد معلومات اتصال</p>
                )}
              </div>

              {/* Bio */}
              {selectedDeputy.bio && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-foreground">نبذة</h4>
                  <p className="text-muted-foreground text-sm leading-relaxed">{selectedDeputy.bio}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t border-border">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => {
                    setIsDetailModalOpen(false);
                    handleEdit(selectedDeputy);
                  }}
                >
                  <Edit className="w-4 h-4 ml-2" />
                  تعديل
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={() => setIsDetailModalOpen(false)}
                >
                  إغلاق
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
