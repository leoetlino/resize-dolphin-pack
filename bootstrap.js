/**
 * resize-dolphin-pack
 * Copyright (C) 2016  Léo Lam
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

require("babel-register");
require("colors");
const cluster = require("cluster");

process.on("uncaughtException", (error) => {
  console.error(`${error.message}`.red.bgBlack.bold);
  console.error(error.stack.red);
  process.exit(1);
});

global.printDebug = (...args) => {
  console.log(...args);
};

global.printInfo = (message) => {
  console.log(`${message}`.blue.bgBlack.bold);
};

global.printWarn = (message) => {
  console.log(`${message}`.yellow.bgBlack.bold);
};

global.printError = (message) => {
  console.error(`${message}`.red.bgBlack.bold);
};

if (cluster.isMaster) {
  require("./source/index.js");
} else {
  require("./source/worker.js");
}
