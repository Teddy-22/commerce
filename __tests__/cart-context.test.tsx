import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { CartProvider, useCart } from 'components/cart/cart-context';
import type { Product, ProductVariant } from 'lib/shopify/types';

// 테스트용 가짜 상품 데이터 생성 헬퍼
const createMockProduct = (id: string = '1'): Product => ({
  id,
  handle: `test-product-${id}`,
  availableForSale: true,
  title: `테스트 상품 ${id}`,
  description: '테스트 상품 설명',
  descriptionHtml: '<p>테스트 상품 설명</p>',
  options: [],
  priceRange: {
    maxVariantPrice: { amount: '100', currencyCode: 'KRW' },
    minVariantPrice: { amount: '100', currencyCode: 'KRW' }
  },
  variants: [],
  featuredImage: {
    url: `https://example.com/image-${id}.jpg`,
    altText: '테스트 이미지',
    width: 800,
    height: 600
  },
  images: [],
  seo: {
    title: '테스트 SEO 제목',
    description: '테스트 SEO 설명'
  },
  tags: [],
  updatedAt: new Date().toISOString()
});

// 테스트용 가짜 상품 바리언트 생성 헬퍼
const createMockVariant = (id: string = '1'): ProductVariant => ({
  id,
  title: `바리언트 ${id}`,
  availableForSale: true,
  selectedOptions: [{ name: '색상', value: '블루' }],
  price: { amount: '100', currencyCode: 'KRW' }
});

// CartProvider 래퍼 컴포넌트
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <CartProvider cartPromise={Promise.resolve(undefined)}>
    {children}
  </CartProvider>
);

describe('CartProvider와 useCart 훅 테스트', () => {
  // 테스트 케이스 1: 초기 빈 카트에 상품 추가
  it('초기 빈 카트에 상품을 추가하면 totalQuantity와 lines가 올바르게 업데이트된다', async () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    
    const mockProduct = createMockProduct();
    const mockVariant = createMockVariant();
    
    // 상품 추가 액션 실행
    act(() => {
      result.current.addCartItem(mockVariant, mockProduct);
    });
    
    // 검증
    expect(result.current.cart?.totalQuantity).toBe(1);
    expect(result.current.cart?.lines.length).toBe(1);
    expect(result.current.cart?.lines[0].merchandise.id).toBe(mockVariant.id);
    expect(result.current.cart?.lines[0].quantity).toBe(1);
  });

  // 테스트 케이스 2: 동일 상품 중복 추가 시 수량 증가
  it('카트에 이미 있는 상품을 다시 추가하면 수량이 증가하고 총액이 두 배가 된다', async () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    
    const mockProduct = createMockProduct();
    const mockVariant = createMockVariant();
    
    // 첫 번째 상품 추가
    act(() => {
      result.current.addCartItem(mockVariant, mockProduct);
    });
    
    const initialAmount = result.current.cart?.cost.totalAmount.amount;
    
    // 같은 상품 다시 추가
    act(() => {
      result.current.addCartItem(mockVariant, mockProduct);
    });
    
    // 검증
    expect(result.current.cart?.lines[0].quantity).toBe(2);
    expect(result.current.cart?.totalQuantity).toBe(2);
    expect(Number(result.current.cart?.cost.totalAmount.amount)).toBe(Number(initialAmount) * 2);
  });

  // 테스트 케이스 3: 상품 수량 감소
  it('카트에 있는 상품의 수량을 감소시키면 총액이 감소한다', async () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    
    const mockProduct = createMockProduct();
    const mockVariant = createMockVariant();
    
    // 상품 2개 추가
    act(() => {
      result.current.addCartItem(mockVariant, mockProduct);
      result.current.addCartItem(mockVariant, mockProduct);
    });
    
    const initialAmount = result.current.cart?.cost.totalAmount.amount;
    const initialQuantity = result.current.cart?.totalQuantity;
    
    // 수량 감소
    act(() => {
      result.current.updateCartItem(mockVariant.id, 'minus');
    });
    
    // 검증
    expect(result.current.cart?.lines[0].quantity).toBe(1);
    expect(result.current.cart?.totalQuantity).toBe(1);
    expect(Number(result.current.cart?.cost.totalAmount.amount)).toBe(Number(initialAmount) / 2);
  });

  // 테스트 케이스 4: 수량이 0이 되면 상품 제거
  it('카트에 있는 상품의 수량이 0이 되면 카트에서 제거된다', async () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    
    const mockProduct = createMockProduct();
    const mockVariant = createMockVariant();
    
    // 상품 1개 추가
    act(() => {
      result.current.addCartItem(mockVariant, mockProduct);
    });
    
    // 수량 감소하여 0으로 만들기
    act(() => {
      result.current.updateCartItem(mockVariant.id, 'minus');
    });
    
    // 검증
    expect(result.current.cart?.lines.length).toBe(0);
    expect(result.current.cart?.totalQuantity).toBe(0);
    expect(result.current.cart?.cost.totalAmount.amount).toBe('0');
  });

  // 테스트 케이스 5: CartProvider 없이 useCart 호출 시 에러 발생
  it('CartProvider 없이 useCart를 호출하면 에러가 발생한다', () => {
    // 에러가 발생할 것으로 예상
    expect(() => {
      renderHook(() => useCart());
    }).toThrow('useCart must be used within a CartProvider');
  });
});
