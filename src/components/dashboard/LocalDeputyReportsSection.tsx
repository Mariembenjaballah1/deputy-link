import { useState, useEffect, useRef } from 'react';
import { 
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, 
  ResponsiveContainer, Tooltip, LineChart, Line, CartesianGrid
} from 'recharts';
import { 
  Download, Loader2, FileSpreadsheet, FileText, 
  TrendingUp, MapPin, MessageSquare, Calendar, Building2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';
import { useLocations } from '@/hooks/useLocations';
import { categoryLabels } from '@/types';

interface ComplaintStats {
  total: number;
  pending: number;
  viewed: number;
  replied: number;
  resolved: number;
}

interface DairaStats {
  name: string;
  total: number;
  pending: number;
  replied: number;
  resolved: number;
}

interface CategoryStats {
  name: string;
  count: number;
}

interface MonthlyStats {
  month: string;
  count: number;
  resolved: number;
}

const COLORS = [
  'hsl(var(--warning))', 
  'hsl(var(--info))', 
  'hsl(var(--secondary))', 
  'hsl(var(--primary))',
  'hsl(var(--accent))'
];

export function LocalDeputyReportsSection() {
  const { getDairaName } = useLocations();
  const reportRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isGeneratingExcel, setIsGeneratingExcel] = useState(false);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('all'); // 'week', 'month', 'quarter', 'year', 'all'
  
  const [stats, setStats] = useState<ComplaintStats>({
    total: 0,
    pending: 0,
    viewed: 0,
    replied: 0,
    resolved: 0,
  });
  const [dairaStats, setDairaStats] = useState<DairaStats[]>([]);
  const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([]);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats[]>([]);

  useEffect(() => {
    loadStats();
  }, [period]);

  const getDateFilter = () => {
    const now = new Date();
    switch (period) {
      case 'week':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      case 'month':
        return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      case 'quarter':
        return new Date(now.getFullYear(), now.getMonth() - 2, 1).toISOString();
      case 'year':
        return new Date(now.getFullYear(), 0, 1).toISOString();
      default:
        return null;
    }
  };

  const loadStats = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('complaints')
        .select('*')
        .not('forwarded_to_deputy_id', 'is', null);

      const dateFilter = getDateFilter();
      if (dateFilter) {
        query = query.gte('created_at', dateFilter);
      }

      const { data: complaints, error } = await query;

      if (error) throw error;

      if (complaints) {
        // Overall stats
        const pending = complaints.filter(c => c.status === 'pending').length;
        const viewed = complaints.filter(c => c.status === 'viewed').length;
        const replied = complaints.filter(c => c.status === 'replied').length;
        const resolved = complaints.filter(c => c.status === 'resolved').length;

        setStats({
          total: complaints.length,
          pending,
          viewed,
          replied,
          resolved,
        });

        // Stats by daira
        const dairaMap = new Map<string, DairaStats>();
        complaints.forEach(c => {
          const dairaName = getDairaName(c.daira_id) || c.daira_id;
          const existing = dairaMap.get(dairaName) || { name: dairaName, total: 0, pending: 0, replied: 0, resolved: 0 };
          existing.total++;
          if (c.status === 'pending') existing.pending++;
          if (c.status === 'replied') existing.replied++;
          if (c.status === 'resolved') existing.resolved++;
          dairaMap.set(dairaName, existing);
        });
        setDairaStats(Array.from(dairaMap.values()).sort((a, b) => b.total - a.total));

        // Stats by category
        const categoryMap = new Map<string, number>();
        complaints.forEach(c => {
          const count = categoryMap.get(c.category) || 0;
          categoryMap.set(c.category, count + 1);
        });
        setCategoryStats(
          Array.from(categoryMap.entries())
            .map(([name, count]) => ({ name: categoryLabels[name as keyof typeof categoryLabels] || name, count }))
            .sort((a, b) => b.count - a.count)
        );

        // Monthly stats
        const monthMap = new Map<string, { count: number; resolved: number }>();
        const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
        
        complaints.forEach(c => {
          const date = new Date(c.created_at);
          const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
          const existing = monthMap.get(monthKey) || { count: 0, resolved: 0 };
          existing.count++;
          if (c.status === 'resolved' || c.status === 'replied') existing.resolved++;
          monthMap.set(monthKey, existing);
        });

        const sortedMonths = Array.from(monthMap.entries())
          .sort((a, b) => a[0].localeCompare(b[0]))
          .slice(-6)
          .map(([key, data]) => {
            const [year, month] = key.split('-');
            return { month: months[parseInt(month)], count: data.count, resolved: data.resolved };
          });
        
        setMonthlyStats(sortedMonths);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
      toast.error('خطأ في تحميل الإحصائيات');
    } finally {
      setLoading(false);
    }
  };

  const pieData = [
    { name: 'قيد الانتظار', value: stats.pending },
    { name: 'تم الاطلاع', value: stats.viewed },
    { name: 'تم الرد', value: stats.replied },
    { name: 'تم الحل', value: stats.resolved },
  ].filter(d => d.value > 0);

  const resolutionRate = stats.total > 0 
    ? Math.round(((stats.replied + stats.resolved) / stats.total) * 100) 
    : 0;

  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true);
    
    try {
      const today = new Date().toLocaleDateString('ar-TN', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });

      const periodLabels: Record<string, string> = {
        week: 'الأسبوع الحالي',
        month: 'الشهر الحالي',
        quarter: 'الربع الحالي',
        year: 'السنة الحالية',
        all: 'كل الفترات',
      };

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
          <h1 style="font-size: 24px; margin: 0; font-weight: bold; color: #1a1a1a;">تقرير نائب الجهة</h1>
          <p style="font-size: 14px; color: #666; margin-top: 8px;">الفترة: ${periodLabels[period]}</p>
          <p style="font-size: 12px; color: #999; margin-top: 4px;">التاريخ: ${today}</p>
        </div>
        
        <hr style="border: none; border-top: 2px solid #333; margin: 20px 0;" />
        
        <h2 style="font-size: 18px; margin-bottom: 20px; color: #333;">ملخص الشكاوى</h2>
        
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 30px;">
          <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; text-align: center;">
            <p style="font-size: 24px; font-weight: bold; margin: 0; color: #333;">${stats.total}</p>
            <p style="font-size: 11px; color: #666; margin: 5px 0 0 0;">الإجمالي</p>
          </div>
          <div style="background: #fef3c7; padding: 15px; border-radius: 8px; text-align: center;">
            <p style="font-size: 24px; font-weight: bold; margin: 0; color: #d97706;">${stats.pending}</p>
            <p style="font-size: 11px; color: #666; margin: 5px 0 0 0;">قيد الانتظار</p>
          </div>
          <div style="background: #d1fae5; padding: 15px; border-radius: 8px; text-align: center;">
            <p style="font-size: 24px; font-weight: bold; margin: 0; color: #059669;">${stats.replied}</p>
            <p style="font-size: 11px; color: #666; margin: 5px 0 0 0;">تم الرد</p>
          </div>
          <div style="background: #dbeafe; padding: 15px; border-radius: 8px; text-align: center;">
            <p style="font-size: 24px; font-weight: bold; margin: 0; color: #2563eb;">${stats.resolved}</p>
            <p style="font-size: 11px; color: #666; margin: 5px 0 0 0;">تم الحل</p>
          </div>
        </div>

        <h2 style="font-size: 18px; margin-bottom: 15px; color: #333;">الشكاوى حسب الدائرة</h2>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
          <thead>
            <tr style="background: #f3f4f6;">
              <th style="padding: 10px; text-align: right; border: 1px solid #e5e7eb;">الدائرة</th>
              <th style="padding: 10px; text-align: center; border: 1px solid #e5e7eb;">الإجمالي</th>
              <th style="padding: 10px; text-align: center; border: 1px solid #e5e7eb;">قيد الانتظار</th>
              <th style="padding: 10px; text-align: center; border: 1px solid #e5e7eb;">تم الرد</th>
              <th style="padding: 10px; text-align: center; border: 1px solid #e5e7eb;">نسبة الحل</th>
            </tr>
          </thead>
          <tbody>
            ${dairaStats.map(d => `
              <tr>
                <td style="padding: 10px; border: 1px solid #e5e7eb;">${d.name}</td>
                <td style="padding: 10px; text-align: center; border: 1px solid #e5e7eb;">${d.total}</td>
                <td style="padding: 10px; text-align: center; border: 1px solid #e5e7eb;">${d.pending}</td>
                <td style="padding: 10px; text-align: center; border: 1px solid #e5e7eb;">${d.replied}</td>
                <td style="padding: 10px; text-align: center; border: 1px solid #e5e7eb;">${d.total > 0 ? Math.round(((d.replied + d.resolved) / d.total) * 100) : 0}%</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <h2 style="font-size: 18px; margin-bottom: 15px; color: #333;">الشكاوى حسب نوع المشكل</h2>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
          <thead>
            <tr style="background: #f3f4f6;">
              <th style="padding: 10px; text-align: right; border: 1px solid #e5e7eb;">النوع</th>
              <th style="padding: 10px; text-align: center; border: 1px solid #e5e7eb;">العدد</th>
              <th style="padding: 10px; text-align: center; border: 1px solid #e5e7eb;">النسبة</th>
            </tr>
          </thead>
          <tbody>
            ${categoryStats.map(c => `
              <tr>
                <td style="padding: 10px; border: 1px solid #e5e7eb;">${c.name}</td>
                <td style="padding: 10px; text-align: center; border: 1px solid #e5e7eb;">${c.count}</td>
                <td style="padding: 10px; text-align: center; border: 1px solid #e5e7eb;">${stats.total > 0 ? Math.round((c.count / stats.total) * 100) : 0}%</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div style="background: #f9fafb; padding: 20px; border-radius: 8px;">
          <h3 style="font-size: 16px; margin-bottom: 15px;">مؤشرات الأداء</h3>
          <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
            <span>نسبة الحل الكلية</span>
            <span style="font-weight: bold; color: ${resolutionRate >= 50 ? '#059669' : '#dc2626'};">${resolutionRate}%</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span>الشكاوى المعالجة</span>
            <span style="font-weight: bold;">${stats.replied + stats.resolved}</span>
          </div>
        </div>
        
        <div style="margin-top: 40px; text-align: center; color: #999; font-size: 11px;">
          <p>تم إنشاء هذا التقرير تلقائياً من نظام شكوى</p>
          <p>© ${new Date().getFullYear()} جميع الحقوق محفوظة</p>
        </div>
      `;

      document.body.appendChild(tempDiv);
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
      pdf.save(`تقرير_نائب_الجهة_${new Date().toISOString().split('T')[0]}.pdf`);
      
      document.body.removeChild(tempDiv);
      toast.success('تم تحميل التقرير بنجاح');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('خطأ في إنشاء التقرير');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleDownloadExcel = async () => {
    setIsGeneratingExcel(true);
    
    try {
      // Summary sheet
      const summaryData = [
        ['تقرير نائب الجهة'],
        [''],
        ['الإحصائيات العامة'],
        ['إجمالي الشكاوى', stats.total],
        ['قيد الانتظار', stats.pending],
        ['تم الاطلاع', stats.viewed],
        ['تم الرد', stats.replied],
        ['تم الحل', stats.resolved],
        [''],
        ['نسبة الحل', `${resolutionRate}%`],
      ];

      // Daira stats sheet
      const dairaData = [
        ['الدائرة', 'الإجمالي', 'قيد الانتظار', 'تم الرد', 'تم الحل', 'نسبة الحل'],
        ...dairaStats.map(d => [
          d.name, 
          d.total, 
          d.pending, 
          d.replied, 
          d.resolved,
          `${d.total > 0 ? Math.round(((d.replied + d.resolved) / d.total) * 100) : 0}%`
        ]),
      ];

      // Category stats sheet
      const categoryData = [
        ['نوع المشكل', 'العدد', 'النسبة'],
        ...categoryStats.map(c => [
          c.name, 
          c.count, 
          `${stats.total > 0 ? Math.round((c.count / stats.total) * 100) : 0}%`
        ]),
      ];

      const wb = XLSX.utils.book_new();
      
      const ws1 = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, ws1, 'ملخص');
      
      const ws2 = XLSX.utils.aoa_to_sheet(dairaData);
      XLSX.utils.book_append_sheet(wb, ws2, 'حسب الدائرة');
      
      const ws3 = XLSX.utils.aoa_to_sheet(categoryData);
      XLSX.utils.book_append_sheet(wb, ws3, 'حسب النوع');

      XLSX.writeFile(wb, `تقرير_نائب_الجهة_${new Date().toISOString().split('T')[0]}.xlsx`);
      
      toast.success('تم تحميل ملف Excel بنجاح');
    } catch (error) {
      console.error('Error generating Excel:', error);
      toast.error('خطأ في إنشاء ملف Excel');
    } finally {
      setIsGeneratingExcel(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-secondary" />
      </div>
    );
  }

  return (
    <motion.div 
      ref={reportRef}
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Controls */}
      <div className="flex flex-wrap gap-3 justify-between items-center">
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="اختر الفترة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">الأسبوع الحالي</SelectItem>
            <SelectItem value="month">الشهر الحالي</SelectItem>
            <SelectItem value="quarter">الربع الحالي</SelectItem>
            <SelectItem value="year">السنة الحالية</SelectItem>
            <SelectItem value="all">كل الفترات</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex gap-3">
          <Button 
            onClick={handleDownloadExcel}
            disabled={isGeneratingExcel}
            variant="outline"
            className="gap-2"
          >
            {isGeneratingExcel ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="w-4 h-4" />
            )}
            Excel
          </Button>
          <Button 
            onClick={handleDownloadPDF}
            disabled={isGeneratingPDF}
            variant="outline"
            className="gap-2"
          >
            {isGeneratingPDF ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileText className="w-4 h-4" />
            )}
            PDF
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-card rounded-2xl p-4 border border-border">
          <MessageSquare className="w-8 h-8 text-secondary mb-2" />
          <p className="text-2xl font-bold text-foreground">{stats.total}</p>
          <p className="text-sm text-muted-foreground">الإجمالي</p>
        </div>
        <div className="bg-warning/10 rounded-xl p-4 border border-warning/20">
          <p className="text-2xl font-bold text-warning">{stats.pending}</p>
          <p className="text-sm text-muted-foreground">قيد الانتظار</p>
        </div>
        <div className="bg-info/10 rounded-xl p-4 border border-info/20">
          <p className="text-2xl font-bold text-info">{stats.viewed}</p>
          <p className="text-sm text-muted-foreground">تم الاطلاع</p>
        </div>
        <div className="bg-secondary/10 rounded-xl p-4 border border-secondary/20">
          <p className="text-2xl font-bold text-secondary">{stats.replied}</p>
          <p className="text-sm text-muted-foreground">تم الرد</p>
        </div>
        <div className="bg-card rounded-2xl p-4 border border-border">
          <TrendingUp className="w-8 h-8 text-primary mb-2" />
          <p className="text-2xl font-bold text-foreground">{resolutionRate}%</p>
          <p className="text-sm text-muted-foreground">نسبة الحل</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <div className="bg-card rounded-2xl p-6 border border-border">
          <h3 className="text-lg font-bold text-foreground mb-4">توزيع الحالات</h3>
          {stats.total > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      direction: 'rtl'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              لا توجد بيانات
            </div>
          )}
        </div>

        {/* Category Bar Chart */}
        <div className="bg-card rounded-2xl p-6 border border-border">
          <h3 className="text-lg font-bold text-foreground mb-4">حسب نوع المشكل</h3>
          {categoryStats.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryStats} layout="vertical">
                  <XAxis type="number" hide />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    width={80}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      direction: 'rtl'
                    }}
                    formatter={(value: number) => [value, 'عدد']}
                  />
                  <Bar 
                    dataKey="count" 
                    fill="hsl(var(--secondary))" 
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              لا توجد بيانات
            </div>
          )}
        </div>
      </div>

      {/* Daira Stats & Monthly Trend */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Daira Stats */}
        <div className="bg-card rounded-2xl p-6 border border-border">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="w-5 h-5 text-secondary" />
            <h3 className="text-lg font-bold text-foreground">حسب الدائرة</h3>
          </div>
          {dairaStats.length > 0 ? (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {dairaStats.map((daira, index) => {
                const rate = daira.total > 0 ? Math.round(((daira.replied + daira.resolved) / daira.total) * 100) : 0;
                return (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-secondary/10 text-secondary text-sm flex items-center justify-center font-bold">
                        {index + 1}
                      </span>
                      <span className="font-medium text-foreground">{daira.name}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-muted-foreground">{daira.total} شكوى</span>
                      <span className={rate >= 50 ? 'text-secondary' : 'text-warning'}>{rate}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-muted-foreground">
              لا توجد بيانات
            </div>
          )}
        </div>

        {/* Monthly Trend */}
        <div className="bg-card rounded-2xl p-6 border border-border">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-secondary" />
            <h3 className="text-lg font-bold text-foreground">التطور الشهري</h3>
          </div>
          {monthlyStats.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyStats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                  />
                  <YAxis 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      direction: 'rtl'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    stroke="hsl(var(--secondary))" 
                    strokeWidth={2}
                    name="الشكاوى"
                    dot={{ fill: 'hsl(var(--secondary))' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="resolved" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    name="المعالجة"
                    dot={{ fill: 'hsl(var(--primary))' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              لا توجد بيانات كافية
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
