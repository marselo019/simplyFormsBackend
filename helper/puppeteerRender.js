// puppeteerRender.js
const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

async function generateThumbnail(formId) {
 const url = `https://9010.random.my.id/forms/${formId}`; // ganti domain sesuai env
 const browser = await puppeteer.launch();
 const page = await browser.newPage();
 await page.goto(url, { waitUntil: "networkidle0" });

 // Tambah footer manual pakai overlay DOM
 await page.evaluate(() => {
  const footer = document.createElement("div");
  footer.style.position = "fixed";
  footer.style.bottom = "0";
  footer.style.width = "100%";
  footer.style.padding = "20px";
  footer.style.background = "rgba(14,14,16,0.9)";
  footer.style.color = "#fff";
  footer.style.textAlign = "center";
  footer.style.fontSize = "12px";
  footer.style.fontFamily = "monospace";
  footer.innerHTML = "Marsel Forms.<br/>Modern Minimalist Forms<br/>2025 Forms";
  document.body.appendChild(footer);
 });

 const filePath = path.join(__dirname, `./thumbnails/${formId}.png`);
 await page.screenshot({ path: filePath, fullPage: true });
 await browser.close();
 return filePath;
}

module.exports = { generateThumbnail };