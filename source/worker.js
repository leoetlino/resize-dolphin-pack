/**
 * resize-dolphin-pack
 * Copyright (C) 2016  Léo Lam
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 */

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
  if (!jobs || !outputDirectory || !targetScale) { // this should normally never happen
    fail("BUG: Missing parameters");
  }

  const warnings = [];

  const newTextureNameRegex = /^tex1_(\d*)x(\d*)_(.*).(?:png|jpg|jpeg|dds)$/i;

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
        .replace(".DDS", ".dds")
        .replace(".JPG", ".jpg")
        .replace(".JPEG", ".jpeg");

      if (name.includes(".nrm.dds")) {
        // Normal maps created by Ishiiruka-Tool cannot be read correctly by Imagemagick.
        // Don't do anything with them as that will corrupt them.
        // More info: https://www.imagemagick.org/discourse-server/viewtopic.php?f=3&t=29280
        warnings.push({ file, message: "Not converting since it may cause corruption" });
        await utils.copyFile(file, outputFile);
      } else if (name.includes("_mip")) {
        // Mipmaps should not be resized, at least not according to the size in the file name.
        // TODO: look into handling them properly
        warnings.push({ file, message: "Not converting mipmap" });
        await utils.copyFile(file, outputFile);
      } else if (scale.width > targetScale) {
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
