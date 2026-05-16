---
config:

  layout: elk
---
classDiagram

%% ==========================================

%% ĐỊNH NGHĨA CÁC ENUM (RULES & STATES)

%% ==========================================

classUserStatus<`<enumeration>`>{

ACTIVE

BANNED

PENDING

}

classProductStatus<`<enumeration>`>{

DRAFT

ACTIVE

DISCONTINUED

}

classStockStatus<`<enumeration>`>{

IN_STOCK

LOW

OUT_OF_STOCK

}

classTransactionType<`<enumeration>`>{

IMPORT

EXPORT

ADJUSTMENT

}

classOrderStatus<`<enumeration>`>{

PENDING

CONFIRMED

READY

DELIVERING

COMPLETED

CANCELLED

}

classOrderType<`<enumeration>`>{

ONLINE

AT_STORE

}

classPaymentStatus<`<enumeration>`>{

PENDING

SUCCESS

FAILED

REFUNDED

}

classRefundStatus<`<enumeration>`>{

PENDING

APPROVED

PROCESSED

REJECTED

}

classDisputeStatus<`<enumeration>`>{

OPEN

IN_REVIEW

RESOLVED

CLOSED

}

classDiscountType<`<enumeration>`>{

PERCENTAGE

FIXED_AMOUNT

}

classNotificationChannel<`<enumeration>`>{

EMAIL

PUSH

SMS

}

classNotificationType<`<enumeration>`>{

SYSTEM

PERSONAL

PROMOTION

}

%% ==========================================

%% NHÓM 1: USER & ACTORS

%% ==========================================

classUser{

<`<abstract>`>

-email:String

-passwordHash:String

-phone:String

-status:UserStatus

+login(email, password)AuthToken

}

classCustomer{

-fullName:String

-isEmailVerified:Boolean

+register(email, password)void

}

classAdmin{

-ownerName:String

+manageSystemSettings()void

+viewFinancialReports()void

+manageStaffAccounts()void

}

classStaff{

<`<abstract>`>

-fullName:String

-isActive:Boolean

-hiredAt:LocalDate

+deactivate()* void

}

classSales{

-isOnline:Boolean

+confirmOrder(order)void

+resolveDispute(dispute)void

+deactivate()void

}

classWarehouseStaff{

-assignedWarehouse:String

+processStock(transaction)void

+inventoryCheck()void

+deactivate()void

}

classStoreStaff{

-counterId:String

-storeLocation:String

+handlePOS(order)void

+preparePickUpOrder(order)void

+deactivate()void

}

User<|--Customer

User<|--Admin

User<|--Staff

Staff<|--Sales

Staff<|--WarehouseStaff

Staff<|--StoreStaff

%% ==========================================

%% NHÓM 2: CATALOG & PRODUCT

%% ==========================================

classCategory{

-name:String

-slug:String

-description:String

-isActive:Boolean

+activate()void

+deactivate()void

}

classProduct{

-name:String

-slug:String

-description:String

-mainImageUrl:String

-status:ProductStatus

+publish()void

+discontinue()void

}

classProductVariant{

-sku:String

-sizeName:String

-price:BigDecimal

-stockStatus:StockStatus

-isActive:Boolean

+updatePrice(newPrice)void

+markOutOfStock()void

}

classTag{

-name:String

-slug:String

}

classReview{

-rating:Integer

-comment:String

-imageUrls:List~String~

-isVerified:Boolean

+approve()void

+reject()void

}

Product"1"*--"*"ProductVariant:has

Product"1"*--"*"Review:receives

Category"1"o--"*"Product:categorizes

Tag"1"o--"*"Product:tags

Customer"1"-->"*"Review:writes

%% ==========================================

%% NHÓM 3: INVENTORY

%% ==========================================

classMaterial{

-name:String

-unit:String

-costPerUnit:BigDecimal

-shelfLifeDays:Integer

+updateCost(newCost)void

}

classWarehouse{

-name:String

-address:String

-isActive:Boolean

}

classStockLevel{

-quantity:BigDecimal

-minThreshold:BigDecimal

-updatedAt:LocalDateTime

+deduct(qty)void

+restock(qty)void

+hasEnoughStock(qty)Boolean

}

classStockTransaction{

-type:TransactionType

-quantity:BigDecimal

-reason:String

-timestamp:LocalDateTime

}

Warehouse"1"o--"*"StockLevel:stores

StockLevel"1"*--"*"StockTransaction:logs

StockLevel"*"-->"0..1"Material:tracks rawmaterial

StockLevel"*"-->"0..1"ProductVariant:tracks SKU

StockTransaction"*"-->"1"WarehouseStaff:performed by

%% ==========================================

%% NHÓM 4: CART & ORDER

%% ==========================================

classCart{

-sessionId:String

-status:String

+calculateSubtotal()BigDecimal

+convertToOrder()Order

}

classCartItem{

-quantity:Integer

-selectedOptions:Map

-addedAt:LocalDateTime

}

classOrder{

-orderCode:String

-status:OrderStatus

-orderType:OrderType

-subtotal:BigDecimal

-shippingFee:BigDecimal

-totalAmount:BigDecimal

-note:String

+confirm()void

+cancel(reason)void

+calculateTotal()BigDecimal

}

