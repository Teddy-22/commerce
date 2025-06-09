import { render, screen } from '@testing-library/react';
import Price from '../components/price';
import { shopifyFetch } from '../lib/shopify';

// 기본 유틸리티 함수 테스트
describe('기본 테스트 환경 검증', () => {
  test('Jest가 정상적으로 작동합니다', () => {
    expect(1 + 1).toBe(2);
  });

  test('비동기 함수 테스트가 작동합니다', async () => {
    const asyncFunc = () => Promise.resolve('success');
    await expect(asyncFunc()).resolves.toBe('success');
  });

  test('모킹 함수가 작동합니다', () => {
    const mockFn = jest.fn().mockReturnValue('mocked');
    expect(mockFn()).toBe('mocked');
    expect(mockFn).toHaveBeenCalled();
  });
});

// React 컴포넌트 테스트
describe('Price 컴포넌트', () => {
  test('가격과 통화 코드를 올바르게 렌더링합니다', () => {
    render(<Price amount="10000" currencyCode="KRW" />);
    
    // 통화 기호와 금액이 표시되는지 확인
    // 참고: 정확한 형식은 브라우저 로케일에 따라 다를 수 있음
    expect(screen.getByText(/₩10,000/)).toBeInTheDocument();
    expect(screen.getByText('KRW')).toBeInTheDocument();
  });

  test('className prop이 적용됩니다', () => {
    render(<Price amount="10000" currencyCode="KRW" className="test-class" />);
    const priceElement = screen.getByText(/₩10,000/);
    expect(priceElement.parentElement).toHaveClass('test-class');
  });
});

// MSW를 사용한 API 모킹 테스트
describe('Shopify API 모킹', () => {
  test('shopifyFetch가 모킹된 응답을 반환합니다', async () => {
    // 상품 조회 API 호출
    const result = await shopifyFetch({
      query: `query getProduct($handle: String!) {
        product(handle: $handle) {
          id
          title
        }
      }`,
      variables: { handle: 'sample-product-1' }
    });

    // 응답 확인
    expect(result.status).toBe(200);
    expect(result.body.data.product).toBeDefined();
    expect(result.body.data.product.title).toBe('샘플 상품 1');
  });
});
