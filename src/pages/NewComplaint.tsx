import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Camera, X, Check, Building2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

import { ComplaintCategory, categoryLabels, categoryMinistries, isMunicipalCategory, MP, LocalDeputy } from '@/types';
import { wilayas, dairas } from '@/data/mockData';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const categories: { id: ComplaintCategory; label: string; icon: string }[] = [
  { id: 'municipal', label: 'بلدية', icon: '🏛️' },
  { id: 'health', label: 'صحية', icon: '🏥' },
  { id: 'environmental', label: 'بيئية', icon: '🌿' },
  { id: 'social', label: 'اجتماعية', icon: '👥' },
  { id: 'employment', label: 'شغلية', icon: '💼' },
  { id: 'security', label: 'أمنية', icon: '🛡️' },
  { id: 'military', label: 'عسكرية', icon: '⭐' },
  { id: 'education_primary', label: 'تعليم ابتدائي/ثانوي', icon: '📚' },
  { id: 'education_higher', label: 'تعليم عالي', icon: '🎓' },
  { id: 'transport', label: 'نقل عمومي', icon: '🚌' },
  { id: 'housing', label: 'سكن وعمران', icon: '🏠' },
  { id: 'infrastructure', label: 'بنية تحتية', icon: '🛣️' },
  { id: 'energy_water', label: 'طاقة ومياه', icon: '💡' },
  { id: 'agriculture', label: 'فلاحة', icon: '🌾' },
  { id: 'telecom', label: 'اتصالات', icon: '📡' },
  { id: 'youth_sports', label: 'شباب ورياضة', icon: '⚽' },
  { id: 'culture', label: 'ثقافة', icon: '🎭' },
  { id: 'public_services', label: 'خدمات عمومية', icon: '🏢' },
  { id: 'corruption', label: 'فساد إداري', icon: '⚖️' },
  { id: 'other', label: 'أخرى', icon: '📋' },
];

