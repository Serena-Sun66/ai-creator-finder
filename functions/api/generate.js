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

    // 提取纯域名根路径
    baseUrl = baseUrl.trim().replace(/\/+$/, '');
    const origin = baseUrl.replace(/(https?:\/\/[^\/]+).*/, '$1');

    // 列出扣子 Python Agent 可能的所有端点路径
    const candidateUrls = [
      `${origin}/stream_run`,
      `${origin}/api/generate`,
      `${origin}/api/stream_run`,
      `${origin}/run`,
      `${origin}/`
    ];

    let debugLogs = [];

    for (const targetUrl of candidateUrls) {
      try {
        const response = await fetch(targetUrl, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiToken}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ input: query })
        });

        const respText = await response.text();

        if (response.ok) {
          return new Response(respText, { status: 200, headers });
        }

        // 如果不是 404，说明路由对了只是报了逻辑错，直接返回该错误
        if (response.status !== 404) {
          return new Response(JSON.stringify({ error: `接口报错 HTTP ${response.status}: ${respText}` }), { status: response.status, headers });
        }

        debugLogs.push(`${targetUrl} -> 404`);
      } catch (e) {
        debugLogs.push(`${targetUrl} -> ${e.message}`);
      }
    }

    return new Response(JSON.stringify({ error: `所有尝试路径均返回 404，已尝试: ${debugLogs.join(' | ')}` }), { status: 500, headers });

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