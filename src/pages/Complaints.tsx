import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, FileText, Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ComplaintCard } from '@/components/complaint/ComplaintCard';
import { ComplaintDetailModal } from '@/components/complaint/ComplaintDetailModal';
import { MobileNav } from '@/components/layout/MobileNav';
import { motion } from 'framer-motion';
import { Complaint, ComplaintCategory, ComplaintStatus } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/authStore';

export default function Complaints() {
  const { user } = useAuthStore();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);

  useEffect(() => {
    loadComplaints();
    
    // Subscribe to real-time updates
    const channel = supabase
      .channel('my-complaints')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'complaints'
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

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-xl border-b border-border px-4 py-4">
        <div className="flex items-center gap-4">
          <Link to="/citizen">
            <ArrowRight className="w-6 h-6 text-foreground" />
          </Link>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-foreground">شكاواي</h1>
            <p className="text-xs text-muted-foreground">{complaints.length} شكوى</p>
          </div>
          <Link to="/complaint/new">
            <Button variant="default" size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              جديدة
            </Button>
          </Link>
        </div>
      </header>

      <main className="container py-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : complaints.length > 0 ? (
          <div className="space-y-4">
            {complaints.map((complaint, index) => (
              <div key={complaint.id} onClick={() => setSelectedComplaint(complaint)} className="cursor-pointer">
                <ComplaintCard complaint={complaint} index={index} />
              </div>
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="w-20 h-20 rounded-full bg-muted mx-auto flex items-center justify-center mb-4">
              <FileText className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-bold text-foreground mb-2">لا توجد شكاوى</h2>
            <p className="text-muted-foreground mb-6">لم تقم بتقديم أي شكوى بعد</p>
            <Link to="/complaint/new">
              <Button variant="hero" size="lg">
                تقديم شكوى جديدة
              </Button>
            </Link>
          </motion.div>
        )}
      </main>

      <MobileNav />

      <ComplaintDetailModal
        complaint={selectedComplaint}
        isOpen={!!selectedComplaint}
        onClose={() => setSelectedComplaint(null)}
        onUpdate={loadComplaints}
        canEdit={true}
        canDelete={true}
      />
    </div>
  );
}
