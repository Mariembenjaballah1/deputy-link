import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if already installed or dismissed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      return;
    }

    const dismissedTime = localStorage.getItem("install-prompt-dismissed");
    if (dismissedTime) {
      const hoursSinceDismissed = (Date.now() - parseInt(dismissedTime)) / (1000 * 60 * 60);
      if (hoursSinceDismissed < 24) {
        return;
      }
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    const handleAppInstalled = () => {
      setShowPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setDismissed(true);
    localStorage.setItem("install-prompt-dismissed", Date.now().toString());
  };

  if (!showPrompt || dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="fixed bottom-20 left-4 right-4 z-50"
      >
        <div className="bg-card border border-border rounded-2xl shadow-lg p-4">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
              <Download className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground">ثبّت التطبيق</h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                أضف شكوى إلى شاشتك الرئيسية للوصول السريع
              </p>
            </div>
            <button
              onClick={handleDismiss}
              className="p-1 hover:bg-muted rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
          <div className="flex gap-2 mt-3">
            <Button onClick={handleInstall} className="flex-1" size="sm">
              <Download className="w-4 h-4 ml-2" />
              تثبيت الآن
            </Button>
            <Button variant="outline" onClick={handleDismiss} size="sm">
              لاحقاً
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
