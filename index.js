const puppeteer = require('puppeteer-extra')
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
puppeteer.use(StealthPlugin());
const { spawn } = require("child_process");

const DEFAULT_PATH = '';

(async () => {
    const b = await puppeteer.launch({ headless: false, defaultViewport: null, executablePath: '/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome' })
    const page = await b.newPage()

    page.on('response', async res => {
        const req = res.request();
        if (req.url().includes('.m3u8') && req.url().includes('jsonp')) {
            const data = await res.text()
            const { flavors, duration } = JSON.parse(data.split('(')[1].slice(0, -2))

            flavors.sort((a, b) => a.width * a.height - b.width * b.height)
            const { url } = flavors.pop()

            const filename = (await page.title()).trim().replace(/[^a-zA-Z0-9]/g, '_')

            console.log('Starting Download: ', filename, duration)

            const ffmpeg = spawn(`ffmpeg`, [
                '-y',
                '-hide_banner',
                '-loglevel',
                'error',
                '-protocol_whitelist',
                'file,http,https,tcp,tls,crypto',
                '-i',
                `${url}`,
                '-c', 
                'copy',
                `${DEFAULT_PATH}${filename}.mp4`
            ], { stdio: 'inherit' })

            ffmpeg.on('exit', exitCode => {
                exitCode ? console.error(`Err: ${exitCode} | ${filename}`) : console.log(`Success: ${filename}`)
            })
        }
    });

    await page.goto('https://mediaspace.illinois.edu/channel/x/223561603');
})();