---
id: TDD-021
title: "Consumer Pact tests – Shopify Cart mutations (cartCreate / cartLinesAdd / cartLinesUpdate / cartLinesRemove)"
dependsOn:
  - TDD-001        # Jest + RTL environment ready
  - TDD-002        # MSW mocking base ready
  - TDD-020        # Contract testing epic scaffolded
status: "open"
owner: ""
estimate: "4h"
---

## 목적
Shopify Storefront GraphQL **Cart** 관련 _뮤테이션 4종_ 에 대해 **Consumer-driven Pact** 계약을 작성한다.  
이 계약은 프론트엔드가 기대하는 요청·응답 스키마를 고정하여 **Shopify API 변화**를 CI 단계에서 즉시 감지할 수 있게 한다.

## 범위
| Mutation | Operation name | Notes |
|----------|----------------|-------|
| `cartCreate`          | `cartCreate`          | 최초 카트 생성 |
| `cartLinesAdd`        | `cartLinesAdd`        | 라인 아이템 추가 |
| `cartLinesUpdate`     | `cartLinesUpdate`     | 수량·머천다이즈 변경 |
| `cartLinesRemove`     | `cartLinesRemove`     | 라인 아이템 삭제 |

- Pact JS 설정(`@pact-foundation/pact`) 및 Jest 통합
- 각 mutation 요청이 올바른 GraphQL operation name을 포함하는지 확인
- 성공 응답 스키마(필드 존재 여부) 검증: `cart.id`, `lines.edges`, `cost.totalAmount.amount`
- Pact 파일(`pacts/frontend-shopifyCart-*.json`) 생성
- `package.json` `pact:mutations` 스크립트 추가
- CI `contract` job에서 실행되도록 워크플로 수정(별도 태스크 TDD-004에서 처리)

## 수용 기준 (Given / When / Then)

| # | Given | When | Then |
|---|-------|------|------|
| 1 | Pact mock server | `createCart()` 호출 | Interaction _cartCreate_ 매칭 & 테스트 녹색 |
| 2 | Pact mock server | `addToCart(lines)` 호출 | _cartLinesAdd_ 매칭 |
| 3 | Pact mock server | `updateCart(lines)` 호출 | _cartLinesUpdate_ 매칭 |
| 4 | Pact mock server | `removeFromCart(ids)` 호출 | _cartLinesRemove_ 매칭 |
| 5 | 테스트 완료 | | `pacts/` 폴더에 4개 mutation 포함 JSON 생성 |

## 작업 체크리스트
- [ ] **Dev Dependency** 설치  
  ```bash
  pnpm add -D @pact-foundation/pact
  ```
- [ ] **pactSetup.ts** 유틸 작성  
  ```ts
  export const provider = new Pact({ consumer:'frontend', provider:'shopifyCart', port:4000 });
  ```
- [ ] 테스트 파일 `__tests__/cart-mutations.pact.ts` 생성  
  - [ ] `beforeAll(provider.setup)` / `afterAll(provider.finalize)`  
  - [ ] 각 mutation Interaction 정의 (state, uponReceiving, withRequest, willRespondWith)  
  - [ ] `shopifyFetch` 래퍼 호출 후 결과 단언  
  - [ ] `provider.verify()` 호출
- [ ] Pact 파일 출력 경로 `pacts/`
- [ ] `package.json` 스크립트  
  ```json
  "pact:mutations": "cross-env USE_MOCKS=true jest --testPathPattern=cart-mutations.pact.ts"
  ```
- [ ] README/tdd-master-plan에 실행 방법 추가
- [ ] CI 워크플로(`contract` job) 에 `pnpm pact:mutations` 포함(별도 태스크에서 처리)

## 구현 예시 (cartCreate)
```ts
await provider.addInteraction({
  state: 'shopper has no cart',
  uponReceiving: 'a cartCreate mutation',
  withRequest: {
    method: 'POST',
    path: '/api/2023-01/graphql.json',
    headers: { 'Content-Type':'application/json' },
    body: { query: like('mutation cartCreate') }
  },
  willRespondWith: {
    status: 200,
    headers: { 'Content-Type':'application/json' },
    body: {
      data: {
        cartCreate: {
          cart: {
            id: like('gid://shopify/Cart/1'),
            cost: {
              totalAmount: { amount: like('0.00'), currencyCode: like('USD') }
            },
            lines: { edges: eachLike({ node: {} }) }
          }
        }
      }
    }
  }
});
```
- 다른 뮤테이션도 위 패턴에 맞춰 정의
- `like`, `eachLike` 매처를 사용해 필수 필드만 규정 → API 진화 허용

## 병렬성 & 의존성
- **TDD-001, 002** 완료 후 **TDD-021** 단독으로 진행 가능  
- 이후 TDD-020 상위 태스크에서 Pact publish/CI 통합을 처리하므로, 본 태스크는 **Pact 파일 생성**까지 완료하면 된다.
- `cart-mutations.pact.ts` 는 다른 테스트와 독립 실행

## 산출물
- Pact consumer 테스트 스위트 (`cart-mutations.pact.ts`)
- 생성된 Pact JSON (`pacts/frontend-shopifyCart-*.json`)
- `package.json` 스크립트 업데이트
- 문서 업데이트 (README / master plan)

## 참고
- Pact JS 문서: https://docs.pact.io
- `lib/shopify/index.ts` – cart* 함수들
- `task/tdd/020-contract-cart-pact.md`
