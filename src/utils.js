const fs = require('fs');

const { PNG } = require('pngjs');

function adjustCanvas(image, width, height) {
  if (image.width === width && image.height === height) {
    // fast-path
    return image;
  }

  const imageAdjustedCanvas = new PNG({
    width,
    height,
    bitDepth: image.bitDepth,
    inputHasAlpha: true,
  });

  PNG.bitblt(image, imageAdjustedCanvas, 0, 0, image.width, image.height, 0, 0);

  return imageAdjustedCanvas;
}

// eslint-disable-next-line arrow-body-style
const mkdirp = async (folderPath) => {
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

const createFolder = async (folderPath, failSilently) => {
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

// eslint-disable-next-line arrow-body-style
const parseImage = async (image) => {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(image)) {
      reject(new Error(`Snapshot ${image} does not exist.`));
      return;
    }

    const fd = fs.createReadStream(image);
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

const errorSerialize = (error) =>
  JSON.stringify(
    Object.getOwnPropertyNames(error).reduce(
      (obj, prop) =>
        Object.assign(obj, {
          [prop]: error[prop],
        }),
      {}
    )
  );

module.exports = {
  adjustCanvas,
  createFolder,
  mkdirp,
  parseImage,
  errorSerialize,
};
