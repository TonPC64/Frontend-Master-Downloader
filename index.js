const puppeteer = require("puppeteer");
const url = "https://frontendmasters.com";
const course = process.argv[2];
const user = process.argv[3];
const pass = process.argv[4];

if (!course || !user || !pass) {
  process.stderr.write("you must provide course, username and your password");
  return;
}

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.goto(url + "/login");

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

  link = await page.evaluate(selector => {
    const anchors = Array.from(document.querySelectorAll(selector));
    return anchors
      .map(anchor => {
        return `${anchor.href}`;
      })
      .shift();
  }, selector);
  console.log(link);
  await page.goto(link);
})();
