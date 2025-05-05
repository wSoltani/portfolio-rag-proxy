/**
 * Portfolio RAG Proxy Worker
 * 
 * This worker provides a proxy to Cloudflare AutoRAG for the portfolio frontend.
 * It exposes a POST endpoint that accepts queries and returns AI-generated responses
 * based on the content in the AutoRAG instance.
 */

// Define the Env interface for TypeScript
export interface Env {
  AI: {
    autorag: (name: string) => {
      aiSearch: (options: {
        query: string;
        rewrite_query?: boolean;
        max_num_results?: number;
        ranking_options?: {
          score_threshold?: number;
        };
        stream?: boolean;
      }) => Promise<{ body: ReadableStream } | any>;
    };
  };
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // Set CORS headers to allow requests from the portfolio frontend
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*', // In production, replace with your actual domain
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle OPTIONS request (preflight)
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: corsHeaders,
      });
    }

    // Only accept POST requests
    if (request.method !== 'POST') {
      return new Response('Method not allowed', {
        status: 405,
        headers: corsHeaders,
      });
    }

    try {
      // Parse the request body
      const requestData = await request.json() as { query: string; stream?: boolean };
      const { query, stream = true } = requestData;

      if (!query || typeof query !== 'string') {
        return new Response(JSON.stringify({ error: 'Query is required and must be a string' }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        });
      }

      // Call AutoRAG with the query
      if (stream) {
        // Handle streaming response
        const streamingResponse = await env.AI.autorag("portfolio-ai").aiSearch({
          query,
          rewrite_query: true,
          max_num_results: 5,
          ranking_options: {
            score_threshold: 0.3,
          },
          stream: true,
        });

        // Check if streamingResponse has a body property
        if (!streamingResponse || !('body' in streamingResponse)) {
          throw new Error('Invalid streaming response format');
        }

        // Return the streaming response with CORS headers
        return new Response(streamingResponse.body, {
          headers: {
            'Content-Type': 'text/event-stream',
            ...corsHeaders,
          },
        });
      } else {
        // Handle non-streaming response
        const response = await env.AI.autorag("portfolio-ai").aiSearch({
          query,
          rewrite_query: true,
          max_num_results: 5,
          ranking_options: {
            score_threshold: 0.3,
          },
          stream: false,
        });

        // Return the JSON response with CORS headers
        return new Response(JSON.stringify(response), {
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        });
      }
    } catch (error) {
      // Handle errors
      console.error('Error processing request:', error);
      return new Response(JSON.stringify({ error: 'Failed to process request' }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }
  },
} satisfies ExportedHandler<Env>;