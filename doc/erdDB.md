---
config:

  layout: elk
---
erDiagram

%% ==========================================

%% NHÓM 0: SYSTEM CONFIG (MỚI THÊM)

%% ==========================================

shop_profiles{

int idPK"Luôn = 1 (Singleton)"

varchar name

varchar address

varchar phone

varchar email

json working_hours"VD: {Monday: 08:00-17:00}"

varchar logo_url

varchar tax_id

timestamp updated_at

}

%% ==========================================

%% NHÓM 1: USERS & ACTORS (CTI & STI Mapping)

%% ==========================================

users{

uuid idPK

varchar email"UNIQUE"

varchar password_hash

varchar phone

varchar status"Enum: ACTIVE, BANNED, PENDING"

varchar role_type"Enum: CUSTOMER, ADMIN, STAFF"

timestamp created_at

}

customers{

uuid user_idPK, FK

varchar full_name

boolean is_email_verified

}

admins{

uuid user_idPK, FK

varchar owner_name

}

staffs{

uuid user_idPK, FK

varchar full_name

boolean is_active

date hired_at

varchar staff_type"Enum: SALES, WAREHOUSE, STORE"

boolean is_online"Null if not Sales"

varchar assigned_warehouse"Null if not Warehouse"

varchar counter_id"Null if not Store"

varchar store_location"Null if not Store"

}

users||--||customers: "extends"

users||--||admins: "extends"

users||--||staffs: "extends"

%% ==========================================

%% NHÓM 2: CHAT REAL-TIME & AI (MỚI THÊM)

%% ==========================================

chat_sessions{

uuid idPK

uuid customer_idFK"Ai tạo phiên chat"

uuid handled_by_staff_idFK"Nullable - Nhân viên tiếp nhận"

boolean is_bot_active"TRUE = AI đang chat, FALSE = Chờ/Đang là Nhân viên"

varchar status"Enum: OPEN, ESCALATED, CLOSED"

timestamp created_at

timestamp closed_at"Nullable"

}

chat_messages{

uuid idPK

uuid session_idFK

varchar sender_type"Enum: CUSTOMER, STAFF, BOT"

uuid sender_idFK"Nullable - Trỏ tới users(id). Null nếu là BOT"

text content

json attachment_urls"Ảnh/Video gửi kèm"

boolean is_read

timestamp created_at

}

