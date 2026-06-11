import { getCustomerOrderStatusByCode } from '../../order/services/order.service.js';
import type { AiToolExecutionResult, AiToolHandler } from './tool.types.js';

interface CheckOrderStatusArguments {
  orderCode: string;
}

const maskOrderReference = (orderCode: string): string => {
  const normalized = orderCode.trim();
  if (normalized.length <= 4) return normalized;
  return `${normalized.slice(0, 2)}***${normalized.slice(-3)}`;
};

export const checkOrderStatusTool: AiToolHandler<CheckOrderStatusArguments> = {
  name: 'checkOrderStatus',
  async execute(args, context): Promise<AiToolExecutionResult> {
    const orderCode = args.orderCode.trim();
    if (!orderCode) {
      return {
        toolName: 'checkOrderStatus',
        status: 'INVALID_REQUEST',
        result: null,
        errorCode: 'INVALID_ORDER_CODE',
        errorMessage: 'Mã đơn hàng không hợp lệ.',
        handoffReason: null,
      };
    }

    const order = await getCustomerOrderStatusByCode(context.actorId, orderCode);
    if (!order) {
      return {
        toolName: 'checkOrderStatus',
        status: 'DENIED',
        result: null,
        errorCode: 'ORDER_NOT_FOUND_OR_FORBIDDEN',
        errorMessage: 'Không tìm thấy đơn hàng phù hợp cho tài khoản hiện tại.',
        handoffReason: null,
      };
    }

    return {
      toolName: 'checkOrderStatus',
      status: 'SUCCESS',
      result: {
        orderReference: maskOrderReference(order.orderCode),
        status: order.status,
        updatedAt: order.updatedAt,
      },
      errorCode: null,
      errorMessage: null,
      handoffReason: null,
    };
  },
};
