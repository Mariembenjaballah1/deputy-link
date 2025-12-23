import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  LayoutDashboard, Users, MapPin, MessageSquare, BarChart3, 
  Settings, LogOut, Menu, X, Plus, Edit, Trash2, Check, XCircle,
  Bell, FileText, Shield, Loader2, Building2, Eye, Phone, Mail, Globe, Briefcase
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/authStore';
import { wilayas, dairas } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { MPImportDialog } from '@/components/admin/MPImportDialog';
import { MPFormModal } from '@/components/admin/MPFormModal';
import { LocalDeputiesManagement } from '@/components/admin/LocalDeputiesManagement';
import { LocationsManagement } from '@/components/admin/LocationsManagement';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import type { MP, Complaint } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { SettingsSection } from '@/components/dashboard/SettingsSection';
import { AdminComplaintsTable } from '@/components/admin/AdminComplaintsTable';
import { AdminReportsSection } from '@/components/admin/AdminReportsSection';
import { PendingRegistrations } from '@/components/admin/PendingRegistrations';
import { ComplaintDetailModal } from '@/components/complaint/ComplaintDetailModal';
const sidebarItems = [
  { icon: LayoutDashboard, label: 'لوحة التحكم', id: 'dashboard' },
  { icon: Users, label: 'النواب', id: 'mps' },
  { icon: Building2, label: 'نواب الجهات', id: 'local_deputies' },
  { icon: MapPin, label: 'الولايات', id: 'locations' },
  { icon: MessageSquare, label: 'الشكاوى', id: 'complaints' },
  { icon: BarChart3, label: 'التقارير', id: 'reports' },
  { icon: Settings, label: 'الإعدادات', id: 'settings' },
];

