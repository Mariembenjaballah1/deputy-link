import { useParams, Link } from 'react-router-dom';
import { mps, activities } from '@/data/mockData';
import { ArrowRight, MapPin, MessageSquare, TrendingUp, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { MobileNav } from '@/components/layout/MobileNav';

export default function MPProfile() {
  const { id } = useParams();
  const mp = mps.find(m => m.id === id);
  const mpActivities = activities.filter(a => a.mpId === id);

  if (!mp) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">النائب غير موجود</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-gradient-to-b from-primary to-primary/80 pt-12 pb-20 px-4">
        <Link to="/citizen" className="inline-flex items-center gap-2 text-primary-foreground/80 mb-6">
          <ArrowRight className="w-5 h-5" />
          <span>رجوع</span>
        </Link>
        
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <img
            src={mp.image}
            alt={mp.name}
            className="w-24 h-24 rounded-full mx-auto ring-4 ring-primary-foreground/30 object-cover"
          />
          <h1 className="text-xl font-bold text-primary-foreground mt-4">{mp.name}</h1>
          <p className="text-primary-foreground/80 flex items-center justify-center gap-1 mt-2">
            <MapPin className="w-4 h-4" />
            {mp.wilaya}
          </p>
        </motion.div>
      </div>

      {/* Stats Cards */}
      <div className="container -mt-10 relative z-10">
        <motion.div 
          className="grid grid-cols-2 gap-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="bg-card rounded-2xl p-4 shadow-lg border border-border/50 text-center">
            <MessageSquare className="w-8 h-8 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{mp.complaintsCount}</p>
            <p className="text-xs text-muted-foreground">شكوى مستلمة</p>
          </div>
          <div className="bg-card rounded-2xl p-4 shadow-lg border border-border/50 text-center">
            <TrendingUp className="w-8 h-8 text-secondary mx-auto mb-2" />
            <p className="text-2xl font-bold text-secondary">{mp.responseRate}%</p>
            <p className="text-xs text-muted-foreground">نسبة الرد</p>
          </div>
        </motion.div>
      </div>

      {/* Recent Activities */}
      <div className="container mt-8">
        <h2 className="text-lg font-bold text-foreground mb-4">آخر الأنشطة</h2>
        <div className="space-y-3">
          {mpActivities.length > 0 ? (
            mpActivities.map((activity, index) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-card rounded-xl p-4 border border-border/50"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                    {activity.category}
                  </span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(activity.date).toLocaleDateString('ar-DZ')}
                  </span>
                </div>
                <h3 className="font-semibold text-foreground">{activity.title}</h3>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {activity.description}
                </p>
              </motion.div>
            ))
          ) : (
            <p className="text-center text-muted-foreground py-8">لا توجد أنشطة</p>
          )}
        </div>
      </div>

      {/* CTA Button */}
      <div className="container mt-8">
        <Link to="/complaint/new">
          <Button variant="hero" size="xl" className="w-full">
            إرسال شكوى لهذا النائب
          </Button>
        </Link>
      </div>

      <MobileNav />
    </div>
  );
}
