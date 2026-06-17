"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

const LOGIN_TIMEOUT_MS = 15_000;
const timeoutErrorMessage = "LOGIN_TIMEOUT";
const AUTH_ENDPOINT =
  "http://localhost/BrandnBeauty/brandnbeauty-backend/php/auth.php";

export function LoginForm() {
  const router = useRouter();
  const [clientStatus, setClientStatus] = useState("");
  const [email, setEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [password, setPassword] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");

    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setErrorMessage("Email is required.");
      return;
    }

    if (!password) {
      setErrorMessage("Password is required.");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters.");
      return;
    }

    setIsSubmitting(true);

    try {
      setClientStatus("Checking local admin credentials...");
      const timeoutPromise = new Promise<never>((_, reject) => {
        window.setTimeout(
          () => reject(new Error(timeoutErrorMessage)),
          LOGIN_TIMEOUT_MS,
        );
      });
      const response = await Promise.race([
        fetch(AUTH_ENDPOINT, {
          body: JSON.stringify({
            action: "admin_login",
            email: trimmedEmail,
            password,
          }),
          headers: {
            "Content-Type": "application/json",
          },
          method: "POST",
        }),
        timeoutPromise,
      ]);
      const data = (await response.json().catch(() => null)) as {
        message?: string;
        success?: boolean;
        token?: string;
        user?: unknown;
      } | null;

      if (!response.ok || !data?.success || !data.token) {
        setErrorMessage(data?.message ?? "Unable to sign in with those credentials.");
        return;
      }

      window.localStorage.setItem("brandnbeauty_admin_token", data.token);
      window.localStorage.setItem(
        "brandnbeauty_admin_user",
        JSON.stringify(data.user ?? { email: trimmedEmail }),
      );
      document.cookie = `brandnbeauty_admin_token=${encodeURIComponent(
        data.token,
      )}; path=/; max-age=86400; SameSite=Lax`;
      setClientStatus("Local admin session created.");
      router.replace("/");
      router.refresh();
    } catch (error) {
      if (error instanceof Error && error.message === timeoutErrorMessage) {
        setErrorMessage("Sign in timed out. Check your connection and try again.");
        return;
      }

      setClientStatus("Local auth endpoint not reachable.");
      setErrorMessage("Sign in could not start. Check local PHP backend.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <label
          className="block text-sm font-bold text-slate-700"
          htmlFor="email"
        >
          Email
        </label>
        <input
          autoComplete="email"
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-950 outline-none transition focus:border-[#527B86] focus:ring-4 focus:ring-[#527B86]/10"
          id="email"
          name="email"
          onChange={(event) => setEmail(event.target.value)}
          placeholder="admin@example.com"
          required
          type="email"
          value={email}
        />
      </div>

      <div className="space-y-2">
        <label
          className="block text-sm font-bold text-slate-700"
          htmlFor="password"
        >
          Password
        </label>
        <input
          autoComplete="current-password"
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-950 outline-none transition focus:border-[#527B86] focus:ring-4 focus:ring-[#527B86]/10"
          id="password"
          name="password"
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Enter password"
          required
          type="password"
          value={password}
        />
      </div>

      {errorMessage ? (
        <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          {errorMessage}
        </div>
      ) : null}

      {clientStatus ? (
        <div className="rounded-2xl bg-stone-50 px-4 py-3 text-xs font-semibold text-slate-500">
          {clientStatus}
        </div>
      ) : null}

      <button
        className="w-full rounded-2xl bg-[#527B86] px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-[#466b74] disabled:cursor-not-allowed disabled:bg-slate-300"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
