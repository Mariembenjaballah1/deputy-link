import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { MobileNav } from '@/components/layout/MobileNav';
import { FloatingButton } from '@/components/layout/FloatingButton';
import { FilterTabs } from '@/components/home/FilterTabs';
import { ActivityCard } from '@/components/home/ActivityCard';
import { MPCard } from '@/components/home/MPCard';
import { activities, mps, wilayas } from '@/data/mockData';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { motion } from 'framer-motion';

const Index = () => {
  const [selectedWilaya, setSelectedWilaya] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMPsSheet, setShowMPsSheet] = useState(false);

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
            <SheetTitle>
              نواب {selectedWilaya ? wilayas.find(w => w.id === selectedWilaya)?.name : 'كل الولايات'}
            </SheetTitle>
          </SheetHeader>
          <div className="space-y-3 mt-6 overflow-y-auto max-h-[calc(80vh-100px)]">
            {filteredMPs.map((mp, index) => (
              <MPCard key={mp.id} mp={mp} index={index} />
            ))}
          </div>
        </SheetContent>
      </Sheet>

      <FloatingButton />
      <MobileNav />
    </div>
  );
};

export default Index;
