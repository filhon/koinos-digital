"use client";

import {
  createCheckoutSession,
  createBillingPortalSession,
} from "@/actions/billing";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SUBSCRIPTION_PLANS } from "@/lib/stripe/config";
import { toast } from "sonner";

export default function PlanPanel({
  churchId,
  subscription,
}: {
  churchId: string;
  subscription: Record<string, unknown> | null;
}) {
  const handleUpgrade = async (
    planKey: "gratis" | "crescimento" | "igreja" | "catedral"
  ) => {
    try {
      const res = await createCheckoutSession(churchId, planKey);
      if (res.url) {
        window.location.href = res.url;
      }
    } catch (e: unknown) {
      toast.error("Erro ao abrir checkout", {
        description: (e as Error).message,
      });
    }
  };

  const handleManage = async () => {
    try {
      const res = await createBillingPortalSession(churchId);
      if (res.url) {
        window.location.href = res.url;
      }
    } catch (e: unknown) {
      toast.error("Erro ao abrir portal de gerencimento", {
        description: (e as Error).message,
      });
    }
  };

  const currentPlan = subscription?.plan || "gratis";
  const status = subscription?.status;

  const statusLabel =
    (
      {
        active: "Ativo",
        trialing: "Período de testes",
        past_due: "Pagamento em atraso",
        canceled: "Cancelado",
        unpaid: "Não pago",
      } as Record<string, string>
    )[status as string] || (status as string);

  return (
    <div className="space-y-6">
      {status === "past_due" && (
        <div className="bg-red-50 text-red-600 border border-red-200 dark:bg-red-900/30 dark:border-red-900/50 dark:text-red-400 p-4 rounded-md flex items-center justify-between">
          <div>
            <strong>Atenção:</strong> Seu último pagamento falhou. Atualize os
            dados para não perder o acesso.
          </div>
          <Button variant="destructive" size="sm" onClick={handleManage}>
            Resolver Pendência
          </Button>
        </div>
      )}

      <div className="bg-muted p-4 rounded-lg flex justify-between items-center">
        <div>
          <span className="text-sm text-muted-foreground mr-2">
            Status da assinatura:
          </span>
          {statusLabel ? (
            <span className="font-semibold text-primary">{statusLabel}</span>
          ) : (
            <span className="font-semibold text-muted-foreground">
              Sem assinatura ativa (Grátis)
            </span>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {Object.entries(SUBSCRIPTION_PLANS).map(([key, plan]) => {
          const isCurrent = currentPlan === key;
          return (
            <Card
              key={key}
              className={isCurrent ? "border-primary ring-1 ring-primary" : ""}
            >
              <CardHeader>
                <CardTitle className="capitalize">{key}</CardTitle>
                <CardDescription>
                  Até {plan.limit === Infinity ? "Ilimitado" : plan.limit}{" "}
                  membros
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {!plan.priceId ? "Grátis" : "Pago"}
                </div>
              </CardContent>
              <CardFooter>
                {isCurrent &&
                subscription?.status &&
                ["active", "trialing"].includes(
                  subscription.status as string
                ) ? (
                  <Button onClick={handleManage} className="w-full">
                    Gerenciar Assinatura
                  </Button>
                ) : isCurrent ? (
                  <Button disabled className="w-full">
                    Plano Atual
                  </Button>
                ) : !plan.priceId ? (
                  <Button variant="outline" className="w-full" disabled>
                    Downgrade (Não automático)
                  </Button>
                ) : (
                  <Button
                    onClick={() =>
                      handleUpgrade(
                        key as "gratis" | "crescimento" | "igreja" | "catedral"
                      )
                    }
                    className="w-full"
                  >
                    Assinar
                  </Button>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