export default function NewComplaint() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [category, setCategory] = useState<ComplaintCategory | null>(null);
  const [selectedWilaya, setSelectedWilaya] = useState<string | null>(null);
  const [selectedDaira, setSelectedDaira] = useState<string | null>(null);
  const [mps, setMps] = useState<MP[]>([]);
  const [isLoadingMps, setIsLoadingMps] = useState(false);

  const filteredDairas = selectedWilaya 
    ? dairas.filter(d => d.wilayaId === selectedWilaya)
    : [];

  const isMunicipal = category ? isMunicipalCategory(category) : false;

  // Load MPs from database when wilaya changes
  useEffect(() => {
    if (selectedWilaya && !isMunicipal) {
      loadMPs();
    }
  }, [selectedWilaya, isMunicipal]);

  const loadMPs = async () => {
    setIsLoadingMps(true);
    try {
      const { data, error } = await supabase
        .from('mps')
        .select('*')
        .eq('wilaya_id', selectedWilaya);

      if (error) {
        console.error('Error loading MPs:', error);
        setMps([]);
      } else if (data) {
        const formattedMps: MP[] = data.map(mp => ({
          id: mp.id,
          name: mp.name,
          image: mp.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(mp.name)}&background=random`,
          wilaya: mp.wilaya,
          wilayaId: mp.wilaya_id || '',
          dairaId: mp.daira_id || '',
          complaintsCount: mp.complaints_count || 0,
          responseRate: mp.response_rate || 0,
        }));
        setMps(formattedMps);
      }
    } catch (error) {
      console.error('Error:', error);
      setMps([]);
    } finally {
      setIsLoadingMps(false);
    }
  };

  const assignedMP = selectedWilaya && !isMunicipal && mps.length > 0
    ? mps[0]
    : null;

  // For local deputies, we don't have a table yet, so show a placeholder
  const assignedLocalDeputy: LocalDeputy | null = selectedWilaya && selectedDaira && isMunicipal
    ? {
        id: 'placeholder',
        name: 'نائب الجهة',
        image: 'https://ui-avatars.com/api/?name=نائب&background=random',
        wilaya: wilayas.find(w => w.id === selectedWilaya)?.name || '',
        wilayaId: selectedWilaya,
        dairaId: selectedDaira,
        daira: dairas.find(d => d.id === selectedDaira)?.name || '',
        complaintsCount: 0,
        responseRate: 0,
      }
    : null;

  const ministry = category && !isMunicipal ? categoryMinistries[category] : null;

  const handleImageUpload = () => {
    if (images.length < 3) {
      setImages([...images, `https://picsum.photos/200/200?random=${Date.now()}`]);
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!category || !selectedWilaya || !selectedDaira) return;
    
    setIsSubmitting(true);
    
    try {
      const complaintData = {
        user_id: 'anonymous', // Would use auth user id in production
        user_phone: '',
        content,
        images,
        category,
        wilaya_id: selectedWilaya,
        daira_id: selectedDaira,
        mp_id: assignedMP?.id || null,
        local_deputy_id: isMunicipal ? 'local' : null,
        assigned_to: isMunicipal ? 'local_deputy' : 'mp',
        status: 'pending',
      };

      const { error } = await supabase
        .from('complaints')
        .insert(complaintData);

      if (error) throw error;
      
      if (isMunicipal) {
        toast.success('تم إرسال الشكوى إلى نائب الجهة', {
          description: 'سيتم معالجة شكواك في أقرب وقت',
        });
      } else {
        toast.success('تم إرسال الشكوى إلى نائب الشعب', {
          description: `سيتم توجيهها إلى ${ministry}`,
        });
      }
      
      navigate('/complaints');
    } catch (error) {
      console.error('Error submitting complaint:', error);
      toast.error('خطأ في إرسال الشكوى');
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceedStep1 = content.trim().length > 10;
  const canProceedStep2 = category !== null;
  const canProceedStep3 = selectedWilaya && selectedDaira && (isMunicipal ? assignedLocalDeputy : assignedMP);

  return (
    <div className="min-h-screen bg-background">
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

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="p-4 pb-32"
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
                    "p-3 rounded-2xl border-2 text-right transition-all duration-200",
                    category === cat.id
                      ? "border-primary bg-primary/10"
                      : "border-border bg-card hover:border-primary/50",
                    cat.id === 'municipal' && "col-span-2 bg-secondary/5 border-secondary/30"
                  )}
                >
                  <span className="text-xl block mb-1">{cat.icon}</span>
                  <span className="font-medium text-foreground text-sm">{cat.label}</span>
                  {cat.id === 'municipal' && (
                    <span className="text-xs text-secondary block mt-1">
                      ← توجّه تلقائياً لنائب الجهة
                    </span>
                  )}
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
              {isMunicipal 
                ? 'حدد الولاية والدائرة لتوجيه شكوتك لنائب الجهة'
                : 'حدد الولاية والدائرة لتوجيه شكوتك للنائب المختص'}
            </p>

            {/* Category & Ministry Info */}
            {category && (
              <div className={cn(
                "p-3 rounded-xl mb-4",
                isMunicipal ? "bg-secondary/10 border border-secondary/30" : "bg-primary/10 border border-primary/30"
              )}>
                <p className="text-xs text-muted-foreground mb-1">نوع الشكوى</p>
                <p className="font-bold text-foreground">{categoryLabels[category]}</p>
                {!isMunicipal && ministry && (
                  <p className="text-xs text-primary mt-1">← ستوجّه إلى: {ministry}</p>
                )}
              </div>
            )}

            <div className="space-y-4">
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
                  <div className="grid grid-cols-2 gap-3 mt-6 overflow-y-auto max-h-[45vh]">
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
                  <div className="grid grid-cols-2 gap-3 mt-6 overflow-y-auto max-h-[35vh]">
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

              {/* Assigned Local Deputy (for municipal) */}
              {isMunicipal && assignedLocalDeputy && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-xl bg-secondary/10 border-2 border-secondary/30"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Building2 className="w-4 h-4 text-secondary" />
                    <p className="text-xs text-secondary font-medium">نائب الجهة المختص</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <img
                      src={assignedLocalDeputy.image}
                      alt={assignedLocalDeputy.name}
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-secondary/30"
                    />
                    <div>
                      <p className="font-bold text-foreground">{assignedLocalDeputy.name}</p>
                      <p className="text-sm text-muted-foreground">{assignedLocalDeputy.daira} - {assignedLocalDeputy.wilaya}</p>
                    </div>
                    <Check className="w-6 h-6 text-secondary mr-auto" />
                  </div>
                </motion.div>
              )}

              {/* Assigned MP (for non-municipal) */}
              {!isMunicipal && assignedMP && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-xl bg-primary/10 border-2 border-primary/30"
                >
                  <p className="text-xs text-primary mb-2 font-medium">نائب الشعب المختص</p>
                  <div className="flex items-center gap-3">
                    <img
                      src={assignedMP.image}
                      alt={assignedMP.name}
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-primary/30"
                    />
                    <div>
                      <p className="font-bold text-foreground">{assignedMP.name}</p>
                      <p className="text-sm text-muted-foreground">{assignedMP.wilaya}</p>
                    </div>
                    <Check className="w-6 h-6 text-primary mr-auto" />
                  </div>
                  {ministry && (
                    <p className="text-xs text-primary/70 mt-3 bg-primary/5 p-2 rounded-lg">
                      📋 سيتم توجيه الشكوى إلى: {ministry}
                    </p>
                  )}
                </motion.div>
              )}
            </div>

            <div className="fixed bottom-0 right-0 left-0 p-4 bg-background border-t border-border">
              <Button
                variant="hero"
                size="xl"
                className="w-full gap-2"
                disabled={!canProceedStep3 || isSubmitting}
                onClick={handleSubmit}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    جاري الإرسال...
                  </>
                ) : (
                  'إرسال الشكوى'
                )}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
