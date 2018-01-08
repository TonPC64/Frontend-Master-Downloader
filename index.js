"use strict";

const fs = require("fs");
const https = require("https");
const mkdirp = require("mkdirp");
const through = require("through2");
const puppeteer = require("puppeteer");
const fromArray = require("from2-array");

const user = process.argv[3];
const pass = process.argv[4];
const course = process.argv[2];
const pathDirectory = process.argv[5] || "DownLoads/";
const url = "https://frontendmasters.com";
const SECONDES = 1000;

if (!course || !user || !pass) {
  process.stderr.write("you must provide course, username and your password");
  return;
}

const directory = pathDirectory + course;

mkdirp(directory, function(err) {
  if (err) console.error(err);
});

(async () => {
  /* TODO: the default mode is headless: true but, it simply don't work
   * Need to understand why
   */
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.goto(url + "/login");

  await page.waitFor(2 * SECONDES);

  await page.waitForSelector("#username");
  const username = await page.$("#username");
  await username.type(user);
  const password = await page.$("#password");
  await password.type(pass);
  const button = await page.$("button");
  await button.click();
  let selector = ".title a";
  await page.waitForSelector(selector);
  const obj = {
    selector,
    course
  };
  let link = await page.evaluate(obj => {
    const anchors = Array.from(document.querySelectorAll(obj.selector));
    return anchors
      .map(anchor => {
        return `${anchor.href}`;
      })
      .filter(text => text.includes(obj.course))
      .pop();
  }, obj);

  await page.goto(link);
  selector = ".LessonListItem a";
  await page.waitForSelector(selector);
  const links = await page.evaluate(selector => {
    const anchors = Array.from(document.querySelectorAll(selector));
    return anchors.map(anchor => {
      return `${anchor.href}`;
    });
  }, selector);
  let finalLinks = [];
  for (link of links) {
    await page.goto(link);
    selector = "video";
    await page.waitForSelector(selector);
    await page.waitFor(8 * SECONDES);

    const videoLink = await page.evaluate(selector => {
      const video = Array.from(document.querySelectorAll(selector)).pop();
      return video.src;
    }, selector);

    const fileName =
      link
        .split("/")
        .filter(str => str.length)
        .pop() + ".mp4";
    finalLinks.push({ fileName, videoLink });
  }

  console.log("Will start downloading videos");

  finalLinks = removeAlreadyFetched(finalLinks);
  downloadVideos(finalLinks);

  function downloadVideos(arrLinks) {
    fromArray
      .obj(arrLinks)
      .pipe(
        through.obj(({ fileName, videoLink }, enc, next) => {
          console.log("Downloading:" + fileName);
          https.get(videoLink, req =>
            req.pipe(
              fs
                .createWriteStream(directory + "/" + fileName)
                .on("finish", () => {
                  console.log(fileName + " downloaded");
                  next();
                })
            )
          );
        })
      )
      .on("finish", () => console.log("All video downloaded"));
  }

  process.on("uncaughtException", err => {
    console.log("You have reached maximum request limit");
    console.log("Sleeping for 15 minutes");
    finalLinks = removeAlreadyFetched(finalLinks);
    setTimeout(() => downloadVideos(finalLinks), SECONDES * 60 * 15);
  });

  function removeAlreadyFetched(arrLinks) {
    const alreadyFetched = fs.readdirSync(directory).map(file => file);
    return arrLinks.filter(
      ({ fileName }) => !alreadyFetched.includes(fileName)
    );
  }
})();
