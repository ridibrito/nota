import { 
  roundABNT, 
  calculateISS, 
  calculateTaxValues, 
  ABNT_TEST_CASES 
} from '../rounding';

describe('Arredondamento ABNT 5891', () => {
  describe('roundABNT', () => {
    test('deve aplicar todas as regras ABNT corretamente', () => {
      ABNT_TEST_CASES.forEach(({ input, expected, rule }) => {
        const result = roundABNT(input);
        expect(result).toBe(expected);
        expect(result).toHaveProperty('toString');
        console.log(`Regra ${rule}: ${input} -> ${result} (esperado: ${expected})`);
      });
    });

    test('deve manter números com 2 casas ou menos inalterados', () => {
      expect(roundABNT(10)).toBe(10);
      expect(roundABNT(10.5)).toBe(10.5);
      expect(roundABNT(10.55)).toBe(10.55);
    });

    test('deve lidar com números negativos', () => {
      expect(roundABNT(-86.064)).toBe(-86.06);
      expect(roundABNT(-86.066)).toBe(-86.07);
    });

    test('deve lidar com zero', () => {
      expect(roundABNT(0)).toBe(0);
      expect(roundABNT(0.004)).toBe(0);
      expect(roundABNT(0.006)).toBe(0.01);
    });
  });

  describe('calculateISS', () => {
    test('deve calcular ISS com arredondamento ABNT', () => {
      // Exemplo do PRD: 86,06 * 5% = 4,303 → 4,30
      expect(calculateISS(86.06, 0.05)).toBe(4.30);
      
      // Exemplo do PRD: 309,75 * 5% = 15,4875 → 15,49
      expect(calculateISS(309.75, 0.05)).toBe(15.49);
      
      // Casos adicionais
      expect(calculateISS(1000, 0.02)).toBe(20.00);
      expect(calculateISS(1500.50, 0.03)).toBe(45.02); // 45.015 -> 45.02 (regra 2.3)
    });

    test('deve lidar com alíquotas diferentes', () => {
      expect(calculateISS(1000, 0.02)).toBe(20.00); // 2%
      expect(calculateISS(1000, 0.03)).toBe(30.00); // 3%
      expect(calculateISS(1000, 0.05)).toBe(50.00); // 5%
    });
  });

  describe('calculateTaxValues', () => {
    test('deve calcular todos os valores fiscais corretamente', () => {
      const result = calculateTaxValues(1000, 0.05, 100);
      
      expect(result.base_value).toBe(1000.00);
      expect(result.iss_rate).toBe(0.05);
      expect(result.iss_value).toBe(50.00);
      expect(result.deductions).toBe(100.00);
      expect(result.net_value).toBe(850.00); // 1000 - 100 - 50
    });

    test('deve calcular sem deduções', () => {
      const result = calculateTaxValues(500, 0.02);
      
      expect(result.base_value).toBe(500.00);
      expect(result.iss_value).toBe(10.00);
      expect(result.deductions).toBe(0.00);
      expect(result.net_value).toBe(490.00); // 500 - 10
    });

    test('deve aplicar arredondamento em todos os cálculos', () => {
      // Caso que gera arredondamentos em múltiplas etapas
      const result = calculateTaxValues(86.06, 0.05, 10.004);
      
      expect(result.base_value).toBe(86.06);
      expect(result.iss_value).toBe(4.30); // 86.06 * 0.05 = 4.303 -> 4.30
      expect(result.deductions).toBe(10.00); // 10.004 -> 10.00
      expect(result.net_value).toBe(71.76); // 86.06 - 10.00 - 4.30
    });
  });

  describe('Casos extremos', () => {
    test('deve lidar com valores muito pequenos', () => {
      expect(roundABNT(0.001)).toBe(0.00);
      expect(roundABNT(0.005)).toBe(0.00); // par anterior (0), regra 2.4
      expect(roundABNT(0.015)).toBe(0.02); // ímpar anterior (1), regra 2.3
    });

    test('deve lidar com valores muito grandes', () => {
      const large = 999999.999;
      const result = roundABNT(large);
      expect(result).toBe(1000000.00);
    });

    test('deve manter precisão em cálculos sequenciais', () => {
      let value = 100;
      
      // Aplica múltiplas operações
      value = calculateISS(value, 0.05); // 5.00
      value = roundABNT(value * 1.1); // 5.50
      value = roundABNT(value / 2); // 2.75
      
      expect(value).toBe(2.75);
      expect(typeof value).toBe('number');
    });
  });
});
