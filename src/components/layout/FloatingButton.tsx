import { Link } from 'react-router-dom';
import { MessageSquarePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

export function FloatingButton() {
  return (
    <motion.div 
      className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
    >
      <Link to="/complaint/new">
        <Button 
          variant="hero" 
          size="xl"
          className="rounded-full px-8 gap-3 shadow-[0_8px_30px_hsl(35_95%_55%/0.5)]"
        >
          <MessageSquarePlus className="w-6 h-6" />
          <span>إشكي</span>
        </Button>
      </Link>
    </motion.div>
  );
}
