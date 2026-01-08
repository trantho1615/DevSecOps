const request = require("supertest");
const app = require("../src/index");

describe("devsecops-node-demo", () => {
  test("GET /health", async () => {
    const res = await request(app).get("/health");
    expect(res.statusCode).toBe(200);
    expect(res.text).toBe("OK");
  });

  test("GET /", async () => {
    const res = await request(app).get("/");
    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  test("GET /api/hello", async () => {
    const res = await request(app).get("/api/hello?name=Tran");
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toContain("Tran");
  });
});
