export interface MP {
  id: string;
  name: string;
  image: string;
  wilaya: string;
  wilayaId: string;
  dairaId?: string;
  daira?: string;
  bloc?: string;
  complaintsCount: number;
  responseRate: number;
  email?: string;
  phone?: string;
  bio?: string;
  profileUrl?: string;
}

export interface LocalDeputy {
  id: string;
  name: string;
  image: string;
  wilaya: string;
  wilayaId: string;
  dairaId: string;
  daira: string;
  complaintsCount: number;
  responseRate: number;
  email?: string;
  phone?: string;
  bio?: string;
}

export interface Activity {
  id: string;
  mpId: string;
  mpName: string;
  mpImage: string;
  title: string;
  description: string;
  category: string;
  date: string;
  wilaya: string;
}

export interface Wilaya {
  id: string;
  name: string;
  code: string;
}

export interface Daira {
  id: string;
  name: string;
  wilayaId: string;
}

export interface Mutamadiya {
  id: string;
  name: string;
  dairaId: string;
  wilayaId: string;
}

export type ComplaintCategory = 
  | 'municipal'
  | 'health'
  | 'environmental'
  | 'social'
  | 'employment'
  | 'security'
  | 'military'
  | 'education_primary'
  | 'education_higher'
  | 'transport'
  | 'housing'
  | 'infrastructure'
  | 'energy_water'
  | 'agriculture'
  | 'telecom'
  | 'youth_sports'
  | 'culture'
  | 'public_services'
  | 'corruption'
  | 'other';

export type ComplaintStatus = 
  | 'pending'
  | 'viewed'
  | 'replied'
  | 'forwarded'
  | 'out_of_scope';

export interface Ministry {
  id: string;
  name: string;
  nameAr: string;
}

export interface Complaint {
  id: string;
  userId: string;
  content: string;
  images: string[];
  category: ComplaintCategory;
  wilayaId: string;
  dairaId: string;
  mpId?: string;
  localDeputyId?: string;
  assignedTo: 'mp' | 'local_deputy';
  status: ComplaintStatus;
  createdAt: string;
  reply?: string;
  repliedAt?: string;
  forwardedTo?: string;
  officialLetter?: string;
}

export const categoryLabels: Record<ComplaintCategory, string> = {
  municipal: 'بلدية',
  health: 'صحية',
  environmental: 'بيئية',
  social: 'اجتماعية',
  employment: 'شغلية / تشغيل',
  security: 'أمنية',
  military: 'عسكرية',
  education_primary: 'تعليمية (ابتدائي / ثانوي)',
  education_higher: 'تعليم عالي / جامعي',
  transport: 'نقل عمومي',
  housing: 'سكن وعمران',
  infrastructure: 'بنية تحتية وطرقات',
  energy_water: 'طاقة ومياه',
  agriculture: 'فلاحة',
  telecom: 'اتصالات وإنترنت',
  youth_sports: 'شباب ورياضة',
  culture: 'ثقافة',
  public_services: 'إدارة وخدمات عمومية',
  corruption: 'فساد إداري',
  other: 'أخرى',
};

export const categoryMinistries: Record<ComplaintCategory, string> = {
  municipal: 'البلدية / نائب الجهة',
  health: 'وزارة الصحة',
  environmental: 'وزارة البيئة',
  social: 'وزارة الشؤون الاجتماعية',
  employment: 'وزارة التشغيل والتكوين المهني',
  security: 'وزارة الداخلية',
  military: 'وزارة الدفاع الوطني',
  education_primary: 'وزارة التربية',
  education_higher: 'وزارة التعليم العالي والبحث العلمي',
  transport: 'وزارة النقل',
  housing: 'وزارة التجهيز والإسكان',
  infrastructure: 'وزارة التجهيز والإسكان',
  energy_water: 'وزارة الصناعة والطاقة والمناجم',
  agriculture: 'وزارة الفلاحة والموارد المائية',
  telecom: 'وزارة تكنولوجيات الاتصال',
  youth_sports: 'وزارة الشباب والرياضة',
  culture: 'وزارة الشؤون الثقافية',
  public_services: 'الوزارة المعنية حسب الخدمة',
  corruption: 'الهيئة الوطنية لمكافحة الفساد',
  other: 'نائب الشعب (تقييم يدوي)',
};

export const statusLabels: Record<ComplaintStatus, string> = {
  pending: 'قيد الدراسة',
  viewed: 'تم الاطلاع',
  replied: 'تم الرد',
  forwarded: 'تم التحويل',
  out_of_scope: 'خارج الاختصاص',
};

export const isMunicipalCategory = (category: ComplaintCategory): boolean => {
  return category === 'municipal';
};
