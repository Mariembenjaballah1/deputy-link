import { Link } from 'react-router-dom';
import { ArrowRight, Bell } from 'lucide-react';
import { MobileNav } from '@/components/layout/MobileNav';
import { motion } from 'framer-motion';

const notifications = [
  {
    id: '1',
    title: 'تم الاطلاع على شكوتك',
    description: 'قام النائب أحمد بن صالح بالاطلاع على شكوتك رقم C001',
    time: 'منذ ساعة',
    read: false,
  },
  {
    id: '2',
    title: 'تم الرد على شكوتك',
    description: 'تلقيت ردًا على شكوتك بخصوص التلوث البيئي',
    time: 'منذ يومين',
    read: true,
  },
];

export default function Notifications() {
  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-xl border-b border-border px-4 py-4">
        <div className="flex items-center gap-4">
          <Link to="/citizen">
            <ArrowRight className="w-6 h-6 text-foreground" />
          </Link>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-foreground">الإشعارات</h1>
          </div>
        </div>
      </header>

      <main className="container py-4">
        {notifications.length > 0 ? (
          <div className="space-y-3">
            {notifications.map((notification, index) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`p-4 rounded-xl border ${
                  notification.read 
                    ? 'bg-card border-border/50' 
                    : 'bg-primary/5 border-primary/20'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    notification.read ? 'bg-muted' : 'bg-primary/10'
                  }`}>
                    <Bell className={`w-5 h-5 ${
                      notification.read ? 'text-muted-foreground' : 'text-primary'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{notification.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{notification.description}</p>
                    <p className="text-xs text-muted-foreground mt-2">{notification.time}</p>
                  </div>
                  {!notification.read && (
                    <div className="w-2 h-2 rounded-full bg-primary" />
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-20 h-20 rounded-full bg-muted mx-auto flex items-center justify-center mb-4">
              <Bell className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-bold text-foreground mb-2">لا توجد إشعارات</h2>
            <p className="text-muted-foreground">ستظهر هنا إشعارات تحديثات شكاواك</p>
          </div>
        )}
      </main>

      <MobileNav />
    </div>
  );
}
