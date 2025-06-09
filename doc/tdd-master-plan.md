# 🧪 TDD Master Plan  
Next.js + Shopify 통합 e-commerce 프로젝트  
버전: 2025-06-09

---

## 목차
1. 도입 목적
2. 범위 및 우선순위
3. 테스트 전략
4. 기술 스택 & 초기 셋업
5. 로드맵
6. 코드 커버리지 목표
7. 로컬 개발 & 모킹 환경
8. CI/CD 통합
9. 테스트 작성 가이드라인
10. Shopify API 통합 테스트 패턴
11. 리스크 & 대응
12. 유지보수 정책
13. 부록: 첫 TDD 예제
14. 참고 자료

---

## 1. 도입 목적
| 목표 | 설명 |
|------|------|
| 품질 향상 | 개발 단계에서 결함 조기 발견, 리팩터링 비용 최소화 |
| 변경 용이성 | UI·비즈니스 로직 변경 시 회귀 위험 감소 |
| 실행 가능한 문서 | 테스트가 사양(spec) 역할 → AI·개발자 이해도 상승 |
| 배포 안정성 | 모든 커밋이 테스트 게이트를 통과해야 배포 가능 |

---

## 2. 범위 및 우선순위
| 단계 | 범위 | 우선순위 |
|------|------|----------|
| 1 | 핵심 React 컴포넌트 (Header, Cart, ProductGallery, VariantSelector) | High |
| 2 | Shopify GraphQL 래퍼 (`lib/shopify/*`) | High |
| 3 | Next.js API Routes (`/api/checkout`, `/api/revalidate`) | Medium |
| 4 | E2E Happy Path (홈→PDP→Cart→Checkout) | Medium |
| 5 | 장애·오류 플로우 (결제 실패, Rate-limit 429) | Low |

---

## 3. 테스트 전략
| 레이어 | 목적 | 도구 |
|--------|------|------|
| Unit | 함수·훅·컴포넌트 검증 | Jest + React Testing Library |
| Integration | 컴포넌트 ↔ API 흐름 | Jest + MSW |
| Contract | 외부 API 스키마 유지 | Pact JS |
| E2E | 사용자 여정 | Playwright |
| Visual (옵션) | UI 회귀 | Storybook + Chromatic |

모든 테스트는 **Given-When-Then** 패턴을 따른다.

---

## 4. 기술 스택 & 초기 셋업
```bash
pnpm add -D jest ts-jest @testing-library/react \
           @testing-library/jest-dom msw @mswjs/data \
           @pact-foundation/pact @playwright/test \
           cross-env
```
- **jest.config.ts**: `preset: 'ts-jest', testEnvironment: 'jsdom'`
- **playwright.config.ts**: 프로젝트 루트에 기본 생성
- **MSW** 디렉터리: `__mocks__/handlers`, `browser.ts`, `server.ts`

---

## 5. 로드맵
| Sprint | 작업 | 산출물 | 완료 기준 |
|--------|------|--------|-----------|
| 0 | 프레임워크 부트스트랩 | 설정 파일 | `pnpm test` 통과 |
| 1 | `useCart` 훅 테스트 | `useCart.test.tsx` | 커버리지 90% |
| 2 | Cart Pact 계약 | `cart.pact.json` | Broker 검증 |
| 3 | PDP→Cart 통합 테스트 | `pdp-cart.integration.test.tsx` | MSW 사용 |
| 4 | 첫 E2E(데스크탑) | `checkout.e2e.spec.ts` | Playwright pass |
| 5 | 실패 플로우 & 모바일 | `payment-fail.e2e.spec.ts` | flaky 0 |

---

## 6. 코드 커버리지 목표
- Unit+Integration ≥ **90 %**
- 핵심 E2E 시나리오 100 %
- `pnpm test --coverage` 결과를 Codecov 업로드

---

## 7. 로컬 개발 & 모킹 환경
### 7.1 목표
- Shopify/백엔드 없이 기능 개발·테스트 가능
- 오프라인에서도 Unit/Integration/E2E 실행
- 로컬·CI/PR 파이프라인 동일 핸들러 사용

### 7.2 환경 변수
| 변수 | 모킹 값 | 실제 값 |
|------|---------|---------|
| `NEXT_PUBLIC_USE_MOCKS` | `true` | `false` |
| `SHOPIFY_STOREFRONT_ACCESS_TOKEN` | `dummy` | real |
| `SHOPIFY_STORE_DOMAIN` | `mock.myshopify.com` | real |

`.env.development.local`
```
NEXT_PUBLIC_USE_MOCKS=true
SHOPIFY_STOREFRONT_ACCESS_TOKEN=dummy
SHOPIFY_STORE_DOMAIN=mock.myshopify.com
```

### 7.3 디렉터리 구조
```
__mocks__/
  handlers/
    shopifyHandlers.ts
    backendHandlers.ts
  browser.ts   # 개발 서버용
  server.ts    # Jest/Playwright용
```

### 7.4 브라우저 초기화
```tsx
if (process.env.NEXT_PUBLIC_USE_MOCKS === 'true' && typeof window !== 'undefined') {
  import('../__mocks__/browser').then(({ worker }) =>
    worker.start({ onUnhandledRequest: 'bypass' })
  );
}
```

