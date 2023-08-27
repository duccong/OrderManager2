const puppeteer = require('puppeteer');
const fs = require('fs');
const { text } = require('express');

const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

const clickWait = async (elem, ms = 1000) => {await elem.click(); await delay(ms);};

const convertStringPxToInt = (sIn) =>  {
    let out = 0;
    out = sIn.slice(0, sIn.length - 2);
    return out;
}

async function  getData(url, outId) {
    console.log('getData: ', url, ' outId: ', outId);
    // Launch the browser and open a new blank page
    const browser = await puppeteer.launch({headless: true});
    const page = await browser.newPage();

    await page.setDefaultTimeout(5000);

    // Navigate the page to a URL
    await page.goto(url, {
        waitUntil: 'networkidle0',
    });

    // Set screen size
    await page.setViewport({ width: 1080, height: 1024 });
    let total = 0;
    console.log('Checking data...');
    // selector category: #scroll-spy > div > div:nth-child(1)
    console.log('Init map menu');
    let nextList = undefined;
    let map = new Map();
    let testI = 1;

    let category = await page.$$('#scroll-spy > div > div > span.item-link');
    console.log('Move to first Category', await category.at(0).evaluate(x => x.textContent));
    await clickWait(category.at(0));
    // //*[@id="restaurant-item"]
    let currentId = 0;


    do {
        let restaurantItem = undefined;
        // if (testI == 1) {
        //     restaurantItem = await page.evaluate(() => document.querySelector('#restaurant-item').outerHTML);
        // } else {
        //     restaurantItem = await page.evaluate(() => document.querySelector('#restaurant-item > div > div').outerHTML);
        // }
        // list meals: #restaurant-item > div > div > div.item-restaurant-row
        testI++;
        // let listMeals = await page.$$('#restaurant-item > div > div > div.item-restaurant-row');
        // map.set(testI, restaurantItem);
        let listMeals = await page.$$('#restaurant-item > div > div > div');
        // map.set(testI, listMeals);
        for (const [i, v] of listMeals.entries()) {
            let id = (await v.evaluate((x) => x.id)).slice(-9);
            let textContent = await v.evaluate((x) => x.textContent);
            let divData = await v.evaluate((x) => x.outerHTML);
            let oldPrice = divData.indexOf(`class="old-price"`);
            if (oldPrice >= 0) {
                oldPrice = divData.indexOf(`>`, (oldPrice));
                // console.log(">>>>>>", divData.slice(oldPrice, oldPrice + 5));
                divData = divData.slice(0, oldPrice + 1) + "~" + divData.slice(oldPrice + 1);
            }
            console.log('Add: [', i, '/', listMeals.length - 1, '].data = ', textContent);
            // if (!map.has(textContent)) {
            //     map.set(textContent, divData);
            // } else {
            if (id.length > 0) {
                currentId = id;
                console.log('Id: ', currentId);
            } else {
                // add id for col item-restaurant-info
                divData = divData.slice(0, 5) + `id=\"${textContent}\"` + divData.slice(5);
            }
            map.set(textContent + currentId, divData);
            // }
            if (i == (listMeals.length - 1)) {
                if (v) {
                    console.log('Moving... to ', textContent);
                    await page.evaluate((elem) => elem.scrollIntoView(), v);
                    await page.waitForTimeout(1000);
                    if (nextList == textContent) { // todo: need to double-check this case
                        nextList = undefined;
                        break;
                    }
                    nextList = textContent;
                }
            }
        }
    } while (nextList != undefined);


    console.log('Start make list menu: ');
    let listMenu = '';
    for(const [k, v] of map.entries()) {
        console.log(v.slice(0, 20));
        listMenu += v;
    }

    // console.log(listMenu);
    fs.writeFile(`${outId}.txt`, listMenu, (err) => {
        console.log(err)
    });

    try {
        // Capture screenshot and save it in the current folder:
        await page.screenshot({ path: `./scrapingbee_homepage.jpg` });

    } catch (err) {
        console.log(`Error: ${err.message}`);
    } finally {
        await browser.close();
        console.log(`Screenshot has been captured successfully`);
    }
    await browser.close();
    return data;
};
// getData();
module.exports = {
    getData : getData,
};

//
// let id = 'guest';
// let link = 'https://shopeefood.vn/ho-chi-minh/com-ba-ghien-nguyen-van-troi';
// let data;
// // read link and save data
// try {
//     data =  getData(link, id);
// } catch (err) {
//     console.log('err:', data)
//     data = err;
// }