import { toLocalPath } from "../../../electron/utils";
import path from "path";

describe("toLocalPath", () => {
  const isWindows = process.platform === "win32";

  it("should return the original string if it does not start with file:", () => {
    expect(toLocalPath("/some/path")).toBe("/some/path");
    expect(toLocalPath("C:\\some\\path")).toBe("C:\\some\\path");
    expect(toLocalPath("http://example.com")).toBe("http://example.com");
  });

  it("should convert simple file:// URL to path", () => {
    // Linux/Mac style
    if (!isWindows) {
      expect(toLocalPath("file:///tmp/test")).toBe("/tmp/test");
    }
  });

  it("should correctly handle encoded characters", () => {
    if (!isWindows) {
      expect(toLocalPath("file:///tmp/test%20file")).toBe("/tmp/test file");
    } else {
      // Windows specific
      // file:///C:/path%20to/file -> C:\path to\file
      // Note: Node's fileURLToPath handles this. We mock the behavior expectation.
      // We can't easily change process.platform in a running test without mocking.
      // But we can verify it works on the current platform (Windows).
      const url = "file:///C:/Users/test/Music/My%20Song.mp3";
      const expected = path.join("C:", "Users", "test", "Music", "My Song.mp3");
      expect(toLocalPath(url)).toBe(expected);
    }
  });

  if (isWindows) {
    it("should handle Windows file URLs correctly", () => {
      // file:///C:/Users/test -> C:\Users\test
      const url = "file:///C:/Users/test/file.txt";
      const expected = "C:\\Users\\test\\file.txt";
      expect(toLocalPath(url)).toBe(expected);
    });

    it("should handle localhost file URLs", () => {
      // file://NAS/Share/file.txt -> \\nas\Share\file.txt (hostname is normalized to lowercase)
      const url = "file://NAS/Share/file.txt";
      const expected = "\\\\nas\\Share\\file.txt";
      expect(toLocalPath(url)).toBe(expected);
    });
  }
});
