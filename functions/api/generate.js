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

    const apiUrl = env.COZE_API_URL;
    const apiToken = env.COZE_API_TOKEN;

    if (!apiUrl || !apiToken) {
      return new Response(JSON.stringify({ error: "Cloudflare 环境变量未配置" }), { status: 500, headers });
    }

    // 覆盖所有 Coze 智能体/工作流可能需要的参数结构
    const cozePayload = {
      parameters: {
        input: query,
        query: query
      },
      input: query,
      query: query,
      additional_messages: [
        {
          role: "user",
          content: query,
          content_type: "text"
        }
      ]
    };

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(cozePayload)
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