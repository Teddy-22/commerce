---
id: TDD-013
title: "Unit tests – Cart price calculations (subtotal / total / taxes)"
dependsOn:
  - TDD-001        # Jest + RTL
  - TDD-002        # MSW mocks
  - TDD-011        # Cart state management tests
status: "open"
owner: ""
estimate: "2h"
---

## 목적
`components/cart/cart-context.tsx` 내부 **금액 계산 로직**이 정확히 동작하는지 단위 테스트로 검증한다.  
`calculateItemCost`, `updateCartTotals` 함수가 수량·가격·통화 코드를 기반으로 **소계(subtotal)·총액(total)·세금(totalTaxAmount)** 을 올바르게 산출하는지 확인한다.

## 범위
- 단가 × 수량 → `cost.totalAmount.amount` 정확성
- 장바구니 라인 여러 개 합산:
  - `subtotalAmount`, `totalAmount`, `totalTaxAmount`
  - `totalQuantity`
- 통화 코드 일관성 (`currencyCode`)
- 소수점 반올림(두 자리) 시나리오
- 세금 필드 기본값(0) 검증

## 수용 기준 (Given / When / Then)

| # | Given | When | Then |
|---|-------|------|------|
| 1 | 상품 A 단가 1000, 수량 2 | `calculateItemCost(2,'1000')` | 반환 `"2000"` |
| 2 | Cart lines: A(2 × 1000), B(1 × 500) | `updateCartTotals(lines)` | `totalQuantity === 3`, `subtotalAmount.amount === "2500"` |
| 3 | 통화 코드 `KRW` 동일 | 합계 계산 | `currencyCode === "KRW"` |
| 4 | 상품 A 단가 333.33, 수량 3 | cost 계산 | `"999.99"` (소수점 유지) |
| 5 | 세금 미정의 | updateTotals 호출 | `totalTaxAmount.amount === "0"` |

## 작업 체크리스트
- [ ] 테스트 파일 `__tests__/cart-price.test.ts` 생성
- [ ] 헬퍼 `mockVariant(price, currency)` → `ProductVariant`
- [ ] 헬퍼 `mockLine(variant, quantity)` → `CartItem`
- [ ] **Case 1–5** 구현 후 **Red → Green** 사이클
- [ ] 반올림 테스트: `expect(amount).toBe("999.99")`
- [ ] `Intl.NumberFormat` 사용 계획 여부 확인 (현재 문자열 연산) → 문자열 비교
- [ ] 커버리지 목표: `cart-context.tsx` **calc functions 100 % branch**
- [ ] PR 메시지: `test: add cart price calculation tests (TDD-013)` + `Closes #TDD-013`

## 구현 팁
```ts
import { calculateItemCost, updateCartTotals } from 'components/cart/cart-context';

describe('calculateItemCost', () => {
  it('returns quantity × price as string', () => {
    expect(calculateItemCost(2, '1000')).toBe('2000');
  });
});
```
- 복수 테스트에서 `updateCartTotals` 결과 객체 구조 단언  
  ```ts
  const { totalAmount, subtotalAmount } = totals.cost;
  expect(subtotalAmount.amount).toBe('2500');
  ```
- 통화 코드 검증: `toBe('KRW')`

## 산출물
- 테스트 스위트 `cart-price.test.ts`
- 커버리지 리포트 개선
- README/ master-plan 업데이트 필요 시 포함

## 참고
- `task/tdd/011-cart-hook-state.md`
- `doc/reverse-engineered-prd.md` – Data Model Snapshot
