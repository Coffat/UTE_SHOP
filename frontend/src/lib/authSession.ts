/** Session hint only — not used for authentication (HttpOnly cookie is the source of truth). */
const SESSION_KEY = "ute_auth_session";

export function setAuthSessionFlag(): void {
  sessionStorage.setItem(SESSION_KEY, "1");
}

export function clearAuthSessionFlag(): void {
  sessionStorage.removeItem(SESSION_KEY);
}

export function hasAuthSessionFlag(): boolean {
  return sessionStorage.getItem(SESSION_KEY) === "1";
}
