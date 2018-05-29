const puppeteer = require("puppeteer");

(async () => {

	const browser = await puppeteer.launch({headless: true});

	const page = await browser.newPage();
	await page.goto("https://www.youtube.com/channel/UCdxB6UoY7VggXoaOSvEhSjg/videos", {waitUntil: "networkidle2"});

	// const videos = await page.evaluate(() => { return document.querySelectorAll('h3.ytd-grid-video-renderer')});
	// const items = await page.$eval('#items.ytd-grid-renderer', el => el.innerHTML);

	// "#items ytd-grid-video-renderer h3 a"
	// "#items ytd-grid-video-renderer"

	// const vidsCount = await page.$$eval("#items ytd-grid-video-renderer h3 a", vids => vids.length);
	// console.log(vidsCount);	

	// for(var i = 0; i < vidsCount; i++){
	// 	const item = await page.$eval
	// }

	const items = await page.$$('#items.ytd-grid-renderer h3 a');

	for (const item of items){
		console.log(item);
		// await async function(){
		// 	const title = await page.evaluate(item => item.innerHTML, item);
		// 	console.log('title:');
		// 	console.log(title);
		// }
	}
	console.log('done');
	// const title = await page.evaluate(item => item.querySelectorAll, items);

	await browser.close();

})();