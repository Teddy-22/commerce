import { setupServer } from 'msw/node';
import { handlers } from './handlers';

/**
 * MSW Node.js 서버 설정
 * 
 * 이 서버는 Jest 테스트 및 기타 Node.js 환경에서 API 요청을 가로채고 모킹된 응답을 반환합니다.
 * jest.setup.ts 파일에서 다음과 같이 사용됩니다:
 * 
 * ```ts
 * import { server } from './__mocks__/server';
 * 
 * beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
 * afterEach(() => server.resetHandlers());
 * afterAll(() => server.close());
 * ```
 * 
 * 테스트 중에 특정 핸들러를 오버라이드하려면:
 * ```ts
 * import { server } from './__mocks__/server';
 * import { http, HttpResponse } from 'msw';
 * 
 * test('특정 시나리오 테스트', () => {
 *   // 특정 테스트를 위한 핸들러 오버라이드
 *   server.use(
 *     http.post('/api/some-endpoint', () => {
 *       return HttpResponse.json({ custom: 'response' });
 *     })
 *   );
 *   
 *   // 테스트 로직...
 * });
 * ```
 */
export const server = setupServer(...handlers);
