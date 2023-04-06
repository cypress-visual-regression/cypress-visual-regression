import { PNG } from "pngjs";
import {
  adjustCanvas,
  errorSerialize,
  createFolder,
  parseImage,
} from "./utils";
import { vi } from "vitest";

vi.mock("fs/promises");

describe("utils module", () => {
  describe("adjustCanvas", () => {
    it("should return the same image if given same width and height than the given image ", () => {
      const originalPNG = new PNG({
        width: 10,
        height: 20,
      });
      const outputPNG = adjustCanvas(originalPNG, 10, 20);
      expect(originalPNG).toEqual(outputPNG);
    });
    it("should return a new image based on the image given , with the new width and height passed", () => {
      const originalPNG = new PNG({ width: 10, height: 20 });
      const outputPNG = adjustCanvas(originalPNG, 50, 70);
      expect(originalPNG).not.toEqual(outputPNG);
      expect(outputPNG.width).toEqual(50);
      expect(outputPNG.height).toEqual(70);
    });
  });
  describe("createFolder", () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("should return true if success", async () => {
      const fs = await import("fs/promises");
      fs.mkdir = vi.fn().mockReturnValue(undefined);
      const result = await createFolder("url-path");
      expect(fs.mkdir).toHaveBeenCalled();
      expect(result).toEqual(true);
    });

    it("should throw if failing", async () => {
      const fs = await import("fs/promises");
      fs.mkdir = vi.fn().mockRejectedValue(new Error("mock error"));
      const promise = createFolder("url-path");
      expect(fs.mkdir).toHaveBeenCalled();
      await expect(promise).rejects.toEqual(new Error("mock error"));
    });

    it("should return false if failing and failSilently is set to true", async () => {
      const fs = await import("fs/promises");
      fs.mkdir = vi.fn().mockRejectedValue(new Error("mock error"));
      const result = await createFolder("url-path", true);
      expect(fs.mkdir).toHaveBeenCalled();
      expect(result).toEqual(false);
    });
  });
  describe("errorSerialize", () => {
    it("should serialize an object into a string", () => {
      const errorObject = { error: "I'm a teapot", code: 418 };
      const output = errorSerialize(errorObject);

      expect(output).toBe('{"error":"I\'m a teapot","code":418}');
    });
  });
  describe("parseImage", () => {
    // TODO mock existsSync
    it("should throw error when image does not exist", async () => {
      const promise = parseImage("img");
      await expect(promise).rejects.toThrow("Snapshot img does not exist.");
    });
    // TODO mock createReadStream
    it("should return an error on PNG creation", async () => {});
    // TODO mock createReadStream
    it("should return a PNG image from reference", async () => {});
  });
});
