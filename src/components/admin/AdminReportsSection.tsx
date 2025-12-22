import { useState, useEffect, useRef } from 'react';
import { 
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, 
  ResponsiveContainer, Tooltip, LineChart, Line, CartesianGrid, Legend 
} from 'recharts';
import { 
  Download, Loader2, FileSpreadsheet, FileText, 
  TrendingUp, Users, MapPin, MessageSquare, Calendar
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';
import { wilayas } from '@/data/mockData';

interface ComplaintStats {
  total: number;
  pending: number;
  viewed: number;
  replied: number;
  forwarded: number;
}

interface WilayaStats {
  name: string;
  total: number;
  pending: number;
  replied: number;
}

interface CategoryStats {
  name: string;
  count: number;
}

interface MonthlyStats {
  month: string;
  count: number;
}

const COLORS = [
  'hsl(var(--warning))', 
  'hsl(var(--info))', 
  'hsl(var(--secondary))', 
  'hsl(var(--primary))',
  'hsl(var(--accent))'
];

const categoryLabels: Record<string, string> = {
  'infrastructure': 'البنية التحتية',
  'health': 'الصحة',
  'education': 'التعليم',
  'transport': 'النقل',
  'environment': 'البيئة',
  'housing': 'الإسكان',
  'employment': 'التوظيف',
  'security': 'الأمن',
  'other': 'أخرى',
};

export function AdminReportsSection() {
  const reportRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isGeneratingExcel, setIsGeneratingExcel] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ComplaintStats>({
    total: 0,
    pending: 0,
    viewed: 0,
    replied: 0,
    forwarded: 0,
  });
  const [wilayaStats, setWilayaStats] = useState<WilayaStats[]>([]);
  const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([]);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats[]>([]);
  const [mpsCount, setMpsCount] = useState(0);
  const [deputiesCount, setDeputiesCount] = useState(0);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      // Load complaints
      const { data: complaints, error: complaintsError } = await supabase
        .from('complaints')
        .select('*');

      if (complaintsError) throw complaintsError;

      // Load MPs count
      const { count: mpsCountResult } = await supabase
        .from('mps')
        .select('*', { count: 'exact', head: true });

      // Load local deputies count
      const { count: deputiesCountResult } = await supabase
        .from('local_deputies')
        .select('*', { count: 'exact', head: true });

      setMpsCount(mpsCountResult || 0);
      setDeputiesCount(deputiesCountResult || 0);

      if (complaints) {
        // Overall stats
        const pending = complaints.filter(c => c.status === 'pending').length;
        const viewed = complaints.filter(c => c.status === 'viewed').length;
        const replied = complaints.filter(c => c.status === 'replied').length;
        const forwarded = complaints.filter(c => c.forwarded_to).length;

        setStats({
          total: complaints.length,
          pending,
          viewed,
          replied,
          forwarded,
        });

        // Stats by wilaya
        const wilayaMap = new Map<string, WilayaStats>();
        complaints.forEach(c => {
          const wilayaName = wilayas.find(w => w.id === c.wilaya_id)?.name || c.wilaya_id;
          const existing = wilayaMap.get(wilayaName) || { name: wilayaName, total: 0, pending: 0, replied: 0 };
          existing.total++;
          if (c.status === 'pending') existing.pending++;
          if (c.status === 'replied') existing.replied++;
          wilayaMap.set(wilayaName, existing);
        });
        setWilayaStats(Array.from(wilayaMap.values()).sort((a, b) => b.total - a.total).slice(0, 10));

        // Stats by category
        const categoryMap = new Map<string, number>();
        complaints.forEach(c => {
          const count = categoryMap.get(c.category) || 0;
          categoryMap.set(c.category, count + 1);
        });
        setCategoryStats(
          Array.from(categoryMap.entries())
            .map(([name, count]) => ({ name: categoryLabels[name] || name, count }))
            .sort((a, b) => b.count - a.count)
        );

        // Monthly stats (last 6 months)
        const monthMap = new Map<string, number>();
        const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
        
        complaints.forEach(c => {
          const date = new Date(c.created_at);
          const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
          const count = monthMap.get(monthKey) || 0;
          monthMap.set(monthKey, count + 1);
        });

        const sortedMonths = Array.from(monthMap.entries())
          .sort((a, b) => a[0].localeCompare(b[0]))
          .slice(-6)
          .map(([key, count]) => {
            const [year, month] = key.split('-');
            return { month: months[parseInt(month)], count };
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
    { name: 'تم التحويل', value: stats.forwarded },
  ].filter(d => d.value > 0);

  const responseRate = stats.total > 0 
    ? Math.round(((stats.replied + stats.forwarded) / stats.total) * 100) 
    : 0;

  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true);
    
    try {
      const today = new Date().toLocaleDateString('ar-TN', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });

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
          <h1 style="font-size: 28px; margin: 0; font-weight: bold; color: #1a1a1a;">التقرير الإداري الشامل</h1>
          <p style="font-size: 14px; color: #666; margin-top: 8px;">نظام شكوى - لوحة الإدارة</p>
          <p style="font-size: 12px; color: #999; margin-top: 4px;">التاريخ: ${today}</p>
        </div>
        
        <hr style="border: none; border-top: 2px solid #333; margin: 20px 0;" />
        
        <h2 style="font-size: 18px; margin-bottom: 20px; color: #333;">ملخص النظام</h2>
        
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 30px;">
          <div style="background: #f0f9ff; padding: 15px; border-radius: 8px; text-align: center;">
            <p style="font-size: 28px; font-weight: bold; margin: 0; color: #0369a1;">${mpsCount}</p>
            <p style="font-size: 12px; color: #666; margin: 5px 0 0 0;">نواب الشعب</p>
          </div>
          <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; text-align: center;">
            <p style="font-size: 28px; font-weight: bold; margin: 0; color: #15803d;">${deputiesCount}</p>
            <p style="font-size: 12px; color: #666; margin: 5px 0 0 0;">نواب الجهة</p>
          </div>
          <div style="background: #faf5ff; padding: 15px; border-radius: 8px; text-align: center;">
            <p style="font-size: 28px; font-weight: bold; margin: 0; color: #7c3aed;">${stats.total}</p>
            <p style="font-size: 12px; color: #666; margin: 5px 0 0 0;">إجمالي الشكاوى</p>
          </div>
        </div>

        <h2 style="font-size: 18px; margin-bottom: 20px; color: #333;">حالات الشكاوى</h2>
        
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 30px;">
          <div style="background: #fef3c7; padding: 12px; border-radius: 8px; text-align: center;">
            <p style="font-size: 22px; font-weight: bold; margin: 0; color: #d97706;">${stats.pending}</p>
            <p style="font-size: 11px; color: #666; margin: 5px 0 0 0;">قيد الانتظار</p>
          </div>
          <div style="background: #dbeafe; padding: 12px; border-radius: 8px; text-align: center;">
            <p style="font-size: 22px; font-weight: bold; margin: 0; color: #2563eb;">${stats.viewed}</p>
            <p style="font-size: 11px; color: #666; margin: 5px 0 0 0;">تم الاطلاع</p>
          </div>
          <div style="background: #d1fae5; padding: 12px; border-radius: 8px; text-align: center;">
            <p style="font-size: 22px; font-weight: bold; margin: 0; color: #059669;">${stats.replied}</p>
            <p style="font-size: 11px; color: #666; margin: 5px 0 0 0;">تم الرد</p>
          </div>
          <div style="background: #ede9fe; padding: 12px; border-radius: 8px; text-align: center;">
            <p style="font-size: 22px; font-weight: bold; margin: 0; color: #7c3aed;">${stats.forwarded}</p>
            <p style="font-size: 11px; color: #666; margin: 5px 0 0 0;">تم التحويل</p>
          </div>
        </div>

        <h2 style="font-size: 18px; margin-bottom: 15px; color: #333;">أعلى 5 ولايات من حيث الشكاوى</h2>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
          <thead>
            <tr style="background: #f3f4f6;">
              <th style="padding: 10px; text-align: right; border: 1px solid #e5e7eb;">الولاية</th>
              <th style="padding: 10px; text-align: center; border: 1px solid #e5e7eb;">الإجمالي</th>
              <th style="padding: 10px; text-align: center; border: 1px solid #e5e7eb;">قيد الانتظار</th>
              <th style="padding: 10px; text-align: center; border: 1px solid #e5e7eb;">تم الرد</th>
            </tr>
          </thead>
          <tbody>
            ${wilayaStats.slice(0, 5).map(w => `
              <tr>
                <td style="padding: 10px; border: 1px solid #e5e7eb;">${w.name}</td>
                <td style="padding: 10px; text-align: center; border: 1px solid #e5e7eb;">${w.total}</td>
                <td style="padding: 10px; text-align: center; border: 1px solid #e5e7eb;">${w.pending}</td>
                <td style="padding: 10px; text-align: center; border: 1px solid #e5e7eb;">${w.replied}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <h2 style="font-size: 18px; margin-bottom: 15px; color: #333;">توزيع الشكاوى حسب الصنف</h2>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
          <thead>
            <tr style="background: #f3f4f6;">
              <th style="padding: 10px; text-align: right; border: 1px solid #e5e7eb;">الصنف</th>
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

        <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
          <h3 style="font-size: 16px; margin-bottom: 15px;">مؤشرات الأداء</h3>
          <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
            <span>نسبة الاستجابة الكلية</span>
            <span style="font-weight: bold; color: ${responseRate >= 50 ? '#059669' : '#dc2626'};">${responseRate}%</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span>الشكاوى المعالجة</span>
            <span style="font-weight: bold;">${stats.replied + stats.forwarded}</span>
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
      pdf.save(`تقرير_إداري_${new Date().toISOString().split('T')[0]}.pdf`);
      
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
        ['التقرير الإداري الشامل'],
        [''],
        ['الإحصائيات العامة'],
        ['نواب الشعب', mpsCount],
        ['نواب الجهة', deputiesCount],
        ['إجمالي الشكاوى', stats.total],
        [''],
        ['حالات الشكاوى'],
        ['قيد الانتظار', stats.pending],
        ['تم الاطلاع', stats.viewed],
        ['تم الرد', stats.replied],
        ['تم التحويل', stats.forwarded],
        [''],
        ['نسبة الاستجابة', `${responseRate}%`],
      ];

      // Wilaya stats sheet
      const wilayaData = [
        ['الولاية', 'الإجمالي', 'قيد الانتظار', 'تم الرد'],
        ...wilayaStats.map(w => [w.name, w.total, w.pending, w.replied]),
      ];

      // Category stats sheet
      const categoryData = [
        ['الصنف', 'العدد', 'النسبة'],
        ...categoryStats.map(c => [
          c.name, 
          c.count, 
          `${stats.total > 0 ? Math.round((c.count / stats.total) * 100) : 0}%`
        ]),
      ];

      const wb = XLSX.utils.book_new();
      
      const ws1 = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, ws1, 'ملخص');
      
      const ws2 = XLSX.utils.aoa_to_sheet(wilayaData);
      XLSX.utils.book_append_sheet(wb, ws2, 'حسب الولاية');
      
      const ws3 = XLSX.utils.aoa_to_sheet(categoryData);
      XLSX.utils.book_append_sheet(wb, ws3, 'حسب الصنف');

      XLSX.writeFile(wb, `تقرير_إداري_${new Date().toISOString().split('T')[0]}.xlsx`);
      
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
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
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
      {/* Export Buttons */}
      <div className="flex gap-3 justify-end">
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
          تصدير Excel
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
          تصدير PDF
        </Button>
      </div>

      {/* System Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card rounded-2xl p-4 border border-border">
          <Users className="w-8 h-8 text-primary mb-2" />
          <p className="text-2xl font-bold text-foreground">{mpsCount}</p>
          <p className="text-sm text-muted-foreground">نواب الشعب</p>
        </div>
        <div className="bg-card rounded-2xl p-4 border border-border">
          <Users className="w-8 h-8 text-secondary mb-2" />
          <p className="text-2xl font-bold text-foreground">{deputiesCount}</p>
          <p className="text-sm text-muted-foreground">نواب الجهة</p>
        </div>
        <div className="bg-card rounded-2xl p-4 border border-border">
          <MessageSquare className="w-8 h-8 text-accent mb-2" />
          <p className="text-2xl font-bold text-foreground">{stats.total}</p>
          <p className="text-sm text-muted-foreground">إجمالي الشكاوى</p>
        </div>
        <div className="bg-card rounded-2xl p-4 border border-border">
          <TrendingUp className="w-8 h-8 text-info mb-2" />
          <p className="text-2xl font-bold text-foreground">{responseRate}%</p>
          <p className="text-sm text-muted-foreground">نسبة الاستجابة</p>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
        <div className="bg-primary/10 rounded-xl p-4 border border-primary/20">
          <p className="text-2xl font-bold text-primary">{stats.forwarded}</p>
          <p className="text-sm text-muted-foreground">تم التحويل</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Pie Chart - Status Distribution */}
        <div className="bg-card rounded-2xl p-6 border border-border">
          <h3 className="text-lg font-bold text-foreground mb-4">توزيع حالات الشكاوى</h3>
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

        {/* Bar Chart - By Category */}
        <div className="bg-card rounded-2xl p-6 border border-border">
          <h3 className="text-lg font-bold text-foreground mb-4">الشكاوى حسب الصنف</h3>
          {categoryStats.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryStats} layout="vertical">
                  <XAxis type="number" hide />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    width={100}
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
                    fill="hsl(var(--primary))" 
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

      {/* Wilaya Stats & Monthly Trend */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Wilaya Stats */}
        <div className="bg-card rounded-2xl p-6 border border-border">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-bold text-foreground">أعلى الولايات</h3>
          </div>
          {wilayaStats.length > 0 ? (
            <div className="space-y-3">
              {wilayaStats.slice(0, 5).map((wilaya, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-sm flex items-center justify-center font-bold">
                      {index + 1}
                    </span>
                    <span className="font-medium text-foreground">{wilaya.name}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-muted-foreground">{wilaya.total} شكوى</span>
                    <span className="text-secondary">{wilaya.replied} رد</span>
                  </div>
                </div>
              ))}
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
            <Calendar className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-bold text-foreground">تطور الشكاوى الشهري</h3>
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
                    formatter={(value: number) => [value, 'شكوى']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
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