classOrderItem{

-quantity:Integer

-unitPrice:BigDecimal

-snapshotName:String

-subtotal:BigDecimal

+calculateSubtotal()BigDecimal

}

classOrderStatusHistory{

-status:OrderStatus

-note:String

-timestamp:LocalDateTime

}

classRecipient{

-fullName:String

-phone:String

-deliveryNote:String

}

Customer"0..1"o--"1"Cart:owns

Cart"1"*--"*"CartItem:contains

Order"1"*--"*"OrderItem:contains

Order"1"*--"*"OrderStatusHistory:tracks

Order"1"*--"1"Recipient:ships to

Customer"0..1"-->"*"Order:places

CartItem"*"-->"1"ProductVariant:refers to

OrderItem"*"-->"1"ProductVariant:refers to

Order"*"-->"0..1"Sales:handles online

Order"*"-->"0..1"StoreStaff:handles atcounter

%% ==========================================

%% NHÓM 5: FINANCE, REFUND & DISPUTE

%% ==========================================

classPayment{

<`<abstract>`>

-amount:BigDecimal

-status:PaymentStatus

-transactionId:String

+confirm(transactionId)* void

+generateQRCode()* String

}

classMOPayment{

-gatewayTransactionId:String

+confirm(transactionId)void

}

classCODPayment{

-shipperNote:String

+confirm(transactionId)void

}

classCashPayment{

-cashTendered:BigDecimal

-changeDue:BigDecimal

+confirm(transactionId)void

}

Payment<|--MOPayment

Payment<|--CODPayment

Payment<|--CashPayment

classRefund{

-amount:BigDecimal

-reason:String

-status:RefundStatus

-processedAt:LocalDateTime

+approve(adminId)void

+process()void

}

classInvoice{

-invoiceCode:String

-totalAmount:BigDecimal

-issuedAt:LocalDateTime

-pdfUrl:String

+generate()void

}

classDispute{

-description:String

-status:DisputeStatus

-resolution:String

-evidenceUrls:List~String~

+escalateToAdmin()void

+resolve(resolution, salesId)void

}

Order"1"*--"*"Payment:has

Order"1"o--"0..1"Invoice:generates

Order"1"o--"0..1"Dispute:involves

Payment"1"*--"0..1"Refund:triggers

%% ==========================================

%% NHÓM 6: LOGISTICS (3PL)

%% ==========================================

classShippingProvider{

-providerName:String

-apiEndpoint:String

-isActive:Boolean

}

classWaybill{

-trackingCode:String

-status:String

-estimatedDelivery:LocalDate

}

classAddress{

-label:String

-street:String

-city:String

-isDefault:Boolean

}

Customer"1"*--"*"Address:saves

Order"*"-->"1"Address:delivered to

ShippingProvider"1"<--"*"Waybill:provided by

Order"1"o--"0..1"Waybill:tracks via

%% ==========================================

%% NHÓM 7: MARKETING & CRM

%% ==========================================

classVoucher{

-code:String

-discountType:DiscountType

-discountValue:BigDecimal

-maxDiscountAmount:BigDecimal

-minOrderAmount:BigDecimal

-validUntil:LocalDateTime

-isActive:Boolean

+validate(order)Boolean

+calculateDiscount(orderTotal)BigDecimal

}

classCampaign{

-name:String

-isActive:Boolean

}

classLoyaltyAccount{

-points:Integer

-tier:String

+earn(points)void

}

classLoyaltyTransaction{

-type:String

-points:Integer

-createdAt:LocalDateTime

}

Campaign"1"o--"*"Voucher:issues

Customer"1"*--"1"LoyaltyAccount:owns

LoyaltyAccount"1"*--"*"LoyaltyTransaction:contains

Order"*"-->"0..1"Voucher:applies

%% ==========================================

%% NHÓM 8: NOTIFICATION & CMS (TÁCH BẢNG GIẢI QUYẾT BROADCAST)

%% ==========================================

classNotificationSender{

<`<interface>`>

+send(notification)* void

}

classEmailSender{

+send(notification)void

}

classPushSender{

+send(notification)void

}

classNotification{

-title : String

-body:String

-type:NotificationType

-channel:NotificationChannel

-referenceType:String

-referenceId:String

-createdAt:LocalDateTime

}

classUserNotification{

-isRead:Boolean

-readAt:LocalDateTime

+markAsRead()void

}

classBlogPost{

-title : String

-slug:String

-content:String

+publish()void

}

NotificationSender<|..EmailSender

NotificationSender<|..PushSender

NotificationSender..> Notification : sends

%% Sợi dây kết nối: User -> UserNotification <- Notification

User"1"*--"*"UserNotification:has

Notification"1"<--"*"UserNotification:maps to

BlogPost"*"-->"1"Staff:written by

%% ==========================================

%% LIÊN KẾT ENUM (DEPENDENCY)

%% ==========================================

User..> UserStatus : uses

Product..> ProductStatus : uses

ProductVariant..> StockStatus : uses

StockTransaction..> TransactionType : uses

Order..> OrderStatus : uses

Order..> OrderType : uses

Payment..> PaymentStatus : uses

Refund..> RefundStatus : uses

Dispute..> DisputeStatus : uses

OrderStatusHistory..> OrderStatus : uses

Voucher..> DiscountType : uses

Notification..> NotificationChannel : uses

Notification..> NotificationType : uses
