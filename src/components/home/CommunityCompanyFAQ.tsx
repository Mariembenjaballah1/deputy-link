import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, 
  Users, 
  FileText, 
  Settings, 
  Gift, 
  AlertCircle, 
  HelpCircle,
  ChevronRight,
  ArrowRight,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

interface FAQTopic {
  id: string;
  title: string;
  icon: React.ReactNode;
  question: string;
  answer: string | string[];
}

const faqTopics: FAQTopic[] = [
  {
    id: 'what-is',
    title: 'ما هي الشركة الأهلية؟',
    icon: <Building2 className="w-5 h-5" />,
    question: 'ما المقصود بالشركة الأهلية؟',
    answer: 'الشركة الأهلية هي شكل قانوني للتنظيم الاقتصادي الجماعي، يهدف إلى خلق مواطن شغل وتحقيق تنمية محلية، ويعتمد على المشاركة الجماعية في التسيير واتخاذ القرار.'
  },
  {
    id: 'who-can-join',
    title: 'من يمكنه الانخراط؟',
    icon: <Users className="w-5 h-5" />,
    question: 'من يحق له الانخراط في شركة أهلية؟',
    answer: 'يمكن لكل مواطن تونسي راشد الانخراط في شركة أهلية وفق الشروط التي يضبطها القانون الأساسي للشركة، دون تمييز على أساس الجنس أو الوضع الاجتماعي.'
  },
  {
    id: 'how-to-create',
    title: 'كيفية التأسيس',
    icon: <FileText className="w-5 h-5" />,
    question: 'ما هي شروط تأسيس شركة أهلية؟',
    answer: [
      'يتطلب تأسيس شركة أهلية:',
      '• عدد أدنى من المؤسسين',
      '• إعداد نظام أساسي',
      '• اختيار نشاط اقتصادي مشروع',
      '• التسجيل لدى الهياكل المختصة وفق الإجراءات القانونية الجاري بها العمل'
    ]
  },
  {
    id: 'management',
    title: 'التسيير والتصرف',
    icon: <Settings className="w-5 h-5" />,
    question: 'كيف يتم تسيير الشركة الأهلية؟',
    answer: 'يتم تسيير الشركة الأهلية بطريقة جماعية عبر هياكل داخلية منتخبة، ويُتخذ القرار وفق مبدأ المشاركة والشفافية، دون هيمنة فرد واحد.'
  },
  {
    id: 'benefits',
    title: 'الامتيازات والدعم',
    icon: <Gift className="w-5 h-5" />,
    question: 'هل تتمتع الشركات الأهلية بدعم من الدولة؟',
    answer: [
      'تتمتع الشركات الأهلية بإمكانيات دعم وتشجيع حسب القوانين والتراتيب الجاري بها العمل، ويمكن أن تشمل:',
      '• تسهيلات إدارية',
      '• برامج دعم وتمويل',
      '• مرافقة فنية وتقنية'
    ]
  },
  {
    id: 'issues',
    title: 'الإشكالات الشائعة',
    icon: <AlertCircle className="w-5 h-5" />,
    question: 'ماذا أفعل إذا واجهت صعوبات في بعث شركة أهلية؟',
    answer: [
      'في حال مواجهة صعوبات، يُنصح بـ:',
      '• مراجعة النظام الأساسي',
      '• طلب الإحاطة من الهياكل المختصة',
      '• الاطلاع على النصوص القانونية المنظمة'
    ]
  },
  {
    id: 'misc',
    title: 'أسئلة متفرقة',
    icon: <HelpCircle className="w-5 h-5" />,
    question: 'هل الشركة الأهلية بديل عن الشركة الخاصة؟',
    answer: 'الشركة الأهلية ليست بديلاً عن الشركة الخاصة، بل نموذج اقتصادي مكمّل يركز على التنمية الجماعية والبعد الاجتماعي.'
  }
];

interface CommunityCompanyFAQProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommunityCompanyFAQ({ open, onOpenChange }: CommunityCompanyFAQProps) {
  const [selectedTopic, setSelectedTopic] = useState<FAQTopic | null>(null);

  const handleClose = () => {
    setSelectedTopic(null);
    onOpenChange(false);
  };

  const handleBack = () => {
    setSelectedTopic(null);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl p-0">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="sticky top-0 bg-background z-10 border-b border-border">
            <SheetHeader className="p-4">
              <div className="flex items-center justify-between">
                {selectedTopic ? (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleBack}
                    className="gap-2"
                  >
                    <ArrowRight className="w-4 h-4" />
                    رجوع
                  </Button>
                ) : (
                  <div />
                )}
                <SheetTitle className="text-center flex-1">
                  {selectedTopic ? selectedTopic.title : 'استفسار حول الشركات الأهلية'}
                </SheetTitle>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={handleClose}
                  className="rounded-full"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </SheetHeader>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            <AnimatePresence mode="wait">
              {!selectedTopic ? (
                <motion.div
                  key="topics"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-3"
                >
                  <p className="text-muted-foreground text-center mb-6">
                    اختر موضوع الاستفسار
                  </p>
                  
                  {faqTopics.map((topic, index) => (
                    <motion.div
                      key={topic.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card
                        className="p-4 cursor-pointer hover:bg-muted/50 transition-colors border-border/50"
                        onClick={() => setSelectedTopic(topic)}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                            {topic.icon}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-foreground">{topic.title}</h3>
                          </div>
                          <ChevronRight className="w-5 h-5 text-muted-foreground" />
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  key="answer"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  {/* Question Card */}
                  <Card className="p-5 bg-primary/5 border-primary/20">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        <HelpCircle className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">السؤال</p>
                        <p className="font-medium text-foreground">{selectedTopic.question}</p>
                      </div>
                    </div>
                  </Card>

                  {/* Answer Card */}
                  <Card className="p-5 bg-accent/5 border-accent/20">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent shrink-0">
                        {selectedTopic.icon}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground mb-2">الجواب</p>
                        {Array.isArray(selectedTopic.answer) ? (
                          <div className="space-y-2">
                            {selectedTopic.answer.map((line, idx) => (
                              <p 
                                key={idx} 
                                className={`text-foreground leading-relaxed ${
                                  line.startsWith('•') ? 'pr-2' : 'font-medium'
                                }`}
                              >
                                {line}
                              </p>
                            ))}
                          </div>
                        ) : (
                          <p className="text-foreground leading-relaxed">{selectedTopic.answer}</p>
                        )}
                      </div>
                    </div>
                  </Card>

                  {/* Info Note */}
                  <div className="bg-muted/50 rounded-xl p-4 text-center">
                    <p className="text-sm text-muted-foreground">
                      هذه المعلومات إرشادية عامة. للمزيد من التفاصيل، يرجى مراجعة النصوص القانونية الرسمية.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
