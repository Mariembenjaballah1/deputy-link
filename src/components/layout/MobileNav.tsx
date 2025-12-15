import { Link, useLocation } from 'react-router-dom';
import { Home, User, FileText, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/', icon: Home, label: 'الرئيسية' },
  { path: '/complaints', icon: FileText, label: 'شكاواي' },
  { path: '/notifications', icon: Bell, label: 'الإشعارات' },
  { path: '/profile', icon: User, label: 'حسابي' },
];

export function MobileNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 right-0 left-0 z-40 bg-card/95 backdrop-blur-xl border-t border-border safe-area-pb">
      <div className="flex items-center justify-around h-16 px-4">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all duration-200",
                isActive 
                  ? "text-primary bg-primary/10" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className={cn("w-5 h-5", isActive && "stroke-[2.5]")} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
