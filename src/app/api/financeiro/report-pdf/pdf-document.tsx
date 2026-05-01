import ReactPDF from "@react-pdf/renderer";
import type { FinancialReport } from "@/lib/validators/financeiro";

const { Document, Page, Text, View, StyleSheet } = ReactPDF;

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    padding: 40,
    backgroundColor: "#ffffff",
    color: "#1a1a2e",
  },
  header: {
    marginBottom: 24,
    borderBottom: "2pt solid #2a9d8f",
    paddingBottom: 12,
  },
  title: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    color: "#264653",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 9,
    color: "#6b7280",
  },
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#264653",
    marginBottom: 8,
    paddingBottom: 4,
    borderBottom: "1pt solid #e5e7eb",
  },
  kpiRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
  },
  kpiCard: {
    flex: 1,
    padding: 10,
    borderRadius: 4,
    backgroundColor: "#f9fafb",
    border: "1pt solid #e5e7eb",
  },
  kpiLabel: {
    fontSize: 7,
    color: "#6b7280",
    marginBottom: 3,
    textTransform: "uppercase",
  },
  kpiValueGreen: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: "#2a9d8f",
  },
  kpiValueRed: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: "#e76f51",
  },
  kpiValueNeutral: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: "#264653",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f3f4f6",
    padding: "5 6",
    borderRadius: 3,
    marginBottom: 2,
  },
  tableRow: {
    flexDirection: "row",
    padding: "4 6",
    borderBottom: "0.5pt solid #f3f4f6",
  },
  tableRowAlt: {
    flexDirection: "row",
    padding: "4 6",
    borderBottom: "0.5pt solid #f3f4f6",
    backgroundColor: "#fafafa",
  },
  colXs: { width: "10%", fontSize: 9 },
  colSm: { width: "20%", fontSize: 9 },
  colMd: { width: "30%", fontSize: 9 },
  colLg: { width: "40%", fontSize: 9 },
  colNum: { width: "25%", fontSize: 9, textAlign: "right" },
  headerText: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#374151",
  },
  barRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
    gap: 6,
  },
  barLabel: {
    width: 80,
    fontSize: 9,
    color: "#374151",
  },
  barBg: {
    flex: 1,
    height: 10,
    backgroundColor: "#f3f4f6",
    borderRadius: 5,
  },
  barFill: {
    height: 10,
    borderRadius: 5,
  },
  barValue: {
    width: 72,
    fontSize: 9,
    textAlign: "right",
    color: "#374151",
  },
  monthRow: {
    flexDirection: "row",
    padding: "4 6",
    borderBottom: "0.5pt solid #f3f4f6",
    alignItems: "center",
    gap: 4,
  },
  monthLabel: { width: 52, fontSize: 8, color: "#374151" },
  footer: {
    position: "absolute",
    bottom: 28,
    left: 40,
    right: 40,
    borderTop: "0.5pt solid #e5e7eb",
    paddingTop: 6,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: { fontSize: 7, color: "#9ca3af" },
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

// ─── Component ────────────────────────────────────────────────────────────────

export function FinancialReportPDF({
  report,
  periodLabel,
}: {
  report: FinancialReport;
  periodLabel: string;
}) {
  const maxBar = Math.max(
    ...report.monthly_data.map((m) => Math.max(m.income, m.expenses)),
    1
  );
  const maxCatIncome = Math.max(
    ...report.income_by_category.map((c) => c.value),
    1
  );
  const maxCatExpense = Math.max(
    ...report.expenses_by_category.map((c) => c.value),
    1
  );
  const today = new Date().toLocaleDateString("pt-BR");

  return (
    <Document title="Relatório Financeiro" author="Koinos Digital">
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Relatório Financeiro</Text>
          <Text style={styles.subtitle}>
            {periodLabel} · {report.date_from} a {report.date_to} · Gerado em{" "}
            {today}
          </Text>
        </View>

        {/* KPIs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resumo do Período</Text>
          <View style={styles.kpiRow}>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>Receitas</Text>
              <Text style={styles.kpiValueGreen}>
                {formatBRL(report.totals.income)}
              </Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>Despesas</Text>
              <Text style={styles.kpiValueRed}>
                {formatBRL(report.totals.expenses)}
              </Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>Saldo Líquido</Text>
              <Text
                style={
                  report.totals.net >= 0
                    ? styles.kpiValueGreen
                    : styles.kpiValueRed
                }
              >
                {formatBRL(report.totals.net)}
              </Text>
            </View>
          </View>
        </View>

        {/* Evolução mensal */}
        {report.monthly_data.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Evolução Mensal</Text>
            <View style={styles.tableHeader}>
              <Text style={[styles.monthLabel, styles.headerText]}>Mês</Text>
              <Text style={[{ flex: 1, fontSize: 8 }, styles.headerText]}>
                Entradas / Saídas
              </Text>
            </View>
            {report.monthly_data.map((m) => (
              <View key={m.month} style={styles.monthRow}>
                <Text style={styles.monthLabel}>{m.month}</Text>
                <View style={{ flex: 1, gap: 2 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <View
                      style={[
                        styles.barFill,
                        {
                          width: `${Math.round((m.income / maxBar) * 100)}%`,
                          backgroundColor: "#2a9d8f",
                          height: 6,
                        },
                      ]}
                    />
                    <Text style={{ fontSize: 7, color: "#2a9d8f", width: 65 }}>
                      {formatBRL(m.income)}
                    </Text>
                  </View>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <View
                      style={[
                        styles.barFill,
                        {
                          width: `${Math.round((m.expenses / maxBar) * 100)}%`,
                          backgroundColor: "#e76f51",
                          height: 6,
                        },
                      ]}
                    />
                    <Text style={{ fontSize: 7, color: "#e76f51", width: 65 }}>
                      {formatBRL(m.expenses)}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Receitas por categoria */}
        {report.income_by_category.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Receitas por Categoria</Text>
            {report.income_by_category.map((c) => (
              <View key={c.category} style={styles.barRow}>
                <Text style={styles.barLabel}>{c.category}</Text>
                <View style={styles.barBg}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        width: `${Math.round((c.value / maxCatIncome) * 100)}%`,
                        backgroundColor: "#2a9d8f",
                      },
                    ]}
                  />
                </View>
                <Text style={styles.barValue}>{formatBRL(c.value)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Despesas por categoria */}
        {report.expenses_by_category.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Despesas por Categoria</Text>
            {report.expenses_by_category.map((c) => (
              <View key={c.category} style={styles.barRow}>
                <Text style={styles.barLabel}>{c.category}</Text>
                <View style={styles.barBg}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        width: `${Math.round((c.value / maxCatExpense) * 100)}%`,
                        backgroundColor: "#e76f51",
                      },
                    ]}
                  />
                </View>
                <Text style={styles.barValue}>{formatBRL(c.value)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Top contribuintes */}
        {report.top_contributors.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Top Contribuintes (Restrito — Tesoureiro/Pastor)
            </Text>
            <View style={styles.tableHeader}>
              <Text style={[styles.colXs, styles.headerText]}>#</Text>
              <Text style={[styles.colLg, styles.headerText]}>Membro</Text>
              <Text style={[styles.colNum, styles.headerText]}>Total</Text>
              <Text style={[styles.colSm, styles.headerText]}>%</Text>
            </View>
            {report.top_contributors.map((c, idx) => {
              const pct =
                report.totals.income > 0
                  ? ((c.total / report.totals.income) * 100).toFixed(1)
                  : "0.0";
              return (
                <View
                  key={c.member_id}
                  style={idx % 2 === 0 ? styles.tableRow : styles.tableRowAlt}
                >
                  <Text style={styles.colXs}>{idx + 1}</Text>
                  <Text style={styles.colLg}>{c.member_name}</Text>
                  <Text style={styles.colNum}>{formatBRL(c.total)}</Text>
                  <Text style={styles.colSm}>{pct}%</Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>Koinos Digital — Confidencial</Text>
          <Text
            style={styles.footerText}
            render={({ pageNumber, totalPages }) =>
              `Página ${pageNumber} de ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}
