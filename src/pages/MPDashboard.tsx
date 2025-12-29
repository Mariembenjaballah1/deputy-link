import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  LayoutDashboard, MessageSquare, BarChart3, 
  Settings, LogOut, Menu, X, Bell, Filter,
  Eye, Reply, Forward, XCircle, Clock, CheckCircle, FileText, Printer, Download, Loader2,
  Inbox
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAuthStore } from '@/store/authStore';
import { useLocations } from '@/hooks/useLocations';
import { Complaint, categoryLabels, statusLabels, categoryMinistries, ComplaintCategory, ComplaintStatus } from '@/types';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { supabase } from '@/integrations/supabase/client';
import { StatsSection } from '@/components/dashboard/StatsSection';
import { SettingsSection } from '@/components/dashboard/SettingsSection';
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';
import { MPProfileSettings } from '@/components/dashboard/MPProfileSettings';
import { ReplyTemplates } from '@/components/dashboard/ReplyTemplates';
import { ForwardComplaintModal } from '@/components/dashboard/ForwardComplaintModal';
import { AuditTrail } from '@/components/dashboard/AuditTrail';

const sidebarItems = [
  { icon: LayoutDashboard, label: 'لوحة التحكم', id: 'dashboard' },
  { icon: MessageSquare, label: 'الطلبات', id: 'complaints' },
  { icon: Inbox, label: 'خزانة المداخلات', id: 'cabinet' },
  { icon: BarChart3, label: 'الإحصائيات', id: 'stats' },
  { icon: Settings, label: 'الإعدادات', id: 'settings' },
];

const generateOfficialLetter = (
  complaint: Complaint, 
  mp: { name: string; wilaya: string; phone?: string; email?: string },
  wilayas: { id: string; name: string }[],
  dairas: { id: string; name: string }[]
) => {
  const today = new Date().toLocaleDateString('ar-TN', { year: 'numeric', month: 'long', day: 'numeric' });
  const ministry = categoryMinistries[complaint.category];
  const wilaya = wilayas.find(w => w.id === complaint.wilayaId)?.name || '';
  const daira = dairas.find(d => d.id === complaint.dairaId)?.name || '';

  return `الجمهورية التونسية
مجلس نواب الشعب

📅 التاريخ: ${today}

إلى
السيد/السيدة
وزير ${ministry}

الموضوع: إحالة طلب مواطن

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

حضرة السيد/السيدة الوزير،

تبعا للمهام الدستورية الموكولة إلينا، وحرصًا على متابعة مشاغل المواطنين، يشرفني أن أتقدم إلى سيادتكم بهذه المراسلة قصد النظر في الطلب التالي:

📌 موضوع الطلب:
\${categoryLabels[complaint.category]}

📍 مكان الطلب:
الولاية: \${wilaya}
البلدية: \${daira}

📝 نص الطلب:
\${complaint.content}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

وعليه، أرجو من سيادتكم التفضل باتخاذ ما ترونه مناسبًا في شأن هذه الوضعية، وإعلامنا بالإجراءات المتخذة في الإبان.

وتفضلوا بقبول فائق عبارات الاحترام والتقدير.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

الإمضاء
${mp.name}
نائب الشعب عن دائرة ${mp.wilaya}
رقم الهاتف: ${mp.phone || '+216 XX XXX XXX'}
البريد الإلكتروني: ${mp.email || 'mp@assembly.tn'}`;
};

