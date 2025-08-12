import { NextResponse } from "next/server"

export const runtime = "nodejs"

const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>FinacView API Docs</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
  </head>
  <body>
    <div id="swagger"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script>
      window.onload = () => {
        window.ui = SwaggerUIBundle({
          url: '/api/openapi',
          dom_id: '#swagger'
        });
      };
    </script>
  </body>
</html>`

export async function GET() {
  return new NextResponse(html, {
    headers: { "content-type": "text/html; charset=utf-8" }
  })
}
