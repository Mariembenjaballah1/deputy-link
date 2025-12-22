import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { TrendingUp, TrendingDown, MessageSquare, Clock, Eye, CheckCircle, Forward } from 'lucide-react';
import { motion } from 'framer-motion';

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

  const previousResponseRate = 65; // Mock previous rate for comparison
  const rateChange = responseRate - previousResponseRate;

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
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
