---
id: TDD-022
title: "Consumer Pact tests – Shopify Product queries (getProduct / getProducts / recommendations / collectionProducts)"
dependsOn:
  - TDD-001        # Jest + RTL environment ready
  - TDD-002        # MSW mocks ready
  - TDD-020        # Contract testing epic scaffolded
status: "open"
owner: ""
estimate: "4h"
---

## 목적
Shopify Storefront GraphQL **제품(Product)** 관련 _쿼리 4종_ 에 대해 **Consumer-driven Pact** 계약을 작성한다.  
프론트엔드가 기대하는 응답 스키마를 고정하여 **Shopify 데이터 모델 변경**을 CI 단계에서 즉시 감지한다.

## 범위
| Query Function | GraphQL Operation | 설명 |
|----------------|------------------|------|
| `getProduct` | `productByHandle` | PDP 개별 제품 조회 |
| `getProducts` | `products` | 전체/검색 결과 페이징 |
| `getProductRecommendations` | `productRecommendations` | 연관 상품 |
| `getCollectionProducts` | `collection.products` | 컬렉션 상품 목록 |

- Pact JS 설정(`@pact-foundation/pact`) 재사용 (`pactSetup.ts`)
- 각 쿼리 요청이 올바른 operation name·variables 포함하는지 검증
- 응답 스키마 필수 필드 검증:
  - `product.id`, `title`, `handle`, `featuredImage.url`
  - 목록 쿼리: `edges[].node` 구조
- Pact JSON (`pacts/frontend-shopifyProduct-*.json`) 생성
- `package.json` 스크립트 `"pact:products"` 추가

## 수용 기준 (Given / When / Then)

| # | Given | When | Then |
|---|-------|------|------|
| 1 | Pact mock server | `getProduct('mock-product')` 호출 | Interaction _getProduct_ 매칭 |
| 2 | Pact mock server | `getProducts({query:'shirt'})` 호출 | _getProducts_ 매칭 |
| 3 | Pact mock server | `getProductRecommendations(id)` 호출 | _productRecommendations_ 매칭 |
| 4 | Pact mock server | `getCollectionProducts({collection:'summer'})` 호출 | _collectionProducts_ 매칭 |
| 5 | 테스트 완료 | | `pacts/frontend-shopifyProduct-*.json` 4개 쿼리 포함 |

## 작업 체크리스트
- [ ] `__tests__/product-queries.pact.ts` 생성
  - [ ] `beforeAll(provider.setup)` / `afterAll(provider.finalize)`
  - [ ] Interaction 4개 정의 (state, uponReceiving, withRequest, willRespondWith)
  - [ ] 호출: `getProduct`, `getProducts`, `getProductRecommendations`, `getCollectionProducts`
  - [ ] 결과 속성 단언 (e.g., `product?.title` truthy)
  - [ ] `provider.verify()` 실행
- [ ] Pact 파일 출력 경로 `pacts/`
- [ ] `package.json`  
  ```json
  "scripts": {
    "pact:products": "cross-env USE_MOCKS=true jest --testPathPattern=product-queries.pact.ts"
  }
  ```
- [ ] README / master-plan 문서 Pact 제품 쿼리 섹션 추가
- [ ] CI 워크플로 (`contract` job) 에 `pnpm pact:products` 명령 추가 (TDD-004 확장)

## 구현 예시 (getProduct)
```ts
await provider.addInteraction({
  state: 'product exists',
  uponReceiving: 'a productByHandle query',
  withRequest: {
    method: 'POST',
    path: '/api/2023-01/graphql.json',
    headers: { 'Content-Type':'application/json' },
    body: { query: like('query productByHandle'), variables: like({ handle: 'mock-product' }) }
  },
  willRespondWith: {
    status: 200,
    headers: { 'Content-Type':'application/json' },
    body: {
      data: {
        productByHandle: {
          id: like('gid://shopify/Product/1'),
          title: like('Mock Product'),
          handle: like('mock-product'),
          featuredImage: { url: like('https://cdn.demo/img.jpg') },
          variants: { edges: eachLike({ node: { id: like('gid://shopify/Variant/1') } }) }
        }
      }
    }
  }
});
```
- 목록·추천 쿼리도 유사 패턴, `edges.eachLike(...)` 사용  
- 매처(`like`, `eachLike`, `regex`)로 유연성 확보

## 병렬성 & 의존성
- **TDD-001, 002** 완료 후 **TDD-022** 단독 진행 가능  
- **TDD-021**(Cart mutations)와 **완전히 병렬** 실행  
- Pact publish / CI 통합은 **TDD-004** 워크플로 작업에서 처리

## 산출물
- Pact consumer 테스트 스위트 (`product-queries.pact.ts`)
- Pact JSON 파일 (`pacts/frontend-shopifyProduct-*.json`)
- npm 스크립트 갱신
- 문서 업데이트

## 참고
- Pact JS Docs: https://docs.pact.io
- `lib/shopify/index.ts` – product 관련 함수들
- `task/tdd/020-contract-cart-pact.md`
- `doc/reverse-engineered-prd.md` – Product Flow
