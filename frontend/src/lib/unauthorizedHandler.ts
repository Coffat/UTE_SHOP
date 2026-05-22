type UnauthorizedHandler = () => void;

let handler: UnauthorizedHandler | null = null;

export function registerUnauthorizedHandler(fn: UnauthorizedHandler): void {
  handler = fn;
}

export function runUnauthorizedHandler(): void {
  handler?.();
}
