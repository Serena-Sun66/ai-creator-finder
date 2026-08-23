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

    // 如果环境变量里的 URL 没有指向 /stream_run，自动拼接 /stream_run
    if (!apiUrl.endsWith('/stream_run')) {
      apiUrl = apiUrl.replace(/\/+$/, '') + '/stream_run';
    }

    // 严苛按照后端需要的 JSON 格式：{ "input": "..." }
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ input: query })
    });

    const data = await response.text();
    return new Response(data, { status: response.status, headers });

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