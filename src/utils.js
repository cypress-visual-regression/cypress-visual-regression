const fs = require("fs");

const { PNG } = require("pngjs");

const resemble = require("./compare-img");

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

    PNG.bitblt(
        image,
        imageAdjustedCanvas,
        0,
        0,
        image.width,
        image.height,
        0,
        0,
    );

    return imageAdjustedCanvas;
}

const compareImages = function (image1, image2, options) {
    return new Promise((resolve, reject) => {
        resemble.compare(image1, image2, options, (err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }
        });
    });
};

const parseImage = async (image) => {
    return new Promise((resolve, reject) => {
        if (!fs.existsSync(image)) {
            reject(new Error(`Snapshot ${image} does not exist.`));
            return;
        }

        const fd = fs.createReadStream(image);
        fd.pipe(new PNG())
            .on("parsed", function () {
                const that = this;
                resolve(that);
            })
            .on("error", (error) => reject(error));
    });
};

module.exports = {
    adjustCanvas,
    compareImages,
    parseImage,
};
