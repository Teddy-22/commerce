---
id: TDD-010
title: "Implement unit tests for Cart Context & useCart hook"
dependsOn:
  - TDD-000      # Bootstrap environment must be complete
status: "open"
owner: ""
estimate: "4h"
---

## 목적
`components/cart/cart-context.tsx` 에 정의된 **CartProvider / useCart 훅**의 핵심 비즈니스 로직을 단위 테스트로 검증한다.  
이 작업은 TDD 사이클의 첫 **실제 기능 테스트**이며, 후속 Integration·E2E 테스트의 기반이 된다.

## 범위
- `cartReducer` 로직 (ADD_ITEM, UPDATE_ITEM)
- `useCart` 훅 내 optimistic state 동작
- 비용 계산 유틸 (`calculateItemCost`, `updateCartTotals`) 결과 검증
- 엣지 케이스: 수량 0 → 아이템 제거, 동일 상품 중복 추가 시 수량 증가
- 에러 처리: CartProvider 미사용 시 `useCart` 호출 오류

## 수용 기준 (Given / When / Then)
| Given | When | Then |
|-------|------|------|
| 초기 빈 카트 | `addCartItem` 으로 상품 A(수량1) 추가 | `totalQuantity === 1`, `lines.length === 1` |
| 카트에 상품 A(1) 존재 | 같은 상품 다시 추가 | `quantity === 2`, `totalAmount` 두 배 |
| 상품 A(2) 존재 | `updateCartItem(id,'minus')` 한번 | `quantity === 1`, 합계 감소 |
| 상품 A(1) 존재 | `updateCartItem(id,'minus')` 한번 | `lines` 배열에서 제거, `totalQuantity === 0` |
| CartProvider 없이 useCart 호출 |  | `Error` throw |

## 작업 체크리스트
- [ ] `__tests__/cart-context.test.tsx` 파일 생성
- [ ] `renderHook` + 커스텀 `wrapper` 로 CartProvider 구성
- [ ] 각 수용 기준에 대한 **Red → Green → Refactor** 사이클 수행
- [ ] Faker/mock 상품 & 바리언트 객체 생성 헬퍼 구현
- [ ] jest-dom matcher (`toHaveLength`, `toBe`) 사용
- [ ] 커버리지: Cart Context 관련 파일 **≥ 95 %** 를 목표
- [ ] 실패/통과 로그를 통해 테스트 명세 문서화 (자동)

## 구현 가이드
```tsx
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <CartProvider cartPromise={Promise.resolve(undefined)}>{children}</CartProvider>
);
const { result } = renderHook(() => useCart(), { wrapper });
```
- **비동기 없음** → `act()` 로 상태 업데이트
- 통화 단위는 문자열 → `Number(…)` 적절히 캐스팅하여 검증

## 병렬성 & 의존성
- TDD-000 완료 후 즉시 Claim 가능
- 다른 AI가 Contract 테스트(TDD-020) 를 병행 가능
- 완료되면 **Integration 테스트(TDD-030)** 가 착수 가능하도록 PR 병합 필수

## 산출물
- 통과하는 Jest 테스트 스위트
- Coverage 보고서(`coverage/lcov-report/index.html`) 검토
- PR: `test:` prefix, `Closes #TDD-010` 포함

## 참고
- `doc/tdd-master-plan.md` § 부록 A
- React Testing Library Docs: https://testing-library.com/docs/react-testing-library/intro
