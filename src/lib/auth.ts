export const ADMIN_SESSION_COOKIE = "bnb_admin_session";
export const ADMIN_PASSWORD_ENV = "ADMIN_LOGIN_PASSWORD";
export const ADMIN_SESSION_SECRET_ENV = "ADMIN_SESSION_SECRET";

export function getAdminPassword() {
  return process.env[ADMIN_PASSWORD_ENV] ?? "";
}

export function getAdminSessionValue() {
  return process.env[ADMIN_SESSION_SECRET_ENV] ?? getAdminPassword();
}

export function isAuthenticated(sessionValue?: string | null) {
  const expectedSession = getAdminSessionValue();

  return Boolean(expectedSession) && sessionValue === expectedSession;
}

export function getSafeRedirectPath(nextPath?: string | null) {
  if (!nextPath || !nextPath.startsWith("/")) {
    return "/";
  }

  if (nextPath.startsWith("//")) {
    return "/";
  }

  if (nextPath.startsWith("/login")) {
    return "/";
  }

  return nextPath;
}
