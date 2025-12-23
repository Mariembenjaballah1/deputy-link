import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Loader2, Building2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { wilayas, dairas } from '@/data/mockData';
import { LocalDeputyFormModal } from './LocalDeputyFormModal';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';

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
  const [deputies, setDeputies] = useState<LocalDeputy[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [wilayaFilter, setWilayaFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDeputy, setEditingDeputy] = useState<LocalDeputy | null>(null);

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
                {wilayas.find(w => w.id === deputy.wilaya_id)?.name} - {dairas.find(d => d.id === deputy.daira_id)?.name}
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
              <Button variant="ghost" size="icon" onClick={() => handleEdit(deputy)}>
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
    </motion.div>
  );
}