export default function MPDashboard() {
  const { user, logout } = useAuthStore();
  const { wilayas, dairas } = useLocations();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [showLetterModal, setShowLetterModal] = useState(false);
  const [officialLetter, setOfficialLetter] = useState('');
  const [replyText, setReplyText] = useState('');
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showAuditTrail, setShowAuditTrail] = useState(false);
  // Realtime notifications for new complaints
  useRealtimeNotifications({
    userId: user?.id || '',
    userType: 'mp',
    onNewNotification: () => loadComplaints(),
  });
  const currentMP = {
    name: user?.name || 'نائب الشعب',
    wilaya: wilayas.find(w => w.id === user?.wilayaId)?.name || '',
    phone: '+216 XX XXX XXX',
    email: user?.email || 'mp@assembly.tn',
  };

  // Load complaints from database
  useEffect(() => {
    loadComplaints();
    
    // Subscribe to real-time updates
    const channel = supabase
      .channel('complaints-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'complaints',
          filter: 'assigned_to=eq.mp'
        },
        () => {
          loadComplaints();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadComplaints = async () => {
    try {
      const { data, error } = await supabase
        .from('complaints')
        .select('*')
        .eq('assigned_to', 'mp')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading complaints:', error);
        setComplaints([]);
      } else if (data) {
        const formattedComplaints: Complaint[] = data.map(c => ({
          id: c.id,
          userId: c.user_id,
          content: c.content,
          images: c.images || [],
          category: c.category as ComplaintCategory,
          wilayaId: c.wilaya_id,
          dairaId: c.daira_id,
          mpId: c.mp_id || undefined,
          localDeputyId: c.local_deputy_id || undefined,
          assignedTo: c.assigned_to as 'mp' | 'local_deputy',
          status: c.status as ComplaintStatus,
          createdAt: c.created_at,
          reply: c.reply || undefined,
          repliedAt: c.replied_at || undefined,
          forwardedTo: c.forwarded_to || undefined,
          officialLetter: c.official_letter || undefined,
        }));
        setComplaints(formattedComplaints);
      }
    } catch (error) {
      console.error('Error:', error);
      setComplaints([]);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Apply filters
  const filteredComplaints = complaints.filter(c => {
    if (categoryFilter !== 'all' && c.category !== categoryFilter) return false;
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    return true;
  });
  
  const stats = {
    total: complaints.length,
    pending: complaints.filter(c => c.status === 'pending').length,
    viewed: complaints.filter(c => c.status === 'viewed').length,
    replied: complaints.filter(c => c.status === 'replied').length,
    forwarded: complaints.filter(c => c.status === 'forwarded').length,
    inCabinet: complaints.filter(c => c.status === 'in_cabinet').length,
  };

  const handleStatusChange = async (status: string) => {
    if (selectedComplaint) {
      try {
        const { error } = await supabase
          .from('complaints')
          .update({ status })
          .eq('id', selectedComplaint.id);

        if (error) throw error;

        setComplaints(prev => prev.map(c => 
          c.id === selectedComplaint.id ? { ...c, status: status as Complaint['status'] } : c
        ));
        setSelectedComplaint(prev => prev ? { ...prev, status: status as Complaint['status'] } : null);
        toast.success(`تم تغيير الحالة إلى: ${statusLabels[status as keyof typeof statusLabels]}`);
      } catch (error) {
        console.error('Error updating status:', error);
        toast.error('خطأ في تحديث الحالة');
      }
    }
  };

  const handleReply = async () => {
    if (!selectedComplaint) return;
    
    if (!replyText.trim()) {
      toast.error('يرجى كتابة نص الرد أولاً');
      return;
    }
    
    try {
      const { error } = await supabase
        .from('complaints')
        .update({ 
          reply: replyText,
          replied_at: new Date().toISOString(),
          status: 'replied'
        })
        .eq('id', selectedComplaint.id);

      if (error) throw error;

      setComplaints(prev => prev.map(c => 
        c.id === selectedComplaint.id 
          ? { ...c, reply: replyText, repliedAt: new Date().toISOString(), status: 'replied' as ComplaintStatus } 
          : c
      ));
      setSelectedComplaint(null);
      setReplyText('');
      toast.success('تم إرسال الرد بنجاح');
    } catch (error) {
      console.error('Error sending reply:', error);
      toast.error('خطأ في إرسال الرد');
    }
  };

  const handleForward = async (forwardTo: string) => {
    if (selectedComplaint) {
      try {
        const { error } = await supabase
          .from('complaints')
          .update({ 
            forwarded_to: forwardTo,
            status: 'forwarded'
          })
          .eq('id', selectedComplaint.id);

        if (error) throw error;

        setComplaints(prev => prev.map(c => 
          c.id === selectedComplaint.id 
            ? { ...c, forwardedTo: forwardTo, status: 'forwarded' as ComplaintStatus } 
            : c
        ));
        setSelectedComplaint(null);
        toast.success(`تم تحويل الطلب إلى: ${forwardTo}`);
      } catch (error) {
        console.error('Error forwarding complaint:', error);
        toast.error('خطأ في تحويل الطلب');
      }
    }
  };

  const handleSaveOfficialLetter = async () => {
    if (selectedComplaint && officialLetter) {
      try {
        const { error } = await supabase
          .from('complaints')
          .update({ official_letter: officialLetter })
          .eq('id', selectedComplaint.id);

        if (error) throw error;

        setComplaints(prev => prev.map(c => 
          c.id === selectedComplaint.id 
            ? { ...c, officialLetter } 
            : c
        ));
        toast.success('تم حفظ المراسلة الرسمية');
      } catch (error) {
        console.error('Error saving letter:', error);
        toast.error('خطأ في حفظ المراسلة');
      }
    }
  };

  const handleGenerateLetter = (complaint: Complaint) => {
    const letter = generateOfficialLetter(complaint, currentMP, wilayas, dairas);
    setOfficialLetter(letter);
    setShowLetterModal(true);
  };

  const handlePrintLetter = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html dir="rtl">
          <head>
            <title>مراسلة رسمية</title>
            <style>
              body { font-family: 'Tajawal', Arial, sans-serif; padding: 40px; line-height: 1.8; }
              pre { white-space: pre-wrap; font-family: inherit; }
            </style>
          </head>
          <body><pre>${officialLetter}</pre></body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
    toast.success('جاري الطباعة...');
  };

  const handleDownloadPDF = async () => {
    if (!selectedComplaint) return;
    
    setIsGeneratingPDF(true);
    
    const today = new Date().toLocaleDateString('ar-TN', { year: 'numeric', month: 'long', day: 'numeric' });
    const ministry = categoryMinistries[selectedComplaint.category];
    const wilaya = wilayas.find(w => w.id === selectedComplaint.wilayaId)?.name || '';
    const daira = dairas.find(d => d.id === selectedComplaint.dairaId)?.name || '';
    
    // Create temporary div for Arabic PDF rendering
    const tempDiv = document.createElement('div');
    tempDiv.style.cssText = `
      position: fixed;
      left: -9999px;
      top: 0;
      width: 210mm;
      min-height: 297mm;
      padding: 20mm;
      background: white;
      font-family: 'Tajawal', 'Arial', sans-serif;
      direction: rtl;
      text-align: right;
      font-size: 14px;
      line-height: 1.8;
      color: #000;
    `;

    tempDiv.innerHTML = `
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="font-size: 22px; margin: 0; font-weight: bold;">الجمهورية التونسية</h1>
        <h2 style="font-size: 18px; margin: 8px 0 0 0; font-weight: normal;">مجلس نواب الشعب</h2>
      </div>
      
      <hr style="border: none; border-top: 2px solid #333; margin: 20px 0;" />
      
      <p style="margin-bottom: 20px;"><strong>التاريخ:</strong> ${today}</p>
      
      <div style="margin-bottom: 20px;">
        <p style="margin: 5px 0;">إلى</p>
        <p style="margin: 5px 0;">السيد/السيدة</p>
        <p style="margin: 5px 0; font-weight: bold; font-size: 16px;">وزير ${ministry}</p>
      </div>
      
      <p style="margin-bottom: 20px;"><strong>الموضوع:</strong> إحالة طلب مواطن</p>
      
      <hr style="border: none; border-top: 1px solid #ccc; margin: 20px 0;" />
      
      <p style="margin-bottom: 15px;">حضرة السيد/السيدة الوزير،</p>
      
      <p style="margin-bottom: 20px; text-align: justify;">
        تبعا للمهام الدستورية الموكولة إلينا، وحرصا على متابعة مشاغل المواطنين، يشرفني أن أتقدم إلى سيادتكم بهذه المراسلة قصد النظر في الطلب التالي:
      </p>
      
      <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
        <p style="margin: 5px 0;"><strong>موضوع الطلب:</strong> \${categoryLabels[selectedComplaint.category]}</p>
        <p style="margin: 5px 0;"><strong>الولاية:</strong> \${wilaya}</p>
        <p style="margin: 5px 0;"><strong>البلدية:</strong> \${daira}</p>
      </div>
      
      <div style="margin-bottom: 20px;">
        <p style="margin-bottom: 10px;"><strong>نص الطلب:</strong></p>
        <div style="background: #fafafa; padding: 15px; border-right: 4px solid #333; text-align: justify;">
          ${selectedComplaint.content}
        </div>
      </div>
      
      <hr style="border: none; border-top: 1px solid #ccc; margin: 20px 0;" />
      
      <p style="margin-bottom: 15px; text-align: justify;">
        وعليه، أرجو من سيادتكم التفضل باتخاذ ما ترونه مناسبا في شأن هذه الوضعية، وإعلامنا بالإجراءات المتخذة في الإبان.
      </p>
      
      <p style="margin-bottom: 30px;">وتفضلوا بقبول فائق عبارات الاحترام والتقدير.</p>
      
      <hr style="border: none; border-top: 1px solid #ccc; margin: 20px 0;" />
      
      <div style="margin-top: 30px;">
        <p style="margin: 5px 0; font-weight: bold;">الإمضاء</p>
        <p style="margin: 5px 0; font-size: 16px; font-weight: bold;">${currentMP.name}</p>
        <p style="margin: 5px 0;">نائب الشعب عن دائرة ${currentMP.wilaya}</p>
        <p style="margin: 5px 0; font-size: 12px; color: #666;">هاتف: ${currentMP.phone || '+216 XX XXX XXX'}</p>
        <p style="margin: 5px 0; font-size: 12px; color: #666;">بريد: ${currentMP.email || 'mp@assembly.tn'}</p>
      </div>
    `;

    document.body.appendChild(tempDiv);

    try {
      await document.fonts.ready;
      
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`مراسلة_رسمية_${selectedComplaint.id}.pdf`);
      toast.success('تم تحميل المراسلة بصيغة PDF');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('خطأ في إنشاء الملف');
    } finally {
      document.body.removeChild(tempDiv);
      setIsGeneratingPDF(false);
    }
  };

  // Old handlers removed - using async versions above

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 right-0 z-50 w-64 bg-primary text-primary-foreground transform transition-transform duration-300 lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
      )}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-bold">تواصل</h1>
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
              {/* Info Banner */}
              <div className="bg-primary/10 border border-primary/30 rounded-xl p-4 mb-6">
                <p className="font-bold text-primary mb-1">📋 مهامك كنائب شعب</p>
                <p className="text-sm text-muted-foreground">
                  تصلك الطلبات غير البلدية • يمكنك إنشاء مراسلات رسمية للوزارات المختصة
                </p>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                <div className="bg-card rounded-2xl p-4 border border-border">
                  <MessageSquare className="w-8 h-8 text-primary mb-2" />
                  <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                  <p className="text-sm text-muted-foreground">إجمالي الطلبات</p>
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
                <div className="bg-card rounded-2xl p-4 border border-border">
                  <Forward className="w-8 h-8 text-accent mb-2" />
                  <p className="text-2xl font-bold text-foreground">{stats.forwarded}</p>
                  <p className="text-sm text-muted-foreground">تم التحويل</p>
                </div>
              </div>

              {/* Recent Complaints */}
              <h3 className="text-lg font-bold text-foreground mb-4">الطلبات الأخيرة</h3>
              <div className="space-y-3">
                {complaints.slice(0, 5).map((complaint) => (
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
                        complaint.status === 'forwarded' && "bg-purple-100 text-purple-700",
                      )}>
                        {statusLabels[complaint.status]}
                      </span>
                    </div>
                    <p className="text-foreground line-clamp-2">{complaint.content}</p>
                    <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                      <span className="bg-primary/10 text-primary px-2 py-1 rounded">
                        {categoryLabels[complaint.category]}
                      </span>
                      <span>← {categoryMinistries[complaint.category]}</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Complaints List */}
          {activeTab === 'complaints' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="flex flex-wrap items-center gap-4 mb-6">
                <div className="relative">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-2"
                    onClick={() => setShowFilterMenu(!showFilterMenu)}
                  >
                    <Filter className="w-4 h-4" />
                    تصفية
                    {(categoryFilter !== 'all' || statusFilter !== 'all') && (
                      <span className="w-2 h-2 bg-primary rounded-full"></span>
                    )}
                  </Button>
                  
                  {showFilterMenu && (
                    <div className="absolute top-full mt-2 right-0 bg-card border border-border rounded-xl shadow-lg p-4 z-50 min-w-[250px]">
                      <div className="mb-4">
                        <label className="text-sm font-medium text-foreground mb-2 block">التصنيف</label>
                        <select 
                          value={categoryFilter}
                          onChange={(e) => setCategoryFilter(e.target.value)}
                          className="w-full p-2 border border-border rounded-lg bg-background text-foreground"
                        >
                          <option value="all">الكل</option>
                          {Object.entries(categoryLabels).filter(([key]) => key !== 'municipal').map(([key, label]) => (
                            <option key={key} value={key}>{label}</option>
                          ))}
                        </select>
                      </div>
                      <div className="mb-4">
                        <label className="text-sm font-medium text-foreground mb-2 block">الحالة</label>
                        <select 
                          value={statusFilter}
                          onChange={(e) => setStatusFilter(e.target.value)}
                          className="w-full p-2 border border-border rounded-lg bg-background text-foreground"
                        >
                          <option value="all">الكل</option>
                          {Object.entries(statusLabels).map(([key, label]) => (
                            <option key={key} value={key}>{label}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => {
                            setCategoryFilter('all');
                            setStatusFilter('all');
                          }}
                        >
                          إعادة تعيين
                        </Button>
                        <Button 
                          variant="default" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => setShowFilterMenu(false)}
                        >
                          تطبيق
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
                
                {categoryFilter !== 'all' && (
                  <span className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full">
                    {categoryLabels[categoryFilter as keyof typeof categoryLabels]}
                  </span>
                )}
                {statusFilter !== 'all' && (
                  <span className="text-xs bg-secondary/10 text-secondary px-3 py-1 rounded-full">
                    {statusLabels[statusFilter as keyof typeof statusLabels]}
                  </span>
                )}
                
                <span className="text-sm text-muted-foreground mr-auto">
                  {filteredComplaints.length} طلب
                </span>
              </div>
              
              <div className="space-y-3">
                {filteredComplaints.map((complaint) => (
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
                        complaint.status === 'forwarded' && "bg-purple-100 text-purple-700",
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
                
                {filteredComplaints.length === 0 && (
                  <div className="text-center py-12">
                    <Filter className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">لا توجد شكاوى تطابق الفلتر</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Cabinet - خزانة المداخلات */}
          {activeTab === 'cabinet' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="bg-accent/10 border border-accent/30 rounded-xl p-4 mb-6">
                <p className="font-bold text-accent mb-1">📁 خزانة المداخلات</p>
                <p className="text-sm text-muted-foreground">
                  الطلبات المحفوظة للمتابعة لاحقاً • يمكنك إنشاء مراسلات رسمية للوزارات من هنا
                </p>
              </div>

              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-foreground">
                  الطلبات في الخزانة ({stats.inCabinet})
                </h3>
              </div>

              {complaints.filter(c => c.status === 'in_cabinet').length === 0 ? (
                <div className="bg-card rounded-xl p-8 border border-border text-center">
                  <Inbox className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">لا توجد طلبات في الخزانة</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    يمكنك إضافة طلبات من قسم الطلبات بالضغط على "إضافة للخزانة"
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {complaints.filter(c => c.status === 'in_cabinet').map((complaint) => (
                    <div 
                      key={complaint.id}
                      className="bg-card rounded-xl p-4 border border-border"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-xs text-muted-foreground">#{complaint.id}</span>
                        <span className="text-xs px-2 py-1 rounded-full bg-accent/20 text-accent">
                          في الخزانة
                        </span>
                      </div>
                      <p className="text-foreground line-clamp-2 mb-3">{complaint.content}</p>
                      <div className="flex items-center gap-2 mb-3 text-xs text-muted-foreground">
                        <span className="bg-primary/10 text-primary px-2 py-1 rounded">
                          {categoryLabels[complaint.category]}
                        </span>
                        <span>← {categoryMinistries[complaint.category]}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="default" 
                          size="sm" 
                          className="gap-1 flex-1"
                          onClick={() => {
                            setSelectedComplaint(complaint);
                            handleGenerateLetter(complaint);
                          }}
                        >
                          <FileText className="w-3 h-3" />
                          إنشاء مراسلة
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="gap-1 flex-1"
                          onClick={() => setSelectedComplaint(complaint)}
                        >
                          <Eye className="w-3 h-3" />
                          عرض التفاصيل
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="gap-1"
                          onClick={async () => {
                            try {
                              const { error } = await supabase
                                .from('complaints')
                                .update({ status: 'pending' })
                                .eq('id', complaint.id);
                              if (error) throw error;
                              loadComplaints();
                              toast.success('تم إرجاع الطلب للقائمة الرئيسية');
                            } catch (error) {
                              toast.error('خطأ في تحديث الحالة');
                            }
                          }}
                        >
                          <XCircle className="w-3 h-3" />
                          إزالة
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Stats */}
          {activeTab === 'stats' && (
            <StatsSection stats={stats} type="mp" />
          )}

          {/* Settings */}
          {activeTab === 'settings' && (
            <MPProfileSettings />
          )}
        </div>
      </main>

      {/* Complaint Detail Modal */}
      {selectedComplaint && !showLetterModal && (
        <div className="fixed inset-0 z-50 bg-foreground/50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">تفاصيل الطلب #{selectedComplaint.id}</h3>
                <button onClick={() => setSelectedComplaint(null)}>
                  <X className="w-6 h-6 text-muted-foreground" />
                </button>
              </div>

              <p className="text-foreground mb-4">{selectedComplaint.content}</p>

              <div className="flex flex-wrap gap-2 mb-4">
                <span className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full">
                  {categoryLabels[selectedComplaint.category]}
                </span>
                <span className="text-xs bg-muted text-muted-foreground px-3 py-1 rounded-full">
                  {wilayas.find(w => w.id === selectedComplaint.wilayaId)?.name}
                </span>
              </div>

              {/* Ministry Info */}
              <div className="bg-accent/10 border border-accent/30 rounded-lg p-3 mb-4">
                <p className="text-xs text-muted-foreground mb-1">الوزارة المختصة</p>
                <p className="font-medium text-accent">{categoryMinistries[selectedComplaint.category]}</p>
              </div>

              {/* Reply Section */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-foreground">الرد على المواطن</label>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-xs gap-1"
                    onClick={() => setShowTemplates(!showTemplates)}
                  >
                    <FileText className="w-3 h-3" />
                    ردود جاهزة
                  </Button>
                </div>
                
                {showTemplates && (
                  <div className="mb-3 p-3 bg-muted/50 rounded-lg">
                    <ReplyTemplates 
                      mode="select" 
                      onSelectTemplate={(content) => {
                        setReplyText(content);
                        setShowTemplates(false);
                      }} 
                    />
                  </div>
                )}
                
                <Textarea
                  placeholder="اكتب ردك هنا..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="min-h-[80px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="gap-2" onClick={() => handleStatusChange('viewed')}>
                  <Eye className="w-4 h-4" />
                  تم الاطلاع
                </Button>
                <Button variant="default" className="gap-2" onClick={handleReply}>
                  <Reply className="w-4 h-4" />
                  إرسال الرد
                </Button>
                
                {/* Forward to Deputy */}
                <Button 
                  variant="secondary" 
                  className="gap-2" 
                  onClick={() => setShowForwardModal(true)}
                >
                  <Forward className="w-4 h-4" />
                  تحويل لنائب الجهة
                </Button>
                
                {/* Add to Cabinet */}
                <Button 
                  variant="accent" 
                  className="gap-2" 
                  onClick={() => handleStatusChange('in_cabinet')}
                >
                  <Inbox className="w-4 h-4" />
                  إضافة للخزانة
                </Button>
                
                <Button variant="outline" className="gap-2 text-destructive col-span-2" onClick={() => handleStatusChange('out_of_scope')}>
                  <XCircle className="w-4 h-4" />
                  خارج الاختصاص
                </Button>
              </div>

              {/* Audit Trail */}
              <div className="mt-6 pt-4 border-t border-border">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full gap-2"
                  onClick={() => setShowAuditTrail(!showAuditTrail)}
                >
                  {showAuditTrail ? 'إخفاء سجل الأحداث' : 'عرض سجل الأحداث'}
                </Button>
                {showAuditTrail && (
                  <div className="mt-4">
                    <AuditTrail complaintId={selectedComplaint.id} />
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Official Letter Modal */}
      {showLetterModal && (
        <div className="fixed inset-0 z-50 bg-foreground/50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">المراسلة الرسمية</h3>
                <button onClick={() => setShowLetterModal(false)}>
                  <X className="w-6 h-6 text-muted-foreground" />
                </button>
              </div>

              <div className="bg-muted/50 rounded-xl p-4 mb-4 font-mono text-sm whitespace-pre-wrap leading-relaxed">
                <Textarea
                  value={officialLetter}
                  onChange={(e) => setOfficialLetter(e.target.value)}
                  className="min-h-[400px] font-mono text-sm bg-transparent border-0 resize-none"
                />
              </div>

              <div className="flex gap-3">
                <Button variant="default" className="flex-1 gap-2" onClick={handlePrintLetter}>
                  <Printer className="w-4 h-4" />
                  طباعة
                </Button>
                <Button variant="outline" className="flex-1 gap-2" onClick={handleDownloadPDF}>
                  <Download className="w-4 h-4" />
                  تحميل PDF
                </Button>
                <Button 
                  variant="secondary" 
                  className="flex-1 gap-2" 
                  onClick={() => {
                    handleStatusChange('forwarded');
                    setShowLetterModal(false);
                  }}
                >
                  <Forward className="w-4 h-4" />
                  تأكيد التحويل
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Forward to Deputy Modal */}
      {showForwardModal && selectedComplaint && (
        <ForwardComplaintModal
          complaint={selectedComplaint}
          mpName={currentMP.name}
          mpWilayaId={user?.wilayaId || ''}
          mpDairaId={user?.dairaId || ''}
          onClose={() => setShowForwardModal(false)}
          onForwarded={() => {
            loadComplaints();
            setSelectedComplaint(null);
          }}
        />
      )}
    </div>
  );
}