customers||--o{chat_sessions: "starts"

staffs||--o{chat_sessions: "handles"

chat_sessions||--o{chat_messages: "contains"

users||--o{chat_messages: "sends"

%% ==========================================

%% NHÓM 3: CATALOG & PRODUCT

%% ==========================================

categories{

int idPK

varchar name

varchar slug"UNIQUE"

text description

boolean is_active

}

products{

uuid idPK

int category_idFK

varchar name

varchar slug"UNIQUE"

text description

varchar main_image_url

varchar status"Enum: DRAFT, ACTIVE, DISCONTINUED"

timestamp created_at

}

tags{

int idPK

varchar name

varchar slug"UNIQUE"

}

product_tags{

uuid product_idPK, FK

int tag_idPK, FK

}

product_variants{

uuid idPK

uuid product_idFK

varchar sku"UNIQUE"

varchar size_name

decimal price

varchar stock_status"Enum: IN_STOCK, LOW, OUT_OF_STOCK"

boolean is_active

}

reviews{

uuid idPK

uuid product_idFK

uuid customer_idFK

int rating

text comment

json image_urls"Array of strings"

boolean is_verified

timestamp created_at

}

categories||--o{products: "has"

products||--o{product_variants: "has"

products||--o{product_tags: "has"

tags||--o{product_tags: "has"

products||--o{reviews: "receives"

customers||--o{reviews: "writes"

%% ==========================================

%% NHÓM 4: INVENTORY

%% ==========================================

materials{

int idPK

varchar name

varchar unit

decimal cost_per_unit

int shelf_life_days

}

warehouses{

int idPK

varchar name

varchar address

boolean is_active

}

stock_levels{

uuid idPK

int warehouse_idFK

int material_idFK"Nullable"

uuid variant_idFK"Nullable"

decimal quantity

decimal min_threshold

timestamp updated_at

}

stock_transactions{

uuid idPK

uuid stock_level_idFK

uuid staff_idFK"WarehouseStaff"

varchar type"Enum: IMPORT, EXPORT, ADJUSTMENT"

decimal quantity

text reason

timestamp created_at

}

warehouses||--o{stock_levels: "stores"

materials||--o{stock_levels: "tracked_in"

product_variants||--o{stock_levels: "tracked_in"

stock_levels||--o{stock_transactions: "logs"

staffs||--o{stock_transactions: "performed_by"

%% ==========================================

%% NHÓM 5: CART & ORDER

%% ==========================================

carts{

uuid idPK

uuid customer_idFK"Nullable (for Guests)"

varchar session_id"Nullable"

varchar status"ACTIVE, CONVERTED"

timestamp updated_at

}

cart_items{

uuid idPK

uuid cart_idFK

uuid variant_idFK

int quantity

json selected_options

timestamp added_at

}

orders{

uuid idPK

uuid customer_idFK"Nullable"

uuid handled_by_sales_idFK"Nullable"

uuid handled_by_store_idFK"Nullable"

uuid voucher_idFK"Nullable"

varchar order_code"UNIQUE"

varchar status"Enum: PENDING, CONFIRMED..."

varchar order_type"Enum: ONLINE, AT_STORE"

decimal subtotal

decimal shipping_fee

decimal total_amount

text note

timestamp created_at

timestamp deleted_at"Soft Delete"

}

order_items{

uuid idPK

uuid order_idFK

uuid variant_idFK

int quantity

decimal unit_price

decimal subtotal

varchar snapshot_name

}

order_status_histories{

uuid idPK

uuid order_idFK

varchar status

text note

timestamp created_at

}

order_recipients{

uuid order_idPK, FK

varchar full_name

varchar phone

text delivery_note

}

customers||--o{carts: "owns"

carts||--o{cart_items: "contains"

product_variants||--o{cart_items: "added_to"

customers||--o{orders: "places"

staffs||--o{orders: "handles"

orders||--o{order_items: "contains"

orders||--o{order_status_histories: "tracks"

orders||--||order_recipients: "ships_to"

product_variants||--o{order_items: "snapshot"

%% ==========================================

%% NHÓM 6: FINANCE, REFUND & DISPUTE

%% ==========================================

payments{

uuid idPK

uuid order_idFK

decimal amount

varchar status"Enum: PENDING, SUCCESS, FAILED"

varchar payment_method"Enum: MO, COD, CASH"

varchar gateway_transaction_id"For MO"

text shipper_note"For COD"

decimal cash_tendered"For CASH"

decimal change_due"For CASH"

timestamp created_at

}

refunds{

uuid idPK

uuid payment_idFK

decimal amount

varchar reason

varchar status"Enum: PENDING, APPROVED, PROCESSED"

timestamp processed_at

}

invoices{

uuid idPK

uuid order_idFK

varchar invoice_code"UNIQUE"

decimal total_amount

varchar pdf_url

timestamp issued_at

}

disputes{

uuid idPK

uuid order_idFK

uuid handled_by_sales_idFK"Nullable"

text description

varchar status"Enum: OPEN, IN_REVIEW, RESOLVED"

text resolution

json evidence_urls"Array of strings"

timestamp created_at

}

orders||--o{payments: "has"

orders||--o|invoices: "generates"

orders||--o|disputes: "involves"

staffs||--o{disputes: "resolves"

payments||--o|refunds: "triggers"

%% ==========================================

%% NHÓM 7: LOGISTICS (3PL)

%% ==========================================

shipping_providers{

int idPK

varchar provider_name

varchar api_endpoint

boolean is_active

}

waybills{

uuid idPK

uuid order_idFK

int provider_idFK

varchar tracking_code"UNIQUE"

varchar status

date estimated_delivery

}

addresses{

uuid idPK

uuid customer_idFK

varchar label

varchar street

varchar city

boolean is_default

}

customers||--o{addresses: "saves"

orders||--o|waybills: "tracks_via"

shipping_providers||--o{waybills: "provides"

%% ==========================================

%% NHÓM 8: MARKETING & CRM

%% ==========================================

campaigns{

int idPK

varchar name

boolean is_active

}

vouchers{

uuid idPK

int campaign_idFK

varchar code"UNIQUE"

varchar discount_type"Enum: PERCENTAGE, FIXED"

decimal discount_value

decimal max_discount_amount

decimal min_order_amount

int usage_limit

int used_count

timestamp valid_until

boolean is_active

}

loyalty_accounts{

uuid idPK

uuid customer_idFK

int points

varchar tier

}

loyalty_transactions{

uuid idPK

uuid account_idFK

varchar type

int points

timestamp created_at

}

campaigns||--o{vouchers: "issues"

vouchers||--o{orders: "applied_to"

customers||--||loyalty_accounts: "owns"

loyalty_accounts||--o{loyalty_transactions: "logs"

%% ==========================================

%% NHÓM 9: NOTIFICATION & CMS

%% ==========================================

notifications{

uuid idPK

varchar title

text body

varchar type"SYSTEM, PERSONAL"

varchar channel"EMAIL, PUSH"

varchar reference_type

varchar reference_id

timestamp created_at

}

user_notifications{

uuid user_idPK, FK

uuid notification_idPK, FK

boolean is_read

timestamp read_at

}

blog_posts{

uuid idPK

uuid author_idFK"Staff"

varchar title

varchar slug"UNIQUE"

text content

timestamp published_at

}

users||--o{user_notifications: "receives"

notifications||--o{user_notifications: "dispatched_to"

staffs||--o{blog_posts: "writes"
