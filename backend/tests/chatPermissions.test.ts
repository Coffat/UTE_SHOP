import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import {
  canSendAsCustomer,
  canSendAsStaff,
  canViewConversation,
} from '../modules/chat/services/chatPermission.service.js';

const makeConversation = (overrides: Partial<any> = {}) =>
  ({
    customerId: new mongoose.Types.ObjectId('665f0f000000000000000001'),
    assignedStaffId: new mongoose.Types.ObjectId('665f0f000000000000000002'),
    status: 'staff_handling',
    ...overrides,
  } as any);

describe('chat permission matrix', () => {
  it('customer can view only own conversation', () => {
    const conversation = makeConversation();
    const own = canViewConversation(
      { id: conversation.customerId.toString(), role: 'CUSTOMER' },
      conversation
    );
    const other = canViewConversation({ id: '665f0f000000000000000099', role: 'CUSTOMER' }, conversation);
    assert.equal(own, true);
    assert.equal(other, false);
  });

  it('staff can view waiting conversations and assigned conversations', () => {
    const waitingConversation = makeConversation({ status: 'waiting_staff', assignedStaffId: null });
    const assignedConversation = makeConversation();
    const waitingAllowed = canViewConversation({ id: '665f0f000000000000000077', role: 'SALES' }, waitingConversation);
    const assignedAllowed = canViewConversation(
      { id: assignedConversation.assignedStaffId.toString(), role: 'SALES' },
      assignedConversation
    );
    assert.equal(waitingAllowed, true);
    assert.equal(assignedAllowed, true);
  });

  it('send permission checks customer/staff ownership correctly', () => {
    const conversation = makeConversation();
    assert.equal(
      canSendAsCustomer({ id: conversation.customerId.toString(), role: 'CUSTOMER' }, conversation),
      true
    );
    assert.equal(
      canSendAsStaff({ id: conversation.assignedStaffId.toString(), role: 'SALES' }, conversation),
      true
    );
  });
});
