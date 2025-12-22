import { useState, useEffect } from 'react';
import { FileText, Plus, Edit, Trash2, Check, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface Template {
  id: string;
  title: string;
  content: string;
  category: string | null;
  is_default: boolean;
}

interface ReplyTemplatesProps {
  onSelectTemplate?: (content: string) => void;
  mode?: 'select' | 'manage';
}

export function ReplyTemplates({ onSelectTemplate, mode = 'manage' }: ReplyTemplatesProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('reply_templates')
        .select('*')
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error loading templates:', error);
      toast.error('خطأ في تحميل القوالب');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTemplate = async () => {
    if (!newTitle.trim() || !newContent.trim()) {
      toast.error('يرجى ملء جميع الحقول');
      return;
    }

    try {
      const { error } = await supabase
        .from('reply_templates')
        .insert({ title: newTitle, content: newContent });

      if (error) throw error;

      toast.success('تم إضافة القالب بنجاح');
      setNewTitle('');
      setNewContent('');
      setIsAdding(false);
      loadTemplates();
    } catch (error) {
      console.error('Error adding template:', error);
      toast.error('خطأ في إضافة القالب');
    }
  };

  const handleUpdateTemplate = async (id: string) => {
    if (!editTitle.trim() || !editContent.trim()) {
      toast.error('يرجى ملء جميع الحقول');
      return;
    }

    try {
      const { error } = await supabase
        .from('reply_templates')
        .update({ title: editTitle, content: editContent })
        .eq('id', id);

      if (error) throw error;

      toast.success('تم تحديث القالب بنجاح');
      setEditingId(null);
      loadTemplates();
    } catch (error) {
      console.error('Error updating template:', error);
      toast.error('خطأ في تحديث القالب');
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    try {
      const { error } = await supabase
        .from('reply_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('تم حذف القالب');
      loadTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('خطأ في حذف القالب');
    }
  };

  const startEditing = (template: Template) => {
    setEditingId(template.id);
    setEditTitle(template.title);
    setEditContent(template.content);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  // Selection mode for choosing a template
  if (mode === 'select') {
    return (
      <div className="space-y-2 max-h-[300px] overflow-y-auto">
        {templates.map((template) => (
          <button
            key={template.id}
            onClick={() => onSelectTemplate?.(template.content)}
            className="w-full text-right p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
          >
            <p className="font-medium text-foreground text-sm">{template.title}</p>
            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{template.content}</p>
          </button>
        ))}
        {templates.length === 0 && (
          <p className="text-center text-muted-foreground py-4">لا توجد قوالب</p>
        )}
      </div>
    );
  }

  // Management mode
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-foreground">الردود الجاهزة</h3>
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2"
          onClick={() => setIsAdding(true)}
        >
          <Plus className="w-4 h-4" />
          إضافة قالب
        </Button>
      </div>

      {/* Add new template form */}
      {isAdding && (
        <div className="bg-muted/50 rounded-xl p-4 border border-border space-y-3">
          <Input
            placeholder="عنوان القالب"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />
          <Textarea
            placeholder="محتوى الرد..."
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            className="min-h-[80px]"
          />
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" size="sm" onClick={() => setIsAdding(false)}>
              <X className="w-4 h-4" />
            </Button>
            <Button size="sm" onClick={handleAddTemplate}>
              <Check className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Templates list */}
      <div className="space-y-3">
        {templates.map((template) => (
          <div key={template.id} className="bg-card rounded-xl p-4 border border-border">
            {editingId === template.id ? (
              <div className="space-y-3">
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                />
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="min-h-[80px]"
                />
                <div className="flex gap-2 justify-end">
                  <Button variant="ghost" size="sm" onClick={() => setEditingId(null)}>
                    <X className="w-4 h-4" />
                  </Button>
                  <Button size="sm" onClick={() => handleUpdateTemplate(template.id)}>
                    <Check className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" />
                    <p className="font-medium text-foreground">{template.title}</p>
                    {template.is_default && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">افتراضي</span>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => startEditing(template)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    {!template.is_default && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-destructive"
                        onClick={() => handleDeleteTemplate(template.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{template.content}</p>
              </>
            )}
          </div>
        ))}
      </div>
    </motion.div>
  );
}
