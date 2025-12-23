import { Wilaya, Daira } from '@/types';

export const wilayas: Wilaya[] = [
  { id: '1', name: 'تونس', code: '01' },
  { id: '2', name: 'أريانة', code: '02' },
  { id: '3', name: 'بن عروس', code: '03' },
  { id: '4', name: 'منوبة', code: '04' },
  { id: '5', name: 'نابل', code: '05' },
  { id: '6', name: 'زغوان', code: '06' },
  { id: '7', name: 'بنزرت', code: '07' },
  { id: '8', name: 'باجة', code: '08' },
  { id: '9', name: 'جندوبة', code: '09' },
  { id: '10', name: 'الكاف', code: '10' },
  { id: '11', name: 'سليانة', code: '11' },
  { id: '12', name: 'سوسة', code: '12' },
  { id: '13', name: 'منستير', code: '13' },
  { id: '14', name: 'مهدية', code: '14' },
  { id: '15', name: 'صفاقس', code: '15' },
  { id: '16', name: 'القيروان', code: '16' },
  { id: '17', name: 'القصرين', code: '17' },
  { id: '18', name: 'سيدي بوزيد', code: '18' },
  { id: '19', name: 'قفصة', code: '19' },
  { id: '20', name: 'توزر', code: '20' },
  { id: '21', name: 'قبلي', code: '21' },
  { id: '22', name: 'قابس', code: '22' },
  { id: '23', name: 'مدنين', code: '23' },
  { id: '24', name: 'تطاوين', code: '24' },
];

