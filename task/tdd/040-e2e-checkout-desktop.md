---
id: TDD-040
title: "E2E test – Desktop purchase flow (Home ➜ PDP ➜ Cart ➜ Checkout)"
dependsOn:
  - TDD-030        # Integration PDP→Cart must be done
status: "open"
owner: ""
estimate: "6h"
---

## 목적
데스크탑 환경(뷰포트 ≥ 1280×720)에서 **홈페이지부터 Shopify 체크아웃 URL 이동**까지의 전체 구매 플로우를 **Playwright** 기반 E2E 테스트로 검증한다.  
- 핵심 사용자 여정(**Happy Path**)이 회귀 없이 동작하는지 보장  
- 통합 테스트 범위를 넘어 실제 라우팅·UI·네비게이션을 검증  
- MSW 모킹으로 Shopify API 의존성 제거, 결제 단계는 Checkout URL 리디렉션 확인으로 대체

## 범위
1. **홈(/)** 접속 → 첫 번째 상품 클릭(PDP 이동)  
2. **바리언트 선택**(필요 시) 및 **Add To Cart**  
3. **Cart Modal 열기** → **Cart Page 이동**  
4. **Checkout** 버튼 클릭 → `expect(page).toHaveURL(/checkout/)`  
5. 총 결제 금액, 라인 수, 수량 등 UI 어설션  
6. 데스크탑 뷰포트(1280×800) 고정, `tracing` / `video` artifacts 저장

## 수용 기준 (Given / When / Then)
| Given | When | Then |
|-------|------|------|
| 홈 접속 | 첫 상품 썸네일 클릭 | URL `/product/<handle>` 로 이동 |
| PDP | Add To Cart 클릭 | Cart badge 숫자 1 로 업데이트 |
| Cart Modal | “View Cart” 클릭 | `/cart` 페이지, Subtotal \$ 표시 |
| Cart Page | Checkout 클릭 | URL `https://*.myshopify.com/*/checkout` 패턴 |
| Checkout URL |  | HTTP 200 & `page.title()` 포함 `Checkout` |

## 작업 체크리스트
- [ ] Playwright test file `__tests__/checkout-desktop.e2e.spec.ts`
- [ ] `test.describe('@desktop')` 태그, viewport `{ width:1280, height:800 }`
- [ ] MSW 서버 전역 설정(`NEXT_PUBLIC_USE_MOCKS=true`)
  - [ ] 홈 3개 상품 응답 mock (`hidden-homepage-featured-items`)
  - [ ] PDP `getProductQuery` / cart mutations mock
- [ ] Step 1: `await page.goto('/')` → 썸네일 `getByRole('link')` 클릭
- [ ] Step 2: 옵션 필요 시 `selectOption` 사용
- [ ] Step 3: 장바구니 뱃지 `toHaveText('1')`
- [ ] Step 4: `/cart` page → `getByRole('button',{name:/checkout/i})`
- [ ] Step 5: `await expect(page).toHaveURL(/checkout/)`
- [ ] Add Playwright config `projects.desktop` if multiple viewports planned
- [ ] Update CI workflow: include `--grep @desktop`
- [ ] Artifacts: enable `recordVideo` and `trace` for easier debug

## 병렬성 & 의존성
- **TDD-030** 완료 후 착수  
- **TDD-045**(Mobile viewport) 와 **병렬 진행** 가능  
- 실패 시 원인 파악 후 MSW 핸들러/통합 로직 수정 → 다른 태스크 영향 최소화

## 구현 가이드
```ts
test.use({ viewport: { width: 1280, height: 800 } });

test('desktop user can complete purchase flow', async ({ page }) => {
  // Step 1 – Home
  await page.goto('/');
  await page.getByRole('link', { name: /sample product/i }).click();

  // Step 2 – PDP
  const add = page.getByRole('button', { name: /add to cart/i });
  await add.click();
  await expect(page.getByTestId('cart-badge')).toHaveText('1');

  // Step 3 – Cart page
  await page.getByRole('link', { name: /cart/i }).click();
  await expect(page.url()).toContain('/cart');
  await page.getByRole('button', { name: /checkout/i }).click();

  // Step 4 – Shopify checkout redirect
  await expect(page).toHaveURL(/checkout/);
});
```

## 산출물
- `checkout-desktop.e2e.spec.ts` 통과
- Playwright trace/video artifacts (`test-results/`)
- CI job 녹색
- PR: `test: add desktop E2E checkout (TDD-040)` + `Closes #TDD-040`

## 참고
- `task/tdd/030-integration-pdp-cart.md`
- `doc/tdd-master-plan.md` § 로컬 개발 & 모킹 환경
- Playwright Docs – Tracing & CI Integration
