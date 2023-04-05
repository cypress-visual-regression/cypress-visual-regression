import * as fs from 'fs';
import { PNG } from 'pngjs';

function adjustCanvas(image: PNG, width: number, height: number): PNG {
  if (image.width === width && image.height === height) {
    // fast-path
    return image;
  }

  console.log('bitDepth is : ', (image as any).bitDepth);

  const imageAdjustedCanvas = new PNG({
    width,
    height,
    // todo: bitDepth should not exists on instance of of PNG, should investigate
    bitDepth: (image as any).bitDepth,
    inputHasAlpha: true,
  });

  PNG.bitblt(image, imageAdjustedCanvas, 0, 0, image.width, image.height, 0, 0);

  return imageAdjustedCanvas;
}

const mkdirp = async (folderPath: string): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    fs.mkdir(folderPath, { recursive: true }, (error) => {
      if (error) {
        console.log(error); // eslint-disable-line no-console
        reject(new Error(`Error in creating ${folderPath}`));
      }
      resolve(true);
    });
  });
};

const createFolder = async (folderPath: string, failSilently?: boolean): Promise<boolean> => {
  if (!fs.existsSync(folderPath)) {
    try {
      await mkdirp(folderPath);
    } catch (error) {
      if (failSilently) {
        console.log(error); // eslint-disable-line no-console
        return false;
      }
      throw error;
    }
  }
  return true;
};

const parseImage = async (path: string): Promise<PNG> => {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(path)) {
      reject(new Error(`Snapshot ${path} does not exist.`));
      return;
    }

    const fd = fs.createReadStream(path);
    /* eslint-disable func-names */
    fd.pipe(new PNG())
      .on('parsed', function () {
        const that = this;
        resolve(that);
      })
      .on('error', (error) => reject(error));
    /* eslint-enable func-names */
  });
};

interface ErrorProperties {
  [key: string]: any;
}

const errorSerialize = (error: Error): string =>
  JSON.stringify(
    Object.getOwnPropertyNames(error).reduce(
      (obj, prop) =>
        Object.assign(obj, {
          [prop]: (error as ErrorProperties)[prop],
        }),
      {}
    )
  );

export { adjustCanvas, createFolder, mkdirp, parseImage, errorSerialize };
