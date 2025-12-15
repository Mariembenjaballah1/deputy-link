import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  LayoutDashboard, MessageSquare, Users, MapPin, BarChart3, 
  Settings, LogOut, Menu, X, ChevronLeft, Bell, Filter,
  Eye, Reply, Forward, XCircle, Clock, CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/authStore';
import { allComplaints, wilayas, dairas } from '@/data/mockData';
import { Complaint, categoryLabels, statusLabels } from '@/types';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const sidebarItems = [
  { icon: LayoutDashboard, label: 'لوحة التحكم', id: 'dashboard' },
  { icon: MessageSquare, label: 'الشكاوى', id: 'complaints' },
  { icon: BarChart3, label: 'الإحصائيات', id: 'stats' },
  { icon: Settings, label: 'الإعدادات', id: 'settings' },
];

export default function MPDashboard() {
  const { user, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);

  // Filter complaints for this MP
  const mpComplaints = allComplaints.filter(c => c.mpId === '1');
  
  const stats = {
    total: mpComplaints.length,
    pending: mpComplaints.filter(c => c.status === 'pending').length,
    viewed: mpComplaints.filter(c => c.status === 'viewed').length,
    replied: mpComplaints.filter(c => c.status === 'replied').length,
  };

  const handleStatusChange = (status: string) => {
    toast.success(`تم تغيير الحالة إلى: ${statusLabels[status as keyof typeof statusLabels]}`);
    setSelectedComplaint(null);
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 right-0 z-50 w-64 bg-primary text-primary-foreground transform transition-transform duration-300 lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
      )}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-bold">شكوى</h1>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden">
              <X className="w-6 h-6" />
            </button>
          </div>
          
          {/* User Info */}
          <div className="flex items-center gap-3 mb-8 p-3 bg-primary-foreground/10 rounded-xl">
            <img 
              src={user?.image || 'https://randomuser.me/api/portraits/men/1.jpg'} 
              alt={user?.name}
              className="w-10 h-10 rounded-full"
            />
            <div>
              <p className="font-medium">{user?.name || 'نائب'}</p>
              <p className="text-xs text-primary-foreground/70">نائب الشعب</p>
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
                    ? "bg-primary-foreground text-primary" 
                    : "hover:bg-primary-foreground/10"
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
              className="w-full justify-start gap-3 text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
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
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
                {stats.pending}
              </span>
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
                  <MessageSquare className="w-8 h-8 text-primary mb-2" />
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
              <div className="space-y-3">
                {mpComplaints.slice(0, 5).map((complaint) => (
                  <div 
                    key={complaint.id}
                    onClick={() => setSelectedComplaint(complaint)}
                    className="bg-card rounded-xl p-4 border border-border cursor-pointer hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-xs text-muted-foreground">#{complaint.id}</span>
                      <span className={cn(
                        "text-xs px-2 py-1 rounded-full",
                        complaint.status === 'pending' && "bg-amber-100 text-amber-700",
                        complaint.status === 'viewed' && "bg-blue-100 text-blue-700",
                        complaint.status === 'replied' && "bg-green-100 text-green-700",
                      )}>
                        {statusLabels[complaint.status]}
                      </span>
                    </div>
                    <p className="text-foreground line-clamp-2">{complaint.content}</p>
                    <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                      <span>{categoryLabels[complaint.category]}</span>
                      <span>{new Date(complaint.createdAt).toLocaleDateString('ar-TN')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Complaints List */}
          {activeTab === 'complaints' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="flex items-center gap-4 mb-6">
                <Button variant="outline" size="sm" className="gap-2">
                  <Filter className="w-4 h-4" />
                  تصفية
                </Button>
              </div>
              
              <div className="space-y-3">
                {mpComplaints.map((complaint) => (
                  <div 
                    key={complaint.id}
                    onClick={() => setSelectedComplaint(complaint)}
                    className="bg-card rounded-xl p-4 border border-border cursor-pointer hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-xs text-muted-foreground">#{complaint.id}</span>
                      <span className={cn(
                        "text-xs px-2 py-1 rounded-full",
                        complaint.status === 'pending' && "bg-amber-100 text-amber-700",
                        complaint.status === 'viewed' && "bg-blue-100 text-blue-700",
                        complaint.status === 'replied' && "bg-green-100 text-green-700",
                      )}>
                        {statusLabels[complaint.status]}
                      </span>
                    </div>
                    <p className="text-foreground line-clamp-2">{complaint.content}</p>
                    <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                      <span>{categoryLabels[complaint.category]}</span>
                      <span>{wilayas.find(w => w.id === complaint.wilayaId)?.name}</span>
                      <span>{new Date(complaint.createdAt).toLocaleDateString('ar-TN')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Stats */}
          {activeTab === 'stats' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
              <BarChart3 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">الإحصائيات قريباً</p>
            </motion.div>
          )}

          {/* Settings */}
          {activeTab === 'settings' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
              <Settings className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">الإعدادات قريباً</p>
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
            className="bg-card rounded-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">تفاصيل الشكوى #{selectedComplaint.id}</h3>
                <button onClick={() => setSelectedComplaint(null)}>
                  <X className="w-6 h-6 text-muted-foreground" />
                </button>
              </div>

              <p className="text-foreground mb-4">{selectedComplaint.content}</p>

              <div className="flex flex-wrap gap-2 mb-6">
                <span className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full">
                  {categoryLabels[selectedComplaint.category]}
                </span>
                <span className="text-xs bg-muted text-muted-foreground px-3 py-1 rounded-full">
                  {wilayas.find(w => w.id === selectedComplaint.wilayaId)?.name}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="gap-2" onClick={() => handleStatusChange('viewed')}>
                  <Eye className="w-4 h-4" />
                  تم الاطلاع
                </Button>
                <Button variant="default" className="gap-2" onClick={() => handleStatusChange('replied')}>
                  <Reply className="w-4 h-4" />
                  رد
                </Button>
                <Button variant="outline" className="gap-2" onClick={() => handleStatusChange('pending')}>
                  <Forward className="w-4 h-4" />
                  تحويل
                </Button>
                <Button variant="outline" className="gap-2 text-destructive" onClick={() => handleStatusChange('out_of_scope')}>
                  <XCircle className="w-4 h-4" />
                  خارج الاختصاص
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
