/** Remove caracteres não numéricos */
function digits(value: string): string {
  return value.replace(/\D/g, "");
}

/** Valida CPF usando algoritmo dos dígitos verificadores */
export function validateCPF(value: string): boolean {
  const cpf = digits(value);

  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false; // sequências inválidas (111.111.111-11)

  const calc = (end: number): number => {
    let sum = 0;
    for (let i = 0; i < end; i++) {
      sum += parseInt(cpf[i]) * (end + 1 - i);
    }
    const rem = (sum * 10) % 11;
    return rem === 10 || rem === 11 ? 0 : rem;
  };

  return calc(9) === parseInt(cpf[9]) && calc(10) === parseInt(cpf[10]);
}

/** Formata CPF para exibição: 000.000.000-00 */
export function formatCPF(value: string): string {
  const cpf = digits(value).slice(0, 11);
  if (cpf.length <= 3) return cpf;
  if (cpf.length <= 6) return `${cpf.slice(0, 3)}.${cpf.slice(3)}`;
  if (cpf.length <= 9)
    return `${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(6)}`;
  return `${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-${cpf.slice(9)}`;
}
