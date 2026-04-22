import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  ADMIN_SESSION_COOKIE,
  getAdminPassword,
  getAdminSessionValue,
  getSafeRedirectPath,
  isAuthenticated,
} from "@/lib/auth";

type LoginPageProps = {
  searchParams?: Promise<{
    error?: string;
    next?: string;
  }>;
};

async function loginAction(formData: FormData) {
  "use server";

  const password = String(formData.get("password") ?? "");
  const nextPath = getSafeRedirectPath(String(formData.get("next") ?? "/"));
  const expectedPassword = getAdminPassword();
  const sessionValue = getAdminSessionValue();

  if (!expectedPassword || !sessionValue || password !== expectedPassword) {
    redirect(`/login?error=1&next=${encodeURIComponent(nextPath)}`);
  }

  const cookieStore = await cookies();

  cookieStore.set(ADMIN_SESSION_COOKIE, sessionValue, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });

  redirect(nextPath);
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = (await searchParams) ?? {};
  const nextPath = getSafeRedirectPath(params.next);
  const showError = params.error === "1";
  const cookieStore = await cookies();

  if (isAuthenticated(cookieStore.get(ADMIN_SESSION_COOKIE)?.value)) {
    redirect("/");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      <div className="w-full max-w-md rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            BrandnBeauty
          </div>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
            Admin Login
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Sign in to access the admin panel.
          </p>
        </div>

        {!getAdminPassword() && (
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            Set the <code>ADMIN_LOGIN_PASSWORD</code> environment variable before
            logging in.
          </div>
        )}

        {showError && (
          <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
            Incorrect password. Please try again.
          </div>
        )}

        <form action={loginAction} className="mt-6 space-y-4">
          <input type="hidden" name="next" value={nextPath} />

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400"
              placeholder="Enter admin password"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-2xl bg-[#5E7F85] px-5 py-3 text-sm font-semibold text-white shadow-sm"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}
