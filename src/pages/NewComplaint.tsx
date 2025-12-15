import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Camera, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

import { ComplaintCategory, categoryLabels } from '@/types';
import { wilayas, dairas, mps } from '@/data/mockData';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { toast } from 'sonner';

const categories: { id: ComplaintCategory; label: string; icon: string }[] = [
  { id: 'security', label: 'أمنية', icon: '🛡️' },
  { id: 'military', label: 'عسكرية', icon: '⭐' },
  { id: 'environmental', label: 'بيئية', icon: '🌿' },
  { id: 'social', label: 'اجتماعية', icon: '👥' },
  { id: 'health', label: 'صحية', icon: '🏥' },
  { id: 'employment', label: 'شغلية', icon: '💼' },
  { id: 'municipal', label: 'بلدية', icon: '🏛️' },
];

export default function NewComplaint() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [category, setCategory] = useState<ComplaintCategory | null>(null);
  const [selectedWilaya, setSelectedWilaya] = useState<string | null>(null);
  const [selectedDaira, setSelectedDaira] = useState<string | null>(null);

  const filteredDairas = selectedWilaya 
    ? dairas.filter(d => d.wilayaId === selectedWilaya)
    : [];

  const assignedMP = selectedWilaya 
    ? mps.find(mp => mp.wilayaId === selectedWilaya)
    : null;

  const handleImageUpload = () => {
    if (images.length < 3) {
      // Simulating image upload
      setImages([...images, `https://picsum.photos/200/200?random=${Date.now()}`]);
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    // Generate complaint ID
    const complaintId = `C${Date.now().toString().slice(-6)}`;
    
    toast.success('تم إرسال الشكوى بنجاح', {
      description: `رقم الشكوى: ${complaintId}`,
    });
    
    navigate('/complaints');
  };

  const canProceedStep1 = content.trim().length > 10;
  const canProceedStep2 = category !== null;
  const canProceedStep3 = selectedWilaya && selectedDaira && assignedMP;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-xl border-b border-border px-4 py-4">
        <div className="flex items-center gap-4">
          <button onClick={() => step > 1 ? setStep(step - 1) : navigate(-1)}>
            <ArrowRight className="w-6 h-6 text-foreground" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-foreground">شكوى جديدة</h1>
            <p className="text-xs text-muted-foreground">الخطوة {step} من 3</p>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="flex gap-2 mt-4">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={cn(
                "h-1 flex-1 rounded-full transition-all duration-300",
                s <= step ? "bg-primary" : "bg-muted"
              )}
            />
          ))}
        </div>
      </header>

      <AnimatePresence mode="wait">
        {/* Step 1: Content */}
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="p-4"
          >
            <h2 className="text-xl font-bold text-foreground mb-2">محتوى الشكوى</h2>
            <p className="text-sm text-muted-foreground mb-6">
              اكتب شكوتك بالتفصيل لتسهيل معالجتها
            </p>

            <Textarea
              placeholder="اكتب شكوتك هنا..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[200px] text-base bg-card border-border resize-none"
            />

            <div className="mt-6">
              <p className="text-sm font-medium text-foreground mb-3">
                إضافة صور (اختياري - حتى 3 صور)
              </p>
              <div className="flex gap-3 flex-wrap">
                {images.map((img, index) => (
                  <div key={index} className="relative">
                    <img
                      src={img}
                      alt={`صورة ${index + 1}`}
                      className="w-20 h-20 rounded-xl object-cover"
                    />
                    <button
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground w-6 h-6 rounded-full flex items-center justify-center"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {images.length < 3 && (
                  <button
                    onClick={handleImageUpload}
                    className="w-20 h-20 rounded-xl border-2 border-dashed border-border flex items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                  >
                    <Camera className="w-6 h-6" />
                  </button>
                )}
              </div>
            </div>

            <div className="fixed bottom-0 right-0 left-0 p-4 bg-background border-t border-border">
              <Button
                variant="default"
                size="xl"
                className="w-full"
                disabled={!canProceedStep1}
                onClick={() => setStep(2)}
              >
                التالي
              </Button>
            </div>
          </motion.div>
        )}

        {/* Step 2: Category */}
        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="p-4"
          >
            <h2 className="text-xl font-bold text-foreground mb-2">طبيعة المشكل</h2>
            <p className="text-sm text-muted-foreground mb-6">
              اختر طبيعة المشكل المقدّمة
            </p>

            <div className="grid grid-cols-2 gap-3">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={cn(
                    "p-4 rounded-2xl border-2 text-right transition-all duration-200",
                    category === cat.id
                      ? "border-primary bg-primary/10"
                      : "border-border bg-card hover:border-primary/50"
                  )}
                >
                  <span className="text-2xl block mb-2">{cat.icon}</span>
                  <span className="font-medium text-foreground">{cat.label}</span>
                </button>
              ))}
            </div>

            <div className="fixed bottom-0 right-0 left-0 p-4 bg-background border-t border-border">
              <Button
                variant="default"
                size="xl"
                className="w-full"
                disabled={!canProceedStep2}
                onClick={() => setStep(3)}
              >
                التالي
              </Button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Location */}
        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="p-4 pb-32"
          >
            <h2 className="text-xl font-bold text-foreground mb-2">التوجيه الجغرافي</h2>
            <p className="text-sm text-muted-foreground mb-6">
              حدد الولاية والدائرة لتوجيه شكوتك للنائب المختص
            </p>

            <div className="space-y-4">
              {/* Wilaya Selection */}
              <Sheet>
                <SheetTrigger asChild>
                  <button className="w-full p-4 rounded-xl border-2 border-border bg-card text-right">
                    <p className="text-xs text-muted-foreground mb-1">الولاية</p>
                    <p className="font-medium text-foreground">
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
                  <div className="grid grid-cols-2 gap-3 mt-6 overflow-y-auto">
                    {wilayas.map((wilaya) => (
                      <Button
                        key={wilaya.id}
                        variant={selectedWilaya === wilaya.id ? 'default' : 'outline'}
                        className="justify-start h-12"
                        onClick={() => {
                          setSelectedWilaya(wilaya.id);
                          setSelectedDaira(null);
                        }}
                      >
                        <span className="text-xs opacity-60 ml-2">{wilaya.code}</span>
                        {wilaya.name}
                      </Button>
                    ))}
                  </div>
                </SheetContent>
              </Sheet>

              {/* Daira Selection */}
              <Sheet>
                <SheetTrigger asChild>
                  <button 
                    className={cn(
                      "w-full p-4 rounded-xl border-2 border-border bg-card text-right",
                      !selectedWilaya && "opacity-50 pointer-events-none"
                    )}
                  >
                    <p className="text-xs text-muted-foreground mb-1">الدائرة البلدية</p>
                    <p className="font-medium text-foreground">
                      {selectedDaira 
                        ? dairas.find(d => d.id === selectedDaira)?.name 
                        : 'اختر الدائرة'}
                    </p>
                  </button>
                </SheetTrigger>
                <SheetContent side="bottom" className="h-[50vh] rounded-t-3xl">
                  <SheetHeader>
                    <SheetTitle>اختر الدائرة</SheetTitle>
                  </SheetHeader>
                  <div className="grid grid-cols-2 gap-3 mt-6 overflow-y-auto">
                    {filteredDairas.map((daira) => (
                      <Button
                        key={daira.id}
                        variant={selectedDaira === daira.id ? 'default' : 'outline'}
                        className="justify-start h-12"
                        onClick={() => setSelectedDaira(daira.id)}
                      >
                        {daira.name}
                      </Button>
                    ))}
                  </div>
                </SheetContent>
              </Sheet>

              {/* Assigned MP */}
              {assignedMP && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-xl bg-secondary/10 border-2 border-secondary/30"
                >
                  <p className="text-xs text-secondary mb-2 font-medium">النائب المختص</p>
                  <div className="flex items-center gap-3">
                    <img
                      src={assignedMP.image}
                      alt={assignedMP.name}
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-secondary/30"
                    />
                    <div>
                      <p className="font-bold text-foreground">{assignedMP.name}</p>
                      <p className="text-sm text-muted-foreground">{assignedMP.wilaya}</p>
                    </div>
                    <Check className="w-6 h-6 text-secondary mr-auto" />
                  </div>
                </motion.div>
              )}
            </div>

            <div className="fixed bottom-0 right-0 left-0 p-4 bg-background border-t border-border">
              <Button
                variant="hero"
                size="xl"
                className="w-full"
                disabled={!canProceedStep3}
                onClick={handleSubmit}
              >
                إرسال الشكوى
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
