import { useState, useEffect } from 'react';
import { Filter, Eye, Search, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { Complaint, categoryLabels, statusLabels, ComplaintCategory, ComplaintStatus, Wilaya, Daira } from '@/types';

interface AdminComplaintsTableProps {
  onViewComplaint?: (complaint: Complaint) => void;
}

export function AdminComplaintsTable({ onViewComplaint }: AdminComplaintsTableProps) {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [wilayas, setWilayas] = useState<Wilaya[]>([]);
  const [dairas, setDairas] = useState<Daira[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [wilayaFilter, setWilayaFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  useEffect(() => {
    loadData();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('admin-complaints-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'complaints',
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

  const loadData = async () => {
    setIsLoading(true);
    await Promise.all([loadComplaints(), loadLocations()]);
    setIsLoading(false);
  };

  const loadLocations = async () => {
    const [wilayasRes, dairasRes] = await Promise.all([
      supabase.from('wilayas').select('*').order('code'),
      supabase.from('dairas').select('*').order('name'),
    ]);

    if (wilayasRes.data) {
      setWilayas(wilayasRes.data.map(w => ({ id: w.id, name: w.name, code: w.code })));
    }
    if (dairasRes.data) {
      setDairas(dairasRes.data.map(d => ({ id: d.id, name: d.name, wilayaId: d.wilaya_id })));
    }
  };

  const loadComplaints = async () => {
    try {
      const { data, error } = await supabase
        .from('complaints')
        .select('*')
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
    }
  };

  // Apply filters
  const filteredComplaints = complaints.filter(c => {
    if (wilayaFilter !== 'all' && c.wilayaId !== wilayaFilter) return false;
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    if (categoryFilter !== 'all' && c.category !== categoryFilter) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return c.content.toLowerCase().includes(query) || c.id.toLowerCase().includes(query);
    }
    return true;
  });

  const stats = {
    total: complaints.length,
    pending: complaints.filter(c => c.status === 'pending').length,
    viewed: complaints.filter(c => c.status === 'viewed').length,
    replied: complaints.filter(c => c.status === 'replied').length,
    forwarded: complaints.filter(c => c.status === 'forwarded').length,
  };

  const activeFiltersCount = [wilayaFilter, statusFilter, categoryFilter].filter(f => f !== 'all').length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {/* Stats Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        <div className="bg-card rounded-xl p-3 border border-border text-center">
          <p className="text-lg font-bold text-foreground">{stats.total}</p>
          <p className="text-xs text-muted-foreground">الإجمالي</p>
        </div>
        <div className="bg-amber-50 dark:bg-amber-950/30 rounded-xl p-3 border border-amber-200 dark:border-amber-800 text-center">
          <p className="text-lg font-bold text-amber-700 dark:text-amber-400">{stats.pending}</p>
          <p className="text-xs text-muted-foreground">قيد الانتظار</p>
        </div>
        <div className="bg-blue-50 dark:bg-blue-950/30 rounded-xl p-3 border border-blue-200 dark:border-blue-800 text-center">
          <p className="text-lg font-bold text-blue-700 dark:text-blue-400">{stats.viewed}</p>
          <p className="text-xs text-muted-foreground">تم الاطلاع</p>
        </div>
        <div className="bg-green-50 dark:bg-green-950/30 rounded-xl p-3 border border-green-200 dark:border-green-800 text-center">
          <p className="text-lg font-bold text-green-700 dark:text-green-400">{stats.replied}</p>
          <p className="text-xs text-muted-foreground">تم الرد</p>
        </div>
        <div className="bg-purple-50 dark:bg-purple-950/30 rounded-xl p-3 border border-purple-200 dark:border-purple-800 text-center">
          <p className="text-lg font-bold text-purple-700 dark:text-purple-400">{stats.forwarded}</p>
          <p className="text-xs text-muted-foreground">تم التحويل</p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="بحث في الشكاوى..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10"
          />
        </div>
        
        <div className="relative">
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-2"
            onClick={() => setShowFilterMenu(!showFilterMenu)}
          >
            <Filter className="w-4 h-4" />
            تصفية
            {activeFiltersCount > 0 && (
              <span className="bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </Button>
          
          {showFilterMenu && (
            <div className="absolute top-full mt-2 left-0 bg-card border border-border rounded-xl shadow-lg p-4 z-50 min-w-[280px]">
              <div className="mb-4">
                <label className="text-sm font-medium text-foreground mb-2 block">الولاية</label>
                <select 
                  value={wilayaFilter}
                  onChange={(e) => setWilayaFilter(e.target.value)}
                  className="w-full p-2 border border-border rounded-lg bg-background text-foreground text-sm"
                >
                  <option value="all">جميع الولايات</option>
                  {wilayas.map(wilaya => (
                    <option key={wilaya.id} value={wilaya.id}>{wilaya.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="mb-4">
                <label className="text-sm font-medium text-foreground mb-2 block">التصنيف</label>
                <select 
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full p-2 border border-border rounded-lg bg-background text-foreground text-sm"
                >
                  <option value="all">جميع التصنيفات</option>
                  {Object.entries(categoryLabels).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
              
              <div className="mb-4">
                <label className="text-sm font-medium text-foreground mb-2 block">الحالة</label>
                <select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full p-2 border border-border rounded-lg bg-background text-foreground text-sm"
                >
                  <option value="all">جميع الحالات</option>
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
                    setWilayaFilter('all');
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
        
        <span className="text-sm text-muted-foreground mr-auto">
          {filteredComplaints.length} شكوى
        </span>
      </div>

      {/* Active Filters */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {wilayaFilter !== 'all' && (
            <span className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full flex items-center gap-1">
              {wilayas.find(w => w.id === wilayaFilter)?.name}
              <button onClick={() => setWilayaFilter('all')} className="hover:text-destructive">×</button>
            </span>
          )}
          {categoryFilter !== 'all' && (
            <span className="text-xs bg-secondary/10 text-secondary px-3 py-1 rounded-full flex items-center gap-1">
              {categoryLabels[categoryFilter as keyof typeof categoryLabels]}
              <button onClick={() => setCategoryFilter('all')} className="hover:text-destructive">×</button>
            </span>
          )}
          {statusFilter !== 'all' && (
            <span className="text-xs bg-accent/10 text-accent px-3 py-1 rounded-full flex items-center gap-1">
              {statusLabels[statusFilter as keyof typeof statusLabels]}
              <button onClick={() => setStatusFilter('all')} className="hover:text-destructive">×</button>
            </span>
          )}
        </div>
      )}

      {/* Complaints Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="text-right p-4 font-medium text-muted-foreground text-sm">#</th>
                <th className="text-right p-4 font-medium text-muted-foreground text-sm">المحتوى</th>
                <th className="text-right p-4 font-medium text-muted-foreground text-sm">التصنيف</th>
                <th className="text-right p-4 font-medium text-muted-foreground text-sm">الولاية</th>
                <th className="text-right p-4 font-medium text-muted-foreground text-sm">الموجه إلى</th>
                <th className="text-right p-4 font-medium text-muted-foreground text-sm">الحالة</th>
                <th className="text-right p-4 font-medium text-muted-foreground text-sm">التاريخ</th>
                <th className="text-right p-4 font-medium text-muted-foreground text-sm">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredComplaints.map((complaint, index) => (
                <tr key={complaint.id} className="border-t border-border hover:bg-muted/50 transition-colors">
                  <td className="p-4 text-sm text-muted-foreground">{index + 1}</td>
                  <td className="p-4">
                    <p className="text-sm text-foreground line-clamp-2 max-w-[250px]">{complaint.content}</p>
                  </td>
                  <td className="p-4">
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                      {categoryLabels[complaint.category]}
                    </span>
                  </td>
                  <td className="p-4 text-sm">
                    <div>
                      <p className="text-foreground">{wilayas.find(w => w.id === complaint.wilayaId)?.name}</p>
                      <p className="text-xs text-muted-foreground">{dairas.find(d => d.id === complaint.dairaId)?.name}</p>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={cn(
                      "text-xs px-2 py-1 rounded",
                      complaint.assignedTo === 'mp' ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300" : "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300"
                    )}>
                      {complaint.assignedTo === 'mp' ? 'نائب الشعب' : 'نائب الجهة'}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={cn(
                      "text-xs px-2 py-1 rounded-full",
                      complaint.status === 'pending' && "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
                      complaint.status === 'viewed' && "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
                      complaint.status === 'replied' && "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
                      complaint.status === 'forwarded' && "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
                    )}>
                      {statusLabels[complaint.status]}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">
                    {new Date(complaint.createdAt).toLocaleDateString('ar-TN')}
                  </td>
                  <td className="p-4">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => onViewComplaint?.(complaint)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredComplaints.length === 0 && (
          <div className="text-center py-12">
            <Filter className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">لا توجد شكاوى تطابق البحث</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
