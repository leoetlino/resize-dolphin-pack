import path from "path";
import walk from "walk";
import recluster from "recluster";
import program from "commander";
import ProgressBar from "progress";
import * as utils from "./utils.js";

program
  .option("-i, --input <path>", "Path to the original texture pack [REQUIRED]")
  .option("-o, --output <path>", "Path to the output directory (where the resized pack will be) [REQUIRED]")
  .option("-j, --workers <number>", "Number of concurrent workers to start [default: number of cores]", parseInt)
  .option("-x, --scale <number>", "Target scale (resized textures will be x times larger than the game's original) [default: x3]", parseInt);
program.parse(process.argv);

if (!program.input || !program.output) {
  printError("Missing arguments");
  program.outputHelp();
  process.exit(1);
}

const directory = utils.makeSureDirectoryExists(program.input);
const outputDirectory = utils.makeSureDirectoryExists(program.output);

printInfo("Directory: " + directory);
printInfo("Output: " + outputDirectory);
printInfo("Target scale: original game x" + program.scale);
console.log("");

const files = [];
const walker = walk.walk(directory);
printInfo("> Getting the file list…".cyan);

const newTextureNameRegex = /^tex1_(\d*)x(\d*)_(.*).(?:png|jpg|jpeg)$/i;
walker.on("file", (root, stat, next) => {
  const file = path.resolve(root, stat.name);

  if (!newTextureNameRegex.test(stat.name)) {
    printDebug("skipping " + file);
    return next();
  }
  files.push({ file, name: stat.name });
  next();
});

walker.on("end", () => {
  const cluster = recluster(path.join(__dirname, "../bootstrap.js"), {
    workers: program.workers,
    readyWhen: "ready",
  });
  cluster.run();
  const workers = cluster.workers();
  const filesPerWorker = Math.ceil(files.length / workers.length);
  printInfo(`${files.length} files to process, ${filesPerWorker} files/worker`);

  // Cut the files list into smaller parts for workers.
  const jobs = [];
  for (let i = 0; i < files.length; i += filesPerWorker) {
    jobs.push(files.slice(i, i + filesPerWorker));
  }

  // Progress bar
  const bar = new ProgressBar(":current/:total\t[:bar] :percent :fileName".yellow, {
    total: files.length,
    complete: "=",
    incomplete: " ",
    width: 30,
  });

  // Handle messages from workers
  let finishedCount = 0;
  const allFinishedHandler = () => {
    console.log("");
    printInfo(`${files.length} files processed`);
    cluster.terminate();
    process.exit(0);
  };
  const workerMsgHandler = (i) => (message) => {
    // printDebug(`MSG (${i})`.bgBlack.white, message);
    if (message.type === "error") {
      printError(`WORKER ${i}: ${message.error}`);
      cluster.terminate();
      process.exit(1);
    } else if (message.type === "completedOne") {
      bar.tick(1, { fileName: message.file.replace(directory + "/", "") });
    } else if (message.type === "completedAll") {
      printInfo(`\nWORKER ${i}: ${message.count} files processed`.green);
      if (message.warnings.length) {
        printWarn(`WORKER ${i}: ${message.warnings.length} warning(s)`);
        message.warnings.forEach((warning) => {
          printWarn(`  ${warning.file.yellow}: ${warning.message}`);
        });
      }
      finishedCount++;
      if (finishedCount === workers.length) {
        allFinishedHandler();
      }
    }
  };

  // Dispatch jobs
  for (let i = 0; i < jobs.length; i++) {
    workers[i].on("message", workerMsgHandler(i));
    workers[i].send({ type: "jobs", outputDirectory, jobs: jobs[i], targetScale: program.scale || 3 });
  }
});
