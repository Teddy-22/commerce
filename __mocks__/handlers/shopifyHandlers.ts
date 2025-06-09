import { http, graphql, HttpResponse } from 'msw';
import { SHOPIFY_GRAPHQL_API_ENDPOINT } from 'lib/constants';

// 모킹 데이터 정의
const mockProducts = [
  {
    id: 'gid://shopify/Product/1',
    handle: 'sample-product-1',
    title: '샘플 상품 1',
    description: '이것은 첫 번째 샘플 상품입니다.',
    descriptionHtml: '<p>이것은 첫 번째 샘플 상품입니다.</p>',
    options: [
      {
        id: 'gid://shopify/ProductOption/1',
        name: '색상',
        values: ['빨강', '파랑', '검정']
      },
      {
        id: 'gid://shopify/ProductOption/2',
        name: '사이즈',
        values: ['S', 'M', 'L']
      }
    ],
    priceRange: {
      minVariantPrice: {
        amount: '10000',
        currencyCode: 'KRW'
      },
      maxVariantPrice: {
        amount: '15000',
        currencyCode: 'KRW'
      }
    },
    variants: {
      edges: [
        {
          node: {
            id: 'gid://shopify/ProductVariant/1',
            title: '빨강 / S',
            availableForSale: true,
            selectedOptions: [
              { name: '색상', value: '빨강' },
              { name: '사이즈', value: 'S' }
            ],
            price: {
              amount: '10000',
              currencyCode: 'KRW'
            }
          }
        },
        {
          node: {
            id: 'gid://shopify/ProductVariant/2',
            title: '파랑 / M',
            availableForSale: true,
            selectedOptions: [
              { name: '색상', value: '파랑' },
              { name: '사이즈', value: 'M' }
            ],
            price: {
              amount: '12000',
              currencyCode: 'KRW'
            }
          }
        }
      ]
    },
    images: {
      edges: [
        {
          node: {
            url: 'https://cdn.shopify.com/mock-image-1.jpg',
            altText: '샘플 상품 1 이미지',
            width: 800,
            height: 800
          }
        }
      ]
    },
    seo: {
      title: '샘플 상품 1',
      description: '이것은 첫 번째 샘플 상품입니다.'
    },
    tags: ['신상품', '인기상품'],
    updatedAt: new Date().toISOString()
  },
  {
    id: 'gid://shopify/Product/2',
    handle: 'sample-product-2',
    title: '샘플 상품 2',
    description: '이것은 두 번째 샘플 상품입니다.',
    descriptionHtml: '<p>이것은 두 번째 샘플 상품입니다.</p>',
    options: [
      {
        id: 'gid://shopify/ProductOption/3',
        name: '색상',
        values: ['흰색', '검정']
      }
    ],
    priceRange: {
      minVariantPrice: {
        amount: '20000',
        currencyCode: 'KRW'
      },
      maxVariantPrice: {
        amount: '20000',
        currencyCode: 'KRW'
      }
    },
    variants: {
      edges: [
        {
          node: {
            id: 'gid://shopify/ProductVariant/3',
            title: '흰색',
            availableForSale: true,
            selectedOptions: [
              { name: '색상', value: '흰색' }
            ],
            price: {
              amount: '20000',
              currencyCode: 'KRW'
            }
          }
        }
      ]
    },
    images: {
      edges: [
        {
          node: {
            url: 'https://cdn.shopify.com/mock-image-2.jpg',
            altText: '샘플 상품 2 이미지',
            width: 800,
            height: 800
          }
        }
      ]
    },
    seo: {
      title: '샘플 상품 2',
      description: '이것은 두 번째 샘플 상품입니다.'
    },
    tags: ['신상품'],
    updatedAt: new Date().toISOString()
  }
];

const mockCollections = [
  {
    id: 'gid://shopify/Collection/1',
    handle: 'new-arrivals',
    title: '신상품',
    description: '새롭게 입고된 상품들',
    descriptionHtml: '<p>새롭게 입고된 상품들</p>',
    seo: {
      title: '신상품',
      description: '새롭게 입고된 상품들'
    },
    updatedAt: new Date().toISOString(),
    products: {
      edges: [
        { node: mockProducts[0] },
        { node: mockProducts[1] }
      ]
    }
  },
  {
    id: 'gid://shopify/Collection/2',
    handle: 'best-sellers',
    title: '인기상품',
    description: '가장 인기있는 상품들',
    descriptionHtml: '<p>가장 인기있는 상품들</p>',
    seo: {
      title: '인기상품',
      description: '가장 인기있는 상품들'
    },
    updatedAt: new Date().toISOString(),
    products: {
      edges: [
        { node: mockProducts[0] }
      ]
    }
  }
];

// 장바구니 상태 관리를 위한 변수
let mockCart = {
  id: 'gid://shopify/Cart/mock-cart-id',
  checkoutUrl: 'https://mock.myshopify.com/cart/checkout',
  totalQuantity: 0,
  lines: {
    edges: []
  },
  cost: {
    subtotalAmount: {
      amount: '0',
      currencyCode: 'KRW'
    },
    totalAmount: {
      amount: '0',
      currencyCode: 'KRW'
    },
    totalTaxAmount: {
      amount: '0',
      currencyCode: 'KRW'
    }
  },
  attributes: [],
  discountCodes: []
};

