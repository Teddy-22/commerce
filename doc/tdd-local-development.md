# 🛠️ Local Development with Mocked Shopify & Backend APIs

> 목표  
> 프론트엔드 개발자가 **실제 Shopify 스토어, 결제 게이트웨이, 내부 마이크로서비스에 접근하지 않고도** 새 기능을 개발·테스트할 수 있도록 **MSW(Mock Service Worker)** 기반 모킹 환경을 구축한다.  
> 이 문서는 로컬 환경 설정, 모의(Mock) 데이터 관리, 실행 스크립트, CI 연동까지 단계별 가이드를 제공한다.

---

## 1. 개념 흐름

```text
┌──────────────────┐      Network Req.      ┌──────────────────┐
│ Next.js (localhost) │ ───────────────▶ │  MSW Mock Layer  │ ──┐
└──────────────────┘                       └──────────────────┘   │
          ▲                                                   │
          │                        실제 호출(선택)              │
          └───────────────────────────────────────────────────────┘
```

- 개발 모드에서 `fetch` / `GraphQL` 호출은 **MSW**가 가로채어 모의 응답을 반환  
- **실제 API 호출 또는 통신 차단** 여부는 **환경 변수**로 전환  
- 테스트(E2E 포함)·Storybook·Jest 모두 동일한 모킹 계층 사용 → 일관성 보장

---

## 2. 전제 조건

| 도구 | 버전(예시) |
|------|-----------|
| Node | ≥ 18 |
| pnpm | ≥ 8 |
| MSW | ^2.x |
| Vite/Next.js | Next 14 (App Router) |

---

## 3. 설치 및 기본 설정

```bash
pnpm add -D msw @mswjs/data
```

### 3.1 디렉터리 구조 제안

```
commerce/
└── __mocks__/
    ├── handlers/
    │   ├── shopifyHandlers.ts
    │   └── backendHandlers.ts
    ├── browser.ts       # 브라우저(개발 서버)용
    └── server.ts        # Node(Jest/Playwright)용
```

### 3.2 환경 변수

| 변수 | 개발(모킹) 값 | 실제 값 |
|------|---------------|---------|
| `USE_MOCKS` | `true` | `false` |
| `SHOPIFY_STORE_DOMAIN` | `mock-store.myshopify.com` | `<real>` |
| `SHOPIFY_STOREFRONT_ACCESS_TOKEN` | `mock-token` | `<real>` |

`.env.development.local` 예시
```
USE_MOCKS=true
SHOPIFY_STOREFRONT_ACCESS_TOKEN=dummy
SHOPIFY_STORE_DOMAIN=mock.myshopify.com
```

---

## 4. MSW 초기화

### 4.1 브라우저용(`__mocks__/browser.ts`)

```ts
import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

export const worker = setupWorker(...handlers);
```

### 4.2 Node용(`__mocks__/server.ts`)

```ts
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);
```

### 4.3 공통 핸들러 작성(`__mocks__/handlers/shopifyHandlers.ts`)

```ts
import { graphql } from 'msw';

export const shopifyHandlers = [
  graphql.operation((req, res, ctx) => {
    const { query } = req.body as { query: string };

    if (query.includes('getProductQuery')) {
      return res(
        ctx.data({
          product: {
            id: 'gid://shopify/Product/1',
            title: 'Mock Product',
            handle: 'mock-product',
            tags: [],
            images: { edges: [] },
            variants: { edges: [] },
            priceRange: {
              minVariantPrice: { amount: '1000', currencyCode: 'KRW' }
            }
          }
        })
      );
    }

    // Fallback
    return res(
      ctx.errors([{ message: 'No mock handler match' }]),
      ctx.status(500)
    );
  })
];
```

`__mocks__/handlers/index.ts`
```ts
import { shopifyHandlers } from './shopifyHandlers';
export const handlers = [...shopifyHandlers /*, ...backendHandlers */];
```

---

## 5. 애플리케이션 진입점에 모킹 로더 삽입

`app/layout.tsx` (또는 `pages/_app.tsx`) 상단:

```tsx
if (process.env.NEXT_PUBLIC_USE_MOCKS === 'true' && typeof window !== 'undefined') {
  // 실행 시점 한 번만
  import('../__mocks__/browser').then(({ worker }) => {
    worker.start({ onUnhandledRequest: 'bypass' });
    console.log('🔶 MSW worker started (browser)');
  });
}
```

