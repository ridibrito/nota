/**
 * Sistema de Arredondamento ABNT 5891 para cálculos fiscais
 * Implementa as 4 regras específicas do ISSNet DF
 * 
 * Regras ABNT 5891:
 * 2.1: Dígito inferior a 5 -> trunca
 * 2.2: Dígito superior a 5 ou 5 seguido de dígitos diferentes de zero -> arredonda para cima
 * 2.3: Dígito igual a 5 seguido apenas de zeros E dígito anterior ímpar -> arredonda para cima
 * 2.4: Dígito igual a 5 seguido apenas de zeros E dígito anterior par -> mantém (trunca)
 */

import { Decimal } from 'decimal.js';

/**
 * Arredonda um valor seguindo as regras ABNT 5891
 * Mantém 2 casas decimais, calcula com até 6 casas
 * 
 * @param value - Valor a ser arredondado
 * @returns Valor arredondado com 2 casas decimais
 */
export function roundABNT(value: number): number {
  // Configura Decimal.js para trabalhar com alta precisão
  Decimal.config({ precision: 28 });
  
  // Converte para Decimal para evitar erros de ponto flutuante
  const decimal = new Decimal(value);
  
  // Trabalha com até 6 casas decimais
  const sixDecimal = decimal.toDecimalPlaces(6, Decimal.ROUND_HALF_EVEN);
  
  // Aplica as regras ABNT para arredondamento para 2 casas
  return roundTo2_ABNT(sixDecimal);
}

/**
 * Aplica as regras ABNT 5891 para arredondamento para 2 casas decimais
 */
function roundTo2_ABNT(decimal: Decimal): number {
  // Se já tem 2 casas ou menos, retorna como está
  if (decimal.decimalPlaces() <= 2) {
    return decimal.toNumber();
  }
  
  // Converte para string para análise dos dígitos
  const str = decimal.toFixed();
  const parts = str.split('.');
  
  if (parts.length === 1) {
    // Número inteiro
    return decimal.toNumber();
  }
  
  const integerPart = parts[0];
  const decimalPart = parts[1];
  
  // Se tem exatamente 2 casas decimais, retorna como está
  if (decimalPart.length <= 2) {
    return decimal.toNumber();
  }
  
  // Pega os primeiros 2 dígitos decimais
  const firstTwoDecimals = decimalPart.substring(0, 2);
  const thirdDigit = parseInt(decimalPart[2], 10);
  const remainingDigits = decimalPart.substring(3);
  
  // Reconstrói o número com 2 casas decimais
  const baseValue = new Decimal(`${integerPart}.${firstTwoDecimals}`);
  
  // Aplica as regras ABNT
  if (thirdDigit < 5) {
    // Regra 2.1: Dígito inferior a 5 -> trunca
    return baseValue.toNumber();
  }
  
  if (thirdDigit > 5) {
    // Regra 2.2: Dígito superior a 5 -> arredonda para cima
    return baseValue.plus(0.01).toNumber();
  }
  
  // thirdDigit === 5
  const hasNonZeroAfter = remainingDigits.split('').some(digit => digit !== '0');
  
  if (hasNonZeroAfter) {
    // Regra 2.2: 5 seguido de dígitos diferentes de zero -> arredonda para cima
    return baseValue.plus(0.01).toNumber();
  }
  
  // 5 seguido apenas de zeros - aplica regras 2.3 e 2.4
  const lastDigit = parseInt(firstTwoDecimals[1], 10);
  
  if (lastDigit % 2 === 1) {
    // Regra 2.3: Dígito anterior ímpar -> arredonda para cima
    return baseValue.plus(0.01).toNumber();
  } else {
    // Regra 2.4: Dígito anterior par -> mantém (trunca)
    return baseValue.toNumber();
  }
}

/**
 * Calcula o ISS aplicando arredondamento ABNT
 */
export function calculateISS(baseValue: number, rate: number): number {
  // Calcula com precisão estendida
  const decimal = new Decimal(baseValue).mul(rate);
  return roundABNT(decimal.toNumber());
}

/**
 * Calcula o valor líquido (base - deduções - ISS)
 */
export function calculateNetValue(
  baseValue: number,
  deductions: number,
  issValue: number
): number {
  const result = new Decimal(baseValue)
    .minus(deductions)
    .minus(issValue);
  
  return roundABNT(result.toNumber());
}

/**
 * Calcula todos os valores fiscais de uma vez
 */
export function calculateTaxValues(
  baseValue: number,
  issRate: number,
  deductions: number = 0
) {
  const issValue = calculateISS(baseValue, issRate);
  const netValue = calculateNetValue(baseValue, deductions, issValue);
  
  return {
    base_value: roundABNT(baseValue),
    iss_rate: issRate,
    iss_value: issValue,
    deductions: roundABNT(deductions),
    net_value: netValue
  };
}

/**
 * Exemplos de teste das regras ABNT
 */
export const ABNT_TEST_CASES = [
  // Regra 2.1: inferior a 5 -> trunca
  { input: 86.064, expected: 86.06, rule: '2.1' },
  { input: 123.451, expected: 123.45, rule: '2.1' },
  
  // Regra 2.2: superior a 5 ou 5 com dígitos != 0 -> arredonda para cima
  { input: 86.066, expected: 86.07, rule: '2.2' },
  { input: 123.456, expected: 123.46, rule: '2.2' },
  { input: 309.7501, expected: 309.76, rule: '2.2' }, // 5 seguido de 01
  
  // Regra 2.3: 5 seguido de zeros E dígito anterior ímpar -> arredonda para cima
  { input: 86.065, expected: 86.07, rule: '2.3' }, // último dígito 5 (ímpar)
  { input: 123.455, expected: 123.46, rule: '2.3' }, // último dígito 5 (ímpar)
  
  // Regra 2.4: 5 seguido de zeros E dígito anterior par -> mantém
  { input: 86.045, expected: 86.04, rule: '2.4' }, // último dígito 4 (par)
  { input: 123.425, expected: 123.42, rule: '2.4' }, // último dígito 2 (par)
  
  // Casos específicos mencionados no PRD
  { input: 86.06 * 0.05, expected: 4.30, rule: 'PRD example 1' }, // 4.303 -> 4.30
  { input: 309.75 * 0.05, expected: 15.49, rule: 'PRD example 2' } // 15.4875 -> 15.49
];
