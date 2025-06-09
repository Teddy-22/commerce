import { http, HttpResponse } from 'msw';
import { TAGS } from 'lib/constants';

/**
 * Next.js API 라우트를 모킹하기 위한 핸들러
 * 
 * 현재 지원하는 API 라우트:
 * - /api/revalidate: Shopify 웹훅 처리 엔드포인트
 */
export const backendHandlers = [
  // /api/revalidate 엔드포인트 모킹
  http.post('/api/revalidate', async ({ request }) => {
    // URL 파라미터 추출
    const url = new URL(request.url);
    const secret = url.searchParams.get('secret');
    
    // 헤더 추출
    const headers = new Headers(request.headers);
    const topic = headers.get('x-shopify-topic') || 'unknown';
    
    // 시크릿 검증
    if (!secret || secret !== 'mock-revalidation-secret') {
      console.error('[MSW] Invalid revalidation secret.');
      return HttpResponse.json(
        { status: 401, message: 'Invalid revalidation secret.' },
        { status: 401 }
      );
    }
    
    // 웹훅 토픽에 따른 처리
    const collectionWebhooks = [
      'collections/create',
      'collections/delete',
      'collections/update'
    ];
    
    const productWebhooks = [
      'products/create',
      'products/delete',
      'products/update'
    ];
    
    const isCollectionUpdate = collectionWebhooks.includes(topic);
    const isProductUpdate = productWebhooks.includes(topic);
    
    if (!isCollectionUpdate && !isProductUpdate) {
      // 지원하지 않는 토픽은 그냥 성공 응답
      return HttpResponse.json(
        { status: 200, message: 'No revalidation needed for this topic.' }
      );
    }
    
    // 실제 환경에서는 여기서 revalidateTag 함수가 호출됨
    // 모킹 환경에서는 로그만 남김
    if (isCollectionUpdate) {
      console.log(`[MSW] Revalidating tag: ${TAGS.collections}`);
      // 실제로는 revalidateTag(TAGS.collections) 호출
    }
    
    if (isProductUpdate) {
      console.log(`[MSW] Revalidating tag: ${TAGS.products}`);
      // 실제로는 revalidateTag(TAGS.products) 호출
    }
    
    // 성공 응답 반환
    return HttpResponse.json({
      status: 200,
      revalidated: true,
      now: Date.now(),
      message: `Successfully revalidated for topic: ${topic}`
    });
  }),
  
  // 기타 API 엔드포인트 모킹을 여기에 추가할 수 있음
  http.all('/api/*', ({ request }) => {
    console.warn(`[MSW] Unhandled API request: ${request.method} ${request.url}`);
    return HttpResponse.json(
      { status: 404, message: 'API endpoint not implemented in MSW handlers' },
      { status: 404 }
    );
  })
];
