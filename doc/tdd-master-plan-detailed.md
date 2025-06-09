# 🧪 TDD Master Plan – Next.js + Shopify Commerce  
버전: 2025-06-09

> 이 문서는 팀이 **Test-Driven Development(TDD)** 를 일관되게 적용하기 위한 종합 가이드입니다.  
> 기존에 분산되어 있던 다음 문서를 모두 병합하며, 모든 세부 정보·코드 예제·구현 방법을 보존합니다.  
> • `tdd-implementation-plan.md` • `tdd-implementation-plan-updated.md`  
> • `tdd-local-development.md` • `tdd-first-examples.md`

---

## 목차
1. [도입 목적](#1-도입-목적)  
2. [범위 및 우선순위](#2-범위-및-우선순위)  
3. [테스트 전략](#3-테스트-전략)  
4. [기술 스택 & 초기 셋업](#4-기술-스택--초기-셋업)  
5. [로컬 개발 & 모킹 환경](#5-로컬-개발--모킹-환경)  
6. [로드맵](#6-로드맵)  
7. [코드 커버리지 목표](#7-코드-커버리지-목표)  
8. [CI/CD 통합](#8-cicd-통합)  
9. [테스트 작성 가이드라인](#9-테스트-작성-가이드라인)  
10. [Shopify API 통합 패턴](#10-shopify-api-통합-패턴)  
11. [리스크 & 대응](#11-리스크--대응)  
12. [유지보수 정책](#12-유지보수-정책)  
13. [부록 A – 첫 TDD 예제](#부록a--첫-tdd-예제)  
14. [부록 B – 문제 해결](#부록b--문제-해결)  
15. [참고 자료](#참고-자료)

---

## 1. 도입 목적
| 목표 | 상세 설명 |
|------|-----------|
| 품질 향상 | **Red → Green → Refactor** 사이클로 결함을 조기에 제거하여 릴리즈 품질 극대화 |
| 변경 용이성 | UI/비즈니스 로직 변경 시 자동 회귀 테스트로 안정성 확보 |
| 실행 가능한 문서 | 테스트 케이스가 스펙(spec) 역할 → AI·신규 인력 온보딩 효율 증가 |
| 배포 안정성 | 모든 커밋은 자동 테스트 게이트를 통과해야만 프로덕션 배포 |

---

## 2. 범위 및 우선순위
| 단계 | 테스트 대상 | 우선순위 | 비고 |
|------|------------|----------|------|
| 1 | 핵심 React 컴포넌트: `Header`, `Cart`, `ProductGallery`, `VariantSelector` | **High** | UX·매출 직접 영향 |
| 2 | Shopify GraphQL 래퍼: `lib/shopify/*` | **High** | 재고·가격 정확도 |
| 3 | Next.js API Routes: `/api/checkout`, `/api/revalidate` | Medium | Webhook & 결제 |
| 4 | E2E Happy Path: **홈→PDP→Cart→Checkout** | Medium | Playwright |
| 5 | 장애/오류 플로우: 결제 실패, 429 재시도 | Low | Chaos / negative |

---

## 3. 테스트 전략
| 레이어 | 목적 | 도구 | 예시 |
|--------|------|------|------|
| Unit | 함수·훅·컴포넌트 단위 검증 | Jest + React Testing Library | `useCart()` 훅 |
| Integration | 컴포넌트 ↔ API 흐름 | Jest + **MSW** | AddToCart → Shopify Cart API |
| Contract | 외부 API 스키마 합의 유지 | **Pact** JS | `cartLinesAdd` 변동 감지 |
| E2E | 사용자 여정 전체 검증 | **Playwright** | 데스크탑·모바일 구매 |
| Visual (옵션) | UI 회귀 테스트 | Storybook + Chromatic | PDP 갤러리 스냅샷 |

모든 케이스는 **Given-When-Then** 패턴으로 작성해 PRD와 1:1 추적성을 확보한다.

---

## 4. 기술 스택 & 초기 셋업

### 4.1 의존성 설치
```bash
pnpm add -D \
  jest ts-jest @types/jest \
  @testing-library/react @testing-library/jest-dom \
  msw @mswjs/data \
  @pact-foundation/pact \
  @playwright/test \
  cross-env
```

### 4.2 Jest 설정
`jest.config.ts`
```ts
export default {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/$1' }
};
```
`jest.setup.ts`
```ts
import '@testing-library/jest-dom/extend-expect';
import { server } from './__mocks__/server';

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

### 4.3 Playwright 설정
`playwright.config.ts`
```ts
import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: '__tests__',
  retries: 1,
  use: { headless: true, viewport: { width: 1280, height: 720 } },
});
```

---

## 5. 로컬 개발 & 모킹 환경

### 5.1 목표
- Shopify 계정·백엔드 서비스 없이도 오프라인 개발/테스트
- **MSW** 하나로 브라우저·Node·CI 환경 일관성 유지
- 시드(Seed) 데이터·Fixtures를 활용한 예측 가능한 결과

### 5.2 환경 변수
| 변수 | 모킹값 | 실제값 |
|------|--------|--------|
| `NEXT_PUBLIC_USE_MOCKS` | `true` | `false` |
| `SHOPIFY_STOREFRONT_ACCESS_TOKEN` | `dummy` | `<real>` |
| `SHOPIFY_STORE_DOMAIN` | `mock.myshopify.com` | `<real>` |

`.env.development.local`
```
NEXT_PUBLIC_USE_MOCKS=true
SHOPIFY_STOREFRONT_ACCESS_TOKEN=dummy
SHOPIFY_STORE_DOMAIN=mock.myshopify.com
```

### 5.3 디렉터리 구조
```
__mocks__/
  handlers/
    shopifyHandlers.ts     # GraphQL 모킹
    backendHandlers.ts     # 내부 서비스 모킹
  browser.ts               # dev 서버용
  server.ts                # Jest/Playwright용
  fixtures/
    products.json
```

### 5.4 MSW 핸들러 예시
`__mocks__/handlers/shopifyHandlers.ts`
```ts
import { graphql } from 'msw';
import products from '../fixtures/products.json';

export const shopifyHandlers = [
  graphql.operation((req, res, ctx) => {
    const { query } = req.body as { query: string };

    // Product 리스트
    if (query.includes('getProductsQuery')) {
      return res(
        ctx.data({
          products: {
            edges: products.map(p => ({ node: p }))
          }
        }),
      );
    }

    // Product 상세
    if (query.includes('getProductQuery')) {
      return res(
        ctx.data({ product: products[0] })
      );
    }

    return res(ctx.errors([{ message: 'No handler' }]), ctx.status(500));
  })
];
```

### 5.5 브라우저/Node 초기화
`__mocks__/browser.ts`
```ts
import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';
export const worker = setupWorker(...handlers);
```
`__mocks__/server.ts`
```ts
import { setupServer } from 'msw/node';
import { handlers } from './handlers';
export const server = setupServer(...handlers);
```
`app/layout.tsx`(App Router)
```tsx
if (process.env.NEXT_PUBLIC_USE_MOCKS === 'true' && typeof window !== 'undefined') {
  import('../__mocks__/browser').then(({ worker }) =>
    worker.start({ onUnhandledRequest: 'bypass' })
  );
}
```

### 5.6 실행 스크립트
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

## 6. 로드맵
| Sprint | 작업 | 산출물 | 완료 기준 |
|--------|------|--------|-----------|
| 0 | 부트스트랩 | jest/playwright/MSW 설정 | `pnpm test` 통과 |
| 1 | `useCart` 훅 TDD | `useCart.test.tsx` | 커버리지 90% |
| 2 | Cart Pact 계약 | `cart.pact.json` | Pact broker green |
| 3 | PDP-Cart 통합 | `pdp-cart.integration.test.tsx` | MSW mock 사용 |
| 4 | E2E Happy Path | `checkout.e2e.spec.ts` | 모든 뷰포트 pass |
| 5 | 오류 플로우 | `payment-fail.e2e.spec.ts` | flaky 0 |

---

## 7. 코드 커버리지 목표
- **Unit + Integration ≥ 90 %**  
- 핵심 E2E 흐름 **100 %**  
- Codecov 뱃지 → PR 코멘트 표시

---

## 8. CI/CD 통합
`github/workflows/test.yml`
```yaml
name: test
on: [push, pull_request]
jobs:
  unit:
    runs-on: ubuntu-latest
    env: { NEXT_PUBLIC_USE_MOCKS: true }
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - run: pnpm install
      - run: pnpm test --coverage
  e2e:
    runs-on: ubuntu-latest
    env: { NEXT_PUBLIC_USE_MOCKS: true }
    steps:
      - uses: actions/checkout@v4
      - uses: microsoft/playwright-github-action@v1
```
- 모든 PR은 **unit + e2e** job 성공 시 병합  
- Staging 배포 전 워크플로우: `NEXT_PUBLIC_USE_MOCKS=false` 로 실제 통합 테스트

---

## 9. 테스트 작성 가이드라인
1. **AAA 패턴**: Arrange → Act → Assert  
2. **단일 행위 검증**: 복수 단언은 동일 행위 범위 내  
3. DOM 탐색은 **ARIA role** 우선, fallback 으로 `data-testid`  
4. Snapshot 테스트 최소화 (Storybook + Visual Regression 대체)  
5. 외부 네트워크 호출은 **반드시 MSW** 로 가로채기  
6. 실패 테스트(Red) 선행 → 최소 구현(Green) → 리팩터  
7. 통합·E2E 테스트는 비동기 처리 `await waitFor()` 사용

---

## 10. Shopify API 통합 패턴
| 패턴 | 설명 |
|------|------|
| Consumer-driven Pact | GraphQL Mutation 스키마 변경 시 CI 단계에서 실패 |
| MSW Runtime Mock | 로컬·CI 에서 외부 호출 차단, 빠른 테스트 |
| Rate-limit Simulation | 429 응답 + Retry-After 헤더 모킹으로 재시도 로직 검증 |

---

## 11. 리스크 & 대응
| 위험 | 영향 | 완화책 |
|------|------|--------|
| Shopify API 변경 | 구매 플로우 중단 | Nightly Pact 검증, 버전 핀 |
| 느린 테스트 | 배포 지연 | 캐시, 테스트 병렬화 |
| flaky E2E | 신뢰도 저하 | 네트워크 모킹·재시도, Playwright trace |

---

## 12. 유지보수 정책
- **새 기능 = 테스트 선행(Red)**  
- 코드 리뷰 체크리스트에 “테스트 포함” 항목  
- 실패 테스트 24 h 이내 FIX SLA  
- 분기마다 커버리지·가이드 라인 갱신  
- `__mocks__/handlers` 변경 시 PR에 테스트 증분 필요

---

## 부록 A – 첫 TDD 예제

### A.1 `useCart` 훅

#### 1) Red – 실패 테스트 작성
```tsx
import { renderHook, act } from '@testing-library/react';
import { CartProvider, useCart } from '../cart-context';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <CartProvider>{children}</CartProvider>
);

it('adds item and increases totalQuantity', () => {
  const { result } = renderHook(() => useCart(), { wrapper });

  act(() => result.current.addItem({ id: 'prod1', quantity: 1 }));

  expect(result.current.totalQuantity).toBe(1); // 💥 RED
});
```

#### 2) Green – 최소 구현
```tsx
const addItem = (line: Line) =>
  setState(s => ({ lines: [...s.lines, line] }));
const totalQuantity = state.lines.reduce((sum, l) => sum + l.quantity, 0);
```

#### 3) Refactor – 중복 ID 처리 & 추가 테스트
```tsx
const addItem = (line: Line) =>
  setState(s => {
    const ex = s.lines.find(l => l.id === line.id);
    return ex
      ? { lines: s.lines.map(l => l.id === line.id ? { ...l, quantity: l.quantity + line.quantity } : l) }
      : { lines: [...s.lines, line] };
  });
```

### A.2 E2E – 구매 플로우
`__tests__/checkout.e2e.spec.ts`
```ts
import { test, expect } from '@playwright/test';

test('user can purchase product', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: /sample product/i }).click();
  await page.getByRole('button', { name: /add to cart/i }).click();
  await page.getByRole('link', { name: /cart/i }).click();
  await expect(page.getByText(/subtotal/i)).toContainText('$');
});
```

---

## 부록 B – 문제 해결

| 증상 | 원인 | 해결 |
|------|------|------|
| 500 “No handler” | MSW 핸들러 미매칭 | 쿼리 문자열·오타 확인, `onUnhandledRequest:'warn'` 로 로그 |
| 실제 API 호출 | Worker 미시작 | `NEXT_PUBLIC_USE_MOCKS` 값 확인, 콘솔 `MSW worker started` 체크 |
| Playwright flaky | 네트워크 타임아웃 | 핸들러 `ctx.delay(500)` 삽입, 재시도 로직 추가 |

---

## 참고 자료
- MSW: https://mswjs.io  
- @mswjs/data: https://github.com/mswjs/data  
- Jest & React Testing Library Best Practices  
- Pact JS: https://docs.pact.io  
- Playwright: https://playwright.dev  
- Shopify Storefront API Docs  
