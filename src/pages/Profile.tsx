import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, User, MapPin, Phone, LogOut, ChevronLeft, Settings, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MobileNav } from '@/components/layout/MobileNav';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { wilayas, dairas } from '@/data/mockData';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';

export default function Profile() {
  const navigate = useNavigate();
  const { user: authUser, logout, updateWilaya } = useAuthStore();
  const [showWilayaDialog, setShowWilayaDialog] = useState(false);
  const [showDairaDialog, setShowDairaDialog] = useState(false);
  const [selectedWilaya, setSelectedWilaya] = useState(authUser?.wilayaId || '1');
  
  const user = {
    phone: authUser?.phone ? `+216 ${authUser.phone}` : '+216 XX XXX XXX',
    wilaya: wilayas.find(w => w.id === authUser?.wilayaId)?.name || 'تونس',
    daira: dairas.find(d => d.id === authUser?.dairaId)?.name || '',
  };
  
  const filteredDairas = dairas.filter(d => d.wilayaId === selectedWilaya);
  
  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  const handleWilayaSelect = (wilayaId: string) => {
    setSelectedWilaya(wilayaId);
    setShowWilayaDialog(false);
    // Show daira dialog if there are dairas for this wilaya
    const availableDairas = dairas.filter(d => d.wilayaId === wilayaId);
    if (availableDairas.length > 0) {
      setShowDairaDialog(true);
    } else {
      updateWilaya(wilayaId);
      toast.success('تم تحديث الولاية بنجاح');
    }
  };

  const handleDairaSelect = (dairaId: string) => {
    updateWilaya(selectedWilaya, dairaId);
    setShowDairaDialog(false);
    toast.success('تم تحديث الولاية والدائرة بنجاح');
  };

  const menuItems = [
    { icon: MapPin, label: 'تغيير الولاية', action: () => setShowWilayaDialog(true) },
    { icon: Settings, label: 'الإعدادات', href: '/settings' },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-gradient-to-b from-primary to-primary/80 pt-12 pb-16 px-4">
        <Link to="/citizen" className="inline-flex items-center gap-2 text-primary-foreground/80 mb-6">
          <ArrowRight className="w-5 h-5" />
          <span>رجوع</span>
        </Link>
        
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-20 h-20 rounded-full bg-primary-foreground/20 mx-auto flex items-center justify-center">
            <User className="w-10 h-10 text-primary-foreground" />
          </div>
          <p className="text-primary-foreground/80 mt-4 flex items-center justify-center gap-2">
            <Phone className="w-4 h-4" />
            {user.phone}
          </p>
          <p className="text-primary-foreground flex items-center justify-center gap-1 mt-2">
            <MapPin className="w-4 h-4" />
            {user.wilaya} {user.daira && `- ${user.daira}`}
          </p>
        </motion.div>
      </div>

      {/* Menu */}
      <div className="container -mt-6 relative z-10">
        <motion.div 
          className="bg-card rounded-2xl shadow-lg border border-border/50 overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {menuItems.map((item) => (
            item.action ? (
              <button
                key={item.label}
                onClick={item.action}
                className="w-full flex items-center gap-4 p-4 border-b border-border/50 last:border-b-0 hover:bg-muted/50 transition-colors text-right"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <item.icon className="w-5 h-5 text-primary" />
                </div>
                <span className="flex-1 font-medium text-foreground">{item.label}</span>
                <ChevronLeft className="w-5 h-5 text-muted-foreground" />
              </button>
            ) : (
              <Link
                key={item.label}
                to={item.href!}
                className="flex items-center gap-4 p-4 border-b border-border/50 last:border-b-0 hover:bg-muted/50 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <item.icon className="w-5 h-5 text-primary" />
                </div>
                <span className="flex-1 font-medium text-foreground">{item.label}</span>
                <ChevronLeft className="w-5 h-5 text-muted-foreground" />
              </Link>
            )
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6"
        >
          <Button 
            variant="outline" 
            size="lg" 
            className="w-full gap-2 text-destructive border-destructive/30 hover:bg-destructive/10"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5" />
            تسجيل الخروج
          </Button>
        </motion.div>
      </div>

      {/* Wilaya Selection Dialog */}
      <Dialog open={showWilayaDialog} onOpenChange={setShowWilayaDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center">اختر الولاية</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-2">
              {wilayas.map((wilaya) => (
                <button
                  key={wilaya.id}
                  onClick={() => handleWilayaSelect(wilaya.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors ${
                    authUser?.wilayaId === wilaya.id 
                      ? 'border-primary bg-primary/10' 
                      : 'border-border hover:bg-muted/50'
                  }`}
                >
                  <span className="font-medium">{wilaya.name}</span>
                  {authUser?.wilayaId === wilaya.id && (
                    <Check className="w-5 h-5 text-primary" />
                  )}
                </button>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Daira Selection Dialog */}
      <Dialog open={showDairaDialog} onOpenChange={setShowDairaDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center">اختر الدائرة</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-2">
              {filteredDairas.map((daira) => (
                <button
                  key={daira.id}
                  onClick={() => handleDairaSelect(daira.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors ${
                    authUser?.dairaId === daira.id 
                      ? 'border-primary bg-primary/10' 
                      : 'border-border hover:bg-muted/50'
                  }`}
                >
                  <span className="font-medium">{daira.name}</span>
                  {authUser?.dairaId === daira.id && (
                    <Check className="w-5 h-5 text-primary" />
                  )}
                </button>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <MobileNav />
    </div>
  );
}
