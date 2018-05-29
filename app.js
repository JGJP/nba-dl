const puppeteer = require("puppeteer");
const { exec } = require("child_process");
const fs = require("fs");

// DB
const low = require("lowdb");
const FileSync = require("lowdb/adapters/FileSync");
const adapter = new FileSync("db.json");
const db = low(adapter);
db.defaults({ downloaded: [] }).write();

const DL_DIR = "./dl";

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
		if(!title.match(/Full Game Highlights/))
			continue;

		// get link
		link = await page.evaluate((sel) => {
			return document.querySelector(sel).getAttribute("href").replace(/^/, "https://youtube.com");
		}, linkSelector)

		// log valid title
		console.log(title);

		// cancel if previously downloaded
		if(DBHas(link)){
			continue;
		}

		// download
		download(link, title);

	}

	await browser.close();

})();

function DBHas(link){

	return db.get("downloaded").find({ link: link }).value()

}

function download(link, title){

	// check for dir
	if (!fs.existsSync(DL_DIR)) fs.mkdirSync(DL_DIR);

	// download
	let child = exec(`youtube-dl "${link}" -f best -o "${DL_DIR}/%(title)s.%(ext)s"`);

	// handle output
	child.on("error", (code, signal) => {
		console.log("child process exited with " + `code ${code} and signal ${signal}`);
	})

	child.on("exit", (code, signal) => {
		console.log("download complete");
		addToDB(link, title);
	})

}

function addToDB(link, title){

	db.get("downloaded")
		.push({ link: link, title: title })
		.write();

}
