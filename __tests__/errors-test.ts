import { API_ERROR_CODES } from '@/lib/api/error-codes.generated';
import { errorMessages } from '@/lib/errors';

/** The app never sees these: they belong to the admin dashboard, webhooks and the web action links. */
const NOT_SHOWN_IN_APP = new Set<string>([
  'ACTION_LINK_INVALID',
  'ACTION_LINK_USED',
  'ADMIN_IP_NOT_ALLOWED',
  'ADMIN_STAFF_REQUIRED',
  'ALREADY_CLAIMED',
  'ANNOUNCEMENT_NOT_FOUND',
  'ANNOUNCEMENT_NOT_SENDABLE',
  'CANNOT_BAN_STAFF',
  'CONFIRMATION_REQUIRED',
  'CSV_INVALID',
  'DELIVERY_NOT_FOUND',
  'DELIVERY_NOT_RETRYABLE',
  'DISPUTE_NOT_FOUND',
  'INVOICE_INVALID_STATE',
  'LAST_SUPER_ADMIN',
  'LEAD_ALREADY_ONBOARDED',
  'LEAD_NOT_FOUND',
  'MODERATION_ITEM_NOT_FOUND',
  'PERMISSION_DENIED',
  'PLAN_NOT_FOUND',
  'REPORT_ACTION_NOT_APPLICABLE',
  'REPORT_ALREADY_RESOLVED',
  'REPORT_NOT_FOUND',
  'REVIEW_STATE_CHANGED',
  'SETTING_NOT_FOUND',
  'SHOP_STATE_CHANGED',
  'STAFF_NOT_FOUND',
  'TASK_NOT_FOUND',
  'TOTP_ALREADY_ENABLED',
  'TOTP_INVALID',
  'TOTP_NOT_SET_UP',
  'TOTP_REQUIRED',
  'USER_ALREADY_BANNED',
  'USER_NOT_BANNED',
  'WEBHOOK_SIGNATURE_INVALID',
  'WEBHOOK_VERIFY_FAILED',
]);

describe('lib/errors', () => {
  it('has Arabic text for every API error code the app can receive', () => {
    const unmapped = API_ERROR_CODES.filter((c) => !NOT_SHOWN_IN_APP.has(c) && !errorMessages[c]);
    expect(unmapped).toEqual([]);
  });
});
