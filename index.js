const fs = require("fs");
const request = require("request");
const CSV = fs.createReadStream("./sample_data.csv");
const Papa = require("papaparse");
const _progress = require("cli-progress");

const amountToDownload = 150;

Papa.parse(CSV, {
  download: true,

  // Header creates the key:value tags rather than one large object, providing more organization
  header: true,
  complete: function(results) {
    const fileName = "convertedJSON.json";
    // Saves the converted CSV file to JSON
    fs.writeFile(fileName, JSON.stringify(results.data), function(err) {
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

const gatherUrls = data => {
  let image_size = "1000";
  console.log("Gathering image urls, please wait...");
  let url = [];
  let sku = [];
  for (let i = 0; i < amountToDownload; i++) {
    url.push("https://" + data[i]["IMAGE URL"].slice(0, -3) + image_size);
    sku.push(data[i]["SKU"]);
  }
  console.log(
    "All image url have been gathered and increased the download size to " +
      image_size +
      "."
  );
  downloadImages(url, sku);
};

const downloadImages = (url, sku) => {
  const b1 = new _progress.Bar({}, _progress.Presets.shades_grey);
  let finishedDownloads = 0;
  b1.start(amountToDownload, 0);
  let value = 0; // value of the progress bar
  let pool = { maxSockets: 15 };
  for (let i = 0; i < amountToDownload; i++) {

  }
};

const requestImages = (sku,url) => new Promise((resolve, reject) => {
    const options = {
      uri: url,
      pool: { maxsockets: 15 },
      forever: true
    };

    request(options)
      .on("error", function(err) {
          reject("Image of SKU " + sku + " could not download");
      })
      .pipe(fs.createWriteStream("images/" + sku + ".jpg"))
      .on("finish", () => {
        resolve("Finished downloading image of SKU" + sku);
      })
  });

const endScript = b1 => {
  b1.stop();
  console.log("Success! All images have finished downloading");
};