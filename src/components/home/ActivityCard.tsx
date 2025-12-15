import { Link } from 'react-router-dom';
import { Activity } from '@/types';
import { Calendar, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';

interface ActivityCardProps {
  activity: Activity;
  index: number;
}

export function ActivityCard({ activity, index }: ActivityCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Link to={`/mp/${activity.mpId}`}>
        <div className="bg-card rounded-2xl p-4 shadow-sm border border-border/50 card-hover">
          <div className="flex items-start gap-3">
            <img
              src={activity.mpImage}
              alt={activity.mpName}
              className="w-12 h-12 rounded-full object-cover ring-2 ring-primary/20"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-semibold text-foreground truncate">{activity.mpName}</h3>
                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full shrink-0">
                  {activity.category}
                </span>
              </div>
              <h4 className="text-sm font-medium text-foreground mt-2 line-clamp-1">
                {activity.title}
              </h4>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {activity.description}
              </p>
              <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(activity.date).toLocaleDateString('ar-DZ')}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {activity.wilaya}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
