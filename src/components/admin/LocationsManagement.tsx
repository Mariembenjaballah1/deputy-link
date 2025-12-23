import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, MapPin, Building, Home, Loader2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { invalidateLocationsCache } from '@/hooks/useLocations';

// Static data for initial import
import { wilayas as staticWilayas, dairas as staticDairas } from '@/data/mockData';
import { mutamadiyat as staticMutamadiyat } from '@/data/mutamadiyat';

interface DbWilaya {
  id: string;
  name: string;
  code: string;
}

interface DbDaira {
  id: string;
  name: string;
  wilaya_id: string;
}

interface DbMutamadiya {
  id: string;
  name: string;
  daira_id: string;
  wilaya_id: string;
}

export function LocationsManagement() {
  const [activeTab, setActiveTab] = useState('wilayas');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWilaya, setSelectedWilaya] = useState<string>('');
  const [selectedDaira, setSelectedDaira] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  
  // Database data
  const [wilayas, setWilayas] = useState<DbWilaya[]>([]);
  const [dairas, setDairas] = useState<DbDaira[]>([]);
  const [mutamadiyat, setMutamadiyat] = useState<DbMutamadiya[]>([]);
  
  // Modal states
  const [isWilayaModalOpen, setIsWilayaModalOpen] = useState(false);
  const [isDairaModalOpen, setIsDairaModalOpen] = useState(false);
  const [isMutamadiyaModalOpen, setIsMutamadiyaModalOpen] = useState(false);
  
  // Edit states
  const [editingWilaya, setEditingWilaya] = useState<DbWilaya | null>(null);
  const [editingDaira, setEditingDaira] = useState<DbDaira | null>(null);
  const [editingMutamadiya, setEditingMutamadiya] = useState<DbMutamadiya | null>(null);
  
  // Form states
  const [wilayaForm, setWilayaForm] = useState({ name: '', code: '' });
  const [dairaForm, setDairaForm] = useState({ name: '', wilayaId: '' });
  const [mutamadiyaForm, setMutamadiyaForm] = useState({ name: '', wilayaId: '', dairaId: '' });

  // Load data on mount
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [wilayasRes, dairasRes, mutamadiyatRes] = await Promise.all([
        supabase.from('wilayas').select('*').order('code'),
        supabase.from('dairas').select('*').order('name'),
        supabase.from('mutamadiyat').select('*').order('name'),
      ]);

      if (wilayasRes.error) throw wilayasRes.error;
      if (dairasRes.error) throw dairasRes.error;
      if (mutamadiyatRes.error) throw mutamadiyatRes.error;

      setWilayas(wilayasRes.data || []);
      setDairas(dairasRes.data || []);
      setMutamadiyat(mutamadiyatRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('خطأ في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  // Import static data to database
  const handleImportStaticData = async () => {
    if (wilayas.length > 0) {
      toast.error('البيانات موجودة مسبقاً في قاعدة البيانات');
      return;
    }

    setImporting(true);
    try {
      // Step 1: Import wilayas
      const wilayasToInsert = staticWilayas.map(w => ({
        name: w.name,
        code: w.code,
      }));

      const { data: insertedWilayas, error: wilayasError } = await supabase
        .from('wilayas')
        .insert(wilayasToInsert)
        .select();

      if (wilayasError) throw wilayasError;

      // Create mapping from old IDs to new UUIDs
      const wilayaIdMap: Record<string, string> = {};
      staticWilayas.forEach((sw, index) => {
        if (insertedWilayas && insertedWilayas[index]) {
          wilayaIdMap[sw.id] = insertedWilayas[index].id;
        }
      });

      // Step 2: Import dairas
      const dairasToInsert = staticDairas.map(d => ({
        name: d.name,
        wilaya_id: wilayaIdMap[d.wilayaId],
      }));

      const { data: insertedDairas, error: dairasError } = await supabase
        .from('dairas')
        .insert(dairasToInsert)
        .select();

      if (dairasError) throw dairasError;

      // Create mapping from old daira IDs to new UUIDs
      const dairaIdMap: Record<string, string> = {};
      staticDairas.forEach((sd, index) => {
        if (insertedDairas && insertedDairas[index]) {
          dairaIdMap[sd.id] = insertedDairas[index].id;
        }
      });

      // Step 3: Import mutamadiyat
      const mutamadiyatToInsert = staticMutamadiyat.map(m => ({
        name: m.name,
        daira_id: dairaIdMap[m.dairaId],
        wilaya_id: wilayaIdMap[m.wilayaId],
      }));

      const { error: mutamadiyatError } = await supabase
        .from('mutamadiyat')
        .insert(mutamadiyatToInsert);

      if (mutamadiyatError) throw mutamadiyatError;

      toast.success('تم استيراد البيانات بنجاح');
      invalidateLocationsCache();
      await loadAllData();
    } catch (error) {
      console.error('Error importing data:', error);
      toast.error('خطأ في استيراد البيانات');
    } finally {
      setImporting(false);
    }
  };
  
  // Filtered data
  const filteredWilayas = wilayas.filter(w => 
    w.name.includes(searchQuery) || w.code.includes(searchQuery)
  );
  
  const filteredDairas = dairas.filter(d => {
    const matchesSearch = d.name.includes(searchQuery);
    const matchesWilaya = !selectedWilaya || d.wilaya_id === selectedWilaya;
    return matchesSearch && matchesWilaya;
  });
  
  const filteredMutamadiyat = mutamadiyat.filter(m => {
    const matchesSearch = m.name.includes(searchQuery);
    const matchesWilaya = !selectedWilaya || m.wilaya_id === selectedWilaya;
    const matchesDaira = !selectedDaira || m.daira_id === selectedDaira;
    return matchesSearch && matchesWilaya && matchesDaira;
  });
  
  const dairasForFilter = selectedWilaya 
    ? dairas.filter(d => d.wilaya_id === selectedWilaya)
    : dairas;
  
  const dairasForMutamadiyaForm = mutamadiyaForm.wilayaId 
    ? dairas.filter(d => d.wilaya_id === mutamadiyaForm.wilayaId)
    : [];

  // CRUD Operations for Wilayas
  const handleSaveWilaya = async () => {
    if (!wilayaForm.name || !wilayaForm.code) {
      toast.error('الرجاء ملء جميع الحقول');
      return;
    }

    try {
      if (editingWilaya) {
        const { error } = await supabase
          .from('wilayas')
          .update({ name: wilayaForm.name, code: wilayaForm.code })
          .eq('id', editingWilaya.id);
        if (error) throw error;
        toast.success('تم تحديث الولاية');
      } else {
        const { error } = await supabase
          .from('wilayas')
          .insert({ name: wilayaForm.name, code: wilayaForm.code });
        if (error) throw error;
        toast.success('تمت إضافة الولاية');
      }
      setIsWilayaModalOpen(false);
      setEditingWilaya(null);
      setWilayaForm({ name: '', code: '' });
      invalidateLocationsCache();
      await loadAllData();
    } catch (error) {
      console.error('Error saving wilaya:', error);
      toast.error('خطأ في حفظ الولاية');
    }
  };

  const handleDeleteWilaya = async (id: string) => {
    try {
      const { error } = await supabase.from('wilayas').delete().eq('id', id);
      if (error) throw error;
      toast.success('تم حذف الولاية');
      invalidateLocationsCache();
      await loadAllData();
    } catch (error) {
      console.error('Error deleting wilaya:', error);
      toast.error('خطأ في حذف الولاية');
    }
  };

  // CRUD Operations for Dairas
  const handleSaveDaira = async () => {
    if (!dairaForm.name || !dairaForm.wilayaId) {
      toast.error('الرجاء ملء جميع الحقول');
      return;
    }

    try {
      if (editingDaira) {
        const { error } = await supabase
          .from('dairas')
          .update({ name: dairaForm.name, wilaya_id: dairaForm.wilayaId })
          .eq('id', editingDaira.id);
        if (error) throw error;
        toast.success('تم تحديث الدائرة');
      } else {
        const { error } = await supabase
          .from('dairas')
          .insert({ name: dairaForm.name, wilaya_id: dairaForm.wilayaId });
        if (error) throw error;
        toast.success('تمت إضافة الدائرة');
      }
      setIsDairaModalOpen(false);
      setEditingDaira(null);
      setDairaForm({ name: '', wilayaId: '' });
      invalidateLocationsCache();
      await loadAllData();
    } catch (error) {
      console.error('Error saving daira:', error);
      toast.error('خطأ في حفظ الدائرة');
    }
  };

  const handleDeleteDaira = async (id: string) => {
    try {
      const { error } = await supabase.from('dairas').delete().eq('id', id);
      if (error) throw error;
      toast.success('تم حذف الدائرة');
      invalidateLocationsCache();
      await loadAllData();
    } catch (error) {
      console.error('Error deleting daira:', error);
      toast.error('خطأ في حذف الدائرة');
    }
  };

  // CRUD Operations for Mutamadiyat
  const handleSaveMutamadiya = async () => {
    if (!mutamadiyaForm.name || !mutamadiyaForm.wilayaId || !mutamadiyaForm.dairaId) {
      toast.error('الرجاء ملء جميع الحقول');
      return;
    }

    try {
      if (editingMutamadiya) {
        const { error } = await supabase
          .from('mutamadiyat')
          .update({ 
            name: mutamadiyaForm.name, 
            wilaya_id: mutamadiyaForm.wilayaId,
            daira_id: mutamadiyaForm.dairaId 
          })
          .eq('id', editingMutamadiya.id);
        if (error) throw error;
        toast.success('تم تحديث المعتمدية');
      } else {
        const { error } = await supabase
          .from('mutamadiyat')
          .insert({ 
            name: mutamadiyaForm.name, 
            wilaya_id: mutamadiyaForm.wilayaId,
            daira_id: mutamadiyaForm.dairaId 
          });
        if (error) throw error;
        toast.success('تمت إضافة المعتمدية');
      }
      setIsMutamadiyaModalOpen(false);
      setEditingMutamadiya(null);
      setMutamadiyaForm({ name: '', wilayaId: '', dairaId: '' });
      invalidateLocationsCache();
      await loadAllData();
    } catch (error) {
      console.error('Error saving mutamadiya:', error);
      toast.error('خطأ في حفظ المعتمدية');
    }
  };

  const handleDeleteMutamadiya = async (id: string) => {
    try {
      const { error } = await supabase.from('mutamadiyat').delete().eq('id', id);
      if (error) throw error;
      toast.success('تم حذف المعتمدية');
      invalidateLocationsCache();
      await loadAllData();
    } catch (error) {
      console.error('Error deleting mutamadiya:', error);
      toast.error('خطأ في حذف المعتمدية');
    }
  };

  // Edit handlers
  const openEditWilaya = (wilaya: DbWilaya) => {
    setEditingWilaya(wilaya);
    setWilayaForm({ name: wilaya.name, code: wilaya.code });
    setIsWilayaModalOpen(true);
  };

  const openEditDaira = (daira: DbDaira) => {
    setEditingDaira(daira);
    setDairaForm({ name: daira.name, wilayaId: daira.wilaya_id });
    setIsDairaModalOpen(true);
  };

  const openEditMutamadiya = (m: DbMutamadiya) => {
    setEditingMutamadiya(m);
    setMutamadiyaForm({ name: m.name, wilayaId: m.wilaya_id, dairaId: m.daira_id });
    setIsMutamadiyaModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {/* Import Button - show only if database is empty */}
      {wilayas.length === 0 && (
        <div className="bg-primary/10 border border-primary/20 rounded-xl p-6 mb-6 text-center">
          <h3 className="text-lg font-bold text-foreground mb-2">قاعدة البيانات فارغة</h3>
          <p className="text-muted-foreground mb-4">
            اضغط على الزر أدناه لاستيراد بيانات الولايات والدوائر والمعتمديات
          </p>
          <Button onClick={handleImportStaticData} disabled={importing} className="gap-2">
            {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {importing ? 'جاري الاستيراد...' : 'استيراد البيانات'}
          </Button>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <TabsList className="bg-muted">
            <TabsTrigger value="wilayas" className="gap-2">
              <MapPin className="w-4 h-4" />
              الولايات ({wilayas.length})
            </TabsTrigger>
            <TabsTrigger value="dairas" className="gap-2">
              <Building className="w-4 h-4" />
              الدوائر ({dairas.length})
            </TabsTrigger>
            <TabsTrigger value="mutamadiyat" className="gap-2">
              <Home className="w-4 h-4" />
              المعتمديات ({mutamadiyat.length})
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="بحث..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
          </div>
          
          {(activeTab === 'dairas' || activeTab === 'mutamadiyat') && (
            <Select value={selectedWilaya || '__all__'} onValueChange={(value) => {
              setSelectedWilaya(value === '__all__' ? '' : value);
              setSelectedDaira('');
            }}>
              <SelectTrigger className="w-full sm:w-48 bg-card">
                <SelectValue placeholder="اختر الولاية" />
              </SelectTrigger>
              <SelectContent className="bg-card border border-border z-50">
                <SelectItem value="__all__">كل الولايات</SelectItem>
                {wilayas.map(w => (
                  <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          
          {activeTab === 'mutamadiyat' && selectedWilaya && (
            <Select value={selectedDaira || '__all__'} onValueChange={(value) => setSelectedDaira(value === '__all__' ? '' : value)}>
              <SelectTrigger className="w-full sm:w-48 bg-card">
                <SelectValue placeholder="اختر الدائرة" />
              </SelectTrigger>
              <SelectContent className="bg-card border border-border z-50">
                <SelectItem value="__all__">كل الدوائر</SelectItem>
                {dairasForFilter.map(d => (
                  <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Wilayas Tab */}
        <TabsContent value="wilayas">
          <div className="flex items-center justify-between mb-4">
            <p className="text-muted-foreground">{filteredWilayas.length} ولاية</p>
            <Button variant="default" className="gap-2" onClick={() => {
              setEditingWilaya(null);
              setWilayaForm({ name: '', code: '' });
              setIsWilayaModalOpen(true);
            }}>
              <Plus className="w-4 h-4" />
              إضافة ولاية
            </Button>
          </div>
          <ScrollArea className="h-[500px]">
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              {filteredWilayas.map((wilaya) => (
                <div key={wilaya.id} className="flex items-center justify-between p-4 border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">{wilaya.code}</span>
                    <span className="font-medium text-foreground">{wilaya.name}</span>
                    <span className="text-xs text-muted-foreground">
                      ({dairas.filter(d => d.wilaya_id === wilaya.id).length} دائرة)
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEditWilaya(wilaya)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-card">
                        <AlertDialogHeader>
                          <AlertDialogTitle>حذف الولاية</AlertDialogTitle>
                          <AlertDialogDescription>
                            هل أنت متأكد من حذف ولاية {wilaya.name}؟ سيتم حذف جميع الدوائر والمعتمديات المرتبطة بها.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>إلغاء</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteWilaya(wilaya.id)}>حذف</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Dairas Tab */}
        <TabsContent value="dairas">
          <div className="flex items-center justify-between mb-4">
            <p className="text-muted-foreground">{filteredDairas.length} دائرة</p>
            <Button variant="default" className="gap-2" onClick={() => {
              setEditingDaira(null);
              setDairaForm({ name: '', wilayaId: '' });
              setIsDairaModalOpen(true);
            }}>
              <Plus className="w-4 h-4" />
              إضافة دائرة
            </Button>
          </div>
          <ScrollArea className="h-[500px]">
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              {filteredDairas.map((daira) => {
                const wilaya = wilayas.find(w => w.id === daira.wilaya_id);
                const mutamadiyatCount = mutamadiyat.filter(m => m.daira_id === daira.id).length;
                return (
                  <div key={daira.id} className="flex items-center justify-between p-4 border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-foreground">{daira.name}</span>
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                        {wilaya?.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ({mutamadiyatCount} معتمدية)
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEditDaira(daira)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-card">
                          <AlertDialogHeader>
                            <AlertDialogTitle>حذف الدائرة</AlertDialogTitle>
                            <AlertDialogDescription>
                              هل أنت متأكد من حذف دائرة {daira.name}؟ سيتم حذف جميع المعتمديات المرتبطة بها.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>إلغاء</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteDaira(daira.id)}>حذف</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Mutamadiyat Tab */}
        <TabsContent value="mutamadiyat">
          <div className="flex items-center justify-between mb-4">
            <p className="text-muted-foreground">{filteredMutamadiyat.length} معتمدية</p>
            <Button variant="default" className="gap-2" onClick={() => {
              setEditingMutamadiya(null);
              setMutamadiyaForm({ name: '', wilayaId: '', dairaId: '' });
              setIsMutamadiyaModalOpen(true);
            }}>
              <Plus className="w-4 h-4" />
              إضافة معتمدية
            </Button>
          </div>
          <ScrollArea className="h-[500px]">
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              {filteredMutamadiyat.map((m) => {
                const wilaya = wilayas.find(w => w.id === m.wilaya_id);
                const daira = dairas.find(d => d.id === m.daira_id);
                return (
                  <div key={m.id} className="flex items-center justify-between p-4 border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-medium text-foreground">{m.name}</span>
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                        {daira?.name}
                      </span>
                      <span className="text-xs text-primary bg-primary/10 px-2 py-1 rounded">
                        {wilaya?.name}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEditMutamadiya(m)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-card">
                          <AlertDialogHeader>
                            <AlertDialogTitle>حذف المعتمدية</AlertDialogTitle>
                            <AlertDialogDescription>
                              هل أنت متأكد من حذف معتمدية {m.name}؟
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>إلغاء</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteMutamadiya(m.id)}>حذف</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* Add/Edit Wilaya Modal */}
      <Dialog open={isWilayaModalOpen} onOpenChange={setIsWilayaModalOpen}>
        <DialogContent className="bg-card">
          <DialogHeader>
            <DialogTitle>{editingWilaya ? 'تعديل الولاية' : 'إضافة ولاية جديدة'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>اسم الولاية</Label>
              <Input
                value={wilayaForm.name}
                onChange={(e) => setWilayaForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="اسم الولاية"
              />
            </div>
            <div className="space-y-2">
              <Label>رمز الولاية</Label>
              <Input
                value={wilayaForm.code}
                onChange={(e) => setWilayaForm(prev => ({ ...prev, code: e.target.value }))}
                placeholder="مثال: 01"
                maxLength={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsWilayaModalOpen(false)}>إلغاء</Button>
            <Button onClick={handleSaveWilaya}>{editingWilaya ? 'تحديث' : 'إضافة'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Daira Modal */}
      <Dialog open={isDairaModalOpen} onOpenChange={setIsDairaModalOpen}>
        <DialogContent className="bg-card">
          <DialogHeader>
            <DialogTitle>{editingDaira ? 'تعديل الدائرة' : 'إضافة دائرة جديدة'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>الولاية</Label>
              <Select 
                value={dairaForm.wilayaId} 
                onValueChange={(value) => setDairaForm(prev => ({ ...prev, wilayaId: value }))}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="اختر الولاية" />
                </SelectTrigger>
                <SelectContent className="bg-card border border-border z-50">
                  {wilayas.map(w => (
                    <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>اسم الدائرة</Label>
              <Input
                value={dairaForm.name}
                onChange={(e) => setDairaForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="اسم الدائرة"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDairaModalOpen(false)}>إلغاء</Button>
            <Button onClick={handleSaveDaira}>{editingDaira ? 'تحديث' : 'إضافة'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Mutamadiya Modal */}
      <Dialog open={isMutamadiyaModalOpen} onOpenChange={setIsMutamadiyaModalOpen}>
        <DialogContent className="bg-card">
          <DialogHeader>
            <DialogTitle>{editingMutamadiya ? 'تعديل المعتمدية' : 'إضافة معتمدية جديدة'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>الولاية</Label>
              <Select 
                value={mutamadiyaForm.wilayaId} 
                onValueChange={(value) => setMutamadiyaForm(prev => ({ ...prev, wilayaId: value, dairaId: '' }))}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="اختر الولاية" />
                </SelectTrigger>
                <SelectContent className="bg-card border border-border z-50">
                  {wilayas.map(w => (
                    <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>الدائرة</Label>
              <Select 
                value={mutamadiyaForm.dairaId} 
                onValueChange={(value) => setMutamadiyaForm(prev => ({ ...prev, dairaId: value }))}
                disabled={!mutamadiyaForm.wilayaId}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="اختر الدائرة" />
                </SelectTrigger>
                <SelectContent className="bg-card border border-border z-50">
                  {dairasForMutamadiyaForm.map(d => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>اسم المعتمدية</Label>
              <Input
                value={mutamadiyaForm.name}
                onChange={(e) => setMutamadiyaForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="اسم المعتمدية"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMutamadiyaModalOpen(false)}>إلغاء</Button>
            <Button onClick={handleSaveMutamadiya}>{editingMutamadiya ? 'تحديث' : 'إضافة'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
