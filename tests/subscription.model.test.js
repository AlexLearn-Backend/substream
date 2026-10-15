import assert from 'node:assert/strict';
import { afterEach, mock, test } from 'node:test';
import { Types } from 'mongoose';
import Subscription from '../models/subscription.model.js';

afterEach(() => mock.restoreAll());

const subscriptionData = (overrides = {}) => ({
  name: 'Test subscription',
  price: 10,
  category: 'technology',
  paymentMethod: 'card',
  startDate: new Date('2025-01-01T12:00:00Z'),
  user: new Types.ObjectId(),
  ...overrides
});

for (const [frequency, days] of Object.entries({ daily: 1, weekly: 7, monthly: 30, annually: 365 })) {
  test(`validation calculates a missing ${frequency} renewal before required validation`, async () => {
    const subscription = new Subscription(subscriptionData({ frequency }));
    const expected = new Date(subscription.startDate);
    expected.setDate(expected.getDate() + days);

    await subscription.validate();

    assert.equal(subscription.renewalDate.getTime(), expected.getTime());
    assert.equal(subscription.status, 'expired');
  });
}

test('saving a canceled subscription with a past renewal preserves canceled status', async () => {
  let persisted;
  mock.method(Subscription.collection, 'insertOne', async (document) => {
    persisted = document;
    return { acknowledged: true, insertedId: document._id };
  });
  const subscription = new Subscription(subscriptionData({
    status: 'canceled', renewalDate: new Date('2025-02-01T12:00:00Z')
  }));

  await subscription.save();

  assert.equal(persisted.status, 'canceled');
});

test('an explicit future renewal is preserved and remains active', async () => {
  const renewalDate = new Date(Date.now() + 86400000);
  const subscription = new Subscription(subscriptionData({ renewalDate }));

  await subscription.validate();

  assert.equal(subscription.renewalDate.getTime(), renewalDate.getTime());
  assert.equal(subscription.status, 'active');
});

test('an explicit renewal before the start date still fails validation', async () => {
  const subscription = new Subscription(subscriptionData({
    renewalDate: new Date('2024-12-01T12:00:00Z')
  }));

  await assert.rejects(subscription.validate(), /Renewal date must be after the start date/);
});
