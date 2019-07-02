# Change Log

All notable changes to this project will be documented in this file. This project adheres to [Semantic Versioning](http://semver.org/).

This change log follows the format documented in [Keep a CHANGELOG](http://keepachangelog.com/).

## v1.0.3

### Changed

- Bumps to Cypress v3.3.2

## v1.0.2

### Changed

- Bumps to Cypress v3.3.1

## v1.0.1

### Changed

- Bumps to Cypress v3.2.0

## v1.0.0

### Changed

- Using [pixelmatch](https://github.com/mapbox/pixelmatch) instead of [image-diff](https://github.com/uber-archive/image-diff)
- **BREAKING**: `errorThreshold` now compares with the square root of the percentage of pixels that have changed. For example, if the image size is 1000 x 660, and there are 257 changed pixels, the error value would be `(257 / 1000 / 660) ** 0.5 = 0.01973306715627196663293831730957`
