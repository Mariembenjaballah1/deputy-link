import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Upload, FileSpreadsheet, Check, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ImportedMP {
  name: string;
  daira: string;
  bloc: string;
  wilaya: string;
  profileUrl?: string;
}

interface MPImportDialogProps {
  onImport: (mps: ImportedMP[]) => void;
}

export function MPImportDialog({ onImport }: MPImportDialogProps) {
  const [open, setOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [parsedData, setParsedData] = useState<ImportedMP[]>([]);
  const [fileName, setFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setImporting(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];

        // Skip header row and parse data
        const mps: ImportedMP[] = [];
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (row && row.length >= 4) {
            // Extract name from markdown link format [name](url)
            const nameCell = row[0] || '';
            const nameMatch = nameCell.match(/\[([^\]]+)\]/);
            const urlMatch = nameCell.match(/\(([^)]+)\)/);
            
            const dairaCell = row[1] || '';
            const dairaMatch = dairaCell.match(/\[([^\]]+)\]/);
            
            const blocCell = row[2] || '';
            const blocMatch = blocCell.match(/\[([^\]]+)\]/);

            mps.push({
              name: nameMatch ? nameMatch[1] : nameCell,
              daira: dairaMatch ? dairaMatch[1] : dairaCell,
              bloc: blocMatch ? blocMatch[1] : blocCell,
              wilaya: row[3] || '',
              profileUrl: urlMatch ? urlMatch[1] : undefined,
            });
          }
        }

        setParsedData(mps);
        toast.success(`تم قراءة ${mps.length} نائب من الملف`);
      } catch (error) {
        console.error('Error parsing Excel:', error);
        toast.error('خطأ في قراءة الملف');
      } finally {
        setImporting(false);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const handleConfirmImport = () => {
    if (parsedData.length === 0) {
      toast.error('لا توجد بيانات للاستيراد');
      return;
    }

    onImport(parsedData);
    toast.success(`تم استيراد ${parsedData.length} نائب بنجاح`);
    setOpen(false);
    setParsedData([]);
    setFileName('');
  };

  const handleCancel = () => {
    setParsedData([]);
    setFileName('');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Upload className="w-4 h-4" />
          استيراد من Excel
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-primary" />
            استيراد قائمة النواب
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* File Upload Area */}
          {parsedData.length === 0 && (
            <div
              className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".xlsx,.xls"
                className="hidden"
              />
              {importing ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="w-10 h-10 text-primary animate-spin" />
                  <p className="text-muted-foreground">جاري قراءة الملف...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload className="w-10 h-10 text-muted-foreground" />
                  <p className="text-foreground font-medium">اضغط لاختيار ملف Excel</p>
                  <p className="text-sm text-muted-foreground">
                    يجب أن يحتوي الملف على: الاسم، الدائرة، الكتلة، الولاية
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Preview Data */}
          {parsedData.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-secondary" />
                  <span className="font-medium">{fileName}</span>
                  <span className="text-sm text-muted-foreground">
                    ({parsedData.length} نائب)
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setParsedData([]);
                    setFileName('');
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <ScrollArea className="h-[300px] rounded-lg border border-border">
                <table className="w-full">
                  <thead className="bg-muted sticky top-0">
                    <tr>
                      <th className="text-right p-3 font-medium text-muted-foreground">#</th>
                      <th className="text-right p-3 font-medium text-muted-foreground">الاسم</th>
                      <th className="text-right p-3 font-medium text-muted-foreground">الدائرة</th>
                      <th className="text-right p-3 font-medium text-muted-foreground">الكتلة</th>
                      <th className="text-right p-3 font-medium text-muted-foreground">الولاية</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedData.map((mp, index) => (
                      <tr key={index} className="border-t border-border">
                        <td className="p-3 text-muted-foreground">{index + 1}</td>
                        <td className="p-3 font-medium">{mp.name}</td>
                        <td className="p-3 text-muted-foreground">{mp.daira}</td>
                        <td className="p-3 text-muted-foreground text-sm">{mp.bloc}</td>
                        <td className="p-3">{mp.wilaya}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </ScrollArea>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={handleCancel}>
                  إلغاء
                </Button>
                <Button onClick={handleConfirmImport} className="gap-2">
                  <Check className="w-4 h-4" />
                  تأكيد الاستيراد
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
