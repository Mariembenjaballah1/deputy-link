import { Complaint, categoryLabels, statusLabels } from '@/types';
import { Clock, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface ComplaintCardProps {
  complaint: Complaint;
  index: number;
  mpName?: string;
  mpImage?: string;
  mpWilaya?: string;
}

export function ComplaintCard({ complaint, index, mpName, mpImage, mpWilaya }: ComplaintCardProps) {
  const statusStyles: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700 border-amber-200',
    viewed: 'bg-blue-100 text-blue-700 border-blue-200',
    replied: 'bg-green-100 text-green-700 border-green-200',
    out_of_scope: 'bg-red-100 text-red-700 border-red-200',
  };

  const statusIcons: Record<string, string> = {
    pending: '⏳',
    viewed: '👀',
    replied: '💬',
    out_of_scope: '❌',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-card rounded-2xl p-4 shadow-sm border border-border/50"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <span className="text-xs text-muted-foreground">#{complaint.id}</span>
        <span className={cn(
          "text-xs px-3 py-1 rounded-full border font-medium",
          statusStyles[complaint.status]
        )}>
          {statusIcons[complaint.status]} {statusLabels[complaint.status]}
        </span>
      </div>

      <p className="text-sm text-foreground line-clamp-3 mb-4">
        {complaint.content}
      </p>

      <div className="flex flex-wrap gap-2 mb-4">
        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full flex items-center gap-1">
          <Tag className="w-3 h-3" />
          {categoryLabels[complaint.category]}
        </span>
      </div>

      {mpName && (
        <div className="flex items-center gap-3 pt-3 border-t border-border/50">
          {mpImage && (
            <img 
              src={mpImage} 
              alt={mpName}
              className="w-8 h-8 rounded-full object-cover"
            />
          )}
          <div className="flex-1">
            <p className="text-xs font-medium text-foreground">{mpName}</p>
            {mpWilaya && <p className="text-xs text-muted-foreground">{mpWilaya}</p>}
          </div>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {new Date(complaint.createdAt).toLocaleDateString('ar-DZ')}
          </span>
        </div>
      )}

      {complaint.status === 'replied' && complaint.reply && (
        <div className="mt-4 p-3 bg-secondary/10 rounded-xl border border-secondary/20">
          <p className="text-xs font-medium text-secondary mb-1">رد النائب:</p>
          <p className="text-sm text-foreground">{complaint.reply}</p>
        </div>
      )}
    </motion.div>
  );
}
