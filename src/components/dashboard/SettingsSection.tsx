import { useState, useEffect } from 'react';
import { Moon, Sun, Bell, BellOff, User, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';

interface SettingsSectionProps {
  type: 'mp' | 'local_deputy' | 'admin';
}

export function SettingsSection({ type }: SettingsSectionProps) {
  const { user, updateProfile } = useAuthStore();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setBio(user.bio || '');
    }
    
    const savedTheme = localStorage.getItem('theme');
    const isDark = savedTheme === 'dark' || 
      (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
    setDarkMode(isDark);
    
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
      updateProfile({
        name: name || user?.name,
        email: email || user?.email,
        bio: bio || user?.bio,
      });
      
      toast.success('تم حفظ الإعدادات بنجاح');
    } catch (error) {
      toast.error('حدث خطأ أثناء الحفظ');
    } finally {
      setIsSaving(false);
    }
  };

  const roleLabels = {
    mp: 'نائب الشعب',
    local_deputy: 'نائب الجهة',
    admin: 'مدير النظام',
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Profile Settings */}
      <div className="bg-card rounded-2xl p-6 border border-border">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">المعلومات الشخصية</h2>
            <p className="text-sm text-muted-foreground">{roleLabels[type]}</p>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">الاسم الكامل</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="أدخل الاسم"
              className="text-right"
            />
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

          {(type === 'mp' || type === 'local_deputy') && (
            <div className="space-y-2">
              <Label htmlFor="bio">النبذة التعريفية</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="اكتب نبذة عنك..."
                className="min-h-[100px]"
              />
            </div>
          )}
          
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
            حفظ التغييرات
          </Button>
        </div>
      </div>

      {/* Appearance Settings */}
      <div className="bg-card rounded-2xl p-6 border border-border">
        <h2 className="text-lg font-semibold text-foreground mb-6">المظهر</h2>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {darkMode ? (
              <Moon className="w-5 h-5 text-primary" />
            ) : (
              <Sun className="w-5 h-5 text-warning" />
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
      </div>

      {/* Notifications Settings */}
      <div className="bg-card rounded-2xl p-6 border border-border">
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
                {type === 'mp' || type === 'local_deputy' 
                  ? 'ستتلقى إشعارات عند وصول طلبات جديدة'
                  : 'ستتلقى إشعارات عند تسجيل نواب جدد'
                }
              </p>
            </div>
          </div>
          <Switch
            checked={notifications}
            onCheckedChange={handleNotificationsToggle}
          />
        </div>
      </div>
    </motion.div>
  );
}
