import path from "path";
import fs from "fs";
import * as utils from "./utils.js";
import imagemagick from "imagemagick-native";

const fail = (error) => {
  process.send({ type: "error", error });
  process.exit(1);
};

process.on("message", (message) => {
  if (message.type === "jobs") {
    return workOnJobs(message.jobs, message.outputDirectory, message.targetScale);
  }
  fail("Unknown message type: " + message.type);
});

async function workOnJobs(jobs, outputDirectory, targetScale) {
  const warnings = [];

  const newTextureNameRegex = /^tex1_(\d*)x(\d*)_(.*).(?:png|jpg|jpeg)$/i;

  for (let texture of jobs) {
    const { file, name } = texture;

    // printDebug(`Processing ${file}`.blue);
    const match = newTextureNameRegex.exec(name);
    if (!match) { // this should normally never happen
      fail(`BUG: No match for ${file}`);
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
      // printDebug(`orig: ${origWidth}x${origHeight}, new: ${width}x${height}, scale: ${scale.width}x${scale.height}`);

      const outputFile = path.resolve(outputDirectory, name)
        .replace(".PNG", ".png")
        .replace(".JPG", ".jpg")
        .replace(".JPEG", ".jpeg");

      if (scale.width > targetScale) {
        const targetWidth = origWidth * targetScale;
        const targetHeight = origHeight * targetScale;
        // printDebug(`scale higher than ${targetScale}, resizing to ${targetWidth}x${targetHeight}`.yellow);
        fs.writeFileSync(outputFile, imagemagick.convert({
          srcData: textureData,
          width: targetWidth,
          height: targetHeight,
        }));
      } else {
        // printDebug(`nothing to do, copying to ${outputFile}`.yellow);
        await utils.copyFile(file, outputFile);
      }
    } catch (error) {
      fail(error.message);
      process.exit(1);
    }

    process.send({ type: "completedOne", file, name });
  }

  process.send({ type: "completedAll", count: jobs.length, warnings });
}
