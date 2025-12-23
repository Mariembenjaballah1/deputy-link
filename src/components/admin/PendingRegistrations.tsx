import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Check, XCircle, Loader2, Clock, Users, Building2, Phone, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { wilayas, dairas } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface PendingRegistration {
  id: string;
  phone: string;
  name: string;
  role: 'mp' | 'local_deputy';
  wilaya_id: string;
  daira_id: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

interface PendingRegistrationsProps {
  onCountChange?: (count: number) => void;
}

export function PendingRegistrations({ onCountChange }: PendingRegistrationsProps) {
  const [registrations, setRegistrations] = useState<PendingRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    loadRegistrations();
    
    // Subscribe to real-time updates
    const channel = supabase
      .channel('pending-registrations')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pending_registrations'
        },
        () => {
          loadRegistrations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadRegistrations = async () => {
    try {
      const { data, error } = await supabase
        .from('pending_registrations')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedData: PendingRegistration[] = (data || []).map(reg => ({
        id: reg.id,
        phone: reg.phone,
        name: reg.name,
        role: reg.role as 'mp' | 'local_deputy',
        wilaya_id: reg.wilaya_id,
        daira_id: reg.daira_id,
        status: reg.status as 'pending' | 'approved' | 'rejected',
        created_at: reg.created_at,
      }));

      setRegistrations(formattedData);
      onCountChange?.(formattedData.length);
    } catch (error) {
      console.error('Error loading registrations:', error);
      toast.error('خطأ في تحميل طلبات التسجيل');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (registration: PendingRegistration) => {
    setProcessingId(registration.id);
    
    try {
      // 1. Add to the appropriate table (mps or local_deputies)
      if (registration.role === 'mp') {
        const wilaya = wilayas.find(w => w.id === registration.wilaya_id);
        const { error: insertError } = await supabase
          .from('mps')
          .insert({
            name: registration.name,
            phone: registration.phone,
            wilaya: wilaya?.name || '',
            wilaya_id: registration.wilaya_id,
            daira_id: registration.daira_id,
            is_active: true,
            complaints_count: 0,
            response_rate: 0,
            image: `https://ui-avatars.com/api/?name=${encodeURIComponent(registration.name)}&background=random`,
          });

        if (insertError) throw insertError;
      } else {
        const { error: insertError } = await supabase
          .from('local_deputies')
          .insert({
            name: registration.name,
            phone: registration.phone,
            wilaya_id: registration.wilaya_id,
            daira_id: registration.daira_id || '',
            is_active: true,
            image: `https://ui-avatars.com/api/?name=${encodeURIComponent(registration.name)}&background=random`,
          });

        if (insertError) throw insertError;
      }

      // 2. Update registration status
      const { error: updateError } = await supabase
        .from('pending_registrations')
        .update({ 
          status: 'approved',
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', registration.id);

      if (updateError) throw updateError;

      toast.success(`تم قبول ${registration.name} كـ${registration.role === 'mp' ? 'نائب شعب' : 'نائب جهة'}`);
      loadRegistrations();
    } catch (error) {
      console.error('Error approving registration:', error);
      toast.error('خطأ في قبول الطلب');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (registration: PendingRegistration) => {
    setProcessingId(registration.id);
    
    try {
      const { error } = await supabase
        .from('pending_registrations')
        .update({ 
          status: 'rejected',
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', registration.id);

      if (error) throw error;

      toast.success(`تم رفض طلب ${registration.name}`);
      loadRegistrations();
    } catch (error) {
      console.error('Error rejecting registration:', error);
      toast.error('خطأ في رفض الطلب');
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (registrations.length === 0) {
    return (
      <div className="bg-card rounded-xl border border-border p-8 text-center">
        <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">لا توجد طلبات تسجيل جديدة</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {registrations.map((registration, index) => (
        <motion.div
          key={registration.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-card rounded-xl border border-border p-4"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center",
                registration.role === 'mp' ? "bg-primary/10" : "bg-secondary/10"
              )}>
                {registration.role === 'mp' ? (
                  <Users className="w-6 h-6 text-primary" />
                ) : (
                  <Building2 className="w-6 h-6 text-secondary" />
                )}
              </div>
              <div>
                <h4 className="font-bold text-foreground">{registration.name}</h4>
                <div className="flex flex-wrap items-center gap-3 mt-1">
                  <span className={cn(
                    "text-xs px-2 py-0.5 rounded-full",
                    registration.role === 'mp' 
                      ? "bg-primary/10 text-primary" 
                      : "bg-secondary/10 text-secondary"
                  )}>
                    {registration.role === 'mp' ? 'نائب شعب' : 'نائب جهة'}
                  </span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {registration.phone}
                  </span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {wilayas.find(w => w.id === registration.wilaya_id)?.name}
                    {registration.daira_id && ` - ${dairas.find(d => d.id === registration.daira_id)?.name}`}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  تاريخ الطلب: {new Date(registration.created_at).toLocaleDateString('ar-DZ')}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                variant="default"
                size="sm"
                className="gap-1"
                disabled={processingId === registration.id}
                onClick={() => handleApprove(registration)}
              >
                {processingId === registration.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                قبول
              </Button>
              <Button 
                variant="destructive"
                size="sm"
                className="gap-1"
                disabled={processingId === registration.id}
                onClick={() => handleReject(registration)}
              >
                <XCircle className="w-4 h-4" />
                رفض
              </Button>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
