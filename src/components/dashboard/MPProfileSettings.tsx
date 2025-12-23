import { useState, useEffect, useRef } from 'react';
import { Camera, Save, Loader2, User, MapPin, Phone, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useLocations } from '@/hooks/useLocations';

export function MPProfileSettings() {
  const { user, updateProfile } = useAuthStore();
  const { wilayas, getDairasByWilaya } = useLocations();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [wilayaId, setWilayaId] = useState('');
  const [dairaId, setDairaId] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [notificationChannel, setNotificationChannel] = useState<'app' | 'whatsapp' | 'both'>('app');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const filteredDairas = getDairasByWilaya(wilayaId);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
      setBio(user.bio || '');
      setWilayaId(user.wilayaId || '');
      setDairaId(user.dairaId || '');
      setImageUrl(user.image || '');
    }
    
    const savedTheme = localStorage.getItem('theme');
    setDarkMode(savedTheme === 'dark');
    
    const savedNotifications = localStorage.getItem('notifications');
    setNotifications(savedNotifications !== 'false');

    const savedChannel = localStorage.getItem('notificationChannel');
    if (savedChannel) setNotificationChannel(savedChannel as typeof notificationChannel);
  }, [user]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('حجم الصورة يجب أن يكون أقل من 2MB');
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id || Date.now()}.${fileExt}`;
      const filePath = `mp-avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setImageUrl(publicUrl);
      toast.success('تم رفع الصورة بنجاح');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('خطأ في رفع الصورة');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDarkModeToggle = (enabled: boolean) => {
    setDarkMode(enabled);
    if (enabled) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const handleNotificationsToggle = (enabled: boolean) => {
    setNotifications(enabled);
    localStorage.setItem('notifications', enabled.toString());
  };

  const handleChannelChange = (channel: typeof notificationChannel) => {
    setNotificationChannel(channel);
    localStorage.setItem('notificationChannel', channel);
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    
    try {
      updateProfile({
        name: name || user?.name,
        email: email || user?.email,
        bio: bio || user?.bio,
        image: imageUrl || user?.image,
      });
      
      toast.success('تم حفظ الإعدادات بنجاح');
    } catch (error) {
      toast.error('حدث خطأ أثناء الحفظ');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Profile Photo */}
      <div className="bg-card rounded-2xl p-6 border border-border">
        <h2 className="text-lg font-semibold text-foreground mb-6">الصورة الشخصية</h2>
        
        <div className="flex items-center gap-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-muted border-4 border-primary/20">
              {imageUrl ? (
                <img src={imageUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User className="w-10 h-10 text-muted-foreground" />
                </div>
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="absolute bottom-0 left-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center hover:bg-primary/90 transition-colors"
            >
              {isUploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Camera className="w-4 h-4" />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>
          
          <div>
            <p className="font-medium text-foreground">{name || 'نائب الشعب'}</p>
            <p className="text-sm text-muted-foreground">نائب الشعب</p>
            <p className="text-xs text-muted-foreground mt-1">الحد الأقصى: 2MB</p>
          </div>
        </div>
      </div>

      {/* Personal Info */}
      <div className="bg-card rounded-2xl p-6 border border-border">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-5 h-5 text-primary" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">المعلومات الشخصية</h2>
        </div>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">الاسم الكامل</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="أدخل الاسم الكامل"
              className="text-right"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                البريد الإلكتروني المهني
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="mp@assembly.tn"
                className="text-left"
                dir="ltr"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                رقم الهاتف المهني
              </Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+216 XX XXX XXX"
                className="text-left"
                dir="ltr"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">النبذة التعريفية</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="اكتب نبذة عنك ونشاطك البرلماني..."
              className="min-h-[100px]"
            />
          </div>
        </div>
      </div>

      {/* Location */}
      <div className="bg-card rounded-2xl p-6 border border-border">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center">
            <MapPin className="w-5 h-5 text-secondary" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">الدائرة الانتخابية</h2>
        </div>
        
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>الولاية</Label>
            <select
              value={wilayaId}
              onChange={(e) => {
                setWilayaId(e.target.value);
                setDairaId('');
              }}
              className="w-full p-3 border border-border rounded-lg bg-background text-foreground"
            >
              <option value="">اختر الولاية</option>
              {wilayas.map(w => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>
          
          <div className="space-y-2">
            <Label>الدائرة / البلدية</Label>
            <select
              value={dairaId}
              onChange={(e) => setDairaId(e.target.value)}
              disabled={!wilayaId}
              className="w-full p-3 border border-border rounded-lg bg-background text-foreground disabled:opacity-50"
            >
              <option value="">اختر الدائرة</option>
              {filteredDairas.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Appearance */}
      <div className="bg-card rounded-2xl p-6 border border-border">
        <h2 className="text-lg font-semibold text-foreground mb-6">المظهر</h2>
        
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-foreground">الوضع الداكن</p>
            <p className="text-sm text-muted-foreground">{darkMode ? 'مفعّل' : 'غير مفعّل'}</p>
          </div>
          <Switch checked={darkMode} onCheckedChange={handleDarkModeToggle} />
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-card rounded-2xl p-6 border border-border">
        <h2 className="text-lg font-semibold text-foreground mb-6">الإشعارات</h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">تفعيل الإشعارات</p>
              <p className="text-sm text-muted-foreground">استلام إشعارات عند وصول شكاوى جديدة</p>
            </div>
            <Switch checked={notifications} onCheckedChange={handleNotificationsToggle} />
          </div>

          {notifications && (
            <div className="pt-4 border-t border-border">
              <Label className="mb-3 block">قناة الإشعارات</Label>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={notificationChannel === 'app' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleChannelChange('app')}
                >
                  داخل التطبيق
                </Button>
                <Button
                  variant={notificationChannel === 'whatsapp' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleChannelChange('whatsapp')}
                >
                  WhatsApp
                </Button>
                <Button
                  variant={notificationChannel === 'both' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleChannelChange('both')}
                >
                  كلاهما
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Save Button */}
      <Button 
        onClick={handleSaveProfile} 
        className="w-full gap-2"
        size="lg"
        disabled={isSaving}
      >
        {isSaving ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Save className="w-4 h-4" />
        )}
        حفظ جميع التغييرات
      </Button>
    </motion.div>
  );
}
