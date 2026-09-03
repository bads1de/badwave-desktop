import { createClient } from "@/libs/supabase/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

jest.mock("@supabase/ssr", () => ({
  createServerClient: jest.fn(),
}));

jest.mock("next/headers", () => ({
  cookies: jest.fn(),
}));

describe("libs/supabase/server", () => {
  const OLD_ENV = process.env;
  let mockCookieStore: any;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV };
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";

    mockCookieStore = {
      getAll: jest.fn().mockReturnValue([]),
      set: jest.fn(),
    };
    (cookies as jest.Mock).mockResolvedValue(mockCookieStore);
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  it("should create a supabase server client and handle cookies", async () => {
    await createClient();
    
    expect(createServerClient).toHaveBeenCalledWith(
      "https://test.supabase.co",
      "test-anon-key",
      expect.objectContaining({
        cookies: expect.any(Object),
      })
    );

    const callArgs = (createServerClient as jest.Mock).mock.calls[0][2];
    
    // Test getAll
    callArgs.cookies.getAll();
    expect(mockCookieStore.getAll).toHaveBeenCalled();

    // Test setAll
    const cookiesToSet = [{ name: "test", value: "val", options: {} }];
    callArgs.cookies.setAll(cookiesToSet);
    expect(mockCookieStore.set).toHaveBeenCalledWith("test", "val", {});
  });

  it("should ignore errors in setAll when in production", async () => {
    (process.env as unknown as { NODE_ENV: string }).NODE_ENV = "production";
    mockCookieStore.set.mockImplementation(() => {
      throw new Error("Server Component cookie error");
    });

    await createClient();
    const callArgs = (createServerClient as jest.Mock).mock.calls[0][2];
    
    expect(() => {
      callArgs.cookies.setAll([{ name: "test", value: "val", options: {} }]);
    }).not.toThrow();
  });
});
