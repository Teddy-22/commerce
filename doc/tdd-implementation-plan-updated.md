# 🧪 Test-Driven Development (TDD) Implementation Plan (Updated)

> Next.js + Shopify 통합 e-commerce 프로젝트  
> 버전: 2025-06-09 (로컬 모킹 요구사항 반영)

---

## 1. 도입 목적
| 목표 | 세부 설명 |
|------|-----------|
| 품질 향상 | 기능 개발 단계에서 결함 조기 발견 → 리팩터링 비용 최소화 |
| 변경 용이성 | 제품/가격 정책·UI 개편 시 회귀 위험 감소 |
| 문서화 대체 | 테스트 케이스가 실행 가능한 사양(spec) 역할 |
| 배포 안정성 | CI 파이프라인에서 테스트가 모든 커밋을 게이트 처리 |

---

## 2. 범위 및 우선순위
| 단계 | 범위 | 우선순위 | 비고 |
|------|------|----------|------|
| 1 | 핵심 React 컴포넌트 (Header, Cart, ProductGallery, VariantSelector) | High | UX·매출 직접 영향 |
| 2 | Shopify GraphQL 쿼리/뮤테이션 래퍼 (`lib/shopify/*`) | High | 재고·가격 정확도 |
| 3 | Next.js API Routes (`/api/checkout`, `/api/revalidate`) | Medium | Webhook 연동 |
| 4 | 전 페이지 E2E Happy Path (홈→PDP→Cart→Checkout) | Medium | Playwright |
| 5 | 장애·오류 플로우 (결제 실패, Rate-limit 429) | Low | Chaos/negative |

---

## 3. 테스트 전략
| 레이어 | 목적 | 도구 | 예시 |
|--------|------|------|------|
| Unit | 함수·훅·컴포넌트 검증 | Jest + RTL | `useCart()` |
| Integration | 컴포넌트 ↔ API 통합 | Jest + MSW | AddToCart→Shopify |
| Contract | 외부 API 스키마 유지 | Pact | cartLinesAdd |
| E2E | 사용자 여정 | Playwright | 구매 완료 |
| Visual (옵션) | UI 회귀 | Storybook + Chromatic | PDP |

모든 테스트 케이스는 Given-When-Then 서술 방식 사용.

---

## 4. 기술 스택 & 초기 셋업
| 영역 | 선택 도구 |
|------|-----------|
| Test Runner | Jest (ts-jest) |
| React Testing | React Testing Library |
| Mocking | MSW |
| Contract | Pact JS |
| E2E | Playwright |
| Coverage | Istanbul |
| CI | GitHub Actions / Vercel CI |

---

## 5. 구현 로드맵
| Sprint | 작업 | 산출물 | 완료 기준 |
|--------|------|--------|-----------|
| 0 | 테스트 프레임워크 부트스트랩 | jest.config.ts, playwright.config.ts | `pnpm test` 통과 |
| 1 | `useCart` 훅 Red→Green | `useCart.test.tsx` | 커버리지 90 %+ |
| 2 | Shopify Cart consumer pact | `cart.pact.json` | Pact broker 검증 |
| 3 | PDP→Cart 통합 테스트 | `pdp-cart.integration.test.tsx` | MSW mock 사용 |
| 4 | 첫 E2E 시나리오 | `checkout.e2e.spec.ts` | Playwright pass |
| 5 | 실패 플로우 & mobile | `payment-fail.e2e.spec.ts` | flaky 0 |

---

## 6. 코드 커버리지 목표
- Unit+Integration ≥ **90 %**
- 핵심 E2E 시나리오 100 %

---

## 7. 테스트 작성 가이드라인
1. AAA(Arrange-Act-Assert) 패턴  
2. 단일 행위 검증  
3. DOM 접근은 role / data-testId 사용  
4. Snapshot 최소화 (Storybook으로 대체)  
5. Shopify 호출은 **반드시 MSW mock** 사용

---

