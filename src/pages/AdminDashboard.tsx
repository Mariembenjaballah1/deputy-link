import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  LayoutDashboard, Users, MapPin, MessageSquare, BarChart3, 
  Settings, LogOut, Menu, X, Plus, Edit, Trash2, Check, XCircle,
  Bell, FileText, Shield, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/authStore';
import { wilayas, dairas } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { MPImportDialog } from '@/components/admin/MPImportDialog';
import type { MP } from '@/types';
import { supabase } from '@/integrations/supabase/client';

const sidebarItems = [
  { icon: LayoutDashboard, label: 'لوحة التحكم', id: 'dashboard' },
  { icon: Users, label: 'النواب', id: 'mps' },
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

  // Load MPs from database on mount
  useEffect(() => {
    loadMPs();
  }, []);

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
          complaintsCount: mp.complaints_count || 0,
          responseRate: mp.response_rate || 0,
          email: mp.email || undefined,
          phone: mp.phone || undefined,
          bio: mp.bio || undefined,
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
        const dairaObj = dairas.find(d => d.name === mp.daira);
        
        return {
          name: mp.name,
          image: `https://ui-avatars.com/api/?name=${encodeURIComponent(mp.name)}&background=random`,
          wilaya: mp.wilaya,
          wilaya_id: wilayaObj?.id || null,
          daira_id: dairaObj?.id || null,
          daira: mp.daira,
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

  const stats = {
    mps: mps.length,
    wilayas: wilayas.length,
    complaints: 0,
    pending: 0,
  };

  const handleApproveMP = (name: string) => {
    toast.success(`تم قبول النائب: ${name}`);
  };

  const handleRejectMP = (name: string) => {
    toast.error(`تم رفض النائب: ${name}`);
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
            <button className="relative">
              <Bell className="w-6 h-6 text-muted-foreground" />
            </button>
          </div>
        </header>

        <div className="p-6">
          {/* Dashboard */}
          {activeTab === 'dashboard' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {/* Stats Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-card rounded-2xl p-4 border border-border">
                  <Users className="w-8 h-8 text-primary mb-2" />
                  <p className="text-2xl font-bold text-foreground">{stats.mps}</p>
                  <p className="text-sm text-muted-foreground">النواب</p>
                </div>
                <div className="bg-card rounded-2xl p-4 border border-border">
                  <MapPin className="w-8 h-8 text-secondary mb-2" />
                  <p className="text-2xl font-bold text-foreground">{stats.wilayas}</p>
                  <p className="text-sm text-muted-foreground">الولايات</p>
                </div>
                <div className="bg-card rounded-2xl p-4 border border-border">
                  <MessageSquare className="w-8 h-8 text-accent mb-2" />
                  <p className="text-2xl font-bold text-foreground">{stats.complaints}</p>
                  <p className="text-sm text-muted-foreground">الشكاوى</p>
                </div>
                <div className="bg-card rounded-2xl p-4 border border-border">
                  <FileText className="w-8 h-8 text-warning mb-2" />
                  <p className="text-2xl font-bold text-foreground">{stats.pending}</p>
                  <p className="text-sm text-muted-foreground">قيد الانتظار</p>
                </div>
              </div>

              {/* Pending MP Approvals */}
              <h3 className="text-lg font-bold text-foreground mb-4">طلبات تسجيل النواب</h3>
              <div className="bg-card rounded-xl border border-border overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-right p-4 font-medium text-muted-foreground">الاسم</th>
                      <th className="text-right p-4 font-medium text-muted-foreground">الهاتف</th>
                      <th className="text-right p-4 font-medium text-muted-foreground">الولاية</th>
                      <th className="text-right p-4 font-medium text-muted-foreground">الحالة</th>
                      <th className="text-right p-4 font-medium text-muted-foreground">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mps.slice(0, 3).map((mp, index) => (
                      <tr key={mp.id} className="border-t border-border">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <img src={mp.image} alt={mp.name} className="w-8 h-8 rounded-full" />
                            <span className="font-medium">{mp.name}</span>
                          </div>
                        </td>
                        <td className="p-4 text-muted-foreground">+216 XX XXX XXX</td>
                        <td className="p-4">{mp.wilaya}</td>
                        <td className="p-4">
                          <span className={cn(
                            "text-xs px-2 py-1 rounded-full",
                            index === 0 ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"
                          )}>
                            {index === 0 ? 'قيد المراجعة' : 'مفعل'}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-secondary"
                              onClick={() => handleApproveMP(mp.name)}
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="text-destructive"
                              onClick={() => handleRejectMP(mp.name)}
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon">
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
                  <Button variant="default" className="gap-2">
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
                      <Button variant="ghost" size="icon">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-destructive"
                        onClick={() => handleDeleteMP(mp.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Locations Management */}
          {activeTab === 'locations' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Wilayas */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-foreground">الولايات</h3>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Plus className="w-4 h-4" />
                      إضافة
                    </Button>
                  </div>
                  <div className="bg-card rounded-xl border border-border overflow-hidden">
                    {wilayas.map((wilaya) => (
                      <div key={wilaya.id} className="flex items-center justify-between p-4 border-b border-border last:border-0">
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground">{wilaya.code}</span>
                          <span className="font-medium">{wilaya.name}</span>
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
                </div>

                {/* Dairas */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-foreground">المعتمديات</h3>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Plus className="w-4 h-4" />
                      إضافة
                    </Button>
                  </div>
                  <div className="bg-card rounded-xl border border-border overflow-hidden">
                    {dairas.slice(0, 8).map((daira) => (
                      <div key={daira.id} className="flex items-center justify-between p-4 border-b border-border last:border-0">
                        <div>
                          <span className="font-medium">{daira.name}</span>
                          <span className="text-xs text-muted-foreground mr-2">
                            ({wilayas.find(w => w.id === daira.wilayaId)?.name})
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
                </div>
              </div>
            </motion.div>
          )}

          {/* Complaints */}
          {activeTab === 'complaints' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <p className="text-muted-foreground mb-4">0 شكوى في النظام</p>
              <div className="text-center py-12">
                <MessageSquare className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">لا توجد شكاوى بعد</p>
                <p className="text-sm text-muted-foreground mt-2">سيتم عرض الشكاوى هنا عند إضافتها</p>
              </div>
            </motion.div>
          )}

          {/* Reports & Settings */}
          {(activeTab === 'reports' || activeTab === 'settings') && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
              <BarChart3 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">قريباً</p>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}
