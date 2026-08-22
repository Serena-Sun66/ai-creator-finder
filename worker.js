export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // API：/api/generate
    if (url.pathname === "/api/generate" && request.method === "POST") {
      try {
        const body = await request.json();
        const query = body.query;

        if (!query) {
          return new Response(
            JSON.stringify({ error: "请输入查询内容" }),
            {
              status: 400,
              headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
              }
            }
          );
        }

        const apiUrl = env.COZE_API_URL;
        const apiToken = env.COZE_API_TOKEN;

        if (!apiUrl || !apiToken) {
          return new Response(
            JSON.stringify({
              error: "Cloudflare 环境变量未配置"
            }),
            {
              status: 500,
              headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
              }
            }
          );
        }

        const endpoint =
          apiUrl.replace(/\/+$/, "") + "/stream_run";

        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + apiToken
          },
          body: JSON.stringify({
            messages: [
              {
                role: "user",
                content: query
              }
            ]
          })
        });

        if (!response.ok) {
          const text = await response.text();

          return new Response(
            JSON.stringify({
              error:
                "Coze API 请求失败: HTTP " +
                response.status +
                " " +
                text
            }),
            {
              status: response.status,
              headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
              }
            }
          );
        }

        return new Response(response.body, {
          status: response.status,
          headers: {
            "Content-Type":
              response.headers.get("Content-Type") ||
              "text/event-stream",
            "Cache-Control": "no-cache",
            "Access-Control-Allow-Origin": "*"
          }
        });
      } catch (error) {
        return new Response(
          JSON.stringify({
            error:
              "服务器错误: " +
              (error.message || String(error))
          }),
          {
            status: 500,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*"
            }
          }
        );
      }
    }

    // 其他请求交给 public 静态资源
    return env.ASSETS.fetch(request);
  }
};
