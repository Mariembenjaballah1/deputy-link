import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { MobileNav } from '@/components/layout/MobileNav';
import { FloatingButton } from '@/components/layout/FloatingButton';
import { FilterTabs } from '@/components/home/FilterTabs';
import { ActivityCard } from '@/components/home/ActivityCard';
import { MPCard } from '@/components/home/MPCard';
import { activities, mps as mockMps, wilayas } from '@/data/mockData';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { MP } from '@/types';

const Index = () => {
  const [selectedWilaya, setSelectedWilaya] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMPsSheet, setShowMPsSheet] = useState(false);
  const [mps, setMps] = useState<MP[]>(mockMps);
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
        setMps(mockMps);
      } else if (data && data.length > 0) {
        const formattedMps: MP[] = data.map(mp => ({
          id: mp.id,
          name: mp.name,
          image: mp.image || 'https://randomuser.me/api/portraits/men/1.jpg',
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
      } else {
        setMps(mockMps);
      }
    } catch (error) {
      console.error('Error:', error);
      setMps(mockMps);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredActivities = activities.filter(activity => {
    const matchesWilaya = !selectedWilaya || 
      wilayas.find(w => w.id === selectedWilaya)?.name === activity.wilaya;
    const matchesSearch = !searchQuery || 
      activity.mpName.includes(searchQuery) || 
      activity.title.includes(searchQuery) ||
      activity.category.includes(searchQuery);
    return matchesWilaya && matchesSearch;
  });

  const filteredMPs = selectedWilaya 
    ? mps.filter(mp => mp.wilayaId === selectedWilaya)
    : mps;

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

        <div className="space-y-4">
          <h2 className="text-lg font-bold text-foreground">أنشطة النواب</h2>
          {filteredActivities.length > 0 ? (
            <div className="space-y-3">
              {filteredActivities.map((activity, index) => (
                <ActivityCard key={activity.id} activity={activity} index={index} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">لا توجد أنشطة متاحة</p>
            </div>
          )}
        </div>
      </main>

      <Sheet open={showMPsSheet} onOpenChange={setShowMPsSheet}>
        <SheetContent side="bottom" className="h-[80vh] rounded-t-3xl">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              نواب {selectedWilaya ? wilayas.find(w => w.id === selectedWilaya)?.name : 'كل الولايات'}
              <span className="text-sm font-normal text-muted-foreground">
                ({filteredMPs.length} نائب)
              </span>
            </SheetTitle>
          </SheetHeader>
          <div className="space-y-3 mt-6 overflow-y-auto max-h-[calc(80vh-100px)]">
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
                <p className="text-muted-foreground">لا يوجد نواب مسجلين</p>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <FloatingButton />
      <MobileNav />
    </div>
  );
};

export default Index;
