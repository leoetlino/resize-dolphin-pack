# resize-dolphin-pack - A simple tool to resize a Dolphin texture pack

## Dependencies
- Node v6 or higher with npm
- libmagick: `libmagick++-dev` and `libmagick++-6.q16-dev` for Debian-based systems

## Getting started
1. `sudo apt install libmagick++-dev libmagick++-6.q16-dev`
2. `sudo ln -s /usr/lib/x86_64-linux-gnu/ImageMagick*/bin-*/Magick++-config /usr/bin/`
3. `npm install`

It is recommended to do `sudo ln -s $(pwd)/bootstrap.js /usr/local/bin/resize-dolphin-pack`
so that `resize-dolphin-pack` can be used more conveniently.

## Usage
`Usage: resize-dolphin-pack [-h] -i <path> -o <path> [-j <number>] [-x <number>]`

* -h, --help              output usage information
* -i, --input <path>      Path to the original texture pack [REQUIRED]
* -o, --output <path>     Path to the output directory (where the resized pack will be) [REQUIRED]
* -j, --workers <number>  Number of concurrent workers to start [default: number of cores]
* -x, --scale <number>    Target scale (resized textures will be x times larger than the game's original) [default: 3]

The output directory must already exist; it will not be created automatically.
