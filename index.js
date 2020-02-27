addEventListener('fetch', event => {
  event.respondWith(forwardReport(event.request))
})

async function forwardReport(req) {

  const url = new URL(req.url)
  const path = url.pathname
  const address = `${PROTOCOL}://${ORIGIN}/${path}`

  let response = false

  const cacheKey = new Request(url, {
    method: req.method
  })

  //Work Around for Admin Page in Word Press
  if ( path == '/wp-login.php' ){
    return new Response('', {
      status: 302,
      headers: { "Location": `${PROTOCOL}://${ORIGIN}/admin` }
    })   
  }

  let cache = caches.default

  // try to find the cache key in the cache
  response = await cache.match(cacheKey)

  // otherwise, fetch from origin, add to cache
  if (!response) {
    response = await fetch(address, { cf: { cacheTtl: 300 }  })
    cache.put(cacheKey, response.clone())
  }
 
  // Check response is html content
  if (
    !response.headers.get("content-type") ||
    !response.headers.get("content-type").includes("text/html")
  ) {
    return response;
  }

  // Read response body.
  const text = await response.text();

  // Modify it.
  var re = new RegExp(ORIGIN,"g");
  const modified = text.replace(re, url.host);
  
  // Send it back, With Content-Type Set
  return new Response(modified, {
    status: response.status,
    statusText: response.statusText,
    headers: { "Content-Type": "text/html" }
  })
}
