const path = require('path');
const Selector = require('testcafe').Selector;

const config = require('../src/_config.json');
const compareImages = require('../src/compare').compareImages;

// get image name
var imageName = 'actual';
if (process.env.type === 'base') imageName = 'base';

config.forEach((el) => {
  fixture('Visual Regression Test')
  .page(el.url);
  test(el.title, async (t) => {
    await t.takeScreenshot(`${el.id}-${el.title}-${imageName}`);
    if (imageName === 'actual') {
      const results = await compareImages(el.id, el.title);
      if (!results) throw new Error(`${el.title} images are different`);
    }
  });
})
