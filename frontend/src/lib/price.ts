export const parseDecimalPrice = (value: unknown): number => {
  if (value == null) return 0;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") return parseFloat(value) || 0;
  if (typeof value === "object" && value !== null && "$numberDecimal" in value) {
    return parseFloat((value as { $numberDecimal: string }).$numberDecimal) || 0;
  }
  return parseFloat(String(value)) || 0;
};
