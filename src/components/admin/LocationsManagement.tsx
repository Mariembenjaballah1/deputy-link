import { useState } from 'react';
import { Plus, Edit, Trash2, Search, MapPin, Building, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { wilayas, dairas } from '@/data/mockData';
import { mutamadiyat } from '@/data/mutamadiyat';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';

export function LocationsManagement() {
  const [activeTab, setActiveTab] = useState('wilayas');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWilaya, setSelectedWilaya] = useState<string>('');
  const [selectedDaira, setSelectedDaira] = useState<string>('');
  
  // Modal states
  const [isWilayaModalOpen, setIsWilayaModalOpen] = useState(false);
  const [isDairaModalOpen, setIsDairaModalOpen] = useState(false);
  const [isMutamadiyaModalOpen, setIsMutamadiyaModalOpen] = useState(false);
  
  // Form states
  const [wilayaForm, setWilayaForm] = useState({ name: '', code: '' });
  const [dairaForm, setDairaForm] = useState({ name: '', wilayaId: '' });
  const [mutamadiyaForm, setMutamadiyaForm] = useState({ name: '', wilayaId: '', dairaId: '' });
  
  // Filtered data
  const filteredWilayas = wilayas.filter(w => 
    w.name.includes(searchQuery) || w.code.includes(searchQuery)
  );
  
  const filteredDairas = dairas.filter(d => {
    const matchesSearch = d.name.includes(searchQuery);
    const matchesWilaya = !selectedWilaya || d.wilayaId === selectedWilaya;
    return matchesSearch && matchesWilaya;
  });
  
  const filteredMutamadiyat = mutamadiyat.filter(m => {
    const matchesSearch = m.name.includes(searchQuery);
    const matchesWilaya = !selectedWilaya || m.wilayaId === selectedWilaya;
    const matchesDaira = !selectedDaira || m.dairaId === selectedDaira;
    return matchesSearch && matchesWilaya && matchesDaira;
  });
  
  const dairasForFilter = selectedWilaya 
    ? dairas.filter(d => d.wilayaId === selectedWilaya)
    : dairas;
  
  const dairasForMutamadiyaForm = mutamadiyaForm.wilayaId 
    ? dairas.filter(d => d.wilayaId === mutamadiyaForm.wilayaId)
    : [];

  const handleAddWilaya = () => {
    if (!wilayaForm.name || !wilayaForm.code) {
      toast.error('الرجاء ملء جميع الحقول');
      return;
    }
    toast.success(`تمت إضافة الولاية: ${wilayaForm.name}`);
    setIsWilayaModalOpen(false);
    setWilayaForm({ name: '', code: '' });
  };

  const handleAddDaira = () => {
    if (!dairaForm.name || !dairaForm.wilayaId) {
      toast.error('الرجاء ملء جميع الحقول');
      return;
    }
    toast.success(`تمت إضافة الدائرة: ${dairaForm.name}`);
    setIsDairaModalOpen(false);
    setDairaForm({ name: '', wilayaId: '' });
  };

  const handleAddMutamadiya = () => {
    if (!mutamadiyaForm.name || !mutamadiyaForm.wilayaId || !mutamadiyaForm.dairaId) {
      toast.error('الرجاء ملء جميع الحقول');
      return;
    }
    toast.success(`تمت إضافة المعتمدية: ${mutamadiyaForm.name}`);
    setIsMutamadiyaModalOpen(false);
    setMutamadiyaForm({ name: '', wilayaId: '', dairaId: '' });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
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
            <Select value={selectedWilaya} onValueChange={(value) => {
              setSelectedWilaya(value);
              setSelectedDaira('');
            }}>
              <SelectTrigger className="w-full sm:w-48 bg-card">
                <SelectValue placeholder="اختر الولاية" />
              </SelectTrigger>
              <SelectContent className="bg-card border border-border z-50">
                <SelectItem value="">كل الولايات</SelectItem>
                {wilayas.map(w => (
                  <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          
          {activeTab === 'mutamadiyat' && selectedWilaya && (
            <Select value={selectedDaira} onValueChange={setSelectedDaira}>
              <SelectTrigger className="w-full sm:w-48 bg-card">
                <SelectValue placeholder="اختر الدائرة" />
              </SelectTrigger>
              <SelectContent className="bg-card border border-border z-50">
                <SelectItem value="">كل الدوائر</SelectItem>
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
            <Button variant="default" className="gap-2" onClick={() => setIsWilayaModalOpen(true)}>
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
                      ({dairas.filter(d => d.wilayaId === wilaya.id).length} دائرة)
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
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
            <Button variant="default" className="gap-2" onClick={() => setIsDairaModalOpen(true)}>
              <Plus className="w-4 h-4" />
              إضافة دائرة
            </Button>
          </div>
          <ScrollArea className="h-[500px]">
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              {filteredDairas.map((daira) => {
                const wilaya = wilayas.find(w => w.id === daira.wilayaId);
                const mutamadiyatCount = mutamadiyat.filter(m => m.dairaId === daira.id).length;
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
                      <Button variant="ghost" size="icon">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
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
            <Button variant="default" className="gap-2" onClick={() => setIsMutamadiyaModalOpen(true)}>
              <Plus className="w-4 h-4" />
              إضافة معتمدية
            </Button>
          </div>
          <ScrollArea className="h-[500px]">
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              {filteredMutamadiyat.map((m) => {
                const wilaya = wilayas.find(w => w.id === m.wilayaId);
                const daira = dairas.find(d => d.id === m.dairaId);
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
                      <Button variant="ghost" size="icon">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* Add Wilaya Modal */}
      <Dialog open={isWilayaModalOpen} onOpenChange={setIsWilayaModalOpen}>
        <DialogContent className="bg-card">
          <DialogHeader>
            <DialogTitle>إضافة ولاية جديدة</DialogTitle>
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
            <Button onClick={handleAddWilaya}>إضافة</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Daira Modal */}
      <Dialog open={isDairaModalOpen} onOpenChange={setIsDairaModalOpen}>
        <DialogContent className="bg-card">
          <DialogHeader>
            <DialogTitle>إضافة دائرة جديدة</DialogTitle>
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
            <Button onClick={handleAddDaira}>إضافة</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Mutamadiya Modal */}
      <Dialog open={isMutamadiyaModalOpen} onOpenChange={setIsMutamadiyaModalOpen}>
        <DialogContent className="bg-card">
          <DialogHeader>
            <DialogTitle>إضافة معتمدية جديدة</DialogTitle>
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
            <Button onClick={handleAddMutamadiya}>إضافة</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
