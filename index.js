const cron = require('node-cron');
const puppeteer = require('puppeteer');
const fs = require('fs');
//const fetch = require('node-fetch');
const fetch = (...args) => import('node-fetch').then(({
    default: fetch
}) => fetch(...args));
const HttpsProxyAgent = require('https-proxy-agent');
const prompt = require('prompt');
const colors = require('@colors/colors/safe');

var data = require('./request.json')
const writer = fs.createWriteStream('log.txt')

// Express Initialised
const express = require('express');
const app = express({
    urlEncoded: true
});

// Configuration 
var port, requestCount, requestInterval, enableLogs = false,
    ctr = 0;

var validIP = undefined,
    currentIP = undefined;

// From request.json
var {
    burp0_cookie,
    burp0_bodyString,
    burp0_headers,
    requestType,
    requestUrl
} = data;
burp0_headers["Cookie"] = burp0_cookie;

var ip = [];
/* var payloads = fs.readFileSync('./payloads.txt', 'utf8', (err, file) => {
    if (err) console.log(err);
}).split(/\n/);
var arrCtr=0; */

const input = [{
        name: "port",
        pattern: /\d/,
        type: 'number',
        default: process.env.PORT || 3000,
        required: false,
        description: "Enter Port"
    },
    {
        name: "requestCount",
        pattern: /\d/,
        type: 'number',
        default: 100000,
        required: false,
        description: "Enter Request Count"
    },
    {
        name: "requestInterval",
        pattern: /\d/,
        type: 'number',
        default: 1000,
        required: false,
        description: "Enter Request Interval"
    },
    {
        name: "parse",
        pattern: /yes|no|y|n/i,
        type: 'string',
        default: "Y",
        required: false,
        description: "Parse request.txt ? "
    },
    {
        name: "enableLogs",
        pattern: /true|t|false|f/i,
        type: 'boolean',
        default: "t",
        required: false,
        description: "Write Output logs to logs.txt ? "
    }

]

prompt.message = ">";

prompt.get(input, (err, result) => {
    if (err) {
        console.log(err);
        process.exit(1);
    } else {

        ({
            port,
            requestCount,
            requestInterval,
            enableLogs
        } = result);

        if (/yes|y/i.test(result["parse"]) == true) parseTxtReqToJson();

        app.listen(port, () => {
            console.log(colors.yellow(`Listening on Port: ${port}`))
        })

        getProxies().then(() => {
            console.log(colors.yellow("Successfuly Extracted IP Address's - Proxies from SSLProxies."));
            var intervalId = setInterval(() => {
                httpsRequests();
                if (ctr == requestCount) {
                    clearInterval(intervalId);
                    task.stop();
                    process.exit(0);
                }
                /* if(arrCtr == payloads.length-1) {
                    clearInterval(intervalId);
                    task.stop();
                    process.exit(0);
                } */

            }, requestInterval);
        });

        var task = cron.schedule("*/2 * * * *", () => {
            getProxies().then(() => console.log(colors.yellow("Successfuly Extracted IP Address's - Proxies from SSLProxies.")));
        })


    }
});

writer.write("Proxied Requests - Logs \n-----------------------\n\n")

app.get("/kill", (req, res) => {
    res.status(200).send("Killing Automation...");
    process.exit(0);
});

app.get('/logs', (req, res) => {
    res.status(200).sendFile(__dirname + "/log.txt");
})

