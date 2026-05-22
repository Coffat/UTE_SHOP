export const BLOG_STAFF_ROLES = [
  'ADMIN',
  'SALES',
  'STORE_STAFF',
  'WAREHOUSE_STAFF',
] as const;

export const isBlogStaffRole = (role: string): boolean =>
  (BLOG_STAFF_ROLES as readonly string[]).includes(role);
