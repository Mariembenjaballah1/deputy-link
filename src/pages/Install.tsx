import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Smartphone, Check, Wifi, WifiOff, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { MobileNav } from "@/components/layout/MobileNav";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const Install = () => {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    // Check if iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    // Listen for app installed
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    // Listen for online/offline
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === "accepted") {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  const features = [
    { icon: Smartphone, title: "تشغيل كتطبيق", description: "افتح التطبيق مباشرة من الشاشة الرئيسية" },
    { icon: WifiOff, title: "العمل بدون إنترنت", description: "تصفح الطلبات المحفوظة حتى بدون اتصال" },
    { icon: Download, title: "تحديثات تلقائية", description: "احصل على آخر التحسينات تلقائياً" },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-gradient-to-l from-primary to-primary/80 text-primary-foreground p-6 pt-12">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
            <Smartphone className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">تثبيت التطبيق</h1>
            <p className="text-primary-foreground/80">أضف تواصل إلى هاتفك</p>
          </div>
        </div>

        {/* Connection Status */}
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${isOnline ? "bg-green-500/20" : "bg-red-500/20"}`}>
          {isOnline ? (
            <>
              <Wifi className="h-4 w-4" />
              <span className="text-sm">متصل بالإنترنت</span>
            </>
          ) : (
            <>
              <WifiOff className="h-4 w-4" />
              <span className="text-sm">غير متصل - الوضع غير المتصل</span>
            </>
          )}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Install Status */}
        {isInstalled ? (
          <Card className="border-green-500/30 bg-green-50 dark:bg-green-950/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                  <Check className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-green-700 dark:text-green-400">التطبيق مثبت</h3>
                  <p className="text-sm text-muted-foreground">يمكنك الآن استخدام التطبيق من الشاشة الرئيسية</p>
                </div>
              </div>
              <Button 
                className="w-full mt-4" 
                onClick={() => navigate("/")}
              >
                العودة للرئيسية
                <ArrowRight className="h-4 w-4 mr-2" />
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                تثبيت التطبيق
              </CardTitle>
              <CardDescription>
                أضف التطبيق إلى شاشتك الرئيسية للوصول السريع
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isIOS ? (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    لتثبيت التطبيق على جهاز iPhone أو iPad:
                  </p>
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>اضغط على زر المشاركة <span className="inline-block px-2 py-1 bg-muted rounded">⎙</span></li>
                    <li>مرر للأسفل واختر "إضافة إلى الشاشة الرئيسية"</li>
                    <li>اضغط "إضافة" في الزاوية العلوية</li>
                  </ol>
                </div>
              ) : deferredPrompt ? (
                <Button onClick={handleInstall} className="w-full" size="lg">
                  <Download className="h-5 w-5 ml-2" />
                  تثبيت الآن
                </Button>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  افتح هذه الصفحة من متصفح Chrome أو Edge للتثبيت
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Features */}
        <div className="space-y-3">
          <h3 className="font-semibold text-lg">مميزات التطبيق</h3>
          {features.map((feature, index) => (
            <Card key={index}>
              <CardContent className="flex items-center gap-4 py-4">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium">{feature.title}</h4>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <MobileNav />
    </div>
  );
};

export default Install;
