import { useState } from 'react';
import { Search, Filter, X, Calendar, MapPin, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocations } from '@/hooks/useLocations';
import { categoryLabels, statusLabels } from '@/types';

interface FiltersState {
  search: string;
  status: string;
  category: string;
  wilayaId: string;
  dairaId: string;
  dateFrom: string;
  dateTo: string;
}

interface ComplaintFiltersProps {
  filters: FiltersState;
  onFiltersChange: (filters: FiltersState) => void;
}

export function ComplaintFilters({ filters, onFiltersChange }: ComplaintFiltersProps) {
  const { wilayas, dairas } = useLocations();
  const [showFilters, setShowFilters] = useState(false);

  const filteredDairas = filters.wilayaId 
    ? dairas.filter(d => d.wilayaId === filters.wilayaId)
    : dairas;

  const handleChange = (key: keyof FiltersState, value: string) => {
    const newFilters = { ...filters, [key]: value };
    
    // Reset daira when wilaya changes
    if (key === 'wilayaId') {
      newFilters.dairaId = '';
    }
    
    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    onFiltersChange({
      search: '',
      status: '',
      category: '',
      wilayaId: '',
      dairaId: '',
      dateFrom: '',
      dateTo: '',
    });
  };

  const hasActiveFilters = Object.values(filters).some(v => v !== '');

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={filters.search}
            onChange={(e) => handleChange('search', e.target.value)}
            placeholder="بحث في الشكاوى..."
            className="pr-10"
          />
        </div>
        <Button 
          variant={showFilters ? 'default' : 'outline'} 
          className="gap-2"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="w-4 h-4" />
          تصفية
          {hasActiveFilters && (
            <span className="w-2 h-2 rounded-full bg-destructive" />
          )}
        </Button>
        {hasActiveFilters && (
          <Button 
            variant="ghost" 
            size="icon"
            onClick={clearFilters}
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Filter Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-card rounded-xl p-4 border border-border grid grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Status */}
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">الحالة</label>
                <Select 
                  value={filters.status} 
                  onValueChange={(v) => handleChange('status', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="جميع الحالات" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">جميع الحالات</SelectItem>
                    {Object.entries(statusLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Category */}
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">الصنف</label>
                <Select 
                  value={filters.category} 
                  onValueChange={(v) => handleChange('category', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="جميع الأصناف" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">جميع الأصناف</SelectItem>
                    {Object.entries(categoryLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Wilaya */}
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">الولاية</label>
                <Select 
                  value={filters.wilayaId} 
                  onValueChange={(v) => handleChange('wilayaId', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="جميع الولايات" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">جميع الولايات</SelectItem>
                    {wilayas.map((w) => (
                      <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Daira */}
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">الدائرة</label>
                <Select 
                  value={filters.dairaId} 
                  onValueChange={(v) => handleChange('dairaId', v)}
                  disabled={!filters.wilayaId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="جميع الدوائر" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">جميع الدوائر</SelectItem>
                    {filteredDairas.map((d) => (
                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date From */}
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">من تاريخ</label>
                <Input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => handleChange('dateFrom', e.target.value)}
                />
              </div>

              {/* Date To */}
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">إلى تاريخ</label>
                <Input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => handleChange('dateTo', e.target.value)}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
