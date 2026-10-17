import Link from "next/link";
import { getModules, getModuleBySlug } from "@/content/loader";
import { PracticeSession } from "@/components/practice/PracticeSession";

export function generateStaticParams() {
  return getModules().map((m) => ({ moduleSlug: m.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ moduleSlug: string }>;
}) {
  const { moduleSlug } = await params;
  const m = getModuleBySlug(moduleSlug);
  return {
    title: `Práctica: ${m.title} — Matemática UNSE 2027`,
    description: `Sesión interactiva de práctica guiada para ${m.title}. Ejercicios generados con comprobación inmediata y resolución paso a paso.`,
  };
}

export default async function ModulePracticePage({
  params,
}: {
  params: Promise<{ moduleSlug: string }>;
}) {
  const { moduleSlug } = await params;
  const m = getModuleBySlug(moduleSlug);

  return (
    <div className="space-y-6">
      <nav aria-label="Navegación de migas de pan" className="text-xs text-muted">
        <ol className="flex items-center gap-1.5">
          <li>
            <Link href="/" className="hover:text-foreground">
              Inicio
            </Link>
          </li>
          <li>/</li>
          <li>
            <Link href={`/modulos/${m.slug}`} className="hover:text-foreground">
              {m.title}
            </Link>
          </li>
          <li>/</li>
          <li className="font-semibold text-accent" aria-current="page">
            Práctica guiada
          </li>
        </ol>
      </nav>

      <PracticeSession module={m} />
    </div>
  );
}
