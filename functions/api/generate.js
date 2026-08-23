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

    let apiUrl = env.COZE_API_URL;
    const apiToken = env.COZE_API_TOKEN;

    if (!apiUrl || !apiToken) {
      return new Response(JSON.stringify({ error: "Cloudflare 环境变量未配置" }), { status: 500, headers });
    }

    // 清理多余的斜杠与重复的 /stream_run
    apiUrl = apiUrl.trim().replace(/\/+$/, '');
    if (!apiUrl.endsWith('/stream_run')) {
      apiUrl = apiUrl + '/stream_run';
    }

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ input: query })
    });

    if (!response.ok) {
      const errText = await response.text();
      return new Response(JSON.stringify({ error: `Coze API 请求失败: HTTP ${response.status} ${errText}` }), { status: response.status, headers });
    }

    const data = await response.text();
    return new Response(data, { status: 200, headers });

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