export const dairas: Daira[] = [
  // تونس (1)
  { id: '1', name: 'المدينة - باب سويقة', wilayaId: '1' },
  { id: '2', name: 'حي الخضراء - المنزه', wilayaId: '1' },
  { id: '3', name: 'الكرم', wilayaId: '1' },
  { id: '4', name: 'السيجومي - الزهور', wilayaId: '1' },
  { id: '5', name: 'الكبارية', wilayaId: '1' },
  { id: '6', name: 'التحرير - باردو', wilayaId: '1' },
  { id: '7', name: 'باب البحر - سيدي البشير', wilayaId: '1' },
  { id: '8', name: 'سيدي حسين', wilayaId: '1' },
  { id: '9', name: 'الحرائرية', wilayaId: '1' },
  { id: '10', name: 'العمران - العمران الأعلى', wilayaId: '1' },
  { id: '11', name: 'قرطاج - المرسى', wilayaId: '1' },
  { id: '12', name: 'الوردية - جبل الجلود', wilayaId: '1' },

  // أريانة (2)
  { id: '13', name: 'رواد 1', wilayaId: '2' },
  { id: '14', name: 'دائرة سكرة 1', wilayaId: '2' },
  { id: '15', name: 'حي التضامن', wilayaId: '2' },
  { id: '16', name: 'دائرة رواد 2', wilayaId: '2' },
  { id: '17', name: 'دائرة سكرة 2', wilayaId: '2' },
  { id: '18', name: 'قلعة الأندلس - سيدي ثابت', wilayaId: '2' },
  { id: '19', name: 'المنيهلة', wilayaId: '2' },
  { id: '20', name: 'أريانة المدينة', wilayaId: '2' },

  // بن عروس (3)
  { id: '21', name: 'رادس - مقرين', wilayaId: '3' },
  { id: '22', name: 'بن عروس - المدينة الجديدة', wilayaId: '3' },
  { id: '23', name: 'حمام الأنف - حمام الشط', wilayaId: '3' },
  { id: '24', name: 'مرناق', wilayaId: '3' },
  { id: '25', name: 'المحمدية', wilayaId: '3' },
  { id: '26', name: 'بومهل البساتين - الزهراء', wilayaId: '3' },
  { id: '27', name: 'المروج - بئر القصعة', wilayaId: '3' },
  { id: '28', name: 'فوشانة', wilayaId: '3' },

  // منوبة (4)
  { id: '29', name: 'منوبة', wilayaId: '4' },
  { id: '30', name: 'المرناقية - برج العامري', wilayaId: '4' },
  { id: '31', name: 'الجديدة - طبربة - البطان', wilayaId: '4' },
  { id: '32', name: 'دوار هيشر', wilayaId: '4' },
  { id: '33', name: 'وادي الليل', wilayaId: '4' },

  // نابل (5)
  { id: '34', name: 'قليبة - حمام الأغزاز', wilayaId: '5' },
  { id: '35', name: 'نابل', wilayaId: '5' },
  { id: '36', name: 'منزل تميم', wilayaId: '5' },
  { id: '37', name: 'منزل بوزلفة - الميدة', wilayaId: '5' },
  { id: '38', name: 'دار شعبان الفهري - بني خيار', wilayaId: '5' },
  { id: '39', name: 'بوعرقوب - بني خلاد', wilayaId: '5' },
  { id: '40', name: 'سليمان', wilayaId: '5' },
  { id: '41', name: 'الهوارية - تاكلسة', wilayaId: '5' },

  // زغوان (6)
  { id: '42', name: 'بئر مشارقة - الفحص', wilayaId: '6' },
  { id: '43', name: 'الناظور - صواف', wilayaId: '6' },
  { id: '44', name: 'زغوان - الزريبة', wilayaId: '6' },

  // بنزرت (7)
  { id: '45', name: 'ماطر - أوتيك', wilayaId: '7' },
  { id: '46', name: 'سجنان - جومين - غزالة', wilayaId: '7' },
  { id: '47', name: 'منزل جميل - جرزونة', wilayaId: '7' },
  { id: '48', name: 'بنزرت الشمالية', wilayaId: '7' },
  { id: '49', name: 'بنزرت الجنوبية', wilayaId: '7' },
  { id: '50', name: 'منزل بورقيبة - تينجة', wilayaId: '7' },
  { id: '51', name: 'غار الملح - العالية - راس الجبل', wilayaId: '7' },

  // باجة (8)
  { id: '52', name: 'باجة الشمالية', wilayaId: '8' },
  { id: '53', name: 'عمدون - نفزة', wilayaId: '8' },
  { id: '54', name: 'باجة الجنوبية - تيبار - تبرسق', wilayaId: '8' },
  { id: '55', name: 'مجاز الباب - قبلاط - تستور', wilayaId: '8' },

  // جندوبة (9)
  { id: '56', name: 'جندوبة', wilayaId: '9' },
  { id: '57', name: 'غار الدماء - وادي مليز', wilayaId: '9' },
  { id: '58', name: 'بوسالم - بلطة بوعوان', wilayaId: '9' },
  { id: '59', name: 'جندوبة الشمالية - فرنانة', wilayaId: '9' },
  { id: '60', name: 'طبرقة - عين دراهم', wilayaId: '9' },

  // الكاف (10)
  { id: '61', name: 'القلعة الخصبة - الجريصة - القصور - الدهماني - السرس', wilayaId: '10' },
  { id: '62', name: 'نبر - الطويرف - ساقية سيدي يوسف - تاجروين', wilayaId: '10' },
  { id: '63', name: 'الكاف الغربية - الكاف الشرقية', wilayaId: '10' },

  // سليانة (11)
  { id: '64', name: 'سليانة - برقو', wilayaId: '11' },
  { id: '65', name: 'بوعرادة - قعفور - الكريب - بورويس - العروسة', wilayaId: '11' },
  { id: '66', name: 'مكثر - الروحية - كسرى', wilayaId: '11' },

  // سوسة (12)
  { id: '67', name: 'مساكن', wilayaId: '12' },
  { id: '68', name: 'سوسة جوهرة', wilayaId: '12' },
  { id: '69', name: 'حمام سوسة - أكودة', wilayaId: '12' },
  { id: '70', name: 'سوسة المدينة - سيدي عبد الحميد', wilayaId: '12' },
  { id: '71', name: 'النفيضة - بوفيشة - هرقلة', wilayaId: '12' },
  { id: '72', name: 'سيدي الهاني - القلعة الصغرى', wilayaId: '12' },
  { id: '73', name: 'القلعة الكبرى - سيدي بوعلي - كندار', wilayaId: '12' },
  { id: '74', name: 'سوسة الرياض', wilayaId: '12' },
  { id: '75', name: 'الزاوية - القصيبة - الثريات', wilayaId: '12' },

  // منستير (13)
  { id: '76', name: 'المكنين', wilayaId: '13' },
  { id: '77', name: 'طبلبة - البقالطة - صيادة - لمطة - بوحجر', wilayaId: '13' },
  { id: '78', name: 'الساحلين - الوردانين - بنبلة', wilayaId: '13' },
  { id: '79', name: 'المنستير 2', wilayaId: '13' },
  { id: '80', name: 'زرمدين - بني حسان', wilayaId: '13' },
  { id: '81', name: 'قصر هلال - قصيبة المديوني', wilayaId: '13' },
  { id: '82', name: 'جمال', wilayaId: '13' },
  { id: '83', name: 'المنستير 1', wilayaId: '13' },

  // مهدية (14)
  { id: '84', name: 'المهدية', wilayaId: '14' },
  { id: '85', name: 'الشابة - ملولش - سيدي علوان', wilayaId: '14' },
  { id: '86', name: 'بومرداس - السواسي', wilayaId: '14' },
  { id: '87', name: 'الجم', wilayaId: '14' },
  { id: '88', name: 'الرجيش - قصور الساف - البرادعة', wilayaId: '14' },
  { id: '89', name: 'اولاد شامخ - هبيرة - شربان', wilayaId: '14' },

  // صفاقس (15)
  { id: '90', name: 'الصخيرة - الغريبة - المحرس', wilayaId: '15' },
  { id: '91', name: 'طينة', wilayaId: '15' },
  { id: '92', name: 'منزل شاكر', wilayaId: '15' },
  { id: '93', name: 'عقارب', wilayaId: '15' },
  { id: '94', name: 'صفاقس الغربية', wilayaId: '15' },
  { id: '95', name: 'ساقية الدائر', wilayaId: '15' },
  { id: '96', name: 'جبنيانة - العامرة', wilayaId: '15' },
  { id: '97', name: 'الحنشة', wilayaId: '15' },
  { id: '98', name: 'صفاقس الجنوبية', wilayaId: '15' },
  { id: '99', name: 'قرقنة', wilayaId: '15' },
  { id: '100', name: 'صفاقس المدينة', wilayaId: '15' },
  { id: '101', name: 'ساقية الزيت', wilayaId: '15' },

  // القيروان (16)
  { id: '102', name: 'القيروان الجنوبية', wilayaId: '16' },
  { id: '103', name: 'القيروان الشمالية', wilayaId: '16' },
  { id: '104', name: 'نصر الله - منزل مهيري - الشراردة', wilayaId: '16' },
  { id: '105', name: 'الشبيكة - حفوز', wilayaId: '16' },
  { id: '106', name: 'بوحجلة', wilayaId: '16' },
  { id: '107', name: 'السبيخة - الوسلاتية - عين جلولة', wilayaId: '16' },
  { id: '108', name: 'العلا - حاجب العيون', wilayaId: '16' },

  // القصرين (17)
  { id: '109', name: 'القصرين الشمالية - الزهور', wilayaId: '17' },
  { id: '110', name: 'سبيطلة', wilayaId: '17' },
  { id: '111', name: 'القصرين الجنوبية - حاسي الفريد', wilayaId: '17' },
  { id: '112', name: 'تالة - حيدرة - فوسانة', wilayaId: '17' },
  { id: '113', name: 'سبيبة - جدليان - العيون', wilayaId: '17' },
  { id: '114', name: 'ماجل بلعباس - فريانة', wilayaId: '17' },

  // سيدي بوزيد (18)
  { id: '115', name: 'منزل بوزيان - المكناسي - المزونة', wilayaId: '18' },
  { id: '116', name: 'بئر الحفي - سيدي علي بوعون', wilayaId: '18' },
  { id: '117', name: 'الرقاب - السعيدة - أولاد حفوز', wilayaId: '18' },
  { id: '118', name: 'سيدي بوزيد الغربية - الهيشرية', wilayaId: '18' },
  { id: '119', name: 'جلمة - سبالة أولاد عسكر', wilayaId: '18' },
  { id: '120', name: 'سيدي بوزيد الشرقية - سوق الجديد', wilayaId: '18' },

  // قفصة (19)
  { id: '121', name: 'القطار - بلخير - السند', wilayaId: '19' },
  { id: '122', name: 'قفصة الجنوبية', wilayaId: '19' },
  { id: '123', name: 'أم العرائس - سيدي بوبكر - الرديف - المتلوي', wilayaId: '19' },
  { id: '124', name: 'قفصة الشمالية - سيدي عيش - القصر - زانوش', wilayaId: '19' },

  // توزر (20)
  { id: '125', name: 'دقاش - حامة الجريد - تمغزة', wilayaId: '20' },
  { id: '126', name: 'توزر', wilayaId: '20' },
  { id: '127', name: 'نفطة - حزوة', wilayaId: '20' },

  // قبلي (21)
  { id: '128', name: 'قبلي - سوق الأحد', wilayaId: '21' },
  { id: '129', name: 'فوار - رجيم معتوق', wilayaId: '21' },
  { id: '130', name: 'دوز', wilayaId: '21' },

  // قابس (22)
  { id: '131', name: 'قابس الجنوبية', wilayaId: '22' },
  { id: '132', name: 'مارث - دخيلة توجان - مطماطة - مطماطة الجديدة', wilayaId: '22' },
  { id: '133', name: 'قابس المدينة - قابس الغربية', wilayaId: '22' },
  { id: '134', name: 'الحامة - الحامة الغربية', wilayaId: '22' },
  { id: '135', name: 'غنوش - المطوية - وذرف - منزل الحبيب', wilayaId: '22' },

  // مدنين (23)
  { id: '136', name: 'جربة ميدون - جربة أجيم', wilayaId: '23' },
  { id: '137', name: 'مدنين الشمالية', wilayaId: '23' },
  { id: '138', name: 'بني خداش', wilayaId: '23' },
  { id: '139', name: 'بن قردان', wilayaId: '23' },
  { id: '140', name: 'جربة حومة السوق', wilayaId: '23' },
  { id: '141', name: 'مدنين الجنوبية - سيدي مخلوف', wilayaId: '23' },
  { id: '142', name: 'جرجيس', wilayaId: '23' },

  // تطاوين (24)
  { id: '143', name: 'ذهيبة - رمادة', wilayaId: '24' },
  { id: '144', name: 'تطاوين الجنوبية - بئر الاحمر - غمراسن', wilayaId: '24' },
  { id: '145', name: 'تطاوين الشمالية - بني مهيرة - الصمار', wilayaId: '24' },
];

// MPs, activities, localDeputies, and complaints are now loaded from the database
// Only geographic reference data (wilayas, dairas) are kept as static data
