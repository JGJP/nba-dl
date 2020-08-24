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

const arg = require('arg')({
    '--manual': String,
    '-m' : '--manual',
});

let search = false
if(arg._[0] !== undefined){
	search = arg._[0]
	console.log('search for: ' + search)
}

const DL_DIR = "dl";
let NEW = false;

(async () => {

	const browser = await puppeteer.launch({headless: true});

	const page = await browser.newPage();
	await page.goto("https://www.youtube.com/channel/UC-XWpctw55Q6b_AHo8rkJgw/videos", {waitUntil: "networkidle2", timeout: 0});

	const LINK_SELECTOR = "#items ytd-grid-video-renderer:nth-child(INDEX) h3 a";
	const LENGTH_SELECTOR = "#items ytd-grid-video-renderer";

	// get list length
	let listLength = await page.evaluate((sel) => {
		return document.querySelectorAll(sel).length;
	}, LENGTH_SELECTOR);

	let toDL = [];

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
		if( !title.match( /Full Game (\d )?Highlights/i ) ) continue

		if( search && !title.match( search ) ) continue

		// get link
		link = await page.evaluate((sel) => {
			return document.querySelector(sel).getAttribute("href").replace(/^/, "https://youtube.com");
		}, linkSelector)

		// cancel if previously downloaded
		if(DBHas(link)){
			continue;
		}

		// if(!title.match(/Warriors/)
		// 	&& !title.match(/Memphis/)
		// 	&& !title.match(/Philadelphia/)
		// 	&& !title.match(/Lakers/)
		// 	&& !title.match(/Jazz/)
		// 	){
		// 	addToDB(link, title);
		// 	console.log('Ignored: '+title);
		// 	continue;
		// }

		toDL.push({link, title})

		// log valid title
		// console.log(title);

		// new videos existed
		NEW = true;

	}

	console.log(toDL);

	for(let i = 0; i < toDL.length; i++){

		const video = toDL[i];

		// download
		await download(video.link, video.title);

	}

	if(!NEW) console.log("No new videos to download");

	await browser.close();

})();

function DBHas(link){

	return db.get("downloaded").find({ link: link }).value()

}

function download(link, title){

	return new Promise((done, err) => {

		try{

			// check for dir
			if (!fs.existsSync(DL_DIR)) fs.mkdirSync(DL_DIR);

			// download
			let dl = youtubedl(link)

			// write stream
			let filename = sanitize(title) + ".mp4";
			dl.pipe(fs.createWriteStream(`./${DL_DIR}/${filename}`));

			// handle output
			dl.on("info", (info) => {
				console.log("Download started: " + filename);
			})

			dl.on("end", () => {
				console.log("Download complete: " + filename);
				addToDB(link, title);
				done();
			});

		} catch(e) {
			console.log('error block triggered')
			console.log(e)
			err(e)
		}

	})

}

function downloadOG(link, title){

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
