addEventListener('fetch', event => {
  event.respondWith(forwardReport(event.request))
})

async function forwardReport(req) {

  const url = new URL(req.url)
  const path = url.pathname
  const search = url.search
  const address = `${PROTOCOL}://${ORIGIN}${path}${search}`

  let response = false

  const cacheKey = new Request(url, {
    method: req.method,
    headers: req.headers
  })

  //Work Around for Admin Page in Word Press, Since Hackers like to look for this....
  if ( path == '/wp-login.php' ){
    return new Response('', {
      status: 302,
      headers: { "Location": `${PROTOCOL}://${ORIGIN}/admin` }
    })   
  }

  //Work Around for Missing FavIcon
  if ( path == '/favicon.ico' ){
    return new Response('', {
      status: 302,
      headers: { "Location": `https://www.twilio.com/favicon.ico` }
    })   
  }

  let cache = caches.default

  // try to find the cache key in the cache
  response = await cache.match(cacheKey)

  // otherwise, fetch from origin, add to cache
  if (!response) {

    request = new Request(address, req)
    request.headers.set('Origin', new URL(address).origin)

   
 console.log(new Map(request.headers))


    response = await fetch(request, { cf: { cacheTtl: 300 }  })
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