const parseTxtReqToJson = () => {
    try {
        let requestTxt = fs.readFileSync('./request.txt', 'utf8').toString();
        let requestArr = requestTxt.split("\n");
        let temp = {},
            temp2 = {};

        for (let i = 0; i < requestArr.length; i++) {
            if (requestArr[i].startsWith("var burp0_cookie = ")) {
                burp0_cookie = requestArr[i].trim().slice(requestArr.indexOf("var burp0_cookie = \"") + "var burp0_cookie = \"".length + 1, requestArr[i].trim().length - 1);
            } else if (requestArr[i].startsWith("var burp0_bodyString = ")) {
                burp0_bodyString = requestArr[i].trim().slice(requestArr.indexOf("var burp0_bodyString = \"") + "var burp0_bodyString = \"".length + 1, requestArr[i].trim().length - 1);
                if (burp0_bodyString.startsWith("{") == true) burp0_bodyString = JSON.stringify(JSON.parse(JSON.parse("\"" + burp0_bodyString + "\"")));
            } else if (requestArr[i].startsWith("var burp0_headers = ")) {
                i++;
                while (requestArr[i][0] != "}") {
                    temp[requestArr[i].trim().substring(1, requestArr[i].trim().indexOf(":") - 1)] = requestArr[i].trim().substring(requestArr[i].trim().indexOf(":") + 3, requestArr[i].trim().lastIndexOf(",") - 1)
                    i++;
                }
                i--;
            } else if (requestArr[i].startsWith("var burp0_options = ")) {
                i++;
                while (requestArr[i][0] != "}") {
                    temp2[requestArr[i].trim().substring(0, requestArr[i].trim().indexOf(":"))] = requestArr[i].trim().substring(requestArr[i].trim().indexOf(":") + 2, requestArr[i].trim().lastIndexOf(",") - 1)
                    i++;
                }
                i--;
            }
        }


        temp["Cookie"] = burp0_cookie;
        burp0_headers = temp;
        requestUrl = temp2["url"].replace("\"", "");
        requestType = temp2["method"].replace("\"", "");

        data = {
            burp0_cookie,
            burp0_bodyString,
            burp0_headers,
            requestUrl,
            requestType
        }

        fs.writeFileSync('./request.json', JSON.stringify(data, null, 2), (err) => {
            if (err) throw err;
        })

    } catch (e) {
        console.log("Error Parsing request.txt file.")
        process.exit(1);
    }

}

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

const convertResHeadersToString = (headers) => {
    let str = "";

    for (var pair of headers.entries())
        str += `${pair[0]} : ${pair[1]}\n`;
    return str
}

async function makeRequests(url, options) {
    try {
        let isValidProxy = false;
        let response = await fetch(url, options).then(res => {
                if (res.ok) {
                    ctr++;
                    console.log(colors.green("Count: " + ctr));
                    console.log(colors.green("Status: " + res.status))
                    if (enableLogs == true)
                        writer.write("Count: " + ctr + "\nStatus: " + res.status + "\nHeaders: \n" + convertResHeadersToString(res.headers) + "\n------------\n\n");

                    // arrCtr++
                    isValidProxy = true;
                }
                return res.json();
            })
            .catch(e => console.log(colors.red(e.toString())))

        if (response !== undefined) {
            console.log(response);
            if (enableLogs == true)
                writer.write("Response: \n" + JSON.stringify(response) + "\n------------\n\n")

        } else if (response !== undefined && (response.hasOwnProperty("status") == true && response.hasOwnProperty("success") == true)) {
            if (response.status === 429 || response.success === false) {
                console.log(response);
                isValidProxy = false
                if (enableLogs == true)
                    writer.write("Response: \n" + JSON.stringify(response) + "\n------------\n\n");

            }
        }

        if (isValidProxy == true)
            validIP = currentIP;
        else
            validIP = undefined;
    } catch (e) {
        console.log(colors.red(e.toString()))
    }
}

async function httpsRequests() {
    // Add Request Body, Cookies & Headers
    process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0

    let proxyAgent;
    if (validIP !== undefined) {
        console.log(colors.blue("Working Proxy: " + validIP))
        proxyAgent = new HttpsProxyAgent(`http://${validIP}`);
    } else {
        let index = Math.floor(Math.random() * ip.length);
        currentIP = ip[index]
        console.log(colors.blue("Proxy: " + currentIP));
        proxyAgent = new HttpsProxyAgent(`http://${currentIP}`);
    }

    // Add Request Options
    var burp0_options;
    if (requestType == "" || requestType.toUpperCase() == "GET" || requestType.toUpperCase() == "HEAD") {
        burp0_options = {
            url: requestUrl,
            headers: burp0_headers,
            method: requestType,
            agent: proxyAgent
        }
    } else {
        burp0_options = {
            url: requestUrl,
            headers: burp0_headers,
            method: requestType,
            agent: proxyAgent,
            body: burp0_bodyString
        }
    }

    try {

        makeRequests(requestUrl, burp0_options);

    } catch (e) {
        console.log(colors.red(e.toString()));
    }
}