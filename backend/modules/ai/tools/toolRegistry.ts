import { aiConfig } from '../../../config/ai.js';
import { ChatHttpError } from '../../chat/services/chat.errors.js';
import { checkOrderStatusTool } from './checkOrderStatus.tool.js';
import { getProductDetailTool } from './getProductDetail.tool.js';
import { handoffToStaffTool } from './handoffToStaff.tool.js';
import {
  checkOrderStatusArgumentsSchema,
  getProductDetailArgumentsSchema,
  handoffToStaffArgumentsSchema,
  searchProductsArgumentsSchema,
} from './toolSchemas.js';
import { searchProductsTool } from './searchProducts.tool.js';
import type {
  AiPass1Decision,
  AiToolExecutionContext,
  AiToolExecutionResult,
  AiToolHandler,
  AiToolName,
} from './tool.types.js';

const toolMap = new Map<AiToolName, AiToolHandler<any>>([
  ['handoffToStaff', handoffToStaffTool],
  ['searchProducts', searchProductsTool],
  ['getProductDetail', getProductDetailTool],
  ['checkOrderStatus', checkOrderStatusTool],
]);

const validateArguments = (toolName: AiToolName, rawArguments: Record<string, unknown>) => {
  if (toolName === 'handoffToStaff') return handoffToStaffArgumentsSchema.safeParse(rawArguments);
  if (toolName === 'searchProducts') return searchProductsArgumentsSchema.safeParse(rawArguments);
  if (toolName === 'getProductDetail') return getProductDetailArgumentsSchema.safeParse(rawArguments);
  if (toolName === 'checkOrderStatus') return checkOrderStatusArgumentsSchema.safeParse(rawArguments);
  return { success: false as const };
};

const isToolEnabled = (toolName: AiToolName) => aiConfig.enabledToolNames.includes(toolName);

const deniedResult = (toolName: AiToolName, errorCode: string, errorMessage: string): AiToolExecutionResult => ({
  toolName,
  status: 'DENIED',
  result: null,
  errorCode,
  errorMessage,
  handoffReason: 'tool_denied',
});

export const executeToolFromDecision = async (
  decision: AiPass1Decision,
  context: AiToolExecutionContext
): Promise<AiToolExecutionResult> => {
  if (decision.type !== 'tool_call') {
    throw new ChatHttpError(400, 'Decision does not contain tool_call.');
  }

  if (!isToolEnabled(decision.toolName)) {
    return deniedResult(decision.toolName, 'TOOL_DISABLED', 'Tool hiện chưa được bật trong hệ thống.');
  }

  const argumentValidation = validateArguments(decision.toolName, decision.arguments);
  if (!argumentValidation.success) {
    return {
      toolName: decision.toolName,
      status: 'INVALID_REQUEST',
      result: null,
      errorCode: 'TOOL_ARGUMENT_INVALID',
      errorMessage: 'Đầu vào tool không hợp lệ.',
      handoffReason: 'tool_argument_invalid',
    };
  }

  const tool = toolMap.get(decision.toolName);
  if (!tool) {
    return deniedResult(decision.toolName, 'TOOL_NOT_IMPLEMENTED', 'Tool chưa được hỗ trợ.');
  }

  return tool.execute(argumentValidation.data, context);
};
