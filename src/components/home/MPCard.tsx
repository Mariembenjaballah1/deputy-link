import { Link } from 'react-router-dom';
import { MP } from '@/types';
import { MapPin, MessageSquare, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

interface MPCardProps {
  mp: MP;
  index: number;
}

export function MPCard({ mp, index }: MPCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.1 }}
    >
      <Link to={`/mp/${mp.id}`}>
        <div className="bg-card rounded-2xl p-4 shadow-sm border border-border/50 card-hover">
          <div className="flex items-center gap-4">
            <img
              src={mp.image}
              alt={mp.name}
              className="w-16 h-16 rounded-full object-cover ring-2 ring-secondary/30"
            />
            <div className="flex-1">
              <h3 className="font-bold text-foreground">{mp.name}</h3>
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                <MapPin className="w-3 h-3" />
                {mp.wilaya}
              </p>
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50">
            <div className="flex items-center gap-2 text-sm">
              <MessageSquare className="w-4 h-4 text-primary" />
              <span className="text-muted-foreground">{mp.complaintsCount} طلب</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <TrendingUp className="w-4 h-4 text-secondary" />
              <span className="font-semibold text-secondary">{mp.responseRate}%</span>
              <span className="text-muted-foreground">نسبة الرد</span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
