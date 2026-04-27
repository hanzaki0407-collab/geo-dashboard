import Image from "next/image";
import { LoginForm } from "./login-form";

export const metadata = {
  title: "サインイン | HANCHAN creative",
};

export default function LoginPage() {
  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-neutral-100 px-4 py-12">
      <div className="w-full max-w-[440px] rounded-2xl bg-white p-8 shadow-[0_2px_24px_rgba(0,0,0,0.06)] sm:p-10">
        <div className="mb-7 flex flex-col items-center gap-3">
          <Image
            src="/hanchan-creative-logo.png"
            alt="HANCHAN creative"
            width={300}
            height={96}
            priority
            className="h-16 w-auto object-contain"
          />
          <p className="text-center text-[14px] leading-relaxed text-neutral-700">
            仕事用のメールアドレスを使用して
            <br />
            サインインします。
          </p>
        </div>

        <LoginForm />
      </div>
    </main>
  );
}
