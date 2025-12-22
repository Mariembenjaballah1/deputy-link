import { useState, useEffect, useRef } from 'react';
import { User, Phone, Mail, MapPin, Camera, Loader2, Save, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { wilayas, dairas } from '@/data/mockData';
import { useAuthStore } from '@/store/authStore';

interface ProfileData {
  name: string;
  phone: string;
  whatsapp_number: string;
  email: string;
  wilaya_id: string;
  daira_id: string;
  bio: string;
  image: string | null;
}

export function LocalDeputyProfileSettings() {
  const { user } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [profileData, setProfileData] = useState<ProfileData>({
    name: '',
    phone: '',
    whatsapp_number: '',
    email: '',
    wilaya_id: '',
    daira_id: '',
    bio: '',
    image: null,
  });

  const [settings, setSettings] = useState({
    notifications_enabled: true,
    notification_channel: 'app', // 'app' | 'whatsapp' | 'both'
    language: 'ar',
  });

  const [deputyId, setDeputyId] = useState<string | null>(null);
  const filteredDairas = dairas.filter(d => d.wilayaId === profileData.wilaya_id);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      // For now, load first active deputy or create one
      const { data, error } = await supabase
        .from('local_deputies')
        .select('*')
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setDeputyId(data.id);
        setProfileData({
          name: data.name || '',
          phone: data.phone || '',
          whatsapp_number: data.whatsapp_number || '',
          email: data.email || '',
          wilaya_id: data.wilaya_id || '',
          daira_id: data.daira_id || '',
          bio: data.bio || '',
          image: data.image,
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('يرجى اختيار صورة صالحة');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('حجم الصورة يجب أن لا يتجاوز 5 ميغابايت');
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `deputy_${Date.now()}.${fileExt}`;
      const filePath = `deputies/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: publicUrl } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setProfileData(prev => ({ ...prev, image: publicUrl.publicUrl }));
      toast.success('تم رفع الصورة بنجاح');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('خطأ في رفع الصورة');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!profileData.name.trim()) {
      toast.error('يرجى إدخال الاسم');
      return;
    }

    if (!profileData.wilaya_id || !profileData.daira_id) {
      toast.error('يرجى اختيار الولاية والدائرة');
      return;
    }

    setSaving(true);
    try {
      const updateData = {
        name: profileData.name.trim(),
        phone: profileData.phone.trim() || null,
        whatsapp_number: profileData.whatsapp_number.trim() || null,
        email: profileData.email.trim() || null,
        wilaya_id: profileData.wilaya_id,
        daira_id: profileData.daira_id,
        bio: profileData.bio.trim() || null,
        image: profileData.image,
      };

      if (deputyId) {
        const { error } = await supabase
          .from('local_deputies')
          .update(updateData)
          .eq('id', deputyId);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('local_deputies')
          .insert(updateData)
          .select()
          .single();

        if (error) throw error;
        setDeputyId(data.id);
      }

      toast.success('تم حفظ البيانات بنجاح');
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('خطأ في حفظ البيانات');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-secondary" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Profile Image */}
      <div className="bg-card rounded-2xl p-6 border border-border">
        <h3 className="text-lg font-bold text-foreground mb-4">الصورة الشخصية</h3>
        <div className="flex items-center gap-6">
          <div 
            onClick={handleImageClick}
            className="relative w-24 h-24 rounded-full bg-muted flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity overflow-hidden"
          >
            {profileData.image ? (
              <img 
                src={profileData.image} 
                alt="Profile" 
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-12 h-12 text-muted-foreground" />
            )}
            {uploading && (
              <div className="absolute inset-0 bg-foreground/50 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-background" />
              </div>
            )}
            <div className="absolute bottom-0 right-0 w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
              <Camera className="w-4 h-4 text-secondary-foreground" />
            </div>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">اضغط لتغيير الصورة</p>
            <p className="text-xs text-muted-foreground mt-1">JPG, PNG - حد أقصى 5 ميغابايت</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
        </div>
      </div>

      {/* Personal Info */}
      <div className="bg-card rounded-2xl p-6 border border-border">
        <h3 className="text-lg font-bold text-foreground mb-4">المعلومات الشخصية</h3>
        <div className="grid gap-4">
          <div>
            <Label htmlFor="name">الاسم الكامل *</Label>
            <div className="relative mt-1">
              <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="name"
                value={profileData.name}
                onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                className="pr-10"
                placeholder="الاسم الكامل"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="wilaya">الولاية *</Label>
              <Select 
                value={profileData.wilaya_id}
                onValueChange={(value) => setProfileData(prev => ({ 
                  ...prev, 
                  wilaya_id: value,
                  daira_id: '' // Reset daira when wilaya changes
                }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="اختر الولاية" />
                </SelectTrigger>
                <SelectContent>
                  {wilayas.map((wilaya) => (
                    <SelectItem key={wilaya.id} value={wilaya.id}>
                      {wilaya.code} - {wilaya.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="daira">الدائرة *</Label>
              <Select 
                value={profileData.daira_id}
                onValueChange={(value) => setProfileData(prev => ({ ...prev, daira_id: value }))}
                disabled={!profileData.wilaya_id}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="اختر الدائرة" />
                </SelectTrigger>
                <SelectContent>
                  {filteredDairas.map((daira) => (
                    <SelectItem key={daira.id} value={daira.id}>
                      {daira.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="bio">نبذة تعريفية</Label>
            <Textarea
              id="bio"
              value={profileData.bio}
              onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
              placeholder="نبذة مختصرة عن مهامك ومجال اختصاصك..."
              className="mt-1 min-h-[80px]"
            />
          </div>
        </div>
      </div>

      {/* Contact Info */}
      <div className="bg-card rounded-2xl p-6 border border-border">
        <h3 className="text-lg font-bold text-foreground mb-4">معلومات الاتصال</h3>
        <div className="grid gap-4">
          <div>
            <Label htmlFor="phone">رقم الهاتف المهني</Label>
            <div className="relative mt-1">
              <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="phone"
                value={profileData.phone}
                onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                className="pr-10"
                placeholder="+213 XX XXX XXXX"
                dir="ltr"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="whatsapp">رقم WhatsApp (للتحويل المباشر)</Label>
            <div className="relative mt-1">
              <MessageCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="whatsapp"
                value={profileData.whatsapp_number}
                onChange={(e) => setProfileData(prev => ({ ...prev, whatsapp_number: e.target.value }))}
                className="pr-10"
                placeholder="+213 XX XXX XXXX"
                dir="ltr"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="email">البريد الإلكتروني</Label>
            <div className="relative mt-1">
              <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                value={profileData.email}
                onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                className="pr-10"
                placeholder="email@example.com"
                dir="ltr"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Settings */}
      <div className="bg-card rounded-2xl p-6 border border-border">
        <h3 className="text-lg font-bold text-foreground mb-4">الإعدادات</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">تفعيل الإشعارات</p>
              <p className="text-sm text-muted-foreground">استلام إشعارات عند وصول شكوى جديدة</p>
            </div>
            <Switch
              checked={settings.notifications_enabled}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, notifications_enabled: checked }))}
            />
          </div>

          <div>
            <Label>قناة الإشعارات</Label>
            <Select 
              value={settings.notification_channel}
              onValueChange={(value) => setSettings(prev => ({ ...prev, notification_channel: value }))}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="app">داخل التطبيق فقط</SelectItem>
                <SelectItem value="whatsapp">WhatsApp فقط</SelectItem>
                <SelectItem value="both">التطبيق و WhatsApp</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>لغة الواجهة</Label>
            <Select 
              value={settings.language}
              onValueChange={(value) => setSettings(prev => ({ ...prev, language: value }))}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ar">العربية</SelectItem>
                <SelectItem value="fr">Français</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <Button 
        onClick={handleSave}
        disabled={saving}
        className="w-full gap-2"
        size="lg"
      >
        {saving ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Save className="w-4 h-4" />
        )}
        حفظ التغييرات
      </Button>
    </motion.div>
  );
}
