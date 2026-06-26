import mongoose from 'mongoose';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { eventBus, AppEvent } from '../shared/utils/eventBus.js';
import { registerNotificationEventHandlers } from '../modules/notification/services/notification.orchestrator.js';
import { Notification, UserNotification } from '../modules/notification/models/Notification.js';
import NotificationDeliveryLog from '../modules/notification/models/NotificationDeliveryLog.js';
import NotificationPreference from '../modules/notification/models/NotificationPreference.js';
import User from '../modules/user/models/User.js';
import * as notifService from '../modules/notification/services/notification.service.js';

import Admin from '../modules/user/models/Admin.js';
import Customer from '../modules/user/models/Customer.js';

dotenv.config();

const runTest = async () => {
  console.log('--- STARTING E2E NOTIFICATION TEST ---');
  
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/uteshop');
  console.log('Connected to MongoDB');

  // Register the handlers
  registerNotificationEventHandlers();

  // Create mock users
  const adminId = new mongoose.Types.ObjectId();
  const customerId = new mongoose.Types.ObjectId();

  await Admin.create({ _id: adminId, fullName: 'Admin Test', email: `admin-${Date.now()}@test.com`, passwordHash: 'hash', role: 'ADMIN', isActive: true });
  await Customer.create({ _id: customerId, fullName: 'Customer Test', email: `customer-${Date.now()}@test.com`, passwordHash: 'hash', role: 'CUSTOMER', isActive: true });
  console.log('Mock users created');

  const eventId = crypto.randomUUID();
  const paymentId = new mongoose.Types.ObjectId().toString();
  const orderId = new mongoose.Types.ObjectId().toString();

  try {
    console.log('\n[Scenario 1] Emit PAYMENT_SUCCESS...');
    await eventBus.emitAsync(AppEvent.PAYMENT_SUCCESS, {
      eventId,
      occurredAt: new Date(),
      entityId: orderId,
      actorId: customerId.toString(),
      orderId,
      paymentId,
      paymentMethod: 'MOMO',
      transactionId: 'TX12345',
    });

    await new Promise(r => setTimeout(r, 500));

    const adminUser = await User.findById(adminId);
    console.log(`Debug AdminUser: role=${adminUser?.role}, isActive=${adminUser?.isActive}, deletedAt=${adminUser?.deletedAt}`);

    const notifCount = await Notification.countDocuments({ sourceEventId: eventId });
    console.log(`Notification created: ${notifCount === 2 ? '✅ PASS' : '❌ FAIL'}`);

    const adminNotifCount = await UserNotification.countDocuments({ user: adminId });
    console.log(`Admin UserNotification created: ${adminNotifCount === 1 ? '✅ PASS' : '❌ FAIL'}`);

    const customerNotifCount = await UserNotification.countDocuments({ user: customerId });
    console.log(`Customer UserNotification created: ${customerNotifCount === 1 ? '✅ PASS' : '❌ FAIL'}`);

    const deliveryLogCount = await NotificationDeliveryLog.countDocuments({
      user: { $in: [adminId, customerId] },
    });
    console.log(`Delivery logs created: ${deliveryLogCount >= 4 ? '✅ PASS' : '❌ FAIL'}`);

    console.log('\n[Scenario 2] Deduplication - Emit exact same PAYMENT_SUCCESS...');
    await eventBus.emitAsync(AppEvent.PAYMENT_SUCCESS, {
      eventId,
      occurredAt: new Date(),
      entityId: orderId,
      actorId: customerId.toString(),
      orderId,
      paymentId,
      paymentMethod: 'MOMO',
      transactionId: 'TX12345',
    });

    await new Promise(r => setTimeout(r, 500));
    
    const notifCountAfter = await Notification.countDocuments({ sourceEventId: eventId });
    console.log(`Deduplication worked (still 2): ${notifCountAfter === 2 ? '✅ PASS' : '❌ FAIL'}`);

    console.log('\n[Scenario 3] Test Notification Service (Cursor Pagination)');
    const listResult = await notifService.getUserNotifications(adminId.toString(), { limit: 10 });
    console.log(`Fetched list size: ${listResult.data.length} ${listResult.data.length === 1 ? '✅ PASS' : '❌ FAIL'}`);

    console.log('\n[Scenario 4] Test Unread Count & Mark As Read');
    const unreadBefore = await notifService.getUnreadCount(adminId.toString());
    console.log(`Unread before: ${unreadBefore} ${unreadBefore === 1 ? '✅ PASS' : '❌ FAIL'}`);

    await notifService.markAsRead(listResult.data[0]._id.toString(), adminId.toString());

    const unreadAfter = await notifService.getUnreadCount(adminId.toString());
    console.log(`Unread after markAsRead: ${unreadAfter} ${unreadAfter === 0 ? '✅ PASS' : '❌ FAIL'}`);

    console.log('\n[Scenario 5] Test Mark All As Read');
    // create one more notification to test markAllAsRead
    const eventId2 = crypto.randomUUID();
    const paymentId2 = new mongoose.Types.ObjectId().toString();
    const orderId2 = new mongoose.Types.ObjectId().toString();
    await eventBus.emitAsync(AppEvent.PAYMENT_SUCCESS, {
      eventId: eventId2,
      occurredAt: new Date(),
      entityId: orderId2,
      actorId: adminId.toString(),
      orderId: orderId2,
      paymentId: paymentId2,
      paymentMethod: 'COD',
    });

    await new Promise(r => setTimeout(r, 500));
    const unreadBeforeAll = await notifService.getUnreadCount(adminId.toString());
    await notifService.markAllAsRead(adminId.toString());
    const unreadAfterAll = await notifService.getUnreadCount(adminId.toString());
    console.log(`Mark all as read reduced unread from ${unreadBeforeAll} to ${unreadAfterAll} ${unreadAfterAll === 0 ? '✅ PASS' : '❌ FAIL'}`);

    console.log('\n[Scenario 6] User preference opt-out (EMAIL + IN_APP)');
    await NotificationPreference.findOneAndUpdate(
      { user: customerId },
      {
        $set: {
          channels: {
            inAppEnabled: false,
            emailEnabled: false,
            pushEnabled: false,
          },
        },
      },
      { upsert: true }
    );

    const customerBeforeOptOut = await UserNotification.countDocuments({ user: customerId });

    const eventId3 = crypto.randomUUID();
    const paymentId3 = new mongoose.Types.ObjectId().toString();
    const orderId3 = new mongoose.Types.ObjectId().toString();
    await eventBus.emitAsync(AppEvent.PAYMENT_FAILED, {
      eventId: eventId3,
      occurredAt: new Date(),
      entityId: orderId3,
      actorId: customerId.toString(),
      customerId: customerId.toString(),
      orderId: orderId3,
      paymentId: paymentId3,
      paymentMethod: 'VNPAY',
      reason: 'Simulated',
    });
    await new Promise(r => setTimeout(r, 500));

    const customerNotificationsAfterOptOut = await UserNotification.countDocuments({
      user: customerId,
    });
    const skippedLogs = await NotificationDeliveryLog.countDocuments({
      user: customerId,
      status: 'SKIPPED',
    });
    console.log(`Opt-out blocks in-app for customer: ${customerNotificationsAfterOptOut === customerBeforeOptOut ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Opt-out creates skipped logs: ${skippedLogs > 0 ? '✅ PASS' : '❌ FAIL'}`);

  } catch (error) {
    console.error('Test failed with error:', error);
  } finally {
    // Cleanup
    console.log('\nCleaning up mock data...');
    await User.deleteMany({ _id: { $in: [adminId, customerId] } });
    await Notification.deleteMany({ sourceEventId: { $in: [eventId] } });
    await UserNotification.deleteMany({ user: { $in: [adminId, customerId] } });
    await NotificationDeliveryLog.deleteMany({ user: { $in: [adminId, customerId] } });
    await NotificationPreference.deleteMany({ user: { $in: [adminId, customerId] } });
    
    await mongoose.disconnect();
    console.log('Disconnected. Test finished.');
  }
};

runTest();
