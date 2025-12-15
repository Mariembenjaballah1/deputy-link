export interface MP {
  id: string;
  name: string;
  image: string;
  wilaya: string;
  wilayaId: string;
  complaintsCount: number;
  responseRate: number;
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

export type ComplaintCategory = 
  | 'security'
  | 'military'
  | 'environmental'
  | 'social'
  | 'health'
  | 'employment'
  | 'municipal';

export type ComplaintStatus = 
  | 'pending'
  | 'viewed'
  | 'replied'
  | 'out_of_scope';

export interface Complaint {
  id: string;
  userId: string;
  content: string;
  images: string[];
  category: ComplaintCategory;
  wilayaId: string;
  dairaId: string;
  mpId: string;
  status: ComplaintStatus;
  createdAt: string;
  reply?: string;
  repliedAt?: string;
}

export const categoryLabels: Record<ComplaintCategory, string> = {
  security: 'أمنية',
  military: 'عسكرية',
  environmental: 'بيئية',
  social: 'اجتماعية',
  health: 'صحية',
  employment: 'شغلية',
  municipal: 'بلدية',
};

export const statusLabels: Record<ComplaintStatus, string> = {
  pending: 'قيد الدراسة',
  viewed: 'تم الاطلاع',
  replied: 'تم الرد',
  out_of_scope: 'خارج الاختصاص',
};
