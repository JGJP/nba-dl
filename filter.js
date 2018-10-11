const puppeteer = require("puppeteer");
const { exec } = require("child_process");
const fs = require("fs");
const youtubedl = require("youtube-dl");
const sanitize = require("sanitize-filename");

// DB
const low = require("lowdb");
const FileSync = require("lowdb/adapters/FileSync");
const adapter = new FileSync("db.json");
const db = low(adapter);
db.defaults({ downloaded: [] }).write();

const DL_DIR = "dl";
let NEW = false;

(async () => {

	const browser = await puppeteer.launch({headless: true});

	const page = await browser.newPage();
	await page.goto("https://www.youtube.com/channel/UCdxB6UoY7VggXoaOSvEhSjg/videos", {waitUntil: "networkidle2"});

	const LINK_SELECTOR = "#items ytd-grid-video-renderer:nth-child(INDEX) h3 a";
	const LENGTH_SELECTOR = "#items ytd-grid-video-renderer";

	// get list length
	let listLength = await page.evaluate((sel) => {
		return document.querySelectorAll(sel).length;
	}, LENGTH_SELECTOR);

	for(let i = 1; i <= listLength; i++){

		let linkSelector = LINK_SELECTOR.replace("INDEX", i),
			link,
			title;

		// get title
		title = await page.evaluate((sel) => {
			let el = document.querySelector(sel);
			return el.innerHTML;
		}, linkSelector);

		// cancel if not a target
		if(!title.match(/Full Game Highlights/)
			) continue;

		// get link
		link = await page.evaluate((sel) => {
			return document.querySelector(sel).getAttribute("href").replace(/^/, "https://youtube.com");
		}, linkSelector)

		// cancel if previously downloaded
		if(DBHas(link)){
			
		}

	}

	if(!NEW) console.log("No new videos to download");

	await browser.close();

})();

function DBHas(link){

	return db.get("downloaded").find({ link: link }).value()

}

function addToDB(link, title){

	db.get("downloaded")
		.push({ link: link, title: title })
		.write();

}
