import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  LayoutDashboard, MessageSquare, BarChart3, 
  Settings, LogOut, Menu, X, Bell, AlertTriangle,
  Eye, Reply, XCircle, Clock, CheckCircle, Building2,
  FileText, History, User, Loader2, PieChart
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAuthStore } from '@/store/authStore';
import { wilayas, dairas } from '@/data/mockData';
import { categoryLabels, statusLabels } from '@/types';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { LocalDeputyProfileSettings } from '@/components/dashboard/LocalDeputyProfileSettings';
import { ComplaintFilters } from '@/components/dashboard/ComplaintFilters';
import { AuditTrail } from '@/components/dashboard/AuditTrail';
import { ReplyTemplates } from '@/components/dashboard/ReplyTemplates';
import { LocalDeputyReportsSection } from '@/components/dashboard/LocalDeputyReportsSection';
import { CoordinationLog } from '@/components/dashboard/CoordinationLog';
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';
import { supabase } from '@/integrations/supabase/client';

const sidebarItems = [
  { icon: LayoutDashboard, label: 'لوحة التحكم', id: 'dashboard' },
  { icon: MessageSquare, label: 'الشكاوى', id: 'complaints' },
  { icon: PieChart, label: 'التقارير', id: 'reports' },
  { icon: User, label: 'الملف الشخصي', id: 'profile' },
  { icon: Settings, label: 'الإعدادات', id: 'settings' },
];

interface DbComplaint {
  id: string;
  user_id: string;
  content: string;
  category: string;
  wilaya_id: string;
  daira_id: string;
  status: string;
  reply: string | null;
  created_at: string;
  updated_at: string;
  forwarded_to: string | null;
  forwarded_at: string | null;
  forwarded_to_deputy_id: string | null;
  forwarding_method: string | null;
  priority: string | null;
  internal_notes: string | null;
  images: string[] | null;
  mp_id: string | null;
}

interface FiltersState {
  search: string;
  status: string;
  category: string;
  wilayaId: string;
  dairaId: string;
  dateFrom: string;
  dateTo: string;
}

