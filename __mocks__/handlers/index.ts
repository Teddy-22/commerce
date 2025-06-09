import { shopifyHandlers } from './shopifyHandlers';
import { backendHandlers } from './backendHandlers';

/**
 * 모든 MSW 핸들러를 통합하여 내보냅니다.
 * - shopifyHandlers: Shopify Storefront API 모킹
 * - backendHandlers: 내부 백엔드 API 모킹
 * 
 * 이 핸들러들은 Jest 테스트와 개발 환경에서 실제 API 호출을 가로채는 데 사용됩니다.
 */
export const handlers = [
  ...shopifyHandlers,
  ...backendHandlers
];
