/**
 * Chuẩn hóa format response API cho toàn bộ hệ thống.
 * Tất cả controller phải dùng helper này thay vì res.json() thủ công.
 */

/**
 * Trả về response thành công
 * @param {import('express').Response} res
 * @param {number} statusCode
 * @param {string} message
 * @param {*} data
 */
export const sendSuccess = (res, statusCode = 200, message = 'Success', data = null) => {
  const payload = { success: true, message };
  if (data !== null) payload.data = data;
  return res.status(statusCode).json(payload);
};

/**
 * Trả về response lỗi
 * @param {import('express').Response} res
 * @param {number} statusCode
 * @param {string} message
 * @param {Array} errors - danh sách lỗi validation (tuỳ chọn)
 */
export const sendError = (res, statusCode = 500, message = 'Internal Server Error', errors = null) => {
  const payload = { success: false, message };
  if (errors) payload.errors = errors;
  return res.status(statusCode).json(payload);
};
