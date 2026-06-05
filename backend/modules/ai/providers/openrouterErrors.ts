export class OpenRouterHttpError extends Error {
  readonly httpStatus: number;

  constructor(httpStatus: number, message: string) {
    super(message);
    this.name = 'OpenRouterHttpError';
    this.httpStatus = httpStatus;
  }
}

export const isOpenRouterRateLimitError = (error: unknown): boolean =>
  error instanceof OpenRouterHttpError && error.httpStatus === 429;
