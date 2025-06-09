import { Pact, Matchers } from '@pact-foundation/pact';
import { pactOptions, testConfig } from '../test/pactSetup';
import {
  createCart,
  addToCart,
  updateCart,
  removeFromCart
} from '../lib/shopify';

// Matchers를 사용하여 유연한 응답 검증
const { like, eachLike } = Matchers;

// Pact 객체 생성
const provider = new Pact(pactOptions);

// 테스트 전역 설정
beforeAll(() => provider.setup());
afterAll(() => provider.finalize());
afterEach(() => provider.verify());

// 테스트 스위트
describe('Shopify Cart API Consumer Tests', () => {
  // 테스트 환경 설정
  beforeEach(() => {
    // 테스트 간 상태 격리를 위한 설정
    jest.resetModules();
    
    // 테스트에서 사용할 환경 변수 설정
    process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN = 'mock-token';
    process.env.SHOPIFY_STORE_DOMAIN = testConfig.mockServerUrl;
  });

  describe('createCart', () => {
    beforeEach(() => {
      return provider.addInteraction({
        state: 'cart is empty',
        uponReceiving: 'a cartCreate mutation',
        withRequest: {
          method: 'POST',
          path: testConfig.shopifyApiPath,
          headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Storefront-Access-Token': 'mock-token'
          },
          body: {
            query: like(expect.stringContaining('mutation createCart')),
            variables: like({ lineItems: null })
          }
        },
        willRespondWith: {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          body: {
            data: {
              cartCreate: {
                cart: {
                  id: like('gid://shopify/Cart/123'),
                  checkoutUrl: like('https://shop.example/cart/123'),
                  totalQuantity: like(0),
                  cost: {
                    subtotalAmount: {
                      amount: like('0.0'),
                      currencyCode: like('USD')
                    },
                    totalAmount: {
                      amount: like('0.0'),
                      currencyCode: like('USD')
                    },
                    totalTaxAmount: {
                      amount: like('0.0'),
                      currencyCode: like('USD')
                    }
                  },
                  lines: {
                    edges: like([])
                  }
                }
              }
            }
          }
        }
      });
    });

    it('should create a new cart', async () => {
      const result = await createCart();
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.cost).toBeDefined();
    });
  });

  describe('addToCart', () => {
    const mockCartId = 'gid://shopify/Cart/123';
    const mockMerchandiseId = 'gid://shopify/ProductVariant/456';
    
    beforeEach(() => {
      // 쿠키에서 cartId를 가져오는 부분 모킹
      jest.spyOn(require('next/cookies'), 'cookies').mockImplementation(() => ({
        get: () => ({ value: mockCartId })
      }));
      
      return provider.addInteraction({
        state: 'cart exists',
        uponReceiving: 'a cartLinesAdd mutation',
        withRequest: {
          method: 'POST',
          path: testConfig.shopifyApiPath,
          headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Storefront-Access-Token': 'mock-token'
          },
          body: {
            query: like(expect.stringContaining('mutation addToCart')),
            variables: {
              cartId: like(mockCartId),
              lines: like([{ merchandiseId: mockMerchandiseId, quantity: 1 }])
            }
          }
        },
        willRespondWith: {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          body: {
            data: {
              cartLinesAdd: {
                cart: {
                  id: like(mockCartId),
                  totalQuantity: like(1),
                  cost: {
                    subtotalAmount: {
                      amount: like('10.0'),
                      currencyCode: like('USD')
                    },
                    totalAmount: {
                      amount: like('10.0'),
                      currencyCode: like('USD')
                    },
                    totalTaxAmount: {
                      amount: like('0.0'),
                      currencyCode: like('USD')
                    }
                  },
                  lines: {
                    edges: eachLike({
                      node: {
                        id: like('gid://shopify/CartLine/789'),
                        quantity: like(1),
                        merchandise: {
                          id: like(mockMerchandiseId),
                          product: {
                            id: like('gid://shopify/Product/123')
                          }
                        }
                      }
                    })
                  }
                }
              }
            }
          }
        }
      });
    });

    it('should add items to cart', async () => {
      const result = await addToCart([{ merchandiseId: mockMerchandiseId, quantity: 1 }]);
      expect(result).toBeDefined();
      expect(result.id).toBe(mockCartId);
      expect(result.totalQuantity).toBe(1);
      expect(result.lines).toHaveLength(1);
    });
  });

  describe('updateCart', () => {
    const mockCartId = 'gid://shopify/Cart/123';
    const mockLineId = 'gid://shopify/CartLine/789';
    const mockMerchandiseId = 'gid://shopify/ProductVariant/456';
    
    beforeEach(() => {
      // 쿠키에서 cartId를 가져오는 부분 모킹
      jest.spyOn(require('next/cookies'), 'cookies').mockImplementation(() => ({
        get: () => ({ value: mockCartId })
      }));
      
      return provider.addInteraction({
        state: 'cart has items',
        uponReceiving: 'a cartLinesUpdate mutation',
        withRequest: {
          method: 'POST',
          path: testConfig.shopifyApiPath,
          headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Storefront-Access-Token': 'mock-token'
          },
          body: {
            query: like(expect.stringContaining('mutation editCartItems')),
            variables: {
              cartId: like(mockCartId),
              lines: like([
                { 
                  id: mockLineId, 
                  merchandiseId: mockMerchandiseId, 
                  quantity: 2 
                }
              ])
            }
          }
        },
        willRespondWith: {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          body: {
            data: {
              cartLinesUpdate: {
                cart: {
                  id: like(mockCartId),
                  totalQuantity: like(2),
                  cost: {
                    subtotalAmount: {
                      amount: like('20.0'),
                      currencyCode: like('USD')
                    },
                    totalAmount: {
                      amount: like('20.0'),
                      currencyCode: like('USD')
                    },
                    totalTaxAmount: {
                      amount: like('0.0'),
                      currencyCode: like('USD')
                    }
                  },
                  lines: {
                    edges: eachLike({
                      node: {
                        id: like(mockLineId),
                        quantity: like(2),
                        merchandise: {
                          id: like(mockMerchandiseId),
                          product: {
                            id: like('gid://shopify/Product/123')
                          }
                        }
                      }
                    })
                  }
                }
              }
            }
          }
        }
      });
    });

    it('should update cart items', async () => {
      const result = await updateCart([
        { id: mockLineId, merchandiseId: mockMerchandiseId, quantity: 2 }
      ]);
      expect(result).toBeDefined();
      expect(result.id).toBe(mockCartId);
      expect(result.totalQuantity).toBe(2);
      expect(result.lines).toHaveLength(1);
      expect(result.lines[0].quantity).toBe(2);
    });
  });

  describe('removeFromCart', () => {
    const mockCartId = 'gid://shopify/Cart/123';
    const mockLineId = 'gid://shopify/CartLine/789';
    
    beforeEach(() => {
      // 쿠키에서 cartId를 가져오는 부분 모킹
      jest.spyOn(require('next/cookies'), 'cookies').mockImplementation(() => ({
        get: () => ({ value: mockCartId })
      }));
      
      return provider.addInteraction({
        state: 'cart has items',
        uponReceiving: 'a cartLinesRemove mutation',
        withRequest: {
          method: 'POST',
          path: testConfig.shopifyApiPath,
          headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Storefront-Access-Token': 'mock-token'
          },
          body: {
            query: like(expect.stringContaining('mutation removeFromCart')),
            variables: {
              cartId: like(mockCartId),
              lineIds: like([mockLineId])
            }
          }
        },
        willRespondWith: {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          body: {
            data: {
              cartLinesRemove: {
                cart: {
                  id: like(mockCartId),
                  totalQuantity: like(0),
                  cost: {
                    subtotalAmount: {
                      amount: like('0.0'),
                      currencyCode: like('USD')
                    },
                    totalAmount: {
                      amount: like('0.0'),
                      currencyCode: like('USD')
                    },
                    totalTaxAmount: {
                      amount: like('0.0'),
                      currencyCode: like('USD')
                    }
                  },
                  lines: {
                    edges: like([])
                  }
                }
              }
            }
          }
        }
      });
    });

    it('should remove items from cart', async () => {
      const result = await removeFromCart([mockLineId]);
      expect(result).toBeDefined();
      expect(result.id).toBe(mockCartId);
      expect(result.totalQuantity).toBe(0);
      expect(result.lines).toHaveLength(0);
    });
  });
});
