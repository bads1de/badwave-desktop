import * as fs from "fs";
import * as path from "path";
import { serveLocalFile } from "../../../electron/lib/local-file-handler";

describe("serveLocalFile", () => {
  const testFilePath = path.join(__dirname, "test-media-file.mp3");
  const testData = Buffer.alloc(1024 * 100, "A"); // 100KB dummy data

  beforeAll(() => {
    fs.writeFileSync(testFilePath, testData);
  });

  afterAll(() => {
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
    }
  });

  it("should serve local file normally", async () => {
    const url = new URL(`badwave://file/${encodeURIComponent(testFilePath)}`);
    const request = new Request(url.toString());
    const response = serveLocalFile(request, url);

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Length")).toBe(String(testData.length));
    expect(response.headers.get("Content-Type")).toBe("audio/mpeg");

    const reader = response.body?.getReader();
    expect(reader).toBeDefined();
    
    let receivedLength = 0;
    while (true) {
      const { done, value } = await reader!.read();
      if (done) break;
      receivedLength += value.length;
    }
    expect(receivedLength).toBe(testData.length);
  });

  it("should handle Range requests", async () => {
    const url = new URL(`badwave://file/${encodeURIComponent(testFilePath)}`);
    const request = new Request(url.toString(), {
      headers: {
        Range: "bytes=1000-1999",
      },
    });
    const response = serveLocalFile(request, url);

    expect(response.status).toBe(206);
    expect(response.headers.get("Content-Length")).toBe("1000");
    expect(response.headers.get("Content-Range")).toBe(`bytes 1000-1999/${testData.length}`);

    const reader = response.body?.getReader();
    expect(reader).toBeDefined();

    let receivedLength = 0;
    while (true) {
      const { done, value } = await reader!.read();
      if (done) break;
      receivedLength += value.length;
    }
    expect(receivedLength).toBe(1000);
  });

  it("should handle suffix Range requests (bytes=-N)", async () => {
    const url = new URL(`badwave://file/${encodeURIComponent(testFilePath)}`);
    const request = new Request(url.toString(), {
      headers: {
        Range: "bytes=-200",
      },
    });
    const response = serveLocalFile(request, url);

    expect(response.status).toBe(206);
    expect(response.headers.get("Content-Length")).toBe("200");
    expect(response.headers.get("Content-Range")).toBe(
      `bytes ${testData.length - 200}-${testData.length - 1}/${testData.length}`,
    );

    const reader = response.body?.getReader();
    expect(reader).toBeDefined();

    let receivedLength = 0;
    while (true) {
      const { done, value } = await reader!.read();
      if (done) break;
      receivedLength += value.length;
    }
    expect(receivedLength).toBe(200);
  });

  it("should handle client cancel without throwing Uncaught Exception", async () => {
    const url = new URL(`badwave://file/${encodeURIComponent(testFilePath)}`);
    const request = new Request(url.toString());
    const response = serveLocalFile(request, url);

    const reader = response.body?.getReader();
    expect(reader).toBeDefined();

    // Read the first chunk
    const { done, value } = await reader!.read();
    expect(done).toBe(false);
    expect(value).toBeDefined();
    expect(value!.length).toBeGreaterThan(0);

    // Cancel the stream from consumer side (mimicking seek/abort/close)
    await reader!.cancel();

    // Wait a bit to let remaining fs.ReadStream events fire
    await new Promise((resolve) => setTimeout(resolve, 100));
  });

  it("should deny path traversal attempts", () => {
    // さまざまなトラバーサルパスのパターン (path.join を使わず生の文字列結合で .. を残す)
    const baseDir = path.dirname(testFilePath).replace(/\\/g, "/");
    const traversalPaths = [
      baseDir + "/../test-media-file.mp3",
      baseDir + "/subdir/../../test-media-file.mp3",
      baseDir + "/..\\test-media-file.mp3",
    ];

    for (const p of traversalPaths) {
      const url = new URL(`badwave://file/${encodeURIComponent(p)}`);
      const request = new Request(url.toString());
      const response = serveLocalFile(request, url);
      expect(response.status).toBe(403);
    }
  });

  it("should deny access if normalized path resolves outside intended boundaries or contains traversal patterns after normalization", () => {
    const maliciousPaths = [
      "C:\\Windows\\System32\\cmd.exe",
      "C:/Windows/System32/cmd.exe",
      "/etc/passwd",
    ];

    for (const p of maliciousPaths) {
      const url = new URL(`badwave://file/${encodeURIComponent(p)}`);
      const request = new Request(url.toString());
      const response = serveLocalFile(request, url);
      expect(response.status).toBe(403);
    }
  });
});
