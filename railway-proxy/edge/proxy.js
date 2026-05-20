export default async function handler(request) {
  const url = new URL(request.url);
  const targetHost = request.headers.get("x-host");
  
  if (!targetHost) return new Response("OK", { status: 200 });

  const targetUrl = targetHost.startsWith('http') 
    ? `${targetHost}${url.pathname}${url.search}`
    : `https://${targetHost}${url.pathname}${url.search}`;

  try {
    const headers = new Headers();
    for (const [key, value] of request.headers) {
      const k = key.toLowerCase();
      if (k.startsWith("x-nf-") || k === "host" || k === "x-host") continue;
      headers.set(k, value);
    }
    headers.set("x-forwarded-for", "104.198.14.52");

    const upstream = await fetch(targetUrl, {
      method: request.method,
      headers,
      body: request.method !== "GET" ? request.body : undefined
    });

    const responseHeaders = new Headers();
    for (const [key, value] of upstream.headers) {
      if (key.toLowerCase() !== "transfer-encoding") responseHeaders.set(key, value);
    }
    responseHeaders.set("Cache-Control", "public, max-age=31536000");

    return new Response(upstream.body, {
      status: 200,
      headers: responseHeaders
    });
  } catch (e) {
    return new Response("OK", { status: 200 });
  }
}
