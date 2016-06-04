/**
 * resize-dolphin-pack
 * Copyright (C) 2016  Léo Lam
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 */

import fs from "fs";
import path from "path";

export const readFile = (file) => new Promise((resolve, reject) => {
  fs.readFile(file, (error, textureData) => {
    if (error) {
      reject(error);
      return;
    }
    resolve(textureData);
  });
});

export const copyFile = (source, dest) => new Promise((resolve, reject) => {
  const rd = fs.createReadStream(source);
  rd.on("error", reject);
  const wr = fs.createWriteStream(dest);
  wr.on("error", reject);
  wr.on("finish", resolve);
  rd.pipe(wr);
});

export const makeSureDirectoryExists = (directory) => {
  if (!directory) {
    throw new Error("No directory was passed");
  }

  directory = path.resolve(directory);

  try {
    const isDirectory = fs.lstatSync(directory).isDirectory();
    if (!isDirectory) {
      throw new Error("Not a directory: " + directory);
    }
  } catch (error) {
    if (error.code === "ENOENT") {
      throw new Error("No such directory: " + directory);
    }
    throw error;
  }

  return directory;
};
