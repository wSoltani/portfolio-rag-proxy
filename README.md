# Portfolio RAG Proxy

A Cloudflare Worker that serves as a proxy between the portfolio frontend and Cloudflare AutoRAG.

## Features

- Exposes a POST endpoint for querying the AutoRAG instance
- Supports both streaming and non-streaming responses
- Includes CORS headers for cross-origin requests
- Error handling for invalid requests
- TypeScript type safety for AutoRAG responses

## Setup

1. Make sure you have created an AutoRAG instance named "portfolio-ai" in your Cloudflare dashboard.

2. Update the wrangler.jsonc file to include the AI binding and set your allowed origin:
   ```jsonc
   {
     "ai": {
       "binding": "AI"
     },
     "vars": {
       "ALLOWED_ORIGIN": "https://your-domain.com"
     }
   }
   ```

## API Usage

### POST /

Send a POST request with a JSON body containing:

```json
{
  "query": "Your question here",
  "stream": true  // Optional, defaults to true
}
```

#### Streaming Response

When `stream: true`, the response will be a server-sent event stream with content-type `text/event-stream`.

#### Non-Streaming Response

When `stream: false`, the response will be a JSON object with the following structure:

```json
{
  "object": "vector_store.search_results.page",
  "search_query": "Your question here",
  "response": "AI-generated response based on your query",
  "data": [
    {
      "file_id": "...",
      "filename": "...",
      "score": 0.45,
      "attributes": {
        "modified_date": 1735689600000,
        "folder": "..."
      },
      "content": [
        {
          "id": "...",
          "type": "text",
          "text": "..."
        }
      ]
    }
  ],
  "has_more": false,
  "next_page": null
}
```

## Development

1. Install dependencies:
   ```
   npm install
   ```

2. Run locally:
   ```
   npm run dev
   ```

3. Deploy to Cloudflare:
   ```
   npm run deploy
   ```

## Testing

Run tests with:

```
npm test
```

## Integration with Portfolio Frontend

To integrate this proxy with your portfolio frontend, make POST requests to the worker's URL. Example:

```javascript
const response = await fetch('https://portfolio-rag-proxy.your-account.workers.dev', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    query: 'Tell me about your projects',
    stream: true
  }),
});

// For streaming responses
if (response.headers.get('Content-Type')?.includes('text/event-stream')) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    const chunk = decoder.decode(value, { stream: true });
    // Process the streaming chunks
    console.log(chunk);
  }
} else {
  // For non-streaming responses
  const data = await response.json();
  console.log(data.response);
}
```