Jest 세팅(`jest.setup.ts`):

```ts
import { server } from './__mocks__/server';

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

Playwright 설정(`playwright.config.ts`):

```ts
import { server } from './__mocks__/server';

export default defineConfig({
  // ...
  globalSetup: async () => {
    server.listen();
  },
  globalTeardown: async () => {
    server.close();
  }
});
```

---

## 6. 모의 데이터 관리

### 6.1 @mswjs/data 를 활용한 스키마 주도 Mock

```ts
import { factory, primaryKey } from '@mswjs/data';

export const db = factory({
  product: {
    id: primaryKey(String),
    title: String,
    price: Number,
    handle: String
  }
});

// 시드 데이터
db.product.create({
  id: '1',
  title: 'Seed Product',
  price: 10000,
  handle: 'seed-product'
});
```

### 6.2 JSON 파일 분리

`__mocks__/fixtures/products.json`
```json
[
  { "id": "1", "title": "Fixture Prod", "price": 5000, "handle": "fixture" }
]
```
핸들러에서 `import products from '../fixtures/products.json';`로 사용.

---

## 7. 실행 스크립트

`package.json`
```json
{
  "scripts": {
    "dev": "next dev",
    "dev:mock": "cross-env NEXT_PUBLIC_USE_MOCKS=true next dev",
    "test": "cross-env USE_MOCKS=true jest --coverage",
    "e2e": "cross-env USE_MOCKS=true playwright test"
  }
}
```

---

## 8. CI / CD 일관성

- **PR 파이프라인**: `USE_MOCKS=true` 로 Unit/Integration/E2E 수행 → 외부 의존성 제거  
- **Staging 배포 전 단계**: `USE_MOCKS=false` 로 실제 Shopify 환경과 통합 테스트  
- GitHub Actions 예:
```yaml
jobs:
  test-mock:
    env:
      USE_MOCKS: true
    ...
  test-real:
    if: github.event_name == 'workflow_dispatch'
    env:
      USE_MOCKS: false
      SHOPIFY_STOREFRONT_ACCESS_TOKEN: ${{ secrets.SHOPIFY_TOKEN }}
```

---

## 9. 신규 API 모킹 절차

1. **스키마 확인**: GraphQL 쿼리/뮤테이션 파라미터·응답 구조 파악  
2. **fixtures** 또는 `db.*.create()` 로 모의 데이터 정의  
3. **핸들러 함수 추가**  
   - 쿼리 문자열 포함 여부로 라우팅  
   - REST API라면 `rest.get('/api/xxx', ...)` 사용  
4. **테스트 작성 → 실패(RED)**  
5. **핸들러 → 코드 구현 → 테스트 통과(GREEN)**  
6. **리팩터 및 커버리지 확인**

---

## 10. 자주 발생하는 문제 & 해결

| 문제 | 증상 | 해결책 |
|------|------|--------|
| 핸들러 미매칭 | 500, "No mock handler match" | 쿼리 문자열 오타·버전 확인, `onUnhandledRequest` 를 `warn` 로 변경 후 로그 확인 |
| `fetch` 실제 전송 | 워커가 안 붙음 | 콘솔에 “MSW worker started” 로그 유무 확인, `NEXT_PUBLIC_USE_MOCKS` 변수 누락 |
| E2E flaky | Playwright 중 네트워크 타임아웃 | 핸들러 응답 지연 `ctx.delay(500)` 로 재현 & 코드 수정 |

---

## 11. 참고 자료

- [MSW 공식 문서](https://mswjs.io/)  
- [@mswjs/data](https://github.com/mswjs/data) – 임베디드 데이터베이스  
- [Shopify GraphQL Admin & Storefront API Docs](https://shopify.dev/docs/api)  

---

### ✅ 결과

이 가이드의 설정을 완료하면 **Shopify나 백엔드 서비스 없이도**:

- `pnpm dev:mock` 로 로컬 개발 서버 실행  
- `pnpm test` 로 모든 단위·통합 테스트 수행  
- `pnpm e2e` 로 Playwright 기반 시나리오 검증  

TDD 사이클을 빠르고 안정적으로 반복할 수 있습니다.  
