---
id: TDD-012
title: "Unit tests – useCart hook error handling (invalid input / provider missing / network)"
dependsOn:
  - TDD-001     # Jest + RTL
  - TDD-002     # MSW mocks (network error simulation)
  - TDD-011     # State management tests complete
status: "open"
owner: ""
estimate: "2h"
---

## 목적
`useCart` 훅과 관련 액션에서 발생할 수 있는 **에러 시나리오**를 단위 테스트로 검증한다.  
잘못된 파라미터 전달, `CartProvider` 누락, 네트워크 오류(mock) 상황에서 올바른 예외 처리·에러 메시지가 노출되는지 확인한다.

## 범위
1. **Provider 누락** 오류  
   - `useCart` 호출 시 `CartProvider` 가 없는 경우 throw
2. **잘못된 입력**  
   - `addCartItem(undefined as any, undefined as any)` 등 유효하지 않은 Variant/Product 전달 시 보호 로직
3. **네트워크 오류 시나리오**  
   - MSW 를 이용해 `cartLinesAdd` 요청이 500 을 반환 → 훅/Action 에서 사용자에게 메시지 전파 (`message` state 등)  
   - Optimistic 상태 롤백 여부 검증 *(가능하면)*

## 수용 기준 (Given / When / Then)

| # | Scenario | Given | When | Then |
|---|----------|-------|------|------|
| 1 | Provider Missing | 컴포넌트 트리 외부 | `renderHook(() => useCart())` | `Error` throw, 메시지 `"useCart must be used within CartProvider"` |
| 2 | Invalid Inputs | CartProvider wrapper 사용 | `addCartItem(undefined, undefined)` | 콘솔 에러 또는 `TypeError` throw, 상태 불변 |
| 3 | Network Error | MSW 핸들러 `cartLinesAdd` 500 응답 | `addCartItem(validVariant, product)` | `message` state `"Error adding to cart"` & 장바구니 수량 0 (롤백) |

## 작업 체크리스트
- [ ] 테스트 파일 `__tests__/cart-error.test.tsx` 생성
- [ ] **Case 1**: Provider 누락  
  ```tsx
  expect(() => renderHook(() => useCart())).toThrow(/within CartProvider/);
  ```
- [ ] **Case 2**: Invalid Inputs  
  - Wrapper 포함, `act(() => result.current.addCartItem(undefined as any, undefined as any))`  
  - `expect(result.current.cart.totalQuantity).toBe(0)`
- [ ] **Case 3**: Network Error  
  - MSW override: `server.use(graphql.mutation('cartLinesAdd', (...)=>
        res(ctx.status(500), ctx.errors([{message:'fail'}]))) )`  
  - Verify toast/message via `useActionState` result or DOM (`aria-live="polite"`)  
  - Ensure cart remains empty
- [ ] Jest `--silent` false or mock `console.error` to avoid noise
- [ ] 커버리지 목표: 오류 브랜치 90% 이상
- [ ] PR: `test: add useCart error handling tests (TDD-012)` + `Closes #TDD-012`

## 구현 팁
- 네트워크 오류 후 optimistic state 롤백은 CartContext 내부 로직에 따라 다를 수 있음 → 필요한 경우 `updateOptimisticCart` mock 또는 `waitFor` 로 비동기 처리
- `jest.spyOn(console, 'error').mockImplementation()` 로 에러 로그 캡처

## 산출물
- `cart-error.test.tsx` 테스트 스위트
- MSW 핸들러 오버라이드 코드
- 커버리지 리포트 확인

## 참고
- `task/tdd/011-cart-hook-state.md`
- MSW error mocking: https://mswjs.io/docs/api/res
- React Hooks Testing Library `renderHook` docs
