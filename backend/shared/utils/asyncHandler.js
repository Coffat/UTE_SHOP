/**
 * asyncHandler – bọc async controller để tự động catch lỗi
 * và chuyển về next(err) thay vì try/catch trong từng controller.
 *
 * Sử dụng:
 *   router.get('/route', asyncHandler(myController))
 *
 * @param {Function} fn - async Express handler (req, res, next)
 * @returns {Function} Express middleware
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default asyncHandler;
