const cron = require('node-cron');
const puppeteer = require('puppeteer');
const fs = require('fs');
//const fetch = require('node-fetch');
const fetch = (...args) => import('node-fetch').then(({
    default: fetch
}) => fetch(...args));
const HttpsProxyAgent = require('https-proxy-agent');
const {
    base64encode,
    base64decode
} = require('nodejs-base64');

/* // Express Initialised
const express = require('express');
const app = express({
    urlEncoded: true
});

var port = process.env.PORT || 3003;
app.listen(port, () => {
    console.log(`Listening on Port: ${port}`)
})

app.get('/logs', (req, res) => {
    res.status(200).sendFile(__dirname + "/log.txt");
}) */

var ip = [];
/* var payloads = fs.readFileSync('./payloads.txt', 'utf8', (err, file) => {
    if (err) console.log(err);
}).split(/\n/);
var arrCtr=0; */
var requestCount = 100000,
    ctr = 0;
var validProxy = undefined;

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
    var intervalId = setInterval(() => {
        httpsRequests();
        if (ctr == requestCount) {
            clearInterval(intervalId);
            task.stop();
            process.exit(0);
        }
        /* if(arrCtr == payloads.length) 
          clearInterval(intervalId); */
    }, 500);
});

var task = cron.schedule("*/2 * * * *", () => {
    getProxies().then(() => console.log("Successfuly Extracted IP Address's - Proxies from SSLProxies."));
})


/* function generatePassword(size = 8) {
    let chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()"
    let pass = "";
    for (let i = 0; i < size; i++) {
        pass += chars[Math.floor(Math.random() * chars.length)];
    }
    return pass;
} */

async function makeRequests(url, options) {
    let isValidProxy = false;
    let response = await fetch(url, options).then(res => {
            if (res.ok) {
                ctr++;
                console.log("Count: " + ctr)
                // arrCtr++
                // fs.appendFileSync('./log.txt', JSON.stringify(response) + "\n------------\n\n")
                isValidProxy = true;
            }
            return res.json();
        })
        .catch(e => console.log(e.toString()))

    if (response !== undefined) {
        console.log(response)
    } else if ((response.status == 403 || response.success == false) && response !== undefined) {
        isValidProxy = false;
    }
    return isValidProxy;
}


async function httpsRequests() {
    // Add Request Body, Cookies & Headers
    process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0;

    let base64Text = "";
    let decodedJson = JSON.parse(base64decode(base64Text));
    let encodedJson = base64encode(JSON.stringify(decodedJson));

    // var burp0_cookie, burp0_bodyString, burp0_headers;

    let proxyAgent;
    if (validProxy !== "") {
        proxyAgent = validProxy;
    } else {
        let index = Math.floor(Math.random() * ip.length);
        console.log("Proxy: " + ip[index]);
        proxyAgent = new HttpsProxyAgent(`http://${ip[index]}`);
    }

    // Add Request Options
    var burp0_options = {
        url: "https://example.com",
        headers: burp0_headers,
        method: "post",
        body: burp0_bodyString,
        agent: proxyAgent
    }

    try {
        /*  const response = await fetch('https://httpbin.org/ip?json', {
             agent: proxyAgent
         });
         const body = await response.text();
         console.log(body); */

        let isValidProxy = makeRequests("https://example.com", burp0_options);
        if (isValidProxy === true)
            validProxy = proxyAgent
        else
            validProxy = undefined;

    } catch (e) {
        console.log(e.toString());
    }
}