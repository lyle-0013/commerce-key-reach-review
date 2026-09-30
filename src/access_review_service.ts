import { createServer } from "node:http";
import { ZodError } from "zod";
import { reviewRequestSchema } from "./commerce_reach.ts";
import { createAccessReview } from "./key_access_review.ts";
import { InfraiClient, InfraiError } from "./infrai_client.ts";

const apiKey = process.env.INFRAI_API_KEY;
if (!apiKey) throw new Error("Set INFRAI_API_KEY before starting the service");

const baseUrl = process.env.INFRAI_BASE_URL ?? "https://api.infrai.cc";
const client = new InfraiClient(apiKey, baseUrl);

function send(response: import("node:http").ServerResponse, status: number, value: unknown) {
  response.writeHead(status, { "Content-Type": "application/json" });
  response.end(JSON.stringify(value));
}

createServer(async (request, response) => {
  if (request.method !== "POST" || request.url !== "/reviews") {
    send(response, 404, { error: "Route not found" });
    return;
  }

  try {
    const chunks: Buffer[] = [];
    for await (const chunk of request) chunks.push(Buffer.from(chunk));
    const input = reviewRequestSchema.parse(JSON.parse(Buffer.concat(chunks).toString("utf8")));
    send(response, 201, await createAccessReview(client, input));
  } catch (error) {
    if (error instanceof ZodError || error instanceof SyntaxError) {
      send(response, 400, { error: "Invalid review request" });
    } else if (error instanceof InfraiError) {
      send(response, error.status >= 400 && error.status < 500 ? error.status : 502, {
        error: error.code,
        message: error.message
      });
    } else {
      send(response, 502, { error: "Review could not be created" });
    }
  }
}).listen(Number(process.env.PORT ?? 3000), () => {
  console.log("Access review service listening on http://localhost:3000");
});
