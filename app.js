const puppeteer = require("puppeteer");
const { exec } = require("child_process");
const fs = require('fs');

const DL_DIR = "./dl";

(async () => {

	const browser = await puppeteer.launch({headless: true});

	const page = await browser.newPage();
	await page.goto("https://www.youtube.com/channel/UCdxB6UoY7VggXoaOSvEhSjg/videos", {waitUntil: "networkidle2"});

	const LINK_SELECTOR = "#items ytd-grid-video-renderer:nth-child(INDEX) h3 a";
	const LENGTH_SELECTOR = "#items ytd-grid-video-renderer";


	let listLength = await page.evaluate((sel) => {
		return document.querySelectorAll(sel).length;
	}, LENGTH_SELECTOR);

	console.log(`videos found: ${listLength}`);

	for(let i = 1; i <= listLength; i++){

		let linkSelector = LINK_SELECTOR.replace("INDEX", i);

		// get title
		let title = await page.evaluate((sel) => {
			let el = document.querySelector(sel);
			return el.innerHTML;
		}, linkSelector);

		// check title
		if(!title.match(/Full Game Highlights \| Game 7/))
			continue;

		// log valid title
		console.log(title);

		// get link
		let link = await page.evaluate((sel) => {
			return document.querySelector(sel).getAttribute("href").replace(/^/, "https://youtube.com");
		}, linkSelector)

		// download
		download(link);

	}

	await browser.close();

})();

function download(link){

	// check for dir
	if (!fs.existsSync(DL_DIR)) fs.mkdirSync(DL_DIR);

	// download
	let child = exec(`youtube-dl "${link}" -f best -o "${DL_DIR}/%(title)s.%(ext)s"`);

	// handle output
	child.on("error", (code, signal) => {
		console.log('child process exited with ' + `code ${code} and signal ${signal}`);
	})

	child.on("exit", (code, signal) => {
		console.log('download complete');
	})

}