## 8. CI / CD 통합
```yaml
# .github/workflows/test.yml
jobs:
  unit:
    runs-on: ubuntu-latest
    env:
      USE_MOCKS: true
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - run: pnpm install
      - run: pnpm test --coverage
  e2e:
    runs-on: ubuntu-latest
    env:
      USE_MOCKS: true
    steps:
      - uses: actions/checkout@v4
      - uses: microsoft/playwright-github-action@v1
```
- Preview 배포 전 **모든 job** 통과 필수  
- Staging 환경에서는 `USE_MOCKS=false` 로 실제 통합 테스트 수행

---

## 9. Shopify API 통합 테스트 패턴
| 패턴 | 설명 |
|------|------|
| Consumer Pact | GraphQL Mutation 계약 테스트 |
| MSW Runtime Mock | 개발/CI에서 외부 호출 차단 |
| Rate-limit Simulation | 429 응답 후 재시도 로직 테스트 |

---

## 10. 리스크 & 대응
| 위험 | 영향 | 대응 |
|------|------|------|
| 외부 API 변경 | 구매 플로우 중단 | Pact nightly |
| 느린 테스트 | 배포 지연 | 병렬화 / 캐시 |
| flaky E2E | 신뢰도 저하 | 네트워크 모킹 강화 |

---

## 11. 유지보수 정책
- 새 기능은 **테스트 선행**(Red)  
- PR 체크리스트에 테스트 항목  
- 실패 테스트 24 h 내 수정  
- 분기별 커버리지 검토

---

## 12. 로컬 개발 환경에서 Shopify & 백엔드 모킹

### 12.1 목표
- 실제 Shopify 스토어 없이 프론트 기능 개발 가능  
- 오프라인 상태에서도 Unit/Integration/E2E 실행  
- 개발·테스트·CI 모두 동일 MSW 핸들러 사용

### 12.2 설치
```bash
pnpm add -D msw @mswjs/data cross-env
```

### 12.3 환경 변수
| 변수 | 모킹 값 | 실제 값 |
|------|---------|---------|
| NEXT_PUBLIC_USE_MOCKS | `true` | `false` |
| SHOPIFY_STOREFRONT_ACCESS_TOKEN | `dummy` | real |
| SHOPIFY_STORE_DOMAIN | mock.myshopify.com | real |

`.env.development.local`
```
NEXT_PUBLIC_USE_MOCKS=true
SHOPIFY_STOREFRONT_ACCESS_TOKEN=dummy
SHOPIFY_STORE_DOMAIN=mock.myshopify.com
```

### 12.4 디렉터리 구조
```
__mocks__/
  handlers/
    shopifyHandlers.ts
    backendHandlers.ts
  browser.ts   # dev 서버
  server.ts    # Jest/Playwright
```

### 12.5 브라우저 초기화
`app/layout.tsx` (또는 `_app.tsx`)
```tsx
if (process.env.NEXT_PUBLIC_USE_MOCKS === 'true' && typeof window !== 'undefined') {
  import('../__mocks__/browser').then(({ worker }) => {
    worker.start({ onUnhandledRequest: 'bypass' });
    console.log('🔶 MSW worker started');
  });
}
```

### 12.6 Jest 설정
`jest.setup.ts`
```ts
import { server } from '../__mocks__/server';
beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

### 12.7 실행 스크립트
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

### 12.8 모의 데이터 관리
- `@mswjs/data` 사용하여 db 팩토리 생성  
- 또는 `__mocks__/fixtures/*.json` 활용  
- 테스트마다 `server.resetHandlers()` 로 상태 초기화

### 12.9 자주 발생하는 문제
| 문제 | 증상 | 해결 |
|------|------|------|
| 핸들러 미매칭 | 500 응답 | 쿼리 문자열 · 핸들러 오타 확인 |
| 실제 호출 발생 | MSW 미동작 | env 변수·worker 로그 확인 |
| flaky E2E | 타임아웃 | `ctx.delay`로 재현 후 코드 개선 |

---

## 13. 참고 자료
- MSW 공식 문서  
- @mswjs/data 가이드  
- Shopify Storefront API Docs  

---

> **결론**  
> 본 계획을 통해 개발자는 로컬에서 **모킹된 Shopify/백엔드** 환경으로 빠르게 TDD 사이클을 반복하고, CI에서 동일한 핸들러를 사용하여 안정적인 배포 파이프라인을 구축할 수 있습니다.  
