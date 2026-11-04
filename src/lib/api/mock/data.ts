import type { AppNotification, PublicBarber, PublicService, PublicShop, ShopHours } from '../types';

/** Same menu the API seeds (src/modules/services/default-services.ts). */
const menu = (prefix: string, priceFactor = 1): PublicService[] =>
  [
    { name: 'حلاقة', nameEn: 'Haircut', durationMin: 30, priceEgp: 100 },
    { name: 'دقن', nameEn: 'Beard', durationMin: 15, priceEgp: 50 },
    { name: 'حلاقة + دقن', nameEn: 'Haircut + beard', durationMin: 45, priceEgp: 140 },
    { name: 'حلاقة أطفال', nameEn: 'Kids haircut', durationMin: 20, priceEgp: 70 },
    { name: 'باكدج عريس', nameEn: 'Groom package', durationMin: 120, priceEgp: 800 },
  ].map((s, i) => ({
    ...s,
    id: `${prefix}-svc-${i + 1}`,
    priceEgp: Math.round((s.priceEgp * priceFactor) / 5) * 5,
  }));

const offersFor = (services: PublicService[], skip: number[] = []) =>
  services
    .filter((_, i) => !skip.includes(i))
    .map((s) => ({
      serviceId: s.id,
      name: s.name,
      nameEn: s.nameEn,
      priceEgp: s.priceEgp,
      durationMin: s.durationMin,
    }));

const hours = (open: string, close: string, closedDay?: number): ShopHours[] =>
  Array.from({ length: 7 }, (_, weekday) =>
    weekday === closedDay
      ? { weekday, open: null, close: null, closesNextDay: false, isClosed: true }
      : { weekday, open, close, closesNextDay: close < open, isClosed: false },
  );

const barber = (
  id: string,
  displayName: string,
  bio: string,
  rating: number,
  count: number,
  services: PublicService[],
  skip?: number[],
): PublicBarber => ({
  id,
  displayName,
  photoUrl: null,
  bio,
  ratingAvg: rating,
  ratingCount: count,
  acceptsBookings: true,
  queueMode: false,
  services: offersFor(services, skip),
});

const demoMenu = menu('demo');
const kingMenu = menu('king', 1.4);
const fadeMenu = menu('fade', 0.85);

export const mockShops: PublicShop[] = [
  {
    id: 'shop-demo',
    name: 'Chairo Demo – Banha',
    slug: 'chairo-demo',
    description: 'صالون رجالي في قلب بنها. احجز ميعادك وتعالى على طول من غير طابور.',
    phone: '+201000000001',
    city: 'بنها',
    area: 'الفلل',
    address: 'شارع فريد ندا، بنها',
    latitude: 30.4659,
    longitude: 31.1848,
    coverUrl: null,
    timezone: 'Africa/Cairo',
    maxAdvanceDays: 7,
    ratingAvg: 4.8,
    ratingCount: 312,
    isFoundingPartner: true,
    hours: hours('12:00', '01:00', 1),
    photos: [],
    services: demoMenu,
    barbers: [
      barber('demo-b1', 'محمد', 'خبرة ١٢ سنة — متخصص في الفيد والتدريج', 4.9, 188, demoMenu),
      barber('demo-b2', 'أحمد', 'دقن وتحديد بالموس', 4.7, 96, demoMenu, [4]),
      barber('demo-b3', 'كريم', 'قصات حديثة وأطفال', 4.6, 54, demoMenu, [4]),
    ],
  },
  {
    id: 'shop-king',
    name: 'The King Barbershop',
    slug: 'king-barbershop',
    description: 'تجربة حلاقة بريميوم: مشروبات، فوطة سخنة، وتحديد دقيق.',
    phone: '+201000000011',
    city: 'القاهرة',
    area: 'مدينة نصر',
    address: 'شارع عباس العقاد، مدينة نصر',
    latitude: 30.0561,
    longitude: 31.3301,
    coverUrl: null,
    timezone: 'Africa/Cairo',
    maxAdvanceDays: 14,
    ratingAvg: 4.9,
    ratingCount: 1204,
    isFoundingPartner: false,
    hours: hours('11:00', '23:30'),
    photos: [],
    services: kingMenu,
    barbers: [
      barber('king-b1', 'يوسف', 'كبير الحلاقين', 5, 640, kingMenu),
      barber('king-b2', 'عمر', 'باكدجات العرسان', 4.8, 410, kingMenu),
    ],
  },
  {
    id: 'shop-fade',
    name: 'صالون فيد',
    slug: 'fade-salon',
    description: 'أسعار مناسبة وشغل نضيف. مناسب للعيلة كلها.',
    phone: '+201000000021',
    city: 'بنها',
    area: 'أتريب',
    address: 'ميدان الإشارة، أتريب',
    latitude: 30.4712,
    longitude: 31.1902,
    coverUrl: null,
    timezone: 'Africa/Cairo',
    maxAdvanceDays: 5,
    ratingAvg: 4.5,
    ratingCount: 87,
    isFoundingPartner: false,
    hours: hours('13:00', '00:00', 5),
    photos: [],
    services: fadeMenu,
    barbers: [
      barber('fade-b1', 'حسن', 'حلاقة كلاسيك', 4.5, 60, fadeMenu, [4]),
      barber('fade-b2', 'مصطفى', 'أطفال وشباب', 4.4, 27, fadeMenu, [4]),
    ],
  },
];

export const mockNotifications = (): AppNotification[] => {
  const ago = (min: number) => new Date(Date.now() - min * 60_000).toISOString();
  return [
    {
      id: 'n1',
      type: 'BOOKING_CREATED',
      title: 'تم تأكيد حجزك',
      body: 'محمد مستنيك في Chairo Demo – Banha. هنفكرك قبل الميعاد بساعتين.',
      data: null,
      readAt: null,
      createdAt: ago(25),
    },
    {
      id: 'n2',
      type: 'WELCOME',
      title: 'أهلاً بيك في Chairo',
      body: 'احجز حلاقك في ثواني وتعالى على ميعادك من غير انتظار.',
      data: null,
      readAt: ago(60 * 24),
      createdAt: ago(60 * 24 * 2),
    },
  ];
};

export const mockPolicy = {
  ar: [
    'الإلغاء مجاني لحد قبل الميعاد بـ 2 ساعة.',
    'الإلغاء المتأخر (أقل من 2 ساعة): كل 3 إلغاءات متأخرة خلال 30 يوم = إنذار واحد.',
    'الإلغاء قبل الميعاد بأقل من 30 دقيقة أو عدم الحضور = إنذار.',
    'الإنذار يفضل محسوب 60 يوم.',
    'أول إنذار: تنبيه بس. تاني إنذار: الحجز في نفس اليوم بس لمدة 30 يوم. تالت إنذار: إيقاف الحجز 30 يوم.',
    'لو عدّت 90 يوم من غير إنذارات، سجلك بيرجع نضيف.',
    'لو الحلاق سجّلك "لم يحضر" وإنت كنت موجود: امسح كود الحضور في المحل، أو اعترض خلال 24 ساعة. من غير دليل مفيش إنذار على حد.',
    'التأجيل مجاني لحد قبل الميعاد بـ 2 ساعة. ولو الحلاق أعلن إنه متأخر، تقدر تأجل أو تلغي من غير أي عقوبة.',
  ],
};
