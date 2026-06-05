import { z } from 'zod';
import { AI_TOOL_NAMES } from './tool.types.js';

const toolNameSchema = z.enum(AI_TOOL_NAMES);

export const handoffToStaffArgumentsSchema = z
  .object({
    reason: z.string().trim().min(1).max(120).optional(),
  })
  .strict();

export const searchProductsArgumentsSchema = z
  .object({
    keyword: z.string().trim().min(1).max(120),
    filters: z
      .object({
        categorySlug: z.string().trim().min(1).max(80).optional(),
        color: z.string().trim().min(1).max(40).optional(),
        style: z.string().trim().min(1).max(40).optional(),
        minPrice: z.number().nonnegative().optional(),
        maxPrice: z.number().nonnegative().optional(),
        sortBy: z.enum(['price_asc', 'price_desc', 'sold']).optional(),
      })
      .strict()
      .optional(),
  })
  .strict();

export const getProductDetailArgumentsSchema = z
  .object({
    productId: z.string().trim().min(1).max(120),
  })
  .strict();

export const checkOrderStatusArgumentsSchema = z
  .object({
    orderCode: z.string().trim().min(2).max(64),
  })
  .strict();

export const toolCallProtocolSchema = z.discriminatedUnion('type', [
  z
    .object({
      type: z.literal('tool_call'),
      toolName: toolNameSchema,
      arguments: z.record(z.string(), z.unknown()),
    })
    .strict(),
  z
    .object({
      type: z.literal('no_tool'),
      reason: z.string().trim().min(1).max(120),
    })
    .strict(),
  z
    .object({
      type: z.literal('handoff'),
      reason: z.string().trim().min(1).max(120),
    })
    .strict(),
]);

export type ToolCallProtocol = z.infer<typeof toolCallProtocolSchema>;
