const puppeteer = require('puppeteer');

(async () => {

	const browser = await puppeteer.launch({headless: false});

	const page = await browser.newPage();
	await page.goto('https://www.youtube.com/channel/UCdxB6UoY7VggXoaOSvEhSjg/videos', {waitUntil: 'networkidle2'});

	await browser.close();

})();