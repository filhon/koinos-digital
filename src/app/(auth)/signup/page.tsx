import Link from "next/link";
import { Church, Users, ChevronRight } from "lucide-react";

export const metadata = {
  title: "Criar conta · Koinos",
};

export default function SignupPage() {
  return (
    <div className="w-full">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
          Como você quer entrar?
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Escolha o caminho certo para o seu perfil.
        </p>
      </div>

      <div className="space-y-4">
        <Link
          href="/signup/igreja"
          className="group flex items-start gap-4 rounded-2xl border border-gray-200 bg-white p-5 transition-all hover:border-gray-900 hover:shadow-sm"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gray-100 transition-colors group-hover:bg-gray-900">
            <Church className="h-5 w-5 text-gray-600 transition-colors group-hover:text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900">
              Cadastrar minha Igreja
            </p>
            <p className="mt-0.5 text-xs text-gray-500 leading-relaxed">
              Sou pastor ou líder e quero cadastrar minha igreja no Koinos pela
              primeira vez.
            </p>
          </div>
          <ChevronRight className="mt-3 h-4 w-4 shrink-0 text-gray-400 transition-colors group-hover:text-gray-900" />
        </Link>

        <Link
          href="/signup/membro"
          className="group flex items-start gap-4 rounded-2xl border border-gray-200 bg-white p-5 transition-all hover:border-gray-900 hover:shadow-sm"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gray-100 transition-colors group-hover:bg-gray-900">
            <Users className="h-5 w-5 text-gray-600 transition-colors group-hover:text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900">
              Entrar como Membro
            </p>
            <p className="mt-0.5 text-xs text-gray-500 leading-relaxed">
              Minha igreja já usa o Koinos e recebi um link de convite da
              liderança.
            </p>
          </div>
          <ChevronRight className="mt-3 h-4 w-4 shrink-0 text-gray-400 transition-colors group-hover:text-gray-900" />
        </Link>
      </div>

      <p className="mt-6 text-center text-sm text-gray-500">
        Já tem uma conta?{" "}
        <Link
          href="/login"
          className="font-medium text-gray-900 hover:underline"
        >
          Fazer login
        </Link>
      </p>
    </div>
  );
}
