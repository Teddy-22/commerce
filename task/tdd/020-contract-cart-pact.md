---
id: TDD-020
title: "Create consumer-side Pact contract tests for Shopify Cart API"
dependsOn:
  - TDD-000          # Environment bootstrap
status: "open"
owner: ""
estimate: "5h"
---

## 목적
Shopify Storefront GraphQL **Cart** 관련 오퍼레이션(`cartCreate`, `cartLinesAdd`, `cartLinesUpdate`, `cartLinesRemove`)에 대해 **Consumer-driven Contract**를 정의하고 Pact 테스트를 구현한다.  
이 계약 테스트는 프론트엔드가 기대하는 요청/응답 스키마를 고정하여 **백엔드 API 변경을 조기에 감지**한다.

## 병렬성
- **TDD-000** 완료 후 즉시 착수 가능  
- **TDD-010**(Cart unit test) 와 **병렬** 진행 가능  
- 완료 후 통합 테스트(TDD-030) 의 선행 조건 *아님* (병렬 가능)  
- CI 에 `pact:verify` job 추가 시 다른 작업과 독립 실행

## 범위
- Pact JS 설정 (`@pact-foundation/pact`)
- Consumer 테스트: `lib/shopify/index.ts → addToCart/createCart/updateCart/removeFromCart`
- Pact Broker (혹은 로컬) 퍼블리시 스크립트 작성 (URL/Token 환경 변수)
- CI 워크플로(job `contract`) 추가
- 예시 Provider 상태 정의(로컬 Stub) – 실제 Provider 검증은 별도

## 수용 기준 (Given / When / Then)
| Given | When | Then |
|-------|------|------|
| Pact mock server | `createCart()` 호출 | Interaction ‘cartCreate’ matched, test green |
| Pact mock server | `addToCart(lines)` 호출 | Interaction ‘cartLinesAdd’ matched |
| Pact mock server | `updateCart(lines)` 호출 | Interaction ‘cartLinesUpdate’ matched |
| Pact mock server | `removeFromCart(ids)` 호출 | Interaction ‘cartLinesRemove’ matched |
| CI | `pnpm pact:verify` 실행 | 모든 consumer tests 통과 & pact 파일 생성 |
| CI | Pact publish step | `*.json` 파일이 Broker/Artifacts 업로드 성공 |

## 작업 체크리스트
- [ ] Install `@pact-foundation/pact` dev dependency
- [ ] Create config util `test/pactSetup.ts` (mock server port/env)
- [ ] Write consumer test file `__tests__/shopify-cart.pact.ts`
  - [ ] Define interactions for the 4 cart mutations
  - [ ] Use GraphQL operation names to match requests
  - [ ] Assert expected response schema (ids, cost fields)
- [ ] Generate pact files into `pacts/`
- [ ] Add `pact:verify` and `pact:publish` npm scripts
  ```json
  "scripts": {
    "pact:verify": "cross-env USE_MOCKS=true jest --testPathPattern=__tests__/.*\\.pact\\.ts$",
    "pact:publish": "pact-broker publish pacts --broker-base-url=$PACT_BROKER_URL --broker-token=$PACT_BROKER_TOKEN"
  }
  ```
- [ ] Update `.github/workflows/test.yml` with `contract` job:
  - Runs after unit job
  - Publishes pact artifacts
- [ ] Documentation update in `doc/tdd-master-plan.md` (§ Shopify API 테스트 패턴)

## 구현 가이드
```ts
import { Pact } from '@pact-foundation/pact';
const provider = new Pact({ consumer: 'frontend', provider: 'shopifyCart', port: 4000 });

await provider.setup();
await provider.addInteraction({
  state: 'cart is empty',
  uponReceiving: 'a cartCreate mutation',
  withRequest: {
    method: 'POST',
    path: '/api/2023-01/graphql.json',
    headers: { 'Content-Type': 'application/json' },
    body: { query: expect.stringContaining('mutation cartCreate') }
  },
  willRespondWith: {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    body: { data: { cartCreate: { cart: { id: like('gid://shopify/Cart/1') } } } }
  }
});
```
- GraphQL 요청은 `body.query` 문자열 포함 여부로 매칭
- `@pact-foundation/pact` `like()`, `eachLike()` 매처 사용

## 산출물
- Consumer Pact JSON files under `pacts/`
- Jest test suite passing
- CI workflow job `contract` green
- Updated documentation & npm scripts

## 참고
- Pact JS Docs: https://docs.pact.io
- `doc/reverse-engineered-prd.md` (Cart flow)
- `doc/tdd-master-plan-detailed.md` § 10
