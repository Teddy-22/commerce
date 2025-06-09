import { test, expect } from '@playwright/test';

/**
 * 기본 E2E 테스트 예제
 * 
 * 이 파일은 Playwright를 사용한 E2E 테스트의 기본 예제를 제공합니다.
 * MSW 모킹 환경과 함께 작동하며, 핵심 사용자 플로우를 테스트합니다.
 */

test.describe('기본 E2E 테스트', () => {
  // 각 테스트 전에 홈페이지 방문
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('홈페이지가 올바르게 로드됩니다', async ({ page }) => {
    // 페이지 제목 확인
    await expect(page).toHaveTitle(/Commerce/);
    
    // 핵심 UI 요소 확인
    await expect(page.locator('nav')).toBeVisible();
    await expect(page.locator('footer')).toBeVisible();
  });

  test('상품 페이지로 이동할 수 있습니다', async ({ page }) => {
    // 첫 번째 상품 클릭 (모킹된 데이터에 의존)
    await page.click('a[href*="/product/"]');
    
    // 상품 페이지로 이동했는지 확인
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('button', { hasText: /장바구니에 추가/i })).toBeVisible();
  });

  test('장바구니에 상품을 추가하고 확인할 수 있습니다', async ({ page }) => {
    // 상품 페이지로 이동
    await page.click('a[href*="/product/"]');
    
    // 장바구니에 추가 버튼 클릭
    await page.click('button:has-text("장바구니에 추가")');
    
    // 장바구니 아이콘 클릭하여 장바구니 열기
    await page.click('button[aria-label="Open cart"]');
    
    // 장바구니에 상품이 있는지 확인
    await expect(page.locator('[data-testid="cart-item"]')).toBeVisible();
    
    // 장바구니 닫기
    await page.click('button[aria-label="Close cart"]');
  });

  test('검색 기능이 작동합니다', async ({ page }) => {
    // 검색 버튼 클릭
    await page.click('button[aria-label="Open search"]');
    
    // 검색어 입력
    await page.fill('input[type="search"]', '샘플');
    
    // 검색 실행 (Enter 키 누름)
    await page.keyboard.press('Enter');
    
    // 검색 결과 페이지로 이동했는지 확인
    await expect(page.url()).toContain('/search');
    
    // 검색 결과가 표시되는지 확인
    await expect(page.locator('main')).toBeVisible();
  });

  test('반응형 디자인이 모바일에서 작동합니다', async ({ page }) => {
    // 모바일 화면 크기로 설정
    await page.setViewportSize({ width: 390, height: 844 });
    
    // 모바일 메뉴 버튼이 표시되는지 확인
    await expect(page.locator('button[aria-label="Open menu"]')).toBeVisible();
    
    // 모바일 메뉴 열기
    await page.click('button[aria-label="Open menu"]');
    
    // 모바일 메뉴가 표시되는지 확인
    await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
  });
});
