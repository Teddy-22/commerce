---
id: TDD-045
title: "E2E test – Mobile purchase flow (Home ➜ PDP ➜ Cart ➜ Checkout)"
dependsOn:
  - TDD-030        # Integration PDP→Cart must be done
status: "open"
owner: ""
estimate: "6h"
---

## 목적
모바일(뷰포트 ≤ 414 px) 환경에서 **홈 → 상품 상세 → 장바구니 → Shopify 체크아웃**까지의 **Happy Path**를 **Playwright**로 검증한다.  
데스크탑 시나리오(TDD-040)와 **병렬**로 진행 가능하며, 모바일 전용 UI(버거 메뉴, 하단 바, 스크롤 등)의 동작을 추가로 확인한다.

## 범위
1. iPhone X(375 × 812) 뷰포트 고정  
2. **홈(/)** 접속 → 모바일 **버거 메뉴** 확인 및 상품 카드 탭 → PDP 이동  
3. **바리언트 선택**(선택지 존재 시) → **Add To Cart**  
4. **Cart Modal**(하단 슬라이드) → **View Cart** 클릭  
5. **장바구니 페이지** → **Checkout** 버튼 → Shopify Checkout URL 리디렉션  
6. UI 검증: 장바구니 뱃지·subtotal·모바일 네비게이션 표시  
7. Playwright trace & video 기록

## 수용 기준 (Given / When / Then)
| Given | When | Then |
|-------|------|------|
| 모바일 홈 진입 | 햄버거 메뉴 아이콘 탭 | 메뉴 drawer 노출 (`aria-label="menu"`) |
| 홈 스크롤 | 첫 상품 카드 탭 | URL `/product/<handle>` 로 이동 |
| PDP | Add To Cart 탭 | 장바구니 뱃지 `1`, mobile toast 표시 |
| Cart Modal | View Cart 탭 | `/cart` 페이지 로드, subtotal 금액 노출 |
| Cart Page | Checkout 탭 | URL 에 `checkout` 포함, HTTP 200 |

## 작업 체크리스트
- [ ] Playwright test `__tests__/checkout-mobile.e2e.spec.ts`
- [ ] `@mobile` tag, viewport `{ width: 375, height: 812 }`
- [ ] 전역 env `NEXT_PUBLIC_USE_MOCKS=true`
- [ ] MSW 핸들러 재사용(040) – 필요 시 이미지·collection mock 추가
- [ ] 단계별 `expect` 로 aria-role·text 검증
- [ ] 햄버거 메뉴: `page.getByRole('button', { name:/open menu/i })`
- [ ] 모달/스크롤: `page.getByRole('dialog')` 존재 확인
- [ ] Checkout 리디렉션 확인 후 `page.title()` 포함 `Checkout`
- [ ] Playwright config `projects.mobile` 추가 (trace, video)
- [ ] CI workflow에 `--grep @mobile` 포함

## 병렬성 & 의존성
- **TDD-030** 완료 후 즉시 시작 가능  
- **TDD-040**(데스크탑)과 **완전히 병렬**  
- 실패 시 모바일-특화 스타일/레이아웃 문제만 수정, 데스크탑 영향 최소화

## 구현 가이드 (예시)
```ts
test.use({ viewport: { width: 375, height: 812 }, tag: '@mobile' });

test('mobile user can purchase product', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /open menu/i }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('link', { name: /sample product/i }).click();

  const add = page.getByRole('button', { name: /add to cart/i });
  await add.tap();             // mobile tap
  await expect(page.getByTestId('cart-badge')).toHaveText('1');

  // Cart modal slide-up
  await page.getByRole('button', { name: /view cart/i }).tap();
  await expect(page).toHaveURL(/\/cart/);
  await page.getByRole('button', { name: /checkout/i }).tap();
  await expect(page).toHaveURL(/checkout/);
});
```

## 산출물
- `checkout-mobile.e2e.spec.ts` 통과
- Trace/비디오 파일 저장 (`test-results/`)
- CI job 녹색
- PR: `test: add mobile E2E checkout (TDD-045)` + `Closes #TDD-045`

## 참고
- TDD-040(데스크탑) 테스트 구조
- `doc/tdd-master-plan.md` § E2E 테스트 전략
- Playwright Mobile Testing docs: https://playwright.dev/docs/mobile
