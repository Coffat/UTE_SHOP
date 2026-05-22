export function getDisplayName(user?: {
  fullName?: string | null;
  name?: string | null;
  email?: string | null;
}): string {
  return (
    user?.fullName?.trim() ||
    user?.name?.trim() ||
    user?.email?.trim() ||
    "User"
  );
}

export function getAvatarInitial(displayName: string): string {
  const ch = displayName.charAt(0);
  return (ch || "U").toUpperCase();
}

/** Endpoints storefront (wishlist, v.v.) chỉ dành cho khách hàng. */
export function isStorefrontCustomer(role?: string | null): boolean {
  return role?.toUpperCase() === "CUSTOMER";
}
