import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

/**
 * MSW 브라우저 서비스 워커 설정
 * 
 * 이 워커는 개발 환경에서 실제 API 요청을 가로채고 모킹된 응답을 반환합니다.
 * Next.js 애플리케이션에서는 다음과 같이 사용할 수 있습니다:
 * 
 * ```tsx
 * // app/layout.tsx 또는 다른 적절한 진입점에서
 * if (process.env.NEXT_PUBLIC_USE_MOCKS === 'true' && typeof window !== 'undefined') {
 *   import('../__mocks__/browser').then(({ worker }) =>
 *     worker.start({ onUnhandledRequest: 'bypass' })
 *   );
 * }
 * ```
 * 
 * onUnhandledRequest: 'bypass'는 모킹되지 않은 요청을 정상적으로 통과시킵니다.
 */
export const worker = setupWorker(...handlers);
