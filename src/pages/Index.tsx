import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { MobileNav } from '@/components/layout/MobileNav';
import { FloatingButton } from '@/components/layout/FloatingButton';
import { InstallPrompt } from '@/components/layout/InstallPrompt';
import { FilterTabs } from '@/components/home/FilterTabs';
import { MPCard } from '@/components/home/MPCard';
import { CommunityCompanyFAQ } from '@/components/home/CommunityCompanyFAQ';
import { useLocations } from '@/hooks/useLocations';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Search, Building2, Sparkles, ChevronLeft } from 'lucide-react';
import { MP } from '@/types';

const Index = () => {
  const { wilayas } = useLocations();
  const [selectedWilaya, setSelectedWilaya] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [mpSearchQuery, setMpSearchQuery] = useState('');
  const [showMPsSheet, setShowMPsSheet] = useState(false);
  const [showFAQ, setShowFAQ] = useState(false);
  
  const [mps, setMps] = useState<MP[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadMPs();
  }, []);

  const loadMPs = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('mps')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.error('Error loading MPs:', error);
        setMps([]);
      } else if (data) {
        const formattedMps: MP[] = data.map(mp => ({
          id: mp.id,
          name: mp.name,
          image: mp.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(mp.name)}&background=random`,
          wilaya: mp.wilaya,
          wilayaId: mp.wilaya_id || '1',
          dairaId: mp.daira_id || '1',
          daira: mp.daira || undefined,
          bloc: mp.bloc || undefined,
          complaintsCount: mp.complaints_count || 0,
          responseRate: mp.response_rate || 0,
          email: mp.email || undefined,
          phone: mp.phone || undefined,
          bio: mp.bio || undefined,
          profileUrl: mp.profile_url || undefined,
        }));
        setMps(formattedMps);
      }
    } catch (error) {
      console.error('Error:', error);
      setMps([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter MPs by wilaya and search query (from Header or Sheet)
  const activeSearchQuery = searchQuery || mpSearchQuery;
  const filteredMPs = mps.filter(mp => {
    const matchesWilaya = !selectedWilaya || mp.wilayaId === selectedWilaya;
    const matchesSearch = !activeSearchQuery || 
      mp.name.toLowerCase().includes(activeSearchQuery.toLowerCase()) ||
      mp.wilaya.toLowerCase().includes(activeSearchQuery.toLowerCase()) ||
      (mp.bloc && mp.bloc.toLowerCase().includes(activeSearchQuery.toLowerCase()));
    return matchesWilaya && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-background pb-40">
      <Header onSearch={setSearchQuery} />
      
      <main className="container py-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <FilterTabs
            selectedWilaya={selectedWilaya}
            onWilayaChange={setSelectedWilaya}
            onShowMPs={() => setShowMPsSheet(true)}
          />
        </motion.div>

        {/* Community Company FAQ Button - Enhanced */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.15, type: "spring", stiffness: 200 }}
          className="mb-6"
        >
          <motion.button
            onClick={() => setShowFAQ(true)}
            className="w-full relative overflow-hidden rounded-2xl bg-gradient-to-l from-primary via-primary/90 to-primary/80 p-[2px] shadow-[0_8px_30px_hsl(var(--primary)/0.4)] group"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {/* Animated gradient border */}
            <div className="absolute inset-0 bg-gradient-to-l from-accent via-primary to-accent opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-pulse" />
            
            <div className="relative bg-card rounded-[14px] p-5">
              <div className="flex items-center gap-4 w-full">
                {/* Animated Icon Container */}
                <motion.div 
                  className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center relative"
                  animate={{ 
                    boxShadow: ["0 0 0 0 hsl(var(--primary)/0.4)", "0 0 0 10px hsl(var(--primary)/0)", "0 0 0 0 hsl(var(--primary)/0.4)"]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Building2 className="w-7 h-7 text-primary" />
                  <Sparkles className="w-4 h-4 text-accent absolute -top-1 -right-1 animate-pulse" />
                </motion.div>
                
                <div className="flex-1 text-right">
                  <h3 className="font-bold text-foreground text-lg mb-1 group-hover:text-primary transition-colors">
                    استفسار حول الشركات الأهلية
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    معلومات شاملة عن التأسيس والإدارة
                  </p>
                </div>
                
                {/* Arrow indicator */}
                <motion.div
                  className="text-primary"
                  animate={{ x: [0, -5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <ChevronLeft className="w-6 h-6" />
                </motion.div>
              </div>
              
              {/* Bottom highlight bar */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-l from-accent via-primary to-accent opacity-50 group-hover:opacity-100 transition-opacity" />
            </div>
          </motion.button>
        </motion.div>

        <div className="space-y-4">
          <h2 className="text-lg font-bold text-foreground">نواب الشعب</h2>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredMPs.length > 0 ? (
            <div className="space-y-3">
              {filteredMPs.slice(0, 5).map((mp, index) => (
                <MPCard key={mp.id} mp={mp} index={index} />
              ))}
              {filteredMPs.length > 5 && (
                <button 
                  onClick={() => setShowMPsSheet(true)}
                  className="w-full py-3 text-primary font-medium hover:bg-primary/5 rounded-xl transition-colors"
                >
                  عرض كل النواب ({filteredMPs.length})
                </button>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">لا يوجد نواب مسجلين</p>
              <p className="text-sm text-muted-foreground mt-2">يرجى إضافة النواب من لوحة الإدارة</p>
            </div>
          )}
        </div>
      </main>

      <Sheet open={showMPsSheet} onOpenChange={setShowMPsSheet}>
        <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              نواب {selectedWilaya ? wilayas.find(w => w.id === selectedWilaya)?.name : 'كل الولايات'}
              <span className="text-sm font-normal text-muted-foreground">
                ({filteredMPs.length} نائب)
              </span>
            </SheetTitle>
          </SheetHeader>
          
          {/* Search input */}
          <div className="relative mt-4 mb-4">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="ابحث عن نائب..."
              value={mpSearchQuery}
              onChange={(e) => setMpSearchQuery(e.target.value)}
              className="pr-10"
            />
          </div>
          
          <div className="space-y-3 overflow-y-auto max-h-[calc(85vh-180px)]">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : filteredMPs.length > 0 ? (
              filteredMPs.map((mp, index) => (
                <MPCard key={mp.id} mp={mp} index={index} />
              ))
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  {mpSearchQuery ? 'لا توجد نتائج للبحث' : 'لا يوجد نواب مسجلين'}
                </p>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Community Company FAQ Sheet */}
      <CommunityCompanyFAQ open={showFAQ} onOpenChange={setShowFAQ} />

      <InstallPrompt />
      <FloatingButton />
      <MobileNav />
    </div>
  );
};

export default Index;
