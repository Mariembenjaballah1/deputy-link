import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Moon, Sun, Bell, BellOff, User, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { MobileNav } from '@/components/layout/MobileNav';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';

export default function Settings() {
  const navigate = useNavigate();
  const { user, updateProfile } = useAuthStore();
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Load user data
    if (user) {
      const nameParts = (user.name || '').split(' ');
      setFirstName(nameParts[0] || '');
      setLastName(nameParts.slice(1).join(' ') || '');
      setEmail(user.email || '');
    }
    
    // Load theme preference
    const savedTheme = localStorage.getItem('theme');
    const isDark = savedTheme === 'dark' || 
      (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    }
    
    // Load notifications preference
    const savedNotifications = localStorage.getItem('notifications');
    setNotifications(savedNotifications !== 'false');
  }, [user]);

  const handleDarkModeToggle = (enabled: boolean) => {
    setDarkMode(enabled);
    if (enabled) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
    toast.success(enabled ? 'تم تفعيل الوضع الداكن' : 'تم تفعيل الوضع الفاتح');
  };

  const handleNotificationsToggle = (enabled: boolean) => {
    setNotifications(enabled);
    localStorage.setItem('notifications', enabled.toString());
    toast.success(enabled ? 'تم تفعيل الإشعارات' : 'تم إيقاف الإشعارات');
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    
    try {
      const fullName = `${firstName} ${lastName}`.trim();
      updateProfile({
        name: fullName || user?.name,
        email: email || user?.email,
      });
      
      toast.success('تم حفظ المعلومات بنجاح');
    } catch (error) {
      toast.error('حدث خطأ أثناء الحفظ');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-gradient-to-b from-primary to-primary/80 pt-12 pb-8 px-4">
        <Link to="/profile" className="inline-flex items-center gap-2 text-primary-foreground/80 mb-4">
          <ArrowRight className="w-5 h-5" />
          <span>رجوع</span>
        </Link>
        
        <motion.h1 
          className="text-2xl font-bold text-primary-foreground"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          الإعدادات
        </motion.h1>
      </div>

      <div className="container -mt-4 relative z-10 space-y-6">
        {/* Personal Info Section */}
        <motion.div 
          className="bg-card rounded-2xl shadow-lg border border-border/50 p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">المعلومات الشخصية</h2>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">الاسم</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="أدخل الاسم"
                  className="text-right"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">اللقب</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="أدخل اللقب"
                  className="text-right"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                className="text-left"
                dir="ltr"
              />
            </div>
            
            <div className="space-y-2">
              <Label>رقم الهاتف</Label>
              <Input
                value={user?.phone ? `+216 ${user.phone}` : ''}
                disabled
                className="text-left bg-muted/50"
                dir="ltr"
              />
              <p className="text-xs text-muted-foreground">لا يمكن تغيير رقم الهاتف</p>
            </div>
            
            <Button 
              onClick={handleSaveProfile} 
              className="w-full gap-2"
              disabled={isSaving}
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              حفظ المعلومات
            </Button>
          </div>
        </motion.div>

        {/* Appearance Section */}
        <motion.div 
          className="bg-card rounded-2xl shadow-lg border border-border/50 p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-lg font-semibold text-foreground mb-6">المظهر</h2>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {darkMode ? (
                <Moon className="w-5 h-5 text-primary" />
              ) : (
                <Sun className="w-5 h-5 text-accent" />
              )}
              <div>
                <p className="font-medium text-foreground">الوضع الداكن</p>
                <p className="text-sm text-muted-foreground">
                  {darkMode ? 'مفعّل' : 'غير مفعّل'}
                </p>
              </div>
            </div>
            <Switch
              checked={darkMode}
              onCheckedChange={handleDarkModeToggle}
            />
          </div>
        </motion.div>

        {/* Notifications Section */}
        <motion.div 
          className="bg-card rounded-2xl shadow-lg border border-border/50 p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-lg font-semibold text-foreground mb-6">الإشعارات</h2>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {notifications ? (
                <Bell className="w-5 h-5 text-primary" />
              ) : (
                <BellOff className="w-5 h-5 text-muted-foreground" />
              )}
              <div>
                <p className="font-medium text-foreground">تفعيل الإشعارات</p>
                <p className="text-sm text-muted-foreground">
                  {notifications ? 'ستتلقى إشعارات عند الرد على شكاويك' : 'لن تتلقى أي إشعارات'}
                </p>
              </div>
            </div>
            <Switch
              checked={notifications}
              onCheckedChange={handleNotificationsToggle}
            />
          </div>
        </motion.div>
      </div>

      <MobileNav />
    </div>
  );
}