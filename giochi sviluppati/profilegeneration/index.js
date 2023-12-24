const Mustache = require("mustache");
const { fetchstats, mods, prettyNumber } = require("./statsfetcher");
const path = require("path");
const fs = require("fs");
const fsextra = require("fs-extra");

const fail = (e) => {
  console.error(e);
  process.exit(-1);
};

const templates = JSON.parse(fs.readFileSync("templates.json"));
const oldValues = JSON.parse(fs.readFileSync("values.json"));

/**
 * render a file into another
 * @param {fs.PathLike} fileIn the file to read
 * @param {fs.PathLike} fileOut the file to write
 * @param {any} view the view of the engine
 */
const renderTemplate = (fileIn, fileOut, view) => {
  console.log("Write " + fileIn + " into " + fileOut);
  const raw = fs.readFileSync(fileIn).toString();
  const output = Mustache.render(raw, view);
  fs.writeFileSync(fileOut, output);
};

/**
 * render all the files recursivly to another directory
 * @param {fs.PathLike} completePath the path to read
 * @param {fs.PathLike} outputPath the path to write
 * @param {any} view the view of the engine
 */
const renderTemplates = (inputPath, outputPath, view) => {
  console.log("Reading path " + inputPath);
  fs.mkdir(outputPath, { recursive: true }, (err) => {
    if (err) {
      return fail("Unable to mkdir future directory: " + err);
    }
    fs.readdir(inputPath, function (err, files) {
      if (err) {
        return fail("Unable to scan directory: " + err);
      }
      files.forEach((file) => {
        const finputPath = path.join(inputPath, file);
        const foutputPath = path.join(outputPath, file);
        fs.stat(finputPath, function (err, stat) {
          if (err) {
            return fail("Unable to scan directory: " + err);
          }
          if (stat.isDirectory()) {
            renderTemplates(finputPath, foutputPath, view);
          } else {
            renderTemplate(finputPath, foutputPath, view);
          }
        });
      });
    });
  });
};

const computeDownloadMin = (timestamp) => {
  const data = oldValues.oldDownloads || [];
  const start = timestamp - templates.downloadMaxTime;
  return data
    .filter((el) => el.timestamp > start)
    .reduce(
      (el1, el2) => {
        if (el1.timestamp > el2.timestamp) {
          return el2;
        } else {
          return el1;
        }
      },
      {
        timestamp,
        totalRaw: oldValues.download.totalRaw,
      }
    ).totalRaw;
};

(async () => {
  const stats = await fetchstats();

  const timestamp = new Date().getTime();
  const downloadDelta = stats.downloadsRaw - computeDownloadMin(timestamp);

  const view = {
    download: {
      curseforge: stats.downloadCF,
      // modrinth: stats.downloadMR,
      total: stats.downloads,
      curseforgeRaw: stats.downloadCFRaw,
      // modrinthRaw: stats.downloadMRRaw,
      totalRaw: stats.downloadsRaw,
      downloadDelta: prettyNumber(downloadDelta),
      downloadDeltaRaw: downloadDelta,
    },
    oldDownloads: [
      ...(oldValues.oldDownloads || []),
      {
        timestamp,
        totalRaw: stats.downloadsRaw,
        delta: downloadDelta,
      },
    ],
    mods,
    global: templates.global,
    today: new Date().toUTCString(),
    timestamp,
  };

  console.log("Current download delta: " + view.download.downloadDelta);
  fsextra.copy(
    "public",
    templates.output,
    {
      recursive: true,
    },
    (err) => {
      if (err) {
        return fail("Unable to clone directory: " + err);
      }
      renderTemplates(templates.templates, templates.output, view);
      fs.writeFileSync(
        templates.output + "/values.json",
        JSON.stringify(view, undefined, 4)
      );
    }
  );
})()
  .then(console.log)
  .catch(fail);