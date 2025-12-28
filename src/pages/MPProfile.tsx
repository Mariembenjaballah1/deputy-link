import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ArrowRight, MapPin, MessageSquare, TrendingUp, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { MobileNav } from '@/components/layout/MobileNav';
import { supabase } from '@/integrations/supabase/client';
import { MP } from '@/types';

export default function MPProfile() {
  const { id } = useParams();
  const [mp, setMp] = useState<MP | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadMP();
  }, [id]);

  const loadMP = async () => {
    if (!id) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('mps')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        console.error('Error loading MP:', error);
        setMp(null);
      } else if (data) {
        setMp({
          id: data.id,
          name: data.name,
          image: data.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name)}&background=random`,
          wilaya: data.wilaya,
          wilayaId: data.wilaya_id || '1',
          dairaId: data.daira_id || '1',
          daira: data.daira || undefined,
          bloc: data.bloc || undefined,
          complaintsCount: data.complaints_count || 0,
          responseRate: data.response_rate || 0,
          email: data.email || undefined,
          phone: data.phone || undefined,
          bio: data.bio || undefined,
          profileUrl: data.profile_url || undefined,
        });
      }
    } catch (error) {
      console.error('Error:', error);
      setMp(null);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!mp) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">النائب غير موجود</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-gradient-to-b from-primary to-primary/80 pt-12 pb-20 px-4">
        <Link to="/citizen" className="inline-flex items-center gap-2 text-primary-foreground/80 mb-6">
          <ArrowRight className="w-5 h-5" />
          <span>رجوع</span>
        </Link>
        
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <img
            src={mp.image}
            alt={mp.name}
            className="w-24 h-24 rounded-full mx-auto ring-4 ring-primary-foreground/30 object-cover"
          />
          <h1 className="text-xl font-bold text-primary-foreground mt-4">{mp.name}</h1>
          <p className="text-primary-foreground/80 flex items-center justify-center gap-1 mt-2">
            <MapPin className="w-4 h-4" />
            {mp.wilaya}
          </p>
          {mp.bloc && (
            <p className="text-primary-foreground/70 text-sm mt-1">{mp.bloc}</p>
          )}
        </motion.div>
      </div>

      {/* Stats Cards */}
      <div className="container -mt-10 relative z-10">
        <motion.div 
          className="grid grid-cols-2 gap-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="bg-card rounded-2xl p-4 shadow-lg border border-border/50 text-center">
            <MessageSquare className="w-8 h-8 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{mp.complaintsCount}</p>
            <p className="text-xs text-muted-foreground">طلب مستلم</p>
          </div>
          <div className="bg-card rounded-2xl p-4 shadow-lg border border-border/50 text-center">
            <TrendingUp className="w-8 h-8 text-secondary mx-auto mb-2" />
            <p className="text-2xl font-bold text-secondary">{mp.responseRate}%</p>
            <p className="text-xs text-muted-foreground">نسبة الرد</p>
          </div>
        </motion.div>
      </div>

      {/* Bio */}
      {mp.bio && (
        <div className="container mt-8">
          <h2 className="text-lg font-bold text-foreground mb-4">نبذة</h2>
          <div className="bg-card rounded-xl p-4 border border-border/50">
            <p className="text-muted-foreground">{mp.bio}</p>
          </div>
        </div>
      )}

      {/* CTA Button */}
      <div className="container mt-8">
        <Link to="/complaint/new">
          <Button variant="hero" size="xl" className="w-full">
            إرسال طلب لهذا النائب
          </Button>
        </Link>
      </div>

      <MobileNav />
    </div>
  );
}
