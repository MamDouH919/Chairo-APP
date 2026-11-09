import type { StaffMembership } from '@/lib/api/types';
import { resolveLanding, type LoginIntent } from '@/lib/landing';

const m = (shopId: string, status: StaffMembership['status'] = 'ACTIVE'): StaffMembership => ({
  shopId,
  shopName: shopId,
  slug: shopId,
  status,
  coverUrl: null,
  role: 'BARBER',
  barberId: 'b-' + shopId,
  barberName: 'محمد',
});

const none: StaffMembership[] = [];
const one = [m('a')];
const many = [m('a'), m('b')];

describe('resolveLanding: memberships × welcome choice', () => {
  const cases: [string, StaffMembership[], LoginIntent, string][] = [
    ['0 shops, chose customer', none, 'customer', 'customer'],
    ['0 shops, chose barber', none, 'barber', 'noShop'],
    ['1 shop, chose customer', one, 'customer', 'customer'],
    ['1 shop, chose barber', one, 'barber', 'shop'],
    ['2 shops, chose customer', many, 'customer', 'customer'],
    ['2 shops, chose barber', many, 'barber', 'pickShop'],
  ];
  it.each(cases)('%s', (_, memberships, intent, kind) => {
    expect(resolveLanding(memberships, intent, null).kind).toBe(kind);
  });

  it('opens the only shop', () => {
    expect(resolveLanding(one, 'barber', null)).toEqual({ kind: 'shop', shopId: 'a' });
  });

  it('reopens the remembered shop when there are several', () => {
    expect(resolveLanding(many, 'barber', { mode: 'shop', shopId: 'b' })).toEqual({ kind: 'shop', shopId: 'b' });
  });

  it('shows the picker when the remembered shop is gone', () => {
    expect(resolveLanding(many, 'barber', { mode: 'shop', shopId: 'gone' }).kind).toBe('pickShop');
  });
});

describe('resolveLanding: pending and inactive shops', () => {
  it('shows the pending state for a registered, unapproved shop', () => {
    expect(resolveLanding([m('new', 'PENDING')], 'barber', null).kind).toBe('pending');
  });

  it('ignores suspended / closed shops', () => {
    expect(resolveLanding([m('x', 'SUSPENDED'), m('y', 'CLOSED')], 'barber', null).kind).toBe('noShop');
    expect(resolveLanding([m('x', 'SUSPENDED'), m('a')], 'barber', null)).toEqual({ kind: 'shop', shopId: 'a' });
  });
});

describe('resolveLanding: cold start (no choice made)', () => {
  it('barbers open in shop mode by default', () => {
    expect(resolveLanding(one, null, null).kind).toBe('shop');
  });

  it('a plain customer stays a customer', () => {
    expect(resolveLanding(none, null, null).kind).toBe('customer');
  });

  it('respects a switch to customer mode', () => {
    expect(resolveLanding(one, null, { mode: 'customer', shopId: 'a' }).kind).toBe('customer');
  });

  it('a barber still waiting for an owner reopens on "no shop"', () => {
    expect(resolveLanding(none, null, { mode: 'shop', shopId: null }).kind).toBe('noShop');
  });
});