export default function LocalDeputyDashboard() {
  const { user, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedComplaint, setSelectedComplaint] = useState<DbComplaint | null>(null);
  const [replyText, setReplyText] = useState('');
  const [internalNote, setInternalNote] = useState('');
  const [showAuditTrail, setShowAuditTrail] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showCoordination, setShowCoordination] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [complaints, setComplaints] = useState<DbComplaint[]>([]);
  const [filters, setFilters] = useState<FiltersState>({
    search: '',
    status: '',
    category: '',
    wilayaId: '',
    dairaId: '',
    dateFrom: '',
    dateTo: '',
  });

  // Realtime notifications for new complaints
  useRealtimeNotifications({
    userId: user?.id || '',
    userType: 'local_deputy',
    onNewNotification: () => loadComplaints(),
  });

  useEffect(() => {
    loadComplaints();
  }, []);

  const loadComplaints = async () => {
    try {
      const { data, error } = await supabase
        .from('complaints')
        .select('*')
        .not('forwarded_to_deputy_id', 'is', null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setComplaints(data || []);
    } catch (error) {
      console.error('Error loading complaints:', error);
      toast.error('خطأ في تحميل الشكاوى');
    } finally {
      setLoading(false);
    }
  };

  // Filter complaints
  const filteredComplaints = useMemo(() => {
    return complaints.filter(c => {
      // Search filter
      if (filters.search && !c.content.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }
      // Status filter
      if (filters.status && c.status !== filters.status) {
        return false;
      }
      // Category filter
      if (filters.category && c.category !== filters.category) {
        return false;
      }
      // Wilaya filter
      if (filters.wilayaId && c.wilaya_id !== filters.wilayaId) {
        return false;
      }
      // Daira filter
      if (filters.dairaId && c.daira_id !== filters.dairaId) {
        return false;
      }
      // Date filters
      if (filters.dateFrom) {
        const fromDate = new Date(filters.dateFrom);
        const complaintDate = new Date(c.created_at);
        if (complaintDate < fromDate) return false;
      }
      if (filters.dateTo) {
        const toDate = new Date(filters.dateTo);
        toDate.setHours(23, 59, 59);
        const complaintDate = new Date(c.created_at);
        if (complaintDate > toDate) return false;
      }
      return true;
    });
  }, [complaints, filters]);

  const stats = useMemo(() => ({
    total: complaints.length,
    pending: complaints.filter(c => c.status === 'pending').length,
    viewed: complaints.filter(c => c.status === 'viewed').length,
    replied: complaints.filter(c => c.status === 'replied').length,
  }), [complaints]);

  // Urgent and overdue complaints
  const urgentComplaints = complaints.filter(c => c.priority === 'urgent' && c.status !== 'replied');
  const overdueComplaints = complaints.filter(c => {
    if (c.status === 'replied') return false;
    const daysSinceCreation = Math.floor((Date.now() - new Date(c.created_at).getTime()) / (1000 * 60 * 60 * 24));
    return daysSinceCreation > 7;
  });

  const handleStatusChange = async (status: string) => {
    if (!selectedComplaint) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('complaints')
        .update({ 
          status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedComplaint.id);

      if (error) throw error;

      // Log to audit trail
      await supabase.from('complaint_audit_log').insert({
        complaint_id: selectedComplaint.id,
        action: 'status_change',
        action_by: user?.name || 'نائب الجهة',
        action_by_role: 'local_deputy',
        old_value: { status: selectedComplaint.status },
        new_value: { status },
      });

      setComplaints(prev => prev.map(c => 
        c.id === selectedComplaint.id ? { ...c, status } : c
      ));
      
      toast.success(`تم تغيير الحالة إلى: ${statusLabels[status as keyof typeof statusLabels]}`);
      setSelectedComplaint(null);
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('خطأ في تحديث الحالة');
    } finally {
      setSaving(false);
    }
  };

  const handleReply = async () => {
    if (!selectedComplaint || !replyText.trim()) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('complaints')
        .update({ 
          reply: replyText,
          status: 'replied',
          replied_at: new Date().toISOString(),
          internal_notes: internalNote || selectedComplaint.internal_notes,
        })
        .eq('id', selectedComplaint.id);

      if (error) throw error;

      // Log to audit trail
      await supabase.from('complaint_audit_log').insert({
        complaint_id: selectedComplaint.id,
        action: 'reply_sent',
        action_by: user?.name || 'نائب الجهة',
        action_by_role: 'local_deputy',
        new_value: { reply: replyText },
        notes: internalNote || null,
      });

      setComplaints(prev => prev.map(c => 
        c.id === selectedComplaint.id 
          ? { ...c, reply: replyText, status: 'replied' } 
          : c
      ));

      toast.success('تم إرسال الرد بنجاح');
      setReplyText('');
      setInternalNote('');
      setSelectedComplaint(null);
    } catch (error) {
      console.error('Error sending reply:', error);
      toast.error('خطأ في إرسال الرد');
    } finally {
      setSaving(false);
    }
  };

  const handleSelectTemplate = (content: string) => {
    setReplyText(content);
    setShowTemplates(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-secondary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 right-0 z-50 w-64 bg-secondary text-secondary-foreground transform transition-transform duration-300 lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
      )}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <Building2 className="w-6 h-6" />
              <h1 className="text-xl font-bold">نائب الجهة</h1>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden">
              <X className="w-6 h-6" />
            </button>
          </div>
          
          {/* User Info */}
          <div className="flex items-center gap-3 mb-8 p-3 bg-secondary-foreground/10 rounded-xl">
            <img 
              src={user?.image || 'https://randomuser.me/api/portraits/men/10.jpg'} 
              alt={user?.name}
              className="w-10 h-10 rounded-full"
            />
            <div>
              <p className="font-medium">{user?.name || 'نائب الجهة'}</p>
              <p className="text-xs text-secondary-foreground/70">ممثل بلدي</p>
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
                    ? "bg-secondary-foreground text-secondary" 
                    : "hover:bg-secondary-foreground/10"
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
              className="w-full justify-start gap-3 text-secondary-foreground/70 hover:text-secondary-foreground hover:bg-secondary-foreground/10"
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
              {stats.pending > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
                  {stats.pending}
                </span>
              )}
            </button>
          </div>
        </header>

        <div className="p-6">
          {/* Dashboard */}
          {activeTab === 'dashboard' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {/* Alerts Section */}
              {(urgentComplaints.length > 0 || overdueComplaints.length > 0) && (
                <div className="space-y-3 mb-6">
                  {urgentComplaints.length > 0 && (
                    <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-5 h-5 text-destructive" />
                        <p className="font-bold text-destructive">شكاوى عاجلة ({urgentComplaints.length})</p>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        توجد شكاوى مصنفة كعاجلة تحتاج معالجة فورية
                      </p>
                    </div>
                  )}
                  {overdueComplaints.length > 0 && (
                    <div className="bg-warning/10 border border-warning/30 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-5 h-5 text-warning" />
                        <p className="font-bold text-warning">شكاوى متأخرة ({overdueComplaints.length})</p>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        شكاوى مضى عليها أكثر من 7 أيام دون رد
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Info Banner */}
              <div className="bg-secondary/10 border border-secondary/30 rounded-xl p-4 mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <Building2 className="w-5 h-5 text-secondary" />
                  <p className="font-bold text-secondary">شكاوى بلدية محوّلة</p>
                </div>
                <p className="text-sm text-muted-foreground">
                  تصلك الشكاوى المحوّلة من نواب الشعب الخاصة بدائرتك
                </p>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-card rounded-2xl p-4 border border-border">
                  <MessageSquare className="w-8 h-8 text-secondary mb-2" />
                  <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                  <p className="text-sm text-muted-foreground">إجمالي الشكاوى</p>
                </div>
                <div className="bg-card rounded-2xl p-4 border border-border">
                  <Clock className="w-8 h-8 text-warning mb-2" />
                  <p className="text-2xl font-bold text-foreground">{stats.pending}</p>
                  <p className="text-sm text-muted-foreground">قيد الانتظار</p>
                </div>
                <div className="bg-card rounded-2xl p-4 border border-border">
                  <Eye className="w-8 h-8 text-info mb-2" />
                  <p className="text-2xl font-bold text-foreground">{stats.viewed}</p>
                  <p className="text-sm text-muted-foreground">تم الاطلاع</p>
                </div>
                <div className="bg-card rounded-2xl p-4 border border-border">
                  <CheckCircle className="w-8 h-8 text-secondary mb-2" />
                  <p className="text-2xl font-bold text-foreground">{stats.replied}</p>
                  <p className="text-sm text-muted-foreground">تم الرد</p>
                </div>
              </div>

              {/* Recent Complaints */}
              <h3 className="text-lg font-bold text-foreground mb-4">الشكاوى الأخيرة</h3>
              {complaints.length === 0 ? (
                <div className="bg-card rounded-xl p-8 border border-border text-center">
                  <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">لا توجد شكاوى محوّلة حالياً</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {complaints.slice(0, 5).map((complaint) => (
                    <div 
                      key={complaint.id}
                      onClick={() => setSelectedComplaint(complaint)}
                      className="bg-card rounded-xl p-4 border border-border cursor-pointer hover:shadow-md transition-all"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">#{complaint.id.slice(0, 8)}</span>
                          {complaint.priority === 'urgent' && (
                            <span className="text-xs bg-destructive/10 text-destructive px-2 py-0.5 rounded-full">
                              عاجل
                            </span>
                          )}
                        </div>
                        <span className={cn(
                          "text-xs px-2 py-1 rounded-full",
                          complaint.status === 'pending' && "bg-amber-100 text-amber-700",
                          complaint.status === 'viewed' && "bg-blue-100 text-blue-700",
                          complaint.status === 'replied' && "bg-green-100 text-green-700",
                        )}>
                          {statusLabels[complaint.status as keyof typeof statusLabels] || complaint.status}
                        </span>
                      </div>
                      <p className="text-foreground line-clamp-2">{complaint.content}</p>
                      <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                        <span className="bg-secondary/10 text-secondary px-2 py-1 rounded">
                          {categoryLabels[complaint.category as keyof typeof categoryLabels] || complaint.category}
                        </span>
                        <span>{new Date(complaint.created_at).toLocaleDateString('ar-TN')}</span>
                        {complaint.forwarded_at && (
                          <span className="text-info">
                            محوّلة {new Date(complaint.forwarded_at).toLocaleDateString('ar-TN')}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Complaints List with Filters */}
          {activeTab === 'complaints' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <ComplaintFilters filters={filters} onFiltersChange={setFilters} />
              
              <div className="mt-6 space-y-3">
                {filteredComplaints.length === 0 ? (
                  <div className="bg-card rounded-xl p-8 border border-border text-center">
                    <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">لا توجد شكاوى مطابقة للبحث</p>
                  </div>
                ) : (
                  filteredComplaints.map((complaint) => (
                    <div 
                      key={complaint.id}
                      onClick={() => setSelectedComplaint(complaint)}
                      className="bg-card rounded-xl p-4 border border-border cursor-pointer hover:shadow-md transition-all"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">#{complaint.id.slice(0, 8)}</span>
                          {complaint.priority === 'urgent' && (
                            <span className="text-xs bg-destructive/10 text-destructive px-2 py-0.5 rounded-full">
                              عاجل
                            </span>
                          )}
                        </div>
                        <span className={cn(
                          "text-xs px-2 py-1 rounded-full",
                          complaint.status === 'pending' && "bg-amber-100 text-amber-700",
                          complaint.status === 'viewed' && "bg-blue-100 text-blue-700",
                          complaint.status === 'replied' && "bg-green-100 text-green-700",
                        )}>
                          {statusLabels[complaint.status as keyof typeof statusLabels] || complaint.status}
                        </span>
                      </div>
                      <p className="text-foreground line-clamp-2">{complaint.content}</p>
                      <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                        <span>{categoryLabels[complaint.category as keyof typeof categoryLabels] || complaint.category}</span>
                        <span>{wilayas.find(w => w.id === complaint.wilaya_id)?.name}</span>
                        <span>{dairas.find(d => d.id === complaint.daira_id)?.name}</span>
                        <span>{new Date(complaint.created_at).toLocaleDateString('ar-TN')}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {/* Reports */}
          {activeTab === 'reports' && (
            <LocalDeputyReportsSection />
          )}

          {/* Profile */}
          {activeTab === 'profile' && (
            <LocalDeputyProfileSettings />
          )}

          {/* Settings */}
          {activeTab === 'settings' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="bg-card rounded-2xl p-6 border border-border">
                <h3 className="text-lg font-bold text-foreground mb-4">الإعدادات العامة</h3>
                <p className="text-muted-foreground">
                  للوصول إلى إعدادات الملف الشخصي والإشعارات، انتقل إلى قسم "الملف الشخصي"
                </p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setActiveTab('profile')}
                >
                  الذهاب للملف الشخصي
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </main>

      {/* Complaint Detail Modal */}
      {selectedComplaint && (
        <div className="fixed inset-0 z-50 bg-foreground/50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">تفاصيل الطلب</h3>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => setShowAuditTrail(true)}
                    title="سجل الأحداث"
                  >
                    <History className="w-4 h-4" />
                  </Button>
                  <button onClick={() => setSelectedComplaint(null)}>
                    <X className="w-6 h-6 text-muted-foreground" />
                  </button>
                </div>
              </div>

              {/* Complaint Info */}
              <div className="bg-muted/50 rounded-xl p-4 mb-4">
                <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
                  <span>#{selectedComplaint.id.slice(0, 8)}</span>
                  <span>•</span>
                  <span>{new Date(selectedComplaint.created_at).toLocaleDateString('ar-TN')}</span>
                  {selectedComplaint.forwarded_at && (
                    <>
                      <span>•</span>
                      <span className="text-info">
                        محوّلة {new Date(selectedComplaint.forwarded_at).toLocaleDateString('ar-TN')}
                      </span>
                    </>
                  )}
                </div>
                <p className="text-foreground">{selectedComplaint.content}</p>
              </div>

              {/* Images */}
              {selectedComplaint.images && selectedComplaint.images.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-foreground mb-2">الصور المرفقة</p>
                  <div className="flex gap-2 flex-wrap">
                    {selectedComplaint.images.map((img, idx) => (
                      <img 
                        key={idx}
                        src={img}
                        alt={`صورة ${idx + 1}`}
                        className="w-20 h-20 object-cover rounded-lg border border-border"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="text-xs bg-secondary/10 text-secondary px-3 py-1 rounded-full">
                  {categoryLabels[selectedComplaint.category as keyof typeof categoryLabels] || selectedComplaint.category}
                </span>
                <span className="text-xs bg-muted text-muted-foreground px-3 py-1 rounded-full">
                  {wilayas.find(w => w.id === selectedComplaint.wilaya_id)?.name}
                </span>
                <span className="text-xs bg-muted text-muted-foreground px-3 py-1 rounded-full">
                  {dairas.find(d => d.id === selectedComplaint.daira_id)?.name}
                </span>
                {selectedComplaint.priority === 'urgent' && (
                  <span className="text-xs bg-destructive/10 text-destructive px-3 py-1 rounded-full">
                    عاجل
                  </span>
                )}
              </div>

              {/* Internal Notes */}
              <div className="mb-4">
                <label className="text-sm font-medium text-foreground mb-2 block">ملاحظات داخلية</label>
                <Textarea
                  placeholder="ملاحظات لن تظهر للمواطن..."
                  value={internalNote || selectedComplaint.internal_notes || ''}
                  onChange={(e) => setInternalNote(e.target.value)}
                  className="min-h-[60px]"
                />
              </div>

              {/* Reply Section */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-foreground">الرد على المواطن</label>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setShowTemplates(true)}
                    className="gap-1 text-xs"
                  >
                    <FileText className="w-3 h-3" />
                    ردود جاهزة
                  </Button>
                </div>
                <Textarea
                  placeholder="اكتب ردك هنا..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  variant="outline" 
                  className="gap-2" 
                  onClick={() => handleStatusChange('viewed')}
                  disabled={saving}
                >
                  <Eye className="w-4 h-4" />
                  تم الاطلاع
                </Button>
                <Button 
                  variant="default" 
                  className="gap-2" 
                  onClick={handleReply}
                  disabled={saving || !replyText.trim()}
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Reply className="w-4 h-4" />}
                  إرسال الرد
                </Button>
                <Button 
                  variant="outline" 
                  className="gap-2"
                  onClick={() => handleStatusChange('processing')}
                  disabled={saving}
                >
                  <Clock className="w-4 h-4" />
                  قيد المعالجة
                </Button>
                <Button 
                  variant="outline" 
                  className="gap-2 text-destructive" 
                  onClick={() => handleStatusChange('out_of_scope')}
                  disabled={saving}
                >
                  <XCircle className="w-4 h-4" />
                  خارج الاختصاص
                </Button>
                <Button 
                  variant="outline" 
                  className="gap-2 col-span-2"
                  onClick={() => setShowCoordination(true)}
                >
                  <Building2 className="w-4 h-4" />
                  التنسيق مع الجهات المحلية
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Audit Trail Modal */}
      {showAuditTrail && selectedComplaint && (
        <div className="fixed inset-0 z-[60] bg-foreground/50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card rounded-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">سجل الأحداث</h3>
                <button onClick={() => setShowAuditTrail(false)}>
                  <X className="w-6 h-6 text-muted-foreground" />
                </button>
              </div>
              <AuditTrail complaintId={selectedComplaint.id} />
            </div>
          </motion.div>
        </div>
      )}

      {/* Reply Templates Modal */}
      {showTemplates && (
        <div className="fixed inset-0 z-[60] bg-foreground/50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card rounded-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">الردود الجاهزة</h3>
                <button onClick={() => setShowTemplates(false)}>
                  <X className="w-6 h-6 text-muted-foreground" />
                </button>
              </div>
              <ReplyTemplates onSelectTemplate={handleSelectTemplate} mode="select" />
            </div>
          </motion.div>
        </div>
      )}

      {/* Coordination Modal */}
      {showCoordination && selectedComplaint && (
        <div className="fixed inset-0 z-[60] bg-foreground/50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">التنسيق مع الجهات المحلية</h3>
                <button onClick={() => setShowCoordination(false)}>
                  <X className="w-6 h-6 text-muted-foreground" />
                </button>
              </div>
              <CoordinationLog complaintId={selectedComplaint.id} />
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
