import Image from "next/image";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { UpdatePasswordForm } from "./form";

export const metadata = {
  title: "パスワード設定 | hanchan creative",
};

export default async function UpdatePasswordPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-[440px] rounded-2xl border border-border bg-card p-8 shadow-[0_2px_24px_rgba(0,0,0,0.5)] sm:p-10">
        <div className="mb-7 flex flex-col items-center gap-3">
          <Image
            src="/hanchan-logo.png"
            alt="hanchan creative"
            width={420}
            height={360}
            priority
            className="logo-screen h-auto w-[170px] object-contain"
          />
          <p className="text-center text-[14px] leading-relaxed text-muted-foreground">
            <span className="font-medium text-foreground">{user.email}</span>
            <br />
            のパスワードを設定します。
          </p>
        </div>

        <UpdatePasswordForm />
      </div>
    </main>
  );
}