### 7.5 실행 스크립트
```json
{
  "scripts": {
    "dev": "next dev",
    "dev:mock": "cross-env NEXT_PUBLIC_USE_MOCKS=true next dev",
    "test": "cross-env NEXT_PUBLIC_USE_MOCKS=true jest --coverage",
    "e2e": "cross-env NEXT_PUBLIC_USE_MOCKS=true playwright test"
  }
}
```

---

## 8. CI/CD 통합
```yaml
# .github/workflows/test.yml
jobs:
  unit:
    runs-on: ubuntu-latest
    env:
      NEXT_PUBLIC_USE_MOCKS: true
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - run: pnpm install
      - run: pnpm test --coverage
  e2e:
    runs-on: ubuntu-latest
    env:
      NEXT_PUBLIC_USE_MOCKS: true
    steps:
      - uses: actions/checkout@v4
      - uses: microsoft/playwright-github-action@v1
```
- **모든** PR은 위 Job을 통과해야 병합
- Staging 통합 테스트 시 `NEXT_PUBLIC_USE_MOCKS=false` 로 실행

---

## 9. 테스트 작성 가이드라인
1. **AAA**: Arrange-Act-Assert  
2. 한 테스트는 **단일 행위** 검증  
3. DOM 접근은 ARIA role → `data-testid` 순  
4. UI Snapshot 최소화 (Storybook 사용)  
5. 외부 호출은 **반드시 MSW 모킹**  
6. 실패 테스트 먼저 작성 → Green → Refactor

---

## 10. Shopify API 통합 테스트 패턴
### 10.1 Consumer-Driven Contract 테스트
| 개념 | 설명 |
|------|------|
| 정의 | 소비자(프론트엔드)가 제공자(Shopify API)에게 기대하는 계약을 명시적으로 정의하는 테스트 방식 |
| 목적 | API 변경 시 소비자 코드 영향을 조기 감지, 안전한 API 진화 보장 |
| 도구 | @pact-foundation/pact |
| 산출물 | JSON 계약 파일 (pacts/*.json) |

### 10.2 구현된 Pact 계약 테스트
| 기능 | 테스트 파일 | 검증 대상 |
|------|------------|-----------|
| 장바구니 생성 | `__tests__/shopify-cart.pact.ts` | `createCart()` → `cartCreate` mutation |
| 상품 추가 | `__tests__/shopify-cart.pact.ts` | `addToCart()` → `cartLinesAdd` mutation |
| 수량 변경 | `__tests__/shopify-cart.pact.ts` | `updateCart()` → `cartLinesUpdate` mutation |
| 상품 제거 | `__tests__/shopify-cart.pact.ts` | `removeFromCart()` → `cartLinesRemove` mutation |

### 10.3 Pact 테스트 실행 방법
```bash
# 모든 Pact 테스트 실행
pnpm pact:verify

# 계약 파일 생성 및 Broker 업로드
pnpm pact:publish
```

### 10.4 Pact 테스트 패턴
```typescript
// 1. 상호작용 정의
provider.addInteraction({
  state: 'cart is empty',                          // 전제 조건
  uponReceiving: 'a cartCreate mutation',          // 시나리오 설명
  withRequest: {                                   // 요청 형식
    method: 'POST',
    path: '/api/2023-01/graphql.json',
    headers: { 'Content-Type': 'application/json' },
    body: { query: like('mutation cartCreate...') }
  },
  willRespondWith: {                               // 기대 응답
    status: 200,
    body: { data: { cartCreate: { cart: { id: like('gid://...') } } } }
  }
});

// 2. 상호작용 검증
const result = await createCart();
expect(result.id).toBeDefined();
```

### 10.5 기타 API 테스트 패턴
| 패턴 | 설명 |
|------|------|
| MSW Runtime Mock | 개발·CI에서 외부 호출 차단, 응답 시뮬레이션 |
| Rate-limit Simulation | 429 응답 후 재시도 로직 검증 |

---

## 11. 리스크 & 대응
| 위험 | 영향 | 대응 |
|------|------|------|
| Shopify API 변경 | 구매 플로우 중단 | Pact nightly |
| 느린 테스트 | 배포 지연 | 캐시·병렬화 |
| flaky E2E | 신뢰도 ↓ | 네트워크 모킹 강화 |

---

## 12. 유지보수 정책
- 새 기능 = **Red → Green** 테스트 선행  
- 코드 리뷰 체크리스트에 "테스트 포함"  
- 실패 테스트 24 h 내 수정 SLA  
- 분기별 커버리지·가이드 업데이트

---

## 13. 부록: 첫 TDD 예제
### 13.1 `useCart` 훅
- Red: 수량 증가 테스트 작성  
- Green: 최소 구현  
- Refactor: 중복 id 처리 + 추가 테스트

### 13.2 E2E 구매 플로우
- Playwright 시나리오: 홈 → 제품 → 장바구니 → 결제  
- 오류 라우팅 발생 시 수정 후 재실행

---

## 14. 참고 자료
- MSW & @mswjs/data  
- Jest & React Testing Library Best Practices  
- Pact JS  
- Playwright Docs  
- Shopify Storefront API Docs
