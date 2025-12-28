import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useState } from 'react';

interface HeaderProps {
  onSearch?: (query: string) => void;
}

export function Header({ onSearch }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    onSearch?.(value);
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-card/90 backdrop-blur-xl border-b border-border">
      <div className="container py-4">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-primary mb-1">تواصل</h1>
            <p className="text-xs text-muted-foreground">صوتك يصل</p>
          </div>
        </div>
        
        <div className="relative mt-4">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="ابحث عن نائب أو موضوع..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pr-10 h-12 bg-background border-border rounded-xl text-sm"
          />
        </div>
      </div>
    </header>
  );
}
