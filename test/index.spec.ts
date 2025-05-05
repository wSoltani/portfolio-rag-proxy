import { describe, it, expect, vi, beforeAll } from 'vitest';
import worker from '../src/index';

describe('Portfolio RAG Proxy Worker', () => {
  const mockEnv = {
    AI: {
      autorag: vi.fn().mockReturnThis(),
      aiSearch: vi.fn(),
    },
  };

  // Mock the AI binding
  beforeAll(() => {
    mockEnv.AI.autorag = vi.fn().mockReturnValue({
      aiSearch: vi.fn().mockImplementation(({ stream }) => {
        if (stream) {
          return {
            body: new ReadableStream({
              start(controller) {
                controller.enqueue('data: {"response": "Test streaming response"}\n\n');
                controller.close();
              },
            }),
          };
        }
        return {
          response: 'Test non-streaming response',
          data: [{ content: [{ text: 'Sample content' }] }],
        };
      }),
    });
  });

  it('should return 405 for non-POST requests', async () => {
    const request = new Request('http://localhost', { method: 'GET' });
    const response = await worker.fetch(request, mockEnv as any, {} as any);
    expect(response.status).toBe(405);
  });

  it('should handle OPTIONS requests for CORS', async () => {
    const request = new Request('http://localhost', { method: 'OPTIONS' });
    const response = await worker.fetch(request, mockEnv as any, {} as any);
    expect(response.status).toBe(200);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
  });

  it('should return 400 for missing query', async () => {
    const request = new Request('http://localhost', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const response = await worker.fetch(request, mockEnv as any, {} as any);
    expect(response.status).toBe(400);
  });

  it('should handle streaming responses', async () => {
    const request = new Request('http://localhost', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'test query', stream: true }),
    });
    const response = await worker.fetch(request, mockEnv as any, {} as any);
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('text/event-stream');
  });

  it('should handle non-streaming responses', async () => {
    const request = new Request('http://localhost', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'test query', stream: false }),
    });
    const response = await worker.fetch(request, mockEnv as any, {} as any);
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('application/json');
  });
});