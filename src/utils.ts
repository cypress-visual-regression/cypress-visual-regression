import fs from "fs";
import { PNG } from "pngjs";
import Debug from "./debug";

const debug = Debug("utils");

export const adjustCanvas = (
  image: PNG,
  width: number,
  height: number
): PNG => {
  if (image.width === width && image.height === height) {
    return image;
  }

  const imageAdjustedCanvas = new PNG({
    width,
    height,
    inputHasAlpha: true,
  });

  PNG.bitblt(image, imageAdjustedCanvas, 0, 0, image.width, image.height, 0, 0);

  return imageAdjustedCanvas;
};

export const mkdirp = async (folderPath: string): Promise<unknown> =>
  await new Promise((resolve, reject) => {
    fs.mkdir(folderPath, { recursive: true }, (error) => {
      if (error != null) {
        debug("mkdirp error:", error);
        reject(new Error(`Error in creating ${folderPath}`));
      }
      resolve(true);
    });
  });

export const createFolder = async (
  folderPath: string,
  failSilently: boolean
): Promise<boolean> => {
  if (!fs.existsSync(folderPath)) {
    try {
      await mkdirp(folderPath);
    } catch (error) {
      if (failSilently) {
        debug("failSilently", error);
        return false;
      }
      throw error;
    }
  }
  return true;
};

export const parseImage = async (image: string): Promise<unknown> =>
  await new Promise((resolve, reject) => {
    if (!fs.existsSync(image)) {
      reject(new Error(`Snapshot ${image} does not exist.`));
      return;
    }

    const fd = fs.createReadStream(image);

    fd.pipe(new PNG())
      .on("parsed", function () {
        resolve(this);
      })
      .on("error", (error) => {
        reject(error);
      });
  });

export const errorSerialize = (error: Record<string, unknown>): string =>
  JSON.stringify(
    Object.getOwnPropertyNames(error).reduce(
      (obj, prop) =>
        Object.assign(obj, {
          [prop]: error[prop],
        }),
      {}
    )
  );
