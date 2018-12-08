# Change Log

All notable changes to this project will be documented in this file.
This project adheres to [Semantic Versioning].

This change log follows the format documented in [Keep a CHANGELOG].

[semantic versioning]: http://semver.org/
[keep a changelog]: http://keepachangelog.com/

## v1.0.0-beta.1

### Changed

- Using [pixelmatch](https://github.com/mapbox/pixelmatch) instead of
  image-diff
- **BREAKING**: `errorThreshold` now compares with the squareroot of the
  percentage of pixels that have changed. For example, if the image size is
  1000 x 660, and there are 257 changed pixels, the error value would be
  `(257 / 1000 / 660) ** 0.5 = 0.01973306715627196663293831730957`
