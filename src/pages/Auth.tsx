import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, Lock, ArrowLeft, User, Users, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { UserRole } from '@/types/auth';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const roles: { id: UserRole; label: string; icon: typeof User; description: string }[] = [
  { id: 'citizen', label: 'مواطن', icon: User, description: 'تقديم ومتابعة الشكاوى' },
  { id: 'mp', label: 'نائب', icon: Users, description: 'إدارة شكاوى المواطنين' },
  { id: 'admin', label: 'مدير', icon: Shield, description: 'إدارة النظام' },
];

export default function Auth() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [step, setStep] = useState<'role' | 'phone' | 'otp'>('role');
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setStep('phone');
  };

  const handlePhoneSubmit = () => {
    if (phone.length >= 8) {
      setStep('otp');
      toast.info('تم إرسال رمز التحقق', { description: 'الرمز: 1234 (للتجربة)' });
    }
  };

  const handleOtpSubmit = () => {
    if (otp === '1234' && selectedRole) {
      login(phone, selectedRole);
      toast.success('تم تسجيل الدخول بنجاح');
      
      // Redirect based on role
      if (selectedRole === 'citizen') {
        navigate('/');
      } else if (selectedRole === 'mp') {
        navigate('/mp-dashboard');
      } else {
        navigate('/admin');
      }
    } else {
      toast.error('رمز التحقق غير صحيح');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary to-primary/80 flex flex-col">
      {/* Header */}
      <header className="p-4">
        {step !== 'role' && (
          <button 
            onClick={() => setStep(step === 'otp' ? 'phone' : 'role')}
            className="text-primary-foreground/80 flex items-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            رجوع
          </button>
        )}
      </header>

      {/* Content */}
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
          {/* Role Selection */}
          {step === 'role' && (
            <motion.div
              key="role"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="w-full max-w-sm space-y-4"
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

          {/* Phone Input */}
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
                  أدخل رقم هاتفك لتلقي رمز التحقق
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
                  disabled={phone.length < 8}
                  onClick={handlePhoneSubmit}
                >
                  إرسال رمز التحقق
                </Button>
              </div>
            </motion.div>
          )}

          {/* OTP Input */}
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
                  disabled={otp.length < 4}
                  onClick={handleOtpSubmit}
                >
                  تسجيل الدخول
                </Button>

                <button className="w-full text-center text-sm text-muted-foreground mt-4">
                  لم تستلم الرمز؟ <span className="text-primary font-medium">إعادة الإرسال</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