export default function AdminDashboard() {
  const { user, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mps, setMps] = useState<MP[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [isMPModalOpen, setIsMPModalOpen] = useState(false);
  const [editingMP, setEditingMP] = useState<MP | null>(null);
  const [localDeputiesCount, setLocalDeputiesCount] = useState(0);
  const [wilayasCount, setWilayasCount] = useState(0);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [selectedMP, setSelectedMP] = useState<MP | null>(null);
  const [isMPDetailModalOpen, setIsMPDetailModalOpen] = useState(false);

  // Load data from database on mount
  useEffect(() => {
    loadMPs();
    loadCounts();
  }, []);

  const loadCounts = async () => {
    try {
      // Load local deputies count
      const { count: deputiesCount } = await supabase
        .from('local_deputies')
        .select('*', { count: 'exact', head: true });
      
      setLocalDeputiesCount(deputiesCount || 0);

      // Load wilayas count from database
      const { count: wilayasDbCount } = await supabase
        .from('wilayas')
        .select('*', { count: 'exact', head: true });
      
      setWilayasCount(wilayasDbCount || 0);
    } catch (error) {
      console.error('Error loading counts:', error);
    }
  };

  const loadMPs = async () => {
    try {
      const { data, error } = await supabase
        .from('mps')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        const formattedMps: MP[] = data.map(mp => ({
          id: mp.id,
          name: mp.name,
          image: mp.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(mp.name)}&background=random`,
          wilaya: mp.wilaya,
          wilayaId: mp.wilaya_id || '',
          dairaId: mp.daira_id || '',
          daira: mp.daira || undefined,
          bloc: mp.bloc || undefined,
          complaintsCount: mp.complaints_count || 0,
          responseRate: mp.response_rate || 0,
          email: mp.email || undefined,
          phone: mp.phone || undefined,
          bio: mp.bio || undefined,
          profileUrl: mp.profile_url || undefined,
        }));
        setMps(formattedMps);
      }
    } catch (error) {
      console.error('Error loading MPs:', error);
      setMps([]);
    } finally {
      setLoading(false);
    }
  };

  const handleImportMPs = async (importedMps: { name: string; daira: string; bloc: string; wilaya: string; profileUrl?: string }[]) => {
    setSaving(true);
    try {
      const mpsToInsert = importedMps.map((mp) => {
        const wilayaObj = wilayas.find(w => w.name === mp.wilaya);
        // Find daira that matches the name AND belongs to the same wilaya
        const dairaObj = dairas.find(d => 
          d.name === mp.daira && 
          (wilayaObj ? d.wilayaId === wilayaObj.id : true)
        ) || dairas.find(d => d.name === mp.daira);
        
        return {
          name: mp.name,
          image: `https://ui-avatars.com/api/?name=${encodeURIComponent(mp.name)}&background=random`,
          wilaya: mp.wilaya,
          wilaya_id: wilayaObj?.id || null,
          daira_id: dairaObj?.id || null,
          daira: mp.daira || dairaObj?.name || null,
          bloc: mp.bloc,
          complaints_count: 0,
          response_rate: 0,
          bio: `كتلة: ${mp.bloc}`,
          profile_url: mp.profileUrl || null,
        };
      });

      const { data, error } = await supabase
        .from('mps')
        .insert(mpsToInsert)
        .select();

      if (error) throw error;

      toast.success(`تم إضافة ${importedMps.length} نائب جديد وحفظهم في قاعدة البيانات`);
      
      // Reload MPs from database
      await loadMPs();
    } catch (error) {
      console.error('Error saving MPs:', error);
      toast.error('خطأ في حفظ البيانات');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMP = async (mpId: string) => {
    try {
      const { error } = await supabase
        .from('mps')
        .delete()
        .eq('id', mpId);

      if (error) throw error;

      setMps(prev => prev.filter(mp => mp.id !== mpId));
      toast.success('تم حذف النائب');
    } catch (error) {
      console.error('Error deleting MP:', error);
      toast.error('خطأ في حذف النائب');
    }
  };

  const handleViewMPDetails = (mp: MP) => {
    setSelectedMP(mp);
    setIsMPDetailModalOpen(true);
  };

  const stats = {
    mps: mps.length,
    localDeputies: localDeputiesCount,
    wilayas: wilayasCount,
    complaints: 0,
    pending: pendingCount,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 right-0 z-50 w-64 bg-foreground text-background transform transition-transform duration-300 lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
      )}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <Shield className="w-6 h-6" />
              <h1 className="text-xl font-bold">إدارة شكوى</h1>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden">
              <X className="w-6 h-6" />
            </button>
          </div>
          
          {/* User Info */}
          <div className="flex items-center gap-3 mb-8 p-3 bg-background/10 rounded-xl">
            <div className="w-10 h-10 rounded-full bg-background/20 flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <p className="font-medium">{user?.name || 'مدير'}</p>
              <p className="text-xs text-background/70">مدير النظام</p>
            </div>
          </div>

          <nav className="space-y-2">
            {sidebarItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
                  activeTab === item.id 
                    ? "bg-background text-foreground" 
                    : "hover:bg-background/10"
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="absolute bottom-6 right-6 left-6">
          <Link to="/auth">
            <Button 
              variant="ghost" 
              className="w-full justify-start gap-3 text-background/70 hover:text-background hover:bg-background/10"
              onClick={logout}
            >
              <LogOut className="w-5 h-5" />
              تسجيل الخروج
            </Button>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:mr-64">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden">
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-bold text-foreground">
              {sidebarItems.find(i => i.id === activeTab)?.label}
            </h2>
            <button className="relative" onClick={() => setActiveTab('dashboard')}>
              <Bell className="w-6 h-6 text-muted-foreground" />
              {pendingCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
                  {pendingCount}
                </span>
              )}
            </button>
          </div>
        </header>

        <div className="p-6">
          {/* Dashboard */}
          {activeTab === 'dashboard' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {/* Stats Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                <div className="bg-card rounded-2xl p-4 border border-border">
                  <Users className="w-8 h-8 text-primary mb-2" />
                  <p className="text-2xl font-bold text-foreground">{stats.mps}</p>
                  <p className="text-sm text-muted-foreground">النواب</p>
                </div>
                <div className="bg-card rounded-2xl p-4 border border-border">
                  <Building2 className="w-8 h-8 text-accent mb-2" />
                  <p className="text-2xl font-bold text-foreground">{stats.localDeputies}</p>
                  <p className="text-sm text-muted-foreground">نواب الجهات</p>
                </div>
                <div className="bg-card rounded-2xl p-4 border border-border">
                  <MapPin className="w-8 h-8 text-secondary mb-2" />
                  <p className="text-2xl font-bold text-foreground">{stats.wilayas}</p>
                  <p className="text-sm text-muted-foreground">الولايات</p>
                </div>
                <div className="bg-card rounded-2xl p-4 border border-border">
                  <MessageSquare className="w-8 h-8 text-warning mb-2" />
                  <p className="text-2xl font-bold text-foreground">{stats.complaints}</p>
                  <p className="text-sm text-muted-foreground">الشكاوى</p>
                </div>
                <div className="bg-card rounded-2xl p-4 border border-border">
                  <FileText className="w-8 h-8 text-destructive mb-2" />
                  <p className="text-2xl font-bold text-foreground">{stats.pending}</p>
                  <p className="text-sm text-muted-foreground">قيد الانتظار</p>
                </div>
              </div>

              {/* Pending Registrations */}
              <h3 className="text-lg font-bold text-foreground mb-4">
                طلبات تسجيل النواب
                {pendingCount > 0 && (
                  <span className="mr-2 text-sm bg-destructive text-destructive-foreground px-2 py-0.5 rounded-full">
                    {pendingCount}
                  </span>
                )}
              </h3>
              <PendingRegistrations onCountChange={setPendingCount} />
            </motion.div>
          )}

          {/* MPs Management */}
          {activeTab === 'mps' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="flex items-center justify-between mb-6">
                <p className="text-muted-foreground">
                  {mps.length} نائب مسجل
                  {saving && <Loader2 className="w-4 h-4 animate-spin inline mr-2" />}
                </p>
                <div className="flex gap-2">
                  <MPImportDialog onImport={handleImportMPs} />
                  <Button variant="default" className="gap-2" onClick={() => { setEditingMP(null); setIsMPModalOpen(true); }}>
                    <Plus className="w-4 h-4" />
                    إضافة نائب
                  </Button>
                </div>
              </div>
              
              <div className="grid gap-4">
                {mps.map((mp) => (
                  <div key={mp.id} className="bg-card rounded-xl p-4 border border-border flex items-center gap-4">
                    <img src={mp.image} alt={mp.name} className="w-12 h-12 rounded-full" />
                    <div className="flex-1">
                      <p className="font-bold text-foreground">{mp.name}</p>
                      <p className="text-sm text-muted-foreground">{mp.wilaya}</p>
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-foreground">{mp.complaintsCount}</p>
                      <p className="text-xs text-muted-foreground">شكوى</p>
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-secondary">{mp.responseRate}%</p>
                      <p className="text-xs text-muted-foreground">نسبة الرد</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleViewMPDetails(mp)} title="عرض التفاصيل">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => { setEditingMP(mp); setIsMPModalOpen(true); }} title="تعديل">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-destructive"
                        onClick={() => handleDeleteMP(mp.id)}
                        title="حذف"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <MPFormModal
                isOpen={isMPModalOpen}
                onClose={() => setIsMPModalOpen(false)}
                onSuccess={loadMPs}
                editMP={editingMP}
              />
            </motion.div>
          )}

          {/* Local Deputies Management */}
          {activeTab === 'local_deputies' && (
            <LocalDeputiesManagement />
          )}

          {/* Locations Management */}
          {activeTab === 'locations' && (
            <LocationsManagement />
          )}

          {/* Complaints */}
          {activeTab === 'complaints' && (
            <AdminComplaintsTable onViewComplaint={setSelectedComplaint} />
          )}

          {/* Reports */}
          {activeTab === 'reports' && (
            <AdminReportsSection />
          )}

          {/* Settings */}
          {activeTab === 'settings' && (
            <SettingsSection type="admin" />
          )}
        </div>
      </main>

      {/* Complaint Detail Modal */}
      <ComplaintDetailModal
        complaint={selectedComplaint}
        isOpen={!!selectedComplaint}
        onClose={() => setSelectedComplaint(null)}
        onUpdate={() => {}}
      />

      {/* MP Detail Modal */}
      <Dialog open={isMPDetailModalOpen} onOpenChange={setIsMPDetailModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>تفاصيل النائب البرلماني</DialogTitle>
          </DialogHeader>
          {selectedMP && (
            <div className="space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Header with image and name */}
              <div className="flex items-center gap-4">
                <img
                  src={selectedMP.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedMP.name)}&background=random&size=128`}
                  alt={selectedMP.name}
                  className="w-24 h-24 rounded-full object-cover border-4 border-primary/20"
                />
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-foreground">{selectedMP.name}</h3>
                  {selectedMP.bloc && (
                    <Badge variant="secondary" className="mt-1">
                      <Briefcase className="w-3 h-3 ml-1" />
                      {selectedMP.bloc}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-primary/10 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-primary">{selectedMP.complaintsCount}</p>
                  <p className="text-sm text-muted-foreground">شكوى</p>
                </div>
                <div className="bg-secondary/10 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-secondary">{selectedMP.responseRate}%</p>
                  <p className="text-sm text-muted-foreground">نسبة الرد</p>
                </div>
              </div>

              {/* Location */}
              <div className="space-y-3">
                <h4 className="font-semibold text-foreground flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  الموقع الجغرافي
                </h4>
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">الولاية</p>
                      <p className="font-medium text-foreground">{selectedMP.wilaya}</p>
                    </div>
                    {selectedMP.daira && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">الدائرة</p>
                        <p className="font-medium text-foreground">{selectedMP.daira}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-3">
                <h4 className="font-semibold text-foreground">معلومات الاتصال</h4>
                
                {selectedMP.phone && (
                  <a href={`tel:${selectedMP.phone}`} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                    <Phone className="w-4 h-4 text-primary" />
                    <span className="text-foreground" dir="ltr">{selectedMP.phone}</span>
                  </a>
                )}
                
                {selectedMP.email && (
                  <a href={`mailto:${selectedMP.email}`} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                    <Mail className="w-4 h-4 text-primary" />
                    <span className="text-foreground">{selectedMP.email}</span>
                  </a>
                )}

                {selectedMP.profileUrl && (
                  <a href={selectedMP.profileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                    <Globe className="w-4 h-4 text-primary" />
                    <span className="text-foreground truncate">الملف الشخصي الرسمي</span>
                  </a>
                )}

                {!selectedMP.phone && !selectedMP.email && !selectedMP.profileUrl && (
                  <p className="text-muted-foreground text-sm">لا توجد معلومات اتصال</p>
                )}
              </div>

              {/* Bio */}
              {selectedMP.bio && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-foreground">نبذة</h4>
                  <p className="text-muted-foreground text-sm leading-relaxed bg-muted/30 rounded-lg p-4">{selectedMP.bio}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t border-border sticky bottom-0 bg-background">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => {
                    setIsMPDetailModalOpen(false);
                    setEditingMP(selectedMP);
                    setIsMPModalOpen(true);
                  }}
                >
                  <Edit className="w-4 h-4 ml-2" />
                  تعديل
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={() => setIsMPDetailModalOpen(false)}
                >
                  إغلاق
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