// 장바구니 계산 함수
const recalculateCart = () => {
  let subtotal = 0;
  let totalQuantity = 0;
  
  mockCart.lines.edges.forEach(edge => {
    const { quantity, merchandise } = edge.node;
    const price = parseFloat(merchandise.price.amount);
    subtotal += price * quantity;
    totalQuantity += quantity;
  });
  
  mockCart.totalQuantity = totalQuantity;
  mockCart.cost.subtotalAmount.amount = subtotal.toString();
  mockCart.cost.totalAmount.amount = subtotal.toString();
  mockCart.cost.totalTaxAmount.amount = '0';
  
  return mockCart;
};

// Shopify GraphQL API 엔드포인트
const endpoint = `https://mock.myshopify.com${SHOPIFY_GRAPHQL_API_ENDPOINT}`;

// GraphQL 핸들러 정의
export const shopifyHandlers = [
  // 장바구니 생성
  graphql.mutation('cartCreate', () => {
    mockCart = {
      id: 'gid://shopify/Cart/mock-cart-id',
      checkoutUrl: 'https://mock.myshopify.com/cart/checkout',
      totalQuantity: 0,
      lines: {
        edges: []
      },
      cost: {
        subtotalAmount: {
          amount: '0',
          currencyCode: 'KRW'
        },
        totalAmount: {
          amount: '0',
          currencyCode: 'KRW'
        },
        totalTaxAmount: {
          amount: '0',
          currencyCode: 'KRW'
        }
      },
      attributes: [],
      discountCodes: []
    };
    
    return HttpResponse.json({
      data: {
        cartCreate: {
          cart: mockCart,
          userErrors: []
        }
      }
    });
  }),
  
  // 장바구니 조회
  graphql.query('getCart', ({ variables }) => {
    const { cartId } = variables;
    
    if (cartId !== 'mock-cart-id') {
      return HttpResponse.json({
        data: {
          cart: null
        }
      });
    }
    
    return HttpResponse.json({
      data: {
        cart: mockCart
      }
    });
  }),
  
  // 장바구니에 상품 추가
  graphql.mutation('cartLinesAdd', ({ variables }) => {
    const { cartId, lines } = variables;
    
    if (cartId !== 'mock-cart-id') {
      return HttpResponse.json({
        data: {
          cartLinesAdd: {
            cart: null,
            userErrors: [{ message: '장바구니를 찾을 수 없습니다.' }]
          }
        }
      });
    }
    
    lines.forEach(line => {
      const { merchandiseId, quantity } = line;
      
      // 상품 찾기
      const productVariant = mockProducts
        .flatMap(p => p.variants.edges)
        .find(v => v.node.id === merchandiseId);
      
      if (productVariant) {
        // 이미 장바구니에 있는지 확인
        const existingLineIndex = mockCart.lines.edges.findIndex(
          e => e.node.merchandise.id === merchandiseId
        );
        
        if (existingLineIndex >= 0) {
          // 수량 증가
          mockCart.lines.edges[existingLineIndex].node.quantity += quantity;
        } else {
          // 새 항목 추가
          mockCart.lines.edges.push({
            node: {
              id: `gid://shopify/CartLine/${Date.now()}`,
              quantity,
              merchandise: {
                id: merchandiseId,
                title: productVariant.node.title,
                selectedOptions: productVariant.node.selectedOptions,
                product: {
                  id: mockProducts.find(p => 
                    p.variants.edges.some(v => v.node.id === merchandiseId)
                  )?.id,
                  title: mockProducts.find(p => 
                    p.variants.edges.some(v => v.node.id === merchandiseId)
                  )?.title,
                  handle: mockProducts.find(p => 
                    p.variants.edges.some(v => v.node.id === merchandiseId)
                  )?.handle,
                  images: mockProducts.find(p => 
                    p.variants.edges.some(v => v.node.id === merchandiseId)
                  )?.images
                },
                price: productVariant.node.price
              }
            }
          });
        }
      }
    });
    
    recalculateCart();
    
    return HttpResponse.json({
      data: {
        cartLinesAdd: {
          cart: mockCart,
          userErrors: []
        }
      }
    });
  }),
  
  // 장바구니에서 상품 제거
  graphql.mutation('cartLinesRemove', ({ variables }) => {
    const { cartId, lineIds } = variables;
    
    if (cartId !== 'mock-cart-id') {
      return HttpResponse.json({
        data: {
          cartLinesRemove: {
            cart: null,
            userErrors: [{ message: '장바구니를 찾을 수 없습니다.' }]
          }
        }
      });
    }
    
    mockCart.lines.edges = mockCart.lines.edges.filter(
      edge => !lineIds.includes(edge.node.id)
    );
    
    recalculateCart();
    
    return HttpResponse.json({
      data: {
        cartLinesRemove: {
          cart: mockCart,
          userErrors: []
        }
      }
    });
  }),
  
  // 장바구니 상품 수량 업데이트
  graphql.mutation('cartLinesUpdate', ({ variables }) => {
    const { cartId, lines } = variables;
    
    if (cartId !== 'mock-cart-id') {
      return HttpResponse.json({
        data: {
          cartLinesUpdate: {
            cart: null,
            userErrors: [{ message: '장바구니를 찾을 수 없습니다.' }]
          }
        }
      });
    }
    
    lines.forEach(line => {
      const { id, quantity } = line;
      const lineIndex = mockCart.lines.edges.findIndex(e => e.node.id === id);
      
      if (lineIndex >= 0) {
        if (quantity <= 0) {
          // 수량이 0 이하면 제거
          mockCart.lines.edges.splice(lineIndex, 1);
        } else {
          // 수량 업데이트
          mockCart.lines.edges[lineIndex].node.quantity = quantity;
        }
      }
    });
    
    recalculateCart();
    
    return HttpResponse.json({
      data: {
        cartLinesUpdate: {
          cart: mockCart,
          userErrors: []
        }
      }
    });
  }),
  
  // 상품 조회
  graphql.query('getProduct', ({ variables }) => {
    const { handle } = variables;
    const product = mockProducts.find(p => p.handle === handle);
    
    if (!product) {
      return HttpResponse.json({
        data: {
          product: null
        }
      });
    }
    
    return HttpResponse.json({
      data: {
        product
      }
    });
  }),
  
  // 상품 목록 조회
  graphql.query('getProducts', ({ variables }) => {
    const { query, reverse, sortKey } = variables;
    let filteredProducts = [...mockProducts];
    
    // 검색어 필터링
    if (query) {
      filteredProducts = filteredProducts.filter(p => 
        p.title.toLowerCase().includes(query.toLowerCase()) || 
        p.description.toLowerCase().includes(query.toLowerCase())
      );
    }
    
    // 정렬
    if (sortKey) {
      switch (sortKey) {
        case 'TITLE':
          filteredProducts.sort((a, b) => a.title.localeCompare(b.title));
          break;
        case 'PRICE':
          filteredProducts.sort((a, b) => 
            parseFloat(a.priceRange.minVariantPrice.amount) - 
            parseFloat(b.priceRange.minVariantPrice.amount)
          );
          break;
        case 'CREATED':
        case 'CREATED_AT':
          // 예시로 updatedAt을 사용
          filteredProducts.sort((a, b) => 
            new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
          );
          break;
      }
      
      // 역순 정렬
      if (reverse) {
        filteredProducts.reverse();
      }
    }
    
    return HttpResponse.json({
      data: {
        products: {
          edges: filteredProducts.map(product => ({ node: product }))
        }
      }
    });
  }),
  
  // 컬렉션 조회
  graphql.query('getCollection', ({ variables }) => {
    const { handle } = variables;
    const collection = mockCollections.find(c => c.handle === handle);
    
    if (!collection) {
      return HttpResponse.json({
        data: {
          collection: null
        }
      });
    }
    
    return HttpResponse.json({
      data: {
        collection
      }
    });
  }),
  
  // 컬렉션 상품 조회
  graphql.query('getCollectionProducts', ({ variables }) => {
    const { handle, reverse, sortKey } = variables;
    const collection = mockCollections.find(c => c.handle === handle);
    
    if (!collection) {
      return HttpResponse.json({
        data: {
          collection: null
        }
      });
    }
    
    let products = [...collection.products.edges];
    
    // 정렬
    if (sortKey) {
      products.sort((a, b) => {
        switch (sortKey) {
          case 'TITLE':
            return a.node.title.localeCompare(b.node.title);
          case 'PRICE':
            return (
              parseFloat(a.node.priceRange.minVariantPrice.amount) - 
              parseFloat(b.node.priceRange.minVariantPrice.amount)
            );
          case 'CREATED':
          case 'CREATED_AT':
            return (
              new Date(a.node.updatedAt).getTime() - 
              new Date(b.node.updatedAt).getTime()
            );
          default:
            return 0;
        }
      });
      
      // 역순 정렬
      if (reverse) {
        products.reverse();
      }
    }
    
    const collectionWithSortedProducts = {
      ...collection,
      products: {
        edges: products
      }
    };
    
    return HttpResponse.json({
      data: {
        collection: collectionWithSortedProducts
      }
    });
  }),
  
  // 컬렉션 목록 조회
  graphql.query('getCollections', () => {
    return HttpResponse.json({
      data: {
        collections: {
          edges: mockCollections.map(collection => ({ node: collection }))
        }
      }
    });
  }),
  
  // 상품 추천 조회
  graphql.query('getProductRecommendations', () => {
    // 간단히 첫 2개 상품을 추천으로 반환
    return HttpResponse.json({
      data: {
        productRecommendations: mockProducts.slice(0, 2)
      }
    });
  }),
  
  // 기타 요청 처리 (fallback)
  http.post(endpoint, () => {
    return HttpResponse.json({
      data: null,
      errors: [{ message: '지원하지 않는 GraphQL 쿼리입니다.' }]
    }, { status: 400 });
  })
];
