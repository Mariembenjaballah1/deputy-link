import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useLocations } from '@/hooks/useLocations';
import { MapPin, Users, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FilterTabsProps {
  selectedWilaya: string | null;
  onWilayaChange: (wilayaId: string | null) => void;
  onShowMPs: () => void;
}

export function FilterTabs({ selectedWilaya, onWilayaChange, onShowMPs }: FilterTabsProps) {
  const { wilayas } = useLocations();
  const [activeFilter, setActiveFilter] = useState<'all' | 'wilaya' | 'mps'>('all');
  const [isWilayaSheetOpen, setIsWilayaSheetOpen] = useState(false);

  const handleAllClick = () => {
    setActiveFilter('all');
    onWilayaChange(null);
  };

  const selectedWilayaName = selectedWilaya 
    ? wilayas.find(w => w.id === selectedWilaya)?.name 
    : null;

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
      <Button
        variant={activeFilter === 'all' ? 'default' : 'outline'}
        size="sm"
        onClick={handleAllClick}
        className="shrink-0 gap-2"
      >
        <Layers className="w-4 h-4" />
        الكل
      </Button>

      <Sheet open={isWilayaSheetOpen} onOpenChange={setIsWilayaSheetOpen}>
        <SheetTrigger asChild>
          <Button
            variant={activeFilter === 'wilaya' ? 'default' : 'outline'}
            size="sm"
            className="shrink-0 gap-2"
            onClick={() => setActiveFilter('wilaya')}
          >
            <MapPin className="w-4 h-4" />
            {selectedWilayaName || 'الولايات'}
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-[60vh] rounded-t-3xl">
          <SheetHeader>
            <SheetTitle>اختر الولاية</SheetTitle>
          </SheetHeader>
          <div className="grid grid-cols-2 gap-3 mt-6 overflow-y-auto">
            {wilayas.map((wilaya) => (
              <Button
                key={wilaya.id}
                variant={selectedWilaya === wilaya.id ? 'default' : 'outline'}
                className="justify-start h-12"
                onClick={() => {
                  onWilayaChange(wilaya.id);
                  setIsWilayaSheetOpen(false);
                }}
              >
                <span className="text-xs text-muted-foreground ml-2">{wilaya.code}</span>
                {wilaya.name}
              </Button>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      <Button
        variant={activeFilter === 'mps' ? 'default' : 'outline'}
        size="sm"
        onClick={() => {
          setActiveFilter('mps');
          onShowMPs();
        }}
        className="shrink-0 gap-2"
      >
        <Users className="w-4 h-4" />
        نواب الولاية
      </Button>
    </div>
  );
}
