export class ChatHttpError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.name = 'ChatHttpError';
    this.statusCode = statusCode;
  }
}

export const isChatHttpError = (error: unknown): error is ChatHttpError => {
  return error instanceof ChatHttpError;
};
