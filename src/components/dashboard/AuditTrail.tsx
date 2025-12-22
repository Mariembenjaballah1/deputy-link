import { useState, useEffect } from 'react';
import { History, Eye, Reply, Forward, MessageSquare, FileText, Loader2, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface AuditLog {
  id: string;
  complaint_id: string;
  action: string;
  action_by: string;
  action_by_role: string | null;
  old_value: any;
  new_value: any;
  notes: string | null;
  created_at: string;
}

interface AuditTrailProps {
  complaintId: string;
}

const actionLabels: Record<string, { label: string; icon: typeof History; color: string }> = {
  created: { label: 'تم الإنشاء', icon: FileText, color: 'text-primary' },
  status_changed: { label: 'تغيير الحالة', icon: Clock, color: 'text-warning' },
  viewed: { label: 'تم الاطلاع', icon: Eye, color: 'text-info' },
  replied: { label: 'تم الرد', icon: Reply, color: 'text-secondary' },
  forwarded_to_ministry: { label: 'تحويل للوزارة', icon: Forward, color: 'text-accent' },
  forwarded_to_deputy: { label: 'تحويل لنائب الجهة', icon: Forward, color: 'text-purple-500' },
  forwarded_via_whatsapp: { label: 'تحويل عبر WhatsApp', icon: MessageSquare, color: 'text-green-500' },
  note_added: { label: 'إضافة ملاحظة', icon: FileText, color: 'text-muted-foreground' },
  priority_changed: { label: 'تغيير الأولوية', icon: Clock, color: 'text-destructive' },
};

export function AuditTrail({ complaintId }: AuditTrailProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAuditLogs();
  }, [complaintId]);

  const loadAuditLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('complaint_audit_log')
        .select('*')
        .eq('complaint_id', complaintId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Error loading audit logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-TN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getActionInfo = (action: string) => {
    return actionLabels[action] || { label: action, icon: History, color: 'text-muted-foreground' };
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">لا يوجد سجل أحداث</p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }}
      className="space-y-1"
    >
      <div className="flex items-center gap-2 mb-4">
        <History className="w-5 h-5 text-primary" />
        <h4 className="font-semibold text-foreground">سجل الأحداث</h4>
      </div>

      <div className="relative pr-4 border-r-2 border-border space-y-4">
        {logs.map((log, index) => {
          const actionInfo = getActionInfo(log.action);
          const IconComponent = actionInfo.icon;

          return (
            <div key={log.id} className="relative">
              {/* Timeline dot */}
              <div className={cn(
                "absolute -right-[13px] w-6 h-6 rounded-full bg-card border-2 border-border flex items-center justify-center",
                index === 0 && "border-primary"
              )}>
                <IconComponent className={cn("w-3 h-3", actionInfo.color)} />
              </div>

              {/* Content */}
              <div className="pr-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={cn("text-sm font-medium", actionInfo.color)}>
                    {actionInfo.label}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    • {log.action_by}
                  </span>
                  {log.action_by_role && (
                    <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded">
                      {log.action_by_role === 'mp' ? 'نائب الشعب' : 
                       log.action_by_role === 'local_deputy' ? 'نائب الجهة' : 
                       log.action_by_role === 'citizen' ? 'مواطن' : log.action_by_role}
                    </span>
                  )}
                </div>

                {log.notes && (
                  <p className="text-sm text-foreground mt-1 bg-muted/50 rounded p-2">
                    {log.notes}
                  </p>
                )}

                {log.new_value && typeof log.new_value === 'object' && (
                  <div className="text-xs text-muted-foreground mt-1">
                    {log.new_value.deputy_name && (
                      <span>→ {log.new_value.deputy_name}</span>
                    )}
                    {log.new_value.status && (
                      <span>→ {log.new_value.status}</span>
                    )}
                  </div>
                )}

                <p className="text-xs text-muted-foreground mt-1">
                  {formatDate(log.created_at)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
