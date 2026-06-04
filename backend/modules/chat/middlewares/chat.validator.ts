import mongoose from 'mongoose';
import { body, param, query } from 'express-validator';
import {
  CHAT_CONVERSATION_STATUSES,
  MAX_MESSAGE_CONTENT_LENGTH,
  MAX_MESSAGE_PAGE_SIZE,
} from '../constants/chat.constants.js';
import { handleValidationErrors } from '../../../shared/middlewares/handleValidation.js';

const isObjectId = (val: string) => {
  if (!mongoose.Types.ObjectId.isValid(val)) throw new Error('ID không hợp lệ');
  return true;
};

export const validateConversationIdParam = [
  param('conversationId').custom(isObjectId).withMessage('conversationId không hợp lệ'),
  handleValidationErrors,
];

export const validateMessagesQuery = [
  query('before').optional().custom(isObjectId).withMessage('before phải là messageId hợp lệ'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: MAX_MESSAGE_PAGE_SIZE })
    .withMessage(`limit phải từ 1 đến ${MAX_MESSAGE_PAGE_SIZE}`)
    .toInt(),
  handleValidationErrors,
];

export const validateSendMessage = [
  body('content')
    .isString()
    .withMessage('content phải là chuỗi')
    .trim()
    .notEmpty()
    .withMessage('content không được rỗng')
    .isLength({ max: MAX_MESSAGE_CONTENT_LENGTH })
    .withMessage(`content tối đa ${MAX_MESSAGE_CONTENT_LENGTH} ký tự`),
  body('clientMessageId')
    .optional()
    .isString()
    .withMessage('clientMessageId phải là chuỗi')
    .trim()
    .isLength({ min: 1, max: 120 })
    .withMessage('clientMessageId phải từ 1 đến 120 ký tự'),
  handleValidationErrors,
];

export const validateConversationListQuery = [
  query('status')
    .optional()
    .isIn(CHAT_CONVERSATION_STATUSES)
    .withMessage(`status phải là ${CHAT_CONVERSATION_STATUSES.join(', ')}`),
  query('search').optional().isString().trim().isLength({ max: 120 }),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: MAX_MESSAGE_PAGE_SIZE })
    .withMessage(`limit phải từ 1 đến ${MAX_MESSAGE_PAGE_SIZE}`)
    .toInt(),
  handleValidationErrors,
];

export const validateStatusPatch = [
  body('status')
    .isString()
    .withMessage('status là bắt buộc')
    .isIn(['staff_handling', 'resolved', 'closed'])
    .withMessage('status chỉ được là staff_handling, resolved hoặc closed'),
  handleValidationErrors,
];
