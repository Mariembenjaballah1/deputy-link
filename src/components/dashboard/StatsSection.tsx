import { useRef, useState } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { TrendingUp, TrendingDown, MessageSquare, Clock, CheckCircle, Download, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface StatsSectionProps {
  stats: {
    total: number;
    pending: number;
    viewed: number;
    replied: number;
    forwarded?: number;
  };
  type: 'mp' | 'local_deputy' | 'admin';
}

const COLORS = ['hsl(var(--warning))', 'hsl(var(--info))', 'hsl(var(--secondary))', 'hsl(var(--primary))'];

export function StatsSection({ stats, type }: StatsSectionProps) {
  const reportRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const pieData = [
    { name: 'قيد الانتظار', value: stats.pending, color: 'hsl(var(--warning))' },
    { name: 'تم الاطلاع', value: stats.viewed, color: 'hsl(var(--info))' },
    { name: 'تم الرد', value: stats.replied, color: 'hsl(var(--secondary))' },
    ...(stats.forwarded ? [{ name: 'تم التحويل', value: stats.forwarded, color: 'hsl(var(--primary))' }] : []),
  ].filter(d => d.value > 0);

  const barData = [
    { name: 'انتظار', value: stats.pending },
    { name: 'اطلاع', value: stats.viewed },
    { name: 'رد', value: stats.replied },
    ...(stats.forwarded ? [{ name: 'تحويل', value: stats.forwarded }] : []),
  ];

  const responseRate = stats.total > 0 
    ? Math.round(((stats.replied + (stats.forwarded || 0)) / stats.total) * 100) 
    : 0;

  const previousResponseRate = 65;
  const rateChange = responseRate - previousResponseRate;

  const roleLabels = {
    mp: 'نائب الشعب',
    local_deputy: 'نائب الجهة',
    admin: 'مدير النظام',
  };

  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;
    
    setIsGeneratingPDF(true);
    
    try {
      const today = new Date().toLocaleDateString('ar-TN', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });

      // Create temporary div for PDF
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
          <h1 style="font-size: 24px; margin: 0; font-weight: bold;">تقرير الإحصائيات</h1>
          <p style="font-size: 14px; color: #666; margin-top: 8px;">${roleLabels[type]}</p>
          <p style="font-size: 12px; color: #999; margin-top: 4px;">التاريخ: ${today}</p>
        </div>
        
        <hr style="border: none; border-top: 2px solid #333; margin: 20px 0;" />
        
        <h2 style="font-size: 18px; margin-bottom: 20px;">ملخص الشكاوى</h2>
        
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 30px;">
          <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; text-align: center;">
            <p style="font-size: 24px; font-weight: bold; margin: 0; color: #333;">${stats.total}</p>
            <p style="font-size: 12px; color: #666; margin: 5px 0 0 0;">إجمالي الشكاوى</p>
          </div>
          <div style="background: #fef3c7; padding: 15px; border-radius: 8px; text-align: center;">
            <p style="font-size: 24px; font-weight: bold; margin: 0; color: #d97706;">${stats.pending}</p>
            <p style="font-size: 12px; color: #666; margin: 5px 0 0 0;">قيد الانتظار</p>
          </div>
          <div style="background: #dbeafe; padding: 15px; border-radius: 8px; text-align: center;">
            <p style="font-size: 24px; font-weight: bold; margin: 0; color: #2563eb;">${stats.viewed}</p>
            <p style="font-size: 12px; color: #666; margin: 5px 0 0 0;">تم الاطلاع</p>
          </div>
          <div style="background: #d1fae5; padding: 15px; border-radius: 8px; text-align: center;">
            <p style="font-size: 24px; font-weight: bold; margin: 0; color: #059669;">${stats.replied}</p>
            <p style="font-size: 12px; color: #666; margin: 5px 0 0 0;">تم الرد</p>
          </div>
          ${stats.forwarded ? `
          <div style="background: #ede9fe; padding: 15px; border-radius: 8px; text-align: center; grid-column: span 2;">
            <p style="font-size: 24px; font-weight: bold; margin: 0; color: #7c3aed;">${stats.forwarded}</p>
            <p style="font-size: 12px; color: #666; margin: 5px 0 0 0;">تم التحويل</p>
          </div>
          ` : ''}
        </div>
        
        <hr style="border: none; border-top: 1px solid #ccc; margin: 20px 0;" />
        
        <h2 style="font-size: 18px; margin-bottom: 20px;">مؤشرات الأداء</h2>
        
        <div style="background: #f9fafb; padding: 20px; border-radius: 8px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid #e5e7eb;">
            <span style="color: #666;">نسبة الاستجابة</span>
            <span style="font-weight: bold; color: ${responseRate >= 50 ? '#059669' : '#dc2626'};">${responseRate}%</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid #e5e7eb;">
            <span style="color: #666;">متوسط وقت الاستجابة</span>
            <span style="font-weight: bold;">2-3 أيام</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #666;">الشكاوى المعالجة</span>
            <span style="font-weight: bold;">${stats.replied + (stats.forwarded || 0)}</span>
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
      pdf.save(`تقرير_الإحصائيات_${new Date().toISOString().split('T')[0]}.pdf`);
      
      toast.success('تم تحميل التقرير بنجاح');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('خطأ في إنشاء التقرير');
    } finally {
      // Clean up temp div
      const tempDiv = document.querySelector('div[style*="left: -9999px"]');
      if (tempDiv) document.body.removeChild(tempDiv);
      setIsGeneratingPDF(false);
    }
  };

  return (
    <motion.div 
      ref={reportRef}
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Download PDF Button */}
      <div className="flex justify-end">
        <Button 
          onClick={handleDownloadPDF}
          disabled={isGeneratingPDF}
          variant="outline"
          className="gap-2"
        >
          {isGeneratingPDF ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          تحميل التقرير PDF
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
          <CheckCircle className="w-8 h-8 text-secondary mb-2" />
          <p className="text-2xl font-bold text-foreground">{stats.replied}</p>
          <p className="text-sm text-muted-foreground">تم الرد</p>
        </div>
        <div className="bg-card rounded-2xl p-4 border border-border">
          <div className="flex items-center gap-2 mb-2">
            {rateChange >= 0 ? (
              <TrendingUp className="w-8 h-8 text-secondary" />
            ) : (
              <TrendingDown className="w-8 h-8 text-destructive" />
            )}
          </div>
          <p className="text-2xl font-bold text-foreground">{responseRate}%</p>
          <p className="text-sm text-muted-foreground">نسبة الاستجابة</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
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
                      <Cell key={`cell-${index}`} fill={entry.color} />
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

        {/* Bar Chart */}
        <div className="bg-card rounded-2xl p-6 border border-border">
          <h3 className="text-lg font-bold text-foreground mb-4">إحصائيات الشكاوى</h3>
          {stats.total > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} layout="vertical">
                  <XAxis type="number" hide />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    width={60}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
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
                    dataKey="value" 
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

      {/* Stats Details */}
      <div className="bg-card rounded-2xl p-6 border border-border">
        <h3 className="text-lg font-bold text-foreground mb-4">ملخص الأداء</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">متوسط وقت الاستجابة</span>
            <span className="font-bold text-foreground">2-3 أيام</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">الشكاوى هذا الشهر</span>
            <span className="font-bold text-foreground">{stats.total}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">معدل الحل</span>
            <span className="font-bold text-secondary">{responseRate}%</span>
          </div>
          {stats.forwarded !== undefined && stats.forwarded > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">الشكاوى المحولة</span>
              <span className="font-bold text-primary">{stats.forwarded}</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
