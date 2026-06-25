import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import OrderStatus from '../shared/enums/OrderStatus.js';
import {
  isValidOrderStatusTransition,
  ALLOWED_ORDER_TRANSITIONS,
} from '../modules/order/constants/orderStatusGroups.js';

describe('isValidOrderStatusTransition', () => {
  it('allows PENDING -> CONFIRMED and CANCELLED', () => {
    assert.equal(isValidOrderStatusTransition(OrderStatus.PENDING, OrderStatus.CONFIRMED), true);
    assert.equal(isValidOrderStatusTransition(OrderStatus.PENDING, OrderStatus.CANCELLED), true);
    assert.equal(isValidOrderStatusTransition(OrderStatus.PENDING, OrderStatus.COMPLETED), false);
  });

  it('allows DELIVERING -> COMPLETED', () => {
    assert.equal(isValidOrderStatusTransition(OrderStatus.DELIVERING, OrderStatus.COMPLETED), true);
  });

  it('blocks transitions from terminal states', () => {
    assert.equal(isValidOrderStatusTransition(OrderStatus.COMPLETED, OrderStatus.PENDING), false);
    assert.equal(isValidOrderStatusTransition(OrderStatus.CANCELLED, OrderStatus.PENDING), false);
    assert.deepEqual(ALLOWED_ORDER_TRANSITIONS[OrderStatus.COMPLETED], [OrderStatus.RETURNED]);
  });
});
