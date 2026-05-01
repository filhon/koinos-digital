import { NextRequest, NextResponse } from "next/server";
import React from "react";
import { getUser } from "@/lib/auth/session";
import { getFinancialReport } from "@/actions/financeiro";
import { FinancialReportPDF } from "./pdf-document";
import type {
  FinancialReportInput,
  ReportPeriod,
} from "@/lib/validators/financeiro";

// Importação compatível com o padrão `export = ReactPDF` da lib
// eslint-disable-next-line @typescript-eslint/no-require-imports
const ReactPDF = require("@react-pdf/renderer") as {
  renderToBuffer: (element: React.ReactElement) => Promise<Buffer>;
};

const PERIOD_LABELS: Record<ReportPeriod, string> = {
  mes_atual: "Mês Atual",
  trimestre: "Trimestre",
  ano: "Ano Atual",
  personalizado: "Personalizado",
};

export async function GET(request: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const ALLOWED = ["admin", "pastor", "presbítero", "diácono", "tesoureiro"];
  if (!ALLOWED.includes(user.role)) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const period = (searchParams.get("period") as ReportPeriod) ?? "ano";

  const input: FinancialReportInput = {
    period,
    account_id: searchParams.get("account_id") ?? undefined,
    date_from: searchParams.get("date_from") ?? undefined,
    date_to: searchParams.get("date_to") ?? undefined,
  };

  const result = await getFinancialReport(input);
  if (!result || !("data" in result) || !result.data) {
    return NextResponse.json(
      { error: "Erro ao gerar relatório." },
      { status: 500 }
    );
  }

  const element = React.createElement(FinancialReportPDF, {
    report: result.data,
    periodLabel: PERIOD_LABELS[period],
  });

  const pdfBuffer = await ReactPDF.renderToBuffer(element);

  return new NextResponse(pdfBuffer as unknown as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="relatorio-financeiro-${period}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
