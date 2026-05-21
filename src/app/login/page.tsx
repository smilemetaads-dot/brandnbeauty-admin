import { LoginForm } from "@/features/auth/LoginForm";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-stone-50 px-4 py-10 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-md items-center">
        <section className="w-full overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="bg-[#527B86] px-6 py-8 text-white">
            <div className="text-xs font-bold uppercase tracking-[0.24em] text-white/70">
              Admin Access
            </div>
            <h1 className="mt-3 text-3xl font-black tracking-tight">
              BrandnBeauty Admin
            </h1>
            <p className="mt-2 text-sm font-medium text-white/80">
              Sign in to continue
            </p>
          </div>

          <div className="p-6">
            <LoginForm />
            <div className="mt-5 rounded-2xl bg-stone-50 px-4 py-3 text-xs font-semibold leading-5 text-slate-500">
              Admin route protection and role enforcement are not connected
              yet. This page only signs in with Supabase Auth.
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
