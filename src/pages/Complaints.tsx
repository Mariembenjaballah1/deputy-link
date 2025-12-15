import { Link } from 'react-router-dom';
import { ArrowRight, FileText, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ComplaintCard } from '@/components/complaint/ComplaintCard';
import { userComplaints } from '@/data/mockData';
import { MobileNav } from '@/components/layout/MobileNav';
import { motion } from 'framer-motion';

export default function Complaints() {
  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-xl border-b border-border px-4 py-4">
        <div className="flex items-center gap-4">
          <Link to="/">
            <ArrowRight className="w-6 h-6 text-foreground" />
          </Link>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-foreground">شكاواي</h1>
            <p className="text-xs text-muted-foreground">{userComplaints.length} شكوى</p>
          </div>
          <Link to="/complaint/new">
            <Button variant="default" size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              جديدة
            </Button>
          </Link>
        </div>
      </header>

      <main className="container py-4">
        {userComplaints.length > 0 ? (
          <div className="space-y-4">
            {userComplaints.map((complaint, index) => (
              <ComplaintCard key={complaint.id} complaint={complaint} index={index} />
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="w-20 h-20 rounded-full bg-muted mx-auto flex items-center justify-center mb-4">
              <FileText className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-bold text-foreground mb-2">لا توجد شكاوى</h2>
            <p className="text-muted-foreground mb-6">لم تقم بتقديم أي شكوى بعد</p>
            <Link to="/complaint/new">
              <Button variant="hero" size="lg">
                تقديم شكوى جديدة
              </Button>
            </Link>
          </motion.div>
        )}
      </main>

      <MobileNav />
    </div>
  );
}
