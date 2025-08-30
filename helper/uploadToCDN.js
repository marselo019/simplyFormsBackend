const axios = require("axios");
const fs = require("fs");

async function uploadToCDN(filePath) {
 const imageData = fs.readFileSync(filePath, { encoding: "base64" });
 const apiKey = `0d83b175e3a1c2e29ef6d6979ca9d118`;

 const res = await axios.post("https://api.imgbb.com/1/upload", null, {
  params: {
   key: apiKey,
   image: imageData,
  },
 });

 return res.data.data.url;
}

module.exports = { uploadToCDN };