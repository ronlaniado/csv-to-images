const fs = require("graceful-fs");
const request = require("request");
const Papa = require("papaparse");
const _progress = require("cli-progress");
const _colors = require("colors");
const FileQueue = require('filequeue');

const fq = new FileQueue(1000);
const image_size = "1000";
const CSV = fq.createReadStream(process.argv[2]);

const convertCSV = (CSV) => {
    Papa.parse(CSV, {
        download: true,
      
        // Header creates the key:value tags rather than one large object, providing more organization
        header: true,
        complete: function(results) {
          const fileName = "convertedCSV.json";
          // Saves the converted CSV file to JSON
          fq.writeFile(fileName, JSON.stringify(results.data), function(err) {
            if (err) {
              console.log(err);
            } else {
              console.log(
                "Success! Your converted JSON file is saved under the name: " +
                  fileName
              );
              gatherUrls(results.data);
            }
          });
        }
      });
}

const gatherUrls = (data) => {
  console.log("Gathering image urls, please wait...");
  let url = [];
  let sku = [];
  for (let i = 0; i < data.length; i++) {
    url.push("https://" + data[i]["IMAGE URL"].slice(0, -3) + image_size);
    sku.push(data[i]["SKU"]);
  }
  console.log(
    "All image urls have been gathered and the download size has been increased to " +
      image_size +
      "."
  );
  downloadImages(url, sku, data.length);
};

const downloadImages = async (url, sku, dataSize) => {
  const b1 = new _progress.Bar({
    format: 'Image Download Progress |' + _colors.cyan('{bar}') + '| {percentage}% | {value}/{total} Images',
    barCompleteChar: '\u2588',
    barIncompleteChar: '\u2591',
    barsize: 50,
    hideCursor: true
  }, _progress.Presets.shades_classic);
  let promises = [];
  let poolOptions = { maxSockets: 50 };
  b1.start(dataSize, 0);
  let value = 0; // value of the progress bar
  fs.promises.mkdir("./images/", { recursive: true }).catch(console.error)

  for (let i = 0; i < dataSize; i++) {
    promises.push(
      requestImage(sku[i], url[i], poolOptions)
        .then(() => {
          value++;
          b1.update(value);
        })
        .catch(err => {
          console.log(
            "There has been an error with the image of SKU: " + sku[i]
          );
        })
    );
  }
  await Promise.all(promises);
  b1.stop();
  console.log("Success! All images have finished downloading.");
};

const requestImage = (sku, url, poolOptions) =>
  new Promise((resolve, reject) => {
    const options = {
      uri: url,
      pool: poolOptions
    };
    request(options)
      .on("error", function(err) {
        reject("The image of SKU " + sku + " could not download");
      })
      .pipe(fq.createWriteStream("./images/" + sku + ".jpg"))
      .on("finish", () => {
        resolve("Finished downloading image of SKU" + sku + ".");
      });
  });

convertCSV(CSV);
