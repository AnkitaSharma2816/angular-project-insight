import puppeteer from 'puppeteer';

export async function generatePdf(html: string): Promise<Buffer> {

	// NOTE: In VSCode extensions you must provide executable path
	const browser = await puppeteer.launch({
		headless: true,
		args: ['--no-sandbox', '--disable-setuid-sandbox']
	});

	const page = await browser.newPage();

	await page.setContent(html, {
		waitUntil: 'load' // ✅ FIXED (no networkidle0)
	});

	const pdf = await page.pdf({
		format: 'A4',
		printBackground: true
	});

	await browser.close();

	return Buffer.from(pdf);
}