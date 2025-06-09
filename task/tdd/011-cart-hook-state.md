---
id: TDD-011
title: "Unit tests – useCart hook state management (add / update / delete)"
dependsOn:
  - TDD-001     # Jest + RTL
  - TDD-002     # MSW base mocks
status: "open"
owner: ""
estimate: "3h"
---

## 목적
`components/cart/cart-context.tsx` 의 **useCart 훅**에서 수행되는 _기본 상태 관리 로직_을 단위 테스트로 검증한다.  
장바구니 라인 추가, 수량 증감, 삭제, 합계 계산에 대한 정상·엣지 케이스를 다룬다.

> ⚠️ **TDD-010**은 상위 에픽(“Cart Context 단위 테스트”)이며, 본 태스크(TDD-011)는 그중 **State Management** 부분에 집중한다. 완료 후 나머지 세부 항목(예: 에러 처리, 통화 계산)용 후속 태스크가 추가될 수 있다.

## 범위
- `cartReducer`:
  - `ADD_ITEM`
  - `UPDATE_ITEM` (`plus`, `minus`, `delete`)
- Helper 함수:
  - `calculateItemCost`
  - `updateCartTotals`
- `useCart` 훅의 optimistic state (`useOptimistic`) 정상 작동

## 수용 기준 (Given / When / Then)

| # | Given | When | Then |
|---|-------|------|------|
| 1 | 빈 카트 상태 | `addCartItem`(상품 A, 수량1) 호출 | `totalQuantity === 1`, `lines.length === 1` |
| 2 | 상품 A(1) 존재 | 동일 상품 A 다시 `addCartItem` | `quantity === 2`, `totalAmount` 두 배 |
| 3 | 상품 A(2) 존재 | `updateCartItem(id,'minus')` | `quantity === 1`, 합계 감소 |
| 4 | 상품 A(1) 존재 | `updateCartItem(id,'minus')` | 아이템 제거, `totalQuantity === 0` |
| 5 | 상품 A(1), B(1) 존재 | `updateCartItem(idA,'delete')` | B만 남고 `totalQuantity === 1` |
| 6 | CartProvider 없이 훅 사용 | `renderHook(() => useCart())` | Error throw (`useCart must be used within CartProvider`) |

## 작업 체크리스트
- [ ] 테스트 파일 `__tests__/cart-state.test.tsx` 생성
- [ ] **Mock helpers**: `createMockProduct()` `createMockVariant(product)`  
      (간단하게 id·price·selectedOptions 포함)
- [ ] CartProvider wrapper:  
  ```tsx
  const wrapper = ({children}: {children:React.ReactNode}) => (
    <CartProvider cartPromise={Promise.resolve(undefined)}>{children}</CartProvider>
  );
  ```
- [ ] 각 수용 기준 구현 – **Red → Green → Refactor** 프로세스 준수
- [ ] `act()` 블록으로 상태 업데이트 감싸기
- [ ] `expect` matcher: `toBe`, `toEqual`, `toHaveLength`
- [ ] 테스트 네이밍: `"should add new line item"` 등 BDD 스타일
- [ ] 커버리지 목표: `cart-context.tsx` **≥ 90 %** (lines)  
      Jest arg: `--collectCoverageFrom "components/cart/cart-context.tsx"`
- [ ] 실패 메시지 가독성 위해 Jest `--verbose`
- [ ] PR: `test: add useCart state tests (TDD-011)` + `Closes #TDD-011`

## 구현 팁
```tsx
const { result } = renderHook(() => useCart(), { wrapper });
act(() => result.current.addCartItem(variantA, productA));
expect(result.current.cart.totalQuantity).toBe(1);
```
- 복수 업데이트 시 `act` 하나에 여러 호출 가능
- 통화 문자열은 `Number(amount)` 캐스팅 후 비교

## 산출물
- 통과하는 Jest 스위트 `cart-state.test.tsx`
- 커버리지 리포트 (lcov) 첨부 여부는 PR 설명에 링크
- README / master-plan 문서 업데이트 필요 시 포함

## 참고
- `task/tdd/001-jest-setup.md`
- `doc/reverse-engineered-prd.md` – Cart Flow
- RTL `renderHook` docs: https://react-hooks-testing-library.com
