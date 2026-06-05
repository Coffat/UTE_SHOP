import type { AiToolExecutionResult, AiToolHandler } from './tool.types.js';

interface HandoffToStaffArguments {
  reason?: string;
}

export const handoffToStaffTool: AiToolHandler<HandoffToStaffArguments> = {
  name: 'handoffToStaff',
  async execute(args): Promise<AiToolExecutionResult> {
    const reason = args.reason?.trim() || 'model_requested_handoff';
    return {
      toolName: 'handoffToStaff',
      status: 'SUCCESS',
      result: {
        handoffRequested: true,
        handoffReason: reason,
      },
      errorCode: null,
      errorMessage: null,
      handoffReason: reason,
    };
  },
};
