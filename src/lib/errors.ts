import { ApiError } from './api/http';

/** API `error.code` → Arabic. Clients own the user-facing text (docs/CONVENTIONS.md). */
export const errorMessages: Record<string, string> = {
  NETWORK: 'مفيش اتصال بالإنترنت. اتأكد من الشبكة وحاول تاني.',
  INTERNAL: 'حصلت مشكلة عندنا. حاول تاني بعد شوية.',
  RATE_LIMITED: 'طلبات كتير ورا بعض. استنى شوية وحاول تاني.',
  VALIDATION_FAILED: 'في بيانات مش مظبوطة. راجعها وحاول تاني.',
  BAD_REQUEST: 'في بيانات مش مظبوطة. راجعها وحاول تاني.',
  NOT_FOUND: 'اللي بتدور عليه مش موجود.',
  ROUTE_NOT_FOUND: 'اللي بتدور عليه مش موجود. حدّث التطبيق وحاول تاني.',
  CONFLICT: 'ده موجود بالفعل.',
  FORBIDDEN: 'مش مسموح لك تعمل ده.',
  FEATURE_DISABLED: 'الخدمة دي مش متاحة دلوقتي.',

  UNAUTHENTICATED: 'سجّل دخولك تاني.',
  TOKEN_EXPIRED: 'سجّل دخولك تاني.',
  TOKEN_INVALID: 'سجّل دخولك تاني.',
  REFRESH_INVALID: 'سجّل دخولك تاني.',
  REFRESH_REUSED: 'سجّل دخولك تاني.',
  SESSION_REVOKED: 'الجلسة دي اتقفلت. سجّل دخولك تاني.',
  ACCOUNT_BANNED: 'الحساب ده موقوف. تواصل مع الدعم.',
  USER_NOT_FOUND: 'الحساب ده مش موجود.',
  USER_ANONYMIZED: 'الحساب ده اتمسح.',
  ACCOUNT_DELETE_BLOCKED_OWNER: 'إنت آخر مالك للمحل. انقل الملكية أو اقفل المحل الأول.',
  ACCOUNT_DELETE_BLOCKED_STAFF: 'حسابات فريق Chairo مينفعش تتمسح من هنا.',

  OTP_COOLDOWN: 'استنى شوية قبل ما تطلب كود جديد.',
  OTP_DAILY_LIMIT: 'وصلت للحد اليومي للأكواد. حاول بكرة.',
  OTP_INVALID: 'الكود غلط. اتأكد منه وحاول تاني.',
  OTP_EXPIRED: 'الكود انتهى. اطلب كود جديد.',
  OTP_TOO_MANY_ATTEMPTS: 'محاولات غلط كتير. اطلب كود جديد.',
  OTP_SEND_FAILED: 'مقدرناش نبعت الكود دلوقتي. حاول تاني كمان دقيقة.',

  SHOP_NOT_FOUND: 'المحل ده مش موجود أو مش متاح دلوقتي.',
  SHOP_NOT_ACTIVE: 'المحل ده مش بياخد حجوزات دلوقتي.',
  BARBER_NOT_FOUND: 'الحلاق ده مش متاح.',
  SERVICE_NOT_FOUND: 'الخدمة دي مش متاحة.',
  NOT_SHOP_MEMBER: 'إنت مش عضو في المحل ده.',
  MEMBER_NOT_FOUND: 'العضو ده مش موجود.',
  LAST_OWNER: 'لازم المحل يفضل له مالك واحد على الأقل.',
  SLUG_TAKEN: 'الرابط ده محجوز. اختار رابط تاني.',
  PHOTO_NOT_FOUND: 'الصورة دي مش موجودة.',
  PHOTO_LIMIT: 'المحل ليه 10 صور بالكتير.',
  TIME_BLOCK_NOT_FOUND: 'الوقت المقفول ده مش موجود.',
  HOURS_OVERLAP: 'مواعيد الشغل متداخلة في نفس اليوم.',
  INVALID_TIME_RANGE: 'وقت النهاية لازم يكون بعد وقت البداية.',
  NOT_SHOP_CUSTOMER: 'الشخص ده عمره ما حجز عندك.',

  MEDIA_NOT_FOUND: 'الصورة مش موجودة. ارفعها تاني.',
  MEDIA_NOT_UPLOADED: 'الصورة لسه مترفعتش. حاول تاني.',
  MEDIA_NOT_READY: 'الصورة لسه بتتجهز أو اترفضت. جرّب صورة تانية.',
  MEDIA_WRONG_TARGET: 'الصورة دي مترفعتش للمكان ده. ارفعها تاني.',

  SUBSCRIPTION_NOT_FOUND: 'مفيش اشتراك للمحل ده.',
  INVOICE_NOT_FOUND: 'الفاتورة دي مش موجودة.',

  SLOT_TAKEN: 'الميعاد ده لسه اتحجز حالاً. اختار ميعاد تاني.',
  SLOT_UNAVAILABLE: 'الميعاد ده برا مواعيد العمل.',
  BOOKING_NOT_FOUND: 'الحجز مش موجود.',
  BOOKING_STATE_CHANGED: 'الحجز اتغير. حدّث الصفحة.',
  INVALID_TRANSITION: 'مينفعش تعمل ده دلوقتي على الحجز ده.',
  TOO_MANY_ACTIVE_BOOKINGS: 'عندك حجزين شغالين بالفعل. الغي واحد أو استنى لما يخلص.',
  BOOKING_SUSPENDED: 'الحجز موقوف مؤقتاً على حسابك بسبب الإنذارات.',
  BOOKING_SAME_DAY_ONLY: 'تقدر تحجز في نفس اليوم بس حالياً بسبب إنذار سابق.',
  CUSTOMER_BLOCKED_BY_SHOP: 'مينفعش تحجز في المحل ده.',
  BOOKING_TOO_FAR_AHEAD: 'الميعاد ده بعيد أوي. اختار ميعاد أقرب.',
  BOOKING_TOO_SOON: 'الميعاد قريب أوي. اختار ميعاد بعد 10 دقايق على الأقل.',
  RESCHEDULE_TOO_LATE: 'التأجيل متاح لحد قبل الميعاد بساعتين بس.',
  SERVICE_NOT_OFFERED: 'الحلاق ده مش بيقدم الخدمة دي.',
  BARBER_UNAVAILABLE: 'الحلاق مش متاح في الميعاد ده.',
  POLICY_NOT_ACCEPTED: 'لازم توافق على سياسة الحجز الأول.',
  IDEMPOTENCY_IN_PROGRESS: 'بنكمّل حجزك… ثانية واحدة.',
  BOOKING_NOT_REBOOKABLE: 'تقدر تعيد الحجز من الحجوزات اللي خلصت بس.',
  TOO_EARLY_FOR_NO_SHOW: 'لسه بدري تسجّله "لم يحضر". استنى وقت السماح يخلص.',

  CHECKIN_INVALID: 'الكود ده مش صح أو انتهى. اطلب من الحلاق يوريك الكود الجديد.',
  CHECKIN_WINDOW_CLOSED: 'تسجيل الحضور بيفتح قبل الميعاد بنص ساعة وبيقفل لما الميعاد يخلص.',
  DISPUTE_WINDOW_CLOSED: 'الاعتراض متاح خلال 24 ساعة بس.',
  APPEAL_EXISTS: 'إنت قدمت اعتراض على ده قبل كده.',
  STRIKE_NOT_FOUND: 'الإنذار ده مش موجود.',
  REPORT_NOT_ALLOWED: 'مينفعش تبلّغ عن الحجز ده.',

  NOTIFICATION_NOT_FOUND: 'الإشعار ده مش موجود.',
  DEVICE_NOT_FOUND: 'الجهاز ده مش موجود.',
  PREFERENCE_LOCKED: 'الإشعار ده أساسي ومينفعش يتقفل.',

  REASSIGN_PENDING: 'في طلب نقل مستني رد الزبون بالفعل.',
  REASSIGN_NOT_PENDING: 'مفيش طلب نقل مستني على الحجز ده.',
  REASSIGN_TOO_LATE: 'الميعاد قريب أوي إننا نسأل الزبون.',
  REASSIGN_FORCE_NOT_ALLOWED: 'مينفعش تنقل الحجز من غير موافقة الزبون دلوقتي.',

  BBOX_TOO_LARGE: 'قرّب الخريطة شوية.',
  WAITLIST_LIMIT: 'وصلت للحد الأقصى لقوائم الانتظار.',
  WAITLIST_EXISTS: 'إنت في قائمة الانتظار دي بالفعل.',
  WAITLIST_NOT_FOUND: 'طلب الانتظار ده مش موجود.',
  WAITLIST_NO_OFFER: 'العرض ده خلص.',
  REVIEW_NOT_ALLOWED: 'تقدر تقيّم حجوزاتك اللي خلصت في آخر 7 أيام بس.',
  REVIEW_EXISTS: 'إنت قيّمت الحجز ده قبل كده.',
  REVIEW_NOT_FOUND: 'التقييم ده مش موجود.',
  REVIEW_EDIT_CLOSED: 'التقييم يتعدل مرة واحدة خلال 48 ساعة.',
  REVIEW_EMPTY: 'التعليق فاضي بعد شيل اللينكات وأرقام الموبايل.',
  REVIEW_ALREADY_REPORTED: 'إنت بلّغت عن التقييم ده قبل كده.',
  REPORT_LIMIT: 'بلاغات كتير النهارده. حاول بكرة.',
  REPORT_NOT_ELIGIBLE: 'تقدر تبلّغ بس عن أماكن وناس اتعاملت معاهم قريب.',
};

export const errorCode = (e: unknown) => (e instanceof ApiError ? e.code : 'INTERNAL');

export function errorMessage(e: unknown): string {
  const code = errorCode(e);
  if (code === 'OTP_INVALID' && e instanceof ApiError) {
    const left = (e.details as { attemptsLeft?: number } | undefined)?.attemptsLeft;
    if (typeof left === 'number') return `الكود غلط. فاضل ${left} محاولات.`;
  }
  return errorMessages[code] ?? errorMessages.INTERNAL;
}
