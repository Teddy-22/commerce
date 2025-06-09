---
id: TDD-030
title: "Integration test: Product Detail Page (PDP) ➜ Add-to-Cart flow"
dependsOn:
  - TDD-000      # env bootstrap
  - TDD-010      # Cart unit tests
status: "open"
owner: ""
estimate: "5h"
---

## 목적
제품 상세 페이지에서 **바리언트 선택 → Add To Cart → 장바구니 상태 반영**까지의 흐름을 통합 테스트로 검증한다.  
실제 Shopify API 대신 **MSW** 핸들러를 사용하여 GraphQL 응답을 모킹한다.

## 범위
- `app/product/[handle]/page.tsx` 서버컴포넌트 + `AddToCart` 클라이언트 액션 간 상호작용
- `CartProvider` optimistic state 업데이트 검증
- MSW 모킹:
  - `getProductQuery`
  - `cartCreate` (최초)
  - `cartLinesAdd`
- React Testing Library의 `render` + `user-event` 활용

## 수용 기준 (Given / When / Then)
| Given | When | Then |
|-------|------|------|
| PDP가 렌더된 상태 | 사용자가 옵션 선택(필요 시) 후 **Add To Cart** 클릭 | `cart.totalQuantity === 1` |
| 최초 카트 없음 | Add To Cart 클릭 | MSW mock `cartCreate` → `cartLinesAdd` 상호작용 순서 호출 |
| 장바구니 배지(Modal) | Add To Cart 후 | 뱃지 숫자 ‘1’ 표시 |
| 동일 PDP에서 두 번 Add | 두 번째 클릭 | `cart.totalQuantity === 2`, `lines.length === 1` |
| 다른 제품 추가 | 새 PDP Add | `lines.length === 2`, 총 수량 3 |

## 작업 체크리스트
- [ ] MSW 핸들러 추가/업데이트  
  - [ ] `handlers/shopifyHandlers.ts` 에 `getProductQuery`, `cartLinesAdd` mock
- [ ] 테스트 파일 `__tests__/pdp-cart.integration.test.tsx` 생성
  - [ ] `render(<ProductProvider><CartProvider>...</CartProvider></ProductProvider>)` 구성
  - [ ] `screen.getByRole('button', { name: /add to cart/i })`
  - [ ] `userEvent.click` 후 `await waitFor` 로 상태 검증
- [ ] MSW interaction 호출 순서(`expect(mswServer).toHaveReceived...`) 검증
- [ ] 커버리지 목표: 이 통합 테스트로 **Cart Context + PDP** 라인 최소 85 % 유지
- [ ] CI unit job 내 통합 테스트 포함 → 녹색 확인

## 병렬성 & 의존성
- **TDD-010** 완료 후 착수해야 함 (Cart 로직 안정화 의존)
- **TDD-020**(Pact) 와 병렬 가능
- 완료되면 E2E 테스트(040, 045) 가 착수 가능

## 구현 가이드
```tsx
render(<RouterContext.Provider value={{ push: jest.fn() }}>
  <CartProvider cartPromise={Promise.resolve(undefined)}>
    <ProductProvider>
      <ProductPage params={{ handle: 'mock-product' }} />
    </ProductProvider>
  </CartProvider>
</RouterContext.Provider>);
```
- 변형 가능, SSR 부분은 모킹된 `getProduct` 데이터로 대체
- `jest.spyOn(global, 'fetch')` 불필요 – MSW 사용

## 산출물
- 테스트 스위트 & 통과 결과
- MSW 핸들러 업데이트
- 커버리지 보고서 확인
- PR: `test: add PDP→Cart integration (TDD-030)` + `Closes #TDD-030`
