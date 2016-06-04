# resize-dolphin-pack - A simple tool to resize a Dolphin texture pack

## Dependencies
- Node v6 or higher with npm
- libmagick: `libmagick++-dev` and `libmagick++-6.q16-dev` for Debian-based systems

## Getting started
1. `sudo apt install libmagick++-dev libmagick++-6.q16-dev`
2. `sudo ln -s /usr/lib/x86_64-linux-gnu/ImageMagick*/bin-*/Magick++-config /usr/bin/`
3. `npm install --production`

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

Example usage:

```
$ resize-dolphin-pack -i ~/wii/texture-packs/GZL/ -o ~/.dolphin-emu/Load/Textures/GZL/ -x 4 -j 5
Directory: ~/wii/texture-packs/GZL/
Output: ~/.dolphin-emu/Load/Textures/GZL/
Target scale: original game x4

> Getting the file list…
skipping ~/wii/texture-packs/GZL/Items/Heros Bow/GZLE01_28764a1e_14.png
3166 files to process, 634 files/worker
404/3166  [====                          ] 13% HUD/Screens/Start Screen/tex1_256x64_08aba0ba05a7746d_5.PNG
```

## TODO
* DDS support (not sure if Imagemagick supports them without any issues)
* better worker usage (it currently splits the jobs evenly, and some workers can finish much earlier)
