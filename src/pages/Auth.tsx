import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, Lock, ArrowLeft, User, Users, Shield, Building2, UserPlus, CheckCircle, Clock, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { UserRole } from '@/types/auth';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useLocations } from '@/hooks/useLocations';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

const roles: { id: UserRole; label: string; icon: typeof User; description: string }[] = [
  { id: 'citizen', label: 'مواطن', icon: User, description: 'تقديم ومتابعة الشكاوى' },
  { id: 'mp', label: 'نائب الشعب', icon: Users, description: 'إدارة شكاوى المواطنين' },
  { id: 'local_deputy', label: 'نائب الجهة', icon: Building2, description: 'إدارة الشكاوى البلدية' },
  { id: 'admin', label: 'مدير', icon: Shield, description: 'إدارة النظام' },
];

export default function Auth() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const { wilayas, dairas, getDairasByWilaya } = useLocations();
  const [step, setStep] = useState<'role' | 'phone' | 'otp' | 'register' | 'pending'>('role');
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Registration fields
  const [registerName, setRegisterName] = useState('');
  const [registerPhone, setRegisterPhone] = useState('');
  const [selectedWilaya, setSelectedWilaya] = useState<string | null>(null);
  const [selectedDaira, setSelectedDaira] = useState<string | null>(null);

  const filteredDairas = selectedWilaya 
    ? getDairasByWilaya(selectedWilaya)
    : [];

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setStep('phone');
  };

  const handlePhoneSubmit = async () => {
    if (phone.length < 8) return;
    
    setIsLoading(true);
    
    try {
      // For citizens - direct OTP flow
      if (selectedRole === 'citizen') {
        setStep('otp');
        toast.info('تم إرسال رمز التحقق', { description: 'الرمز: 1234 (للتجربة)' });
      } 
      // For admin - direct OTP flow (admin phones are pre-configured)
      else if (selectedRole === 'admin') {
        setStep('otp');
        toast.info('تم إرسال رمز التحقق', { description: 'الرمز: 1234 (للتجربة)' });
      }
      // For MPs - check if phone exists in mps table
      else if (selectedRole === 'mp') {
        const { data: mp, error } = await supabase
          .from('mps')
          .select('*')
          .eq('phone', '+216' + phone)
          .single();
        
        if (mp && mp.is_active !== false) {
          // MP exists and is active - proceed to OTP
          setStep('otp');
          toast.info('تم إرسال رمز التحقق', { description: 'الرمز: 1234 (للتجربة)' });
        } else {
          // Check if there's a pending registration
          const { data: pending } = await supabase
            .from('pending_registrations')
            .select('*')
            .eq('phone', '+216' + phone)
            .eq('role', 'mp')
            .single();
          
          if (pending) {
            if (pending.status === 'pending') {
              setStep('pending');
              toast.info('طلبك قيد المراجعة');
            } else if (pending.status === 'rejected') {
              toast.error('تم رفض طلب التسجيل', { description: 'يرجى التواصل مع الإدارة' });
            } else if (pending.status === 'approved') {
              // Should have been added to mps table - try login
              setStep('otp');
              toast.info('تم إرسال رمز التحقق');
            }
          } else {
            // No registration - offer to register
            setRegisterPhone(phone);
            setStep('register');
            toast.info('رقم غير مسجل', { description: 'يمكنك تقديم طلب تسجيل' });
          }
        }
      }
      // For Local Deputies - check if phone exists in local_deputies table
      else if (selectedRole === 'local_deputy') {
        const { data: deputy, error } = await supabase
          .from('local_deputies')
          .select('*')
          .eq('phone', '+216' + phone)
          .single();
        
        if (deputy && deputy.is_active !== false) {
          // Deputy exists and is active - proceed to OTP
          setStep('otp');
          toast.info('تم إرسال رمز التحقق', { description: 'الرمز: 1234 (للتجربة)' });
        } else {
          // Check if there's a pending registration
          const { data: pending } = await supabase
            .from('pending_registrations')
            .select('*')
            .eq('phone', '+216' + phone)
            .eq('role', 'local_deputy')
            .single();
          
          if (pending) {
            if (pending.status === 'pending') {
              setStep('pending');
              toast.info('طلبك قيد المراجعة');
            } else if (pending.status === 'rejected') {
              toast.error('تم رفض طلب التسجيل', { description: 'يرجى التواصل مع الإدارة' });
            } else if (pending.status === 'approved') {
              setStep('otp');
              toast.info('تم إرسال رمز التحقق');
            }
          } else {
            // No registration - offer to register
            setRegisterPhone(phone);
            setStep('register');
            toast.info('رقم غير مسجل', { description: 'يمكنك تقديم طلب تسجيل' });
          }
        }
      }
    } catch (error) {
      console.error('Error checking phone:', error);
      toast.error('خطأ في التحقق');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async () => {
    if (otp !== '1234') {
      toast.error('رمز التحقق غير صحيح');
      return;
    }
    
    if (!selectedRole) return;
    
    setIsLoading(true);
    
    try {
      let userData = { name: 'مستخدم', image: '', wilayaId: '', dairaId: '' };
      
      // Fetch user data based on role
      if (selectedRole === 'mp') {
        const { data: mp } = await supabase
          .from('mps')
          .select('*')
          .eq('phone', '+216' + phone)
          .single();
        
        if (mp) {
          userData = {
            name: mp.name,
            image: mp.image || '',
            wilayaId: mp.wilaya_id || '',
            dairaId: mp.daira_id || '',
          };
        }
      } else if (selectedRole === 'local_deputy') {
        const { data: deputy } = await supabase
          .from('local_deputies')
          .select('*')
          .eq('phone', '+216' + phone)
          .single();
        
        if (deputy) {
          userData = {
            name: deputy.name,
            image: deputy.image || '',
            wilayaId: deputy.wilaya_id || '',
            dairaId: deputy.daira_id || '',
          };
        }
      }
      
      login(phone, selectedRole, userData.name, userData.image, userData.wilayaId, userData.dairaId);
      toast.success('تم تسجيل الدخول بنجاح');
      
      if (selectedRole === 'citizen') {
        navigate('/');
      } else if (selectedRole === 'mp') {
        navigate('/mp-dashboard');
      } else if (selectedRole === 'local_deputy') {
        navigate('/local-deputy-dashboard');
      } else {
        navigate('/admin');
      }
    } catch (error) {
      console.error('Error during login:', error);
      toast.error('خطأ في تسجيل الدخول');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!registerName.trim() || !registerPhone || !selectedWilaya || !selectedRole) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }
    
    // For local deputies, daira is required
    if (selectedRole === 'local_deputy' && !selectedDaira) {
      toast.error('يرجى اختيار الدائرة');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const { error } = await supabase
        .from('pending_registrations')
        .insert({
          phone: '+216' + registerPhone,
          name: registerName.trim(),
          role: selectedRole,
          wilaya_id: selectedWilaya,
          daira_id: selectedDaira,
          status: 'pending',
        });
      
      if (error) {
        if (error.code === '23505') {
          toast.error('هذا الرقم مسجل بالفعل');
        } else {
          throw error;
        }
        return;
      }
      
      setStep('pending');
      toast.success('تم إرسال طلب التسجيل', { description: 'سيتم مراجعته من قبل الإدارة' });
    } catch (error) {
      console.error('Error registering:', error);
      toast.error('خطأ في إرسال الطلب');
    } finally {
      setIsLoading(false);
    }
  };

  const goBack = () => {
    if (step === 'otp') setStep('phone');
    else if (step === 'phone') setStep('role');
    else if (step === 'register') setStep('phone');
    else if (step === 'pending') setStep('role');
    else setStep('role');
    
    // Reset states
    setOtp('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary to-primary/80 flex flex-col">
      <header className="p-4">
        {step !== 'role' && (
          <button 
            onClick={goBack}
            className="text-primary-foreground/80 flex items-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            رجوع
          </button>
        )}
      </header>

      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-primary-foreground mb-2">شكوى</h1>
          <p className="text-primary-foreground/80">صوتك يصل</p>
        </motion.div>

        <AnimatePresence mode="wait">
          {step === 'role' && (
            <motion.div
              key="role"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="w-full max-w-sm space-y-3"
            >
              <h2 className="text-xl font-bold text-primary-foreground text-center mb-6">
                اختر نوع الحساب
              </h2>
              {roles.map((role) => (
                <button
                  key={role.id}
                  onClick={() => handleRoleSelect(role.id)}
                  className="w-full bg-card/10 backdrop-blur-lg border border-primary-foreground/20 rounded-2xl p-4 flex items-center gap-4 hover:bg-card/20 transition-all"
                >
                  <div className="w-12 h-12 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                    <role.icon className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div className="text-right flex-1">
                    <p className="font-bold text-primary-foreground">{role.label}</p>
                    <p className="text-sm text-primary-foreground/70">{role.description}</p>
                  </div>
                </button>
              ))}
            </motion.div>
          )}

          {step === 'phone' && (
            <motion.div
              key="phone"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="w-full max-w-sm"
            >
              <div className="bg-card rounded-3xl p-6 shadow-xl">
                <div className="w-16 h-16 rounded-full bg-primary/10 mx-auto flex items-center justify-center mb-4">
                  <Phone className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-xl font-bold text-foreground text-center mb-2">
                  رقم الهاتف
                </h2>
                <p className="text-sm text-muted-foreground text-center mb-6">
                  {selectedRole === 'citizen' || selectedRole === 'admin'
                    ? 'أدخل رقم هاتفك لتلقي رمز التحقق'
                    : 'أدخل رقم هاتفك المسجل للدخول أو التسجيل'}
                </p>
                
                <div className="flex gap-2 mb-6" dir="ltr">
                  <div className="bg-muted rounded-xl px-4 py-3 text-muted-foreground font-medium">
                    +216
                  </div>
                  <Input
                    type="tel"
                    placeholder="00 000 000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 8))}
                    className="flex-1 h-12 text-lg text-center"
                  />
                </div>

                <Button
                  variant="default"
                  size="xl"
                  className="w-full"
                  disabled={phone.length < 8 || isLoading}
                  onClick={handlePhoneSubmit}
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    'متابعة'
                  )}
                </Button>
              </div>
            </motion.div>
          )}

          {step === 'otp' && (
            <motion.div
              key="otp"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="w-full max-w-sm"
            >
              <div className="bg-card rounded-3xl p-6 shadow-xl">
                <div className="w-16 h-16 rounded-full bg-primary/10 mx-auto flex items-center justify-center mb-4">
                  <Lock className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-xl font-bold text-foreground text-center mb-2">
                  رمز التحقق
                </h2>
                <p className="text-sm text-muted-foreground text-center mb-6">
                  أدخل الرمز المرسل إلى +216 {phone}
                </p>
                
                <Input
                  type="text"
                  placeholder="0000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  className="h-14 text-2xl text-center tracking-[1em] mb-6"
                  dir="ltr"
                />

                <Button
                  variant="hero"
                  size="xl"
                  className="w-full"
                  disabled={otp.length < 4 || isLoading}
                  onClick={handleOtpSubmit}
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    'تسجيل الدخول'
                  )}
                </Button>

                <button className="w-full text-center text-sm text-muted-foreground mt-4">
                  لم تستلم الرمز؟ <span className="text-primary font-medium">إعادة الإرسال</span>
                </button>
              </div>
            </motion.div>
          )}

          {step === 'register' && (
            <motion.div
              key="register"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="w-full max-w-sm"
            >
              <div className="bg-card rounded-3xl p-6 shadow-xl">
                <div className="w-16 h-16 rounded-full bg-secondary/10 mx-auto flex items-center justify-center mb-4">
                  <UserPlus className="w-8 h-8 text-secondary" />
                </div>
                <h2 className="text-xl font-bold text-foreground text-center mb-2">
                  طلب تسجيل جديد
                </h2>
                <p className="text-sm text-muted-foreground text-center mb-6">
                  {selectedRole === 'mp' ? 'تسجيل كنائب شعب' : 'تسجيل كنائب جهة'}
                </p>
                
                <div className="space-y-4">
                  {/* Name */}
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-2">الاسم الكامل</label>
                    <Input
                      type="text"
                      placeholder="أدخل اسمك الكامل"
                      value={registerName}
                      onChange={(e) => setRegisterName(e.target.value)}
                      className="h-12"
                    />
                  </div>
                  
                  {/* Phone (pre-filled) */}
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-2">رقم الهاتف</label>
                    <div className="flex gap-2" dir="ltr">
                      <div className="bg-muted rounded-xl px-4 py-3 text-muted-foreground font-medium">
                        +216
                      </div>
                      <Input
                        type="tel"
                        value={registerPhone}
                        disabled
                        className="flex-1 h-12 text-center bg-muted"
                      />
                    </div>
                  </div>
                  
                  {/* Wilaya */}
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-2">الولاية</label>
                    <Sheet>
                      <SheetTrigger asChild>
                        <button className="w-full p-3 rounded-xl border border-border bg-background text-right">
                          <p className="text-foreground">
                            {selectedWilaya 
                              ? wilayas.find(w => w.id === selectedWilaya)?.name 
                              : 'اختر الولاية'}
                          </p>
                        </button>
                      </SheetTrigger>
                      <SheetContent side="bottom" className="h-[60vh] rounded-t-3xl">
                        <SheetHeader>
                          <SheetTitle>اختر الولاية</SheetTitle>
                        </SheetHeader>
                        <div className="grid grid-cols-2 gap-2 mt-4 max-h-[50vh] overflow-y-auto">
                          {wilayas.map((wilaya) => (
                            <button
                              key={wilaya.id}
                              onClick={() => {
                                setSelectedWilaya(wilaya.id);
                                setSelectedDaira(null);
                              }}
                              className={`p-3 rounded-xl text-right transition-all ${
                                selectedWilaya === wilaya.id
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted hover:bg-muted/80'
                              }`}
                            >
                              {wilaya.name}
                            </button>
                          ))}
                        </div>
                      </SheetContent>
                    </Sheet>
                  </div>
                  
                  {/* Daira (for local deputies) */}
                  {selectedRole === 'local_deputy' && selectedWilaya && (
                    <div>
                      <label className="text-sm font-medium text-foreground block mb-2">الدائرة</label>
                      <Sheet>
                        <SheetTrigger asChild>
                          <button className="w-full p-3 rounded-xl border border-border bg-background text-right">
                            <p className="text-foreground">
                              {selectedDaira 
                                ? dairas.find(d => d.id === selectedDaira)?.name 
                                : 'اختر الدائرة'}
                            </p>
                          </button>
                        </SheetTrigger>
                        <SheetContent side="bottom" className="h-[60vh] rounded-t-3xl">
                          <SheetHeader>
                            <SheetTitle>اختر الدائرة</SheetTitle>
                          </SheetHeader>
                          <div className="grid grid-cols-2 gap-2 mt-4 max-h-[50vh] overflow-y-auto">
                            {filteredDairas.map((daira) => (
                              <button
                                key={daira.id}
                                onClick={() => setSelectedDaira(daira.id)}
                                className={`p-3 rounded-xl text-right transition-all ${
                                  selectedDaira === daira.id
                                    ? 'bg-secondary text-secondary-foreground'
                                    : 'bg-muted hover:bg-muted/80'
                                }`}
                              >
                                {daira.name}
                              </button>
                            ))}
                          </div>
                        </SheetContent>
                      </Sheet>
                    </div>
                  )}
                </div>

                <Button
                  variant="hero"
                  size="xl"
                  className="w-full mt-6"
                  disabled={!registerName.trim() || !selectedWilaya || isLoading}
                  onClick={handleRegister}
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <UserPlus className="w-5 h-5 ml-2" />
                      إرسال طلب التسجيل
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          )}

          {step === 'pending' && (
            <motion.div
              key="pending"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="w-full max-w-sm"
            >
              <div className="bg-card rounded-3xl p-6 shadow-xl text-center">
                <div className="w-20 h-20 rounded-full bg-amber-100 mx-auto flex items-center justify-center mb-4">
                  <Clock className="w-10 h-10 text-amber-600" />
                </div>
                <h2 className="text-xl font-bold text-foreground mb-2">
                  طلبك قيد المراجعة
                </h2>
                <p className="text-muted-foreground mb-6">
                  سيتم مراجعة طلب التسجيل من قبل الإدارة وإعلامك بالنتيجة
                </p>
                
                <div className="bg-muted/50 rounded-xl p-4 mb-6">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>وقت المراجعة المتوقع: 24-48 ساعة</span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="lg"
                  className="w-full"
                  onClick={() => {
                    setStep('role');
                    setPhone('');
                    setOtp('');
                    setSelectedRole(null);
                  }}
                >
                  العودة للرئيسية
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
