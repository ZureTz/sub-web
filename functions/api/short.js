export async function onRequestPost(context) {
  const request = context.request;

  const upstream = await fetch("https://short.trozure.uk/short", {
    method: "POST",
    headers: {
      "Content-Type":
        request.headers.get("Content-Type") || "application/json",
    },
    body: request.body,
  });

  return new Response(upstream.body, {
    status: upstream.status,
    headers: {
      "Content-Type":
        upstream.headers.get("Content-Type") || "application/json",
    },
  });
}