import fs from "fs";
import path from "path";
import walk from "walk";
import imagemagick from "imagemagick-native";
import * as utils from "./utils.js";

// Get a sane directory path
let directory = process.argv[2];
if (!directory) {
  printError("No path to the texture pack directory passed as first argument.");
  process.exit(1);
}
try {
  directory = utils.makeSureDirectoryExists(directory);
} catch (error) {
  printError(error.message);
  process.exit(1);
}

let outputDirectory = process.argv[3];
if (!outputDirectory) {
  printError("No path to the output directory passed as second argument.");
  process.exit(1);
}
try {
  outputDirectory = utils.makeSureDirectoryExists(outputDirectory);
} catch (error) {
  printError(error.message);
  process.exit(1);
}

printInfo("Directory: " + directory);
printInfo("Output: " + outputDirectory);
console.log("\n");

const walker = walk.walk(directory);
let counter = 0;
let warnings = [];
walker.on("file", async (root, stat, next) => {
  const file = path.resolve(root, stat.name);
  printDebug(("Processing " + file).blue);

  const newTextureNameRegex = /^tex1_(\d*)x(\d*)_(.*)_(\d*).(?:png|jpg|jpeg)$/i;
  if (!newTextureNameRegex.test(stat.name)) {
    printDebug("skipped");
    return next();
  }

  const match = newTextureNameRegex.exec(stat.name);
  if (!match) {
    // This should not happen at all
    printError("BUG: No match!");
    process.exit(1);
  }
  const [, origWidth, origHeight] = match;
  try {
    const textureData = await utils.readFile(file);
    const { width, height } = imagemagick.identify({ srcData: textureData });
    const scale = { width: width / origWidth, height: height / origHeight };
    if (scale.width !== scale.height) {
      warnings.push({ file, message: `scale.width != scale.height (${scale.width}x${scale.height})` });
    }
    if (!Number.isInteger(scale.width)) {
      warnings.push({ file, message: `Non-integer scale (${scale.width}x${scale.height})` });
    }
    printDebug(`orig: ${origWidth}x${origHeight}, new: ${width}x${height}, scale: ${scale.width}x${scale.height}`);

    const targetScale = 2;
    const outputFile = path.resolve(outputDirectory, stat.name)
      .replace(".PNG", ".png")
      .replace(".JPG", ".jpg")
      .replace(".JPEG", ".jpeg");
    if (scale.width > targetScale) {
      const targetWidth = origWidth * targetScale;
      const targetHeight = origHeight * targetScale;
      printDebug(`scale higher than 4, resizing to ${targetWidth}x${targetHeight}`.yellow);
      fs.writeFileSync(outputFile, imagemagick.convert({
        srcData: textureData,
        width: targetWidth,
        height: targetHeight,
      }));
    } else {
      printDebug(`nothing to do, copying to ${outputFile}`.yellow);
      await utils.copyFile(file, outputFile);
    }
  } catch (error) {
    printError(error);
    process.exit(1);
  }

  counter++;
  next();
});

walker.on("end", () => {
  console.log("\n");
  printInfo(`${counter} files processed`);
  if (warnings.length) {
    printWarn(warnings.length + " warning(s)");
    console.log();
    warnings.forEach((warning) => {
      printWarn(`${warning.file.yellow}: ${warning.message}`);
    });
  }
});
