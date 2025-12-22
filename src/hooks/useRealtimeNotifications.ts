import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { categoryLabels } from '@/types';

interface UseRealtimeNotificationsProps {
  assignedTo: 'mp' | 'local_deputy';
  onNewComplaint?: () => void;
}

export function useRealtimeNotifications({ assignedTo, onNewComplaint }: UseRealtimeNotificationsProps) {
  const notificationSound = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Check if notifications are enabled
    const notificationsEnabled = localStorage.getItem('notifications') !== 'false';
    
    if (!notificationsEnabled) return;

    // Create notification sound
    notificationSound.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleT86eMfXwYlcLABVlu/kq3krGzy03+K/ckYUNFSZ8+qshzQ0Gj+22duph0xAXr/p5bGOTBcAG4bj2aZYKw9JqdbUh0QnP3vH1bSLW0Y3V5zl5a5/NxMAWqnq26FfIwI/mNjghVIXKnHFyLmPWzknVpLq5bCDRCESYK3t4ap0NAEqfczctHU6FF6R0s+WWS8wZbPc0I5GICZPjdrWmksfDk6Y0MmHRyUubazYzJBFHB1Lk9jUlEYeDE2V0MaBPiItaaXUzJBDGh5GjdLMhD4dEU2MzMB7OBwrbqjXyohBGxxBh87LgDofD0qJy7x3NRkpbKfWyYc/GRs/hMvIfjgbDkiGybp0MxgnapzSwIQ8FxhAgMbFfTYZDUaDxrZwMRQlZZXOwIM6ExY8fb+/dDIXCkN/wq5sMRMiYo/KvoE4ERQ4d7m5cC8VCT57vattLxEgX4nFuX03DxI1c7OyaywTB0B5tqZoLQ4eWoW+s3c0DQ8waK2sYykSBj11sKJlKgsaU3+3rXMwCw0sYqilXiYQBDpxrJ5hKAkXUHu0qXAvCgomXKOfWSQOAzZtqJlaJQgUT3ixpWssBAgkV56dVCENATJppo9TIwYRTHKto2gqAwcgU5iYTR4LAi5mo4xQIAUPSW6qn2QnAgYeTJOUShsJAS1jnoVMHgQNR2qmnWEkAQUaTY+PRRgHACthmoJJGwMLRGenl1wiAAQXSYuKQhUFACddlX9FGQIKQWSkk1kgAAMURouGPRMDACRZkXxCFgEIP2Khj1YdAAMQQYaDOhECACFWjnk/FAAHPF6ejFMaAAIOPoF9NQ8BAB1TinY8EgAGOVualE8XAAELOX13Mg0AACZRhnI4EAAFN1aWkEsUAAEIO3VyLwsAAB1Ng207DgAENlORjEgSAAEHNnFsLAkAABpJfGc3DAADNFCNiEUQAAEGMm1oKQgAABdFdmQzCgACME6JhEIOAAEEL2hjJwYAABNCcmEwCAABLkuFf0AOAAEDLGVeJAQAABE/bl0tBgABK0eBezwMAAECKmFbIgMAAA47aVkpBQABKEJ9dzkKAAEBKFxXIAIAAAs3ZVYmAwABJT54dDYIAAEAJlhUHgEAAAkzYVMjAgABIjl0cDMGAAD/I1RPHAAAAAcvXVAhAQABHzVwbDAEAAD+IVBMGQAAAAU=');
    
    // Subscribe to new complaints
    const channel = supabase
      .channel('new-complaints-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'complaints',
          filter: `assigned_to=eq.${assignedTo}`
        },
        (payload) => {
          console.log('New complaint received:', payload);
          
          // Play notification sound
          if (notificationSound.current) {
            notificationSound.current.play().catch(console.error);
          }
          
          // Show toast notification
          const category = payload.new.category as keyof typeof categoryLabels;
          toast.success('شكوى جديدة', {
            description: `تم استلام شكوى جديدة في تصنيف: ${categoryLabels[category] || category}`,
            duration: 5000,
          });
          
          // Request browser notification permission and show notification
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('شكوى جديدة', {
              body: `تم استلام شكوى جديدة في تصنيف: ${categoryLabels[category] || category}`,
              icon: '/favicon.ico',
              dir: 'rtl',
            });
          }
          
          // Callback to refresh data
          onNewComplaint?.();
        }
      )
      .subscribe();

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      supabase.removeChannel(channel);
    };
  }, [assignedTo, onNewComplaint]);
}
