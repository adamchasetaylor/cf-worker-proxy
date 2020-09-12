addEventListener('fetch', (event) => {
  event.respondWith(forwardReport(event.request));
});

async function forwardReport(req) {
  const url = new URL(req.url);
  let path = url.pathname;
  let request = false;

  if (path === '/' || path === '') {
    path = '/index.html';
  }

  if (path === '/favicon.ico') {
    return new Response('', {
      status: 302,
      headers: { Location: `https://www.twilio.com/favicon.ico` },
    });
  }

  const { search } = url;
  const address = `${PROTOCOL}://${ORIGIN}${path}${search}`;

  console.log(address);

  let response = false;

  const cacheKey = new Request(url, {
    method: req.method,
    headers: req.headers,
  });

  const cache = caches.default;

  // try to find the cache key in the cache
  response = await cache.match(cacheKey);

  // otherwise, fetch from origin, add to cache
  if (!response) {
    request = new Request(address, req);
    request.headers.set('Origin', new URL(address).origin);

    console.log(new Map(request.headers));

    response = await fetch(request, { cf: { cacheTtl: 300 } });
    cache.put(cacheKey, response.clone());
  }

  // Check response is html content
  if (!response.headers.get('content-type') || !response.headers.get('content-type').includes('text/html')) {
    return response;
  }

  // Read response body.
  const text = await response.text();

  // Modify it.
  const re = new RegExp(ORIGIN, 'g');
  const modified = text.replace(re, url.host);

  // Send it back, With Content-Type Set
  return new Response(modified, {
    status: response.status,
    statusText: response.statusText,
    headers: { 'Content-Type': 'text/html' },
  });
}
