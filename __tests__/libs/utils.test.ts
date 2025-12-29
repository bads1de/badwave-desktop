import { cn, getRandomColor, splitTags } from "@/libs/utils";

describe("utils", () => {
  describe("cn", () => {
    it("クラス名を結合する", () => {
      expect(cn("class1", "class2")).toBe("class1 class2");
    });

    it("条件付きクラス名を処理する", () => {
      expect(cn("class1", true && "class2", false && "class3")).toBe(
        "class1 class2"
      );
    });

    it("Tailwindの衝突を解決する", () => {
      expect(cn("px-2 py-2", "p-4")).toBe("p-4");
    });
  });

  describe("getRandomColor", () => {
    it("定義された色のリストから色を返す", () => {
      const colors = [
        "#00ff87",
        "#60efff",
        "#0061ff",
        "#ff00a0",
        "#ff1700",
        "#fff700",
        "#a6ff00",
        "#00ffa3",
        "#00ffff",
        "#ff00ff",
      ];
      const color = getRandomColor();
      expect(colors).toContain(color);
    });
  });

  describe("splitTags", () => {
    it("カンマ区切りの文字列を配列に分割する", () => {
      expect(splitTags("tag1, tag2,tag3")).toEqual(["tag1", "tag2", "tag3"]);
    });

    it("空の文字列やundefinedを処理する", () => {
      expect(splitTags("")).toEqual([]);
      expect(splitTags(undefined)).toEqual([]);
    });

    it("余計な空白を削除する", () => {
      expect(splitTags("  tag1  ,  tag2  ")).toEqual(["tag1", "tag2"]);
    });

    it("空のタグを除外する", () => {
      expect(splitTags("tag1,,tag2")).toEqual(["tag1", "tag2"]);
    });
  });
});
