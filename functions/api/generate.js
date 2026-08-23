export async function onRequestPost(context) {
  const { request, env } = context;

  // 统一跨域与 JSON 响应头
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "*",
    "Content-Type": "application/json"
  };

  try {
    const body = await request.json().catch(() => ({}));
    const query = body.query || body.prompt || body.input || body.text;

    if (!query) {
      return new Response(JSON.stringify({ error: "请求参数为空" }), { status: 400, headers });
    }

    const apiUrl = env.COZE_API_URL;
    const apiToken = env.COZE_API_TOKEN;

    if (!apiUrl || !apiToken) {
      return new Response(JSON.stringify({ error: "Cloudflare 环境变量未配置 COZE_API_URL 或 COZE_API_TOKEN" }), { status: 500, headers });
    }

    // 请求 Coze API
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        query: query,
        parameters: { query: query }
      })
    });

    const data = await response.text();
    return new Response(data, { status: response.status, headers });

  } catch (err) {
    return new Response(JSON.stringify({ error: "Pages Function 运行错误: " + err.message }), { status: 500, headers });
  }
}

// 支持 OPTIONS 预检请求
export async function onRequestOptions() {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "*"
    }
  });
}