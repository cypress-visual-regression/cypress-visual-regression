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

// Combines 3 images side by side
// Courtesy of ChatGPT!
const combineImages = async (file1, file2, file3, output) => {
  const [img1, img2, img3] = await Promise.all([
    new Promise((resolve, reject) => {
      fs.createReadStream(file1)
        .pipe(new PNG())
        .on('error', reject)
        .on('parsed', () => resolve(this));
    }),
    new Promise((resolve, reject) => {
      fs.createReadStream(file2)
        .pipe(new PNG())
        .on('error', reject)
        .on('parsed', () => resolve(this));
    }),
    new Promise((resolve, reject) => {
      fs.createReadStream(file3)
        .pipe(new PNG())
        .on('error', reject)
        .on('parsed', () => resolve(this));
    })
  ]);

  const combinedImg = new PNG({
    width: img1.width + img2.width + img3.width,
    height: Math.max(img1.height, img2.height, img3.height)
  });

  img1.bitblt(combinedImg, 0, 0, img1.width, img1.height, 0, 0);
  img2.bitblt(combinedImg, 0, 0, img2.width, img2.height, img1.width, 0);
  img3.bitblt(combinedImg, 0, 0, img3.width, img3.height, img1.width + img2.width, 0);

  const stream = fs.createWriteStream(output);
  await new Promise((resolve, reject) => {
    stream.on('error', reject);
    stream.on('close', resolve);
    combinedImg.pack().pipe(stream);
  });
}

module.exports = {
  adjustCanvas,
  combineImages,
  createFolder,
  mkdirp,
  parseImage,
  errorSerialize,
};
