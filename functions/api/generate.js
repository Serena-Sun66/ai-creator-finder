export async function onRequestPost(context) {
  const { request, env } = context;

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

    let baseUrl = env.COZE_API_URL || "";
    const apiToken = env.COZE_API_TOKEN || "";

    if (!baseUrl || !apiToken) {
      return new Response(JSON.stringify({ error: "Cloudflare 环境变量未配置" }), { status: 500, headers });
    }

    // 自动清洗 baseUrl，防止尾部多余斜杠
    baseUrl = baseUrl.trim().replace(/\/+$/, '');

    // 尝试多个扣子 Agent 可能使用的端点后缀
    const endpoints = baseUrl.endsWith('/stream_run') 
      ? [baseUrl, baseUrl.replace('/stream_run', '/api/stream_run')] 
      : [`${baseUrl}/stream_run`, `${baseUrl}/api/stream_run`, baseUrl];

    let lastError = "";

    for (const targetUrl of endpoints) {
      try {
        const response = await fetch(targetUrl, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiToken}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ input: query })
        });

        if (response.ok) {
          const data = await response.text();
          return new Response(data, { status: 200, headers });
        } else {
          const errText = await response.text();
          lastError = `[${targetUrl}] HTTP ${response.status}: ${errText}`;
        }
      } catch (e) {
        lastError = `[${targetUrl}] ${e.message}`;
      }
    }

    return new Response(JSON.stringify({ error: `Coze API 请求失败: ${lastError}` }), { status: 500, headers });

  } catch (err) {
    return new Response(JSON.stringify({ error: "Pages Function 运行错误: " + err.message }), { status: 500, headers });
  }
}

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