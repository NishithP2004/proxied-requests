const cron = require('node-cron');
const puppeteer = require('puppeteer');
const fs = require('fs');
//const fetch = require('node-fetch');
const fetch = (...args) => import('node-fetch').then(({
    default: fetch
}) => fetch(...args));
const HttpsProxyAgent = require('https-proxy-agent');
//const proxy_check = require('proxy-check');

var ip = [];
var payloads = fs.readFileSync('./payloads.txt', 'utf8', (err, file) => {
    if (err) console.log(err);
}).split(/\n/);
var arrCtr=0;

async function getProxies() {
    try {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.goto('https://sslproxies.org/', {
            waitUntil: "load",
            timeout: 0
        });
        await page.waitForSelector("#list > div > div.text-center > ul > li:nth-child(5) > a > i");
        await page.click("#list > div > div.text-center > ul > li:nth-child(5) > a > i");
        setTimeout(async () => {
            await page.waitForSelector('#raw > div > div > div.modal-body > textarea');
            let res = await page.$eval("#raw > div > div > div.modal-body > textarea", textArea => textArea.textContent);
            fs.writeFileSync('./IP_Address.txt', res.substring(res.indexOf("UTC.") + 4, res.length).trim(), err => console.log(err))
            await browser.close();
        }, 5000);
    } catch (e) {
        console.log(e);
    }

    ip = fs.readFileSync("./IP_Address.txt", 'utf-8', (err, file) => {
        if (err) console.log(err);
    }).split(/\n/);
}

getProxies().then(() => {
    console.log("Successfuly Extracted IP Address's - Proxies from SSLProxies.");
    httpsRequests();
});
cron.schedule("*/5 * * * *", () => {
    getProxies().then(() => console.log("Successfuly Extracted IP Address's - Proxies from SSLProxies."));
})


function generatePassword(size = 8) {
    let chars = "abcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()"
    let pass = "";
    for (let i = 0; i < size; i++) {
        pass += chars[Math.floor(Math.random() * chars.length)];
    }
    return pass;
}

async function httpsRequests() {
    // Add Request Body, Cookies & Headers
   

    let index = Math.floor(Math.random() * ip.length);
    console.log("Proxy: " + ip[index]);
    let proxyAgent = new HttpsProxyAgent(`http://${ip[index]}`);
    
    // Add Request Options

    try {
        /*  const response = await fetch('https://httpbin.org/ip?json', {
             agent: proxyAgent
         });
         const body = await response.text();
         console.log(body); */

        let response = await fetch(`${url}`, burp0_options).then(res => res.json());
        console.log(response)
    } catch (e) {
        console.log(e);
        arrCtr--;
    }
}

var intervalId = setInterval(() => {
    httpsRequests();
    if(arrCtr == payloads.length - 1) 
      clearInterval(intervalId);
}, 10000);