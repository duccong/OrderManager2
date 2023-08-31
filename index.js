const myUtils = require('./puppeteer')
const bodyParser = require('body-parser');
const express = require('express')
var path = require('path');
const app = express()
const port = 3000
const fs = require('fs')

const regrexAllSpecialCase = /[:;'"?!@#\$%\^\&*\)\(+=._-]/gi;

app.use(express.static(__dirname + '/public'));
app.set("view engine", "ejs");
app.set('views', path.join(__dirname, 'views'));

app.use(bodyParser.urlencoded({ extended: true })); 

app.get('/',async (req, res) => {
    let pathShowViews = 'views/shopViews/'
    let files = [];

    if (!fs.existsSync(pathShowViews)) {
        console.log('No room folder!');
        fs.mkdirSync(pathShowViews, { recursive: true }, (err) => {
            console.error("error while writing file: " , err);
        });
    }

    const fileList = fs.readdirSync(pathShowViews);
    console.log("Nums of file: ", fileList.length);
    // Create the full path of the file/directory by concatenating the passed directory and file/directory name
    for (const file of fileList) {
        // const name = `${pathShowViews}/${file}`;
        files.push(file.slice(0, -4));
    }
    let mRoom = new Map();
    for (const [i, v] of Object.entries(files)) {
        mRoom.set( +i + 1 , v);
    }
    res.render("index", {
        data: JSON.stringify(Object.fromEntries(mRoom))
    })
});

app.get('/shopping', async (req, res) => {
    let linkShopee = req.query.linkShopee
    let roomId = req.query.roomId;
    let link = req.query.link;
    // TODO: need valid user input
    if (linkShopee) {
        let iLink = linkShopee.indexOf('-linkShopee-');
        if (iLink >= 0) {
            roomId = linkShopee.slice(0, iLink);
            link = linkShopee.slice(iLink + 12);
        }
    } 

    if (!roomId || !link) {
        res.send(`<h1>Something wrong. Not found roomId or link</h1>`);
        return;
    }
    console.log("Shopping: ", roomId, link)
    let id = roomId.replace(regrexAllSpecialCase, '-');
    let linkId = link.slice(link.lastIndexOf("/") + 1).replace(regrexAllSpecialCase, '-'); 
    let cacheFileName = `shopViews/${id + "-linkShopee-" + linkId}`;
    // TOOD: Need to improve catch all exception?
    if (!fs.existsSync(`views/${cacheFileName}.ejs`)) {
        res.send(`<h1>Something wrong. Not found roomId or link ${cacheFileName}</h1>`);
        return;
    }
    console.log(`Your ID: ` + roomId + ` link: `, link);
    res.render("shopping", {
        roomId: roomId,
        link: link,
        loadingPage: cacheFileName,
        pageLoadedSuccess: true
    });
});

app.post('/shopping', async (req, res) => {
    console.log(`SHOPPING >> Your ID: ${req.body.fId} \n Link: ${req.body.fLink}`);
    let id = req.body.fId;
    let link = req.body.fLink;
    let iLastQuerry = link.lastIndexOf('?');
    if (iLastQuerry >= 0) {
        link = link.slice(0, link.lastIndexOf('?'));
    }
    let data;
    // read link and save data
    id = id.replaceAll(regrexAllSpecialCase, '-');
    let linkId = link.slice(link.lastIndexOf("/") + 1).replace(regrexAllSpecialCase, '-');
    let cacheFileName = `shopViews/${id + "-linkShopee-" + linkId}`;
    let dataPath = `views/${cacheFileName}.ejs`;
    let pageLoadedSuccess = false;
    if (!fs.existsSync(dataPath)) {
        console.log(`Path: ${dataPath} is not existed`);
       try {
           data = await myUtils.getData(link, cacheFileName);
           pageLoadedSuccess = true;
        } catch (err) {
           console.error('ERR: Gettinng data from link - ', err.message);
        }
    } else {
        console.log(`Path: ${dataPath} is existed`);
        pageLoadedSuccess = true;
    }

    res.render("shopping", {
        pageLoadedSuccess: pageLoadedSuccess,
        link: link,
        roomId: id,
        loadingPage: cacheFileName,
    });
});

app.post("/ordered", (req, res) => {
    const { roomId, link, listMenu, userId} = req.body
    console.log(`Bill: `, listMenu, ' of ', userId, ' from: ', roomId);
    jListMenu = JSON.parse(listMenu);
    const date = new Date();
    let day = date.getDate();
    let month = date.getMonth() + 1;
    let year = date.getFullYear();
    let dailyFolder = './daily/' + year + month + day + '/';
    
    // write order
    let milS = date.getMilliseconds();
    let sec = addZ(date.getSeconds());
    let min = addZ(date.getMinutes());
    let hours = addZ(date.getHours());
    let dates = `${hours}h${min}m${sec}s${milS}ms`;
    jListMenu['Time'] = dates;
    let linkId = link.slice(link.lastIndexOf("/") + 1).replace(regrexAllSpecialCase, '-');
    let pathRoomFolder = `${dailyFolder}${roomId}-${linkId}/`

    // let orderNum = roomId;
    if (!fs.existsSync(dailyFolder)) {
        console.log('Today path is not existed', dailyFolder)
        fs.mkdirSync(dailyFolder, { recursive: true }, (err) => {
            console.error("error while writing file: " , err);
        });
    }

    if (!fs.existsSync(pathRoomFolder)) {
        console.log('Room path is not existed', pathRoomFolder);
        fs.mkdirSync(pathRoomFolder, { recursive: true }, (err) => {
            if (err != null) console.error("error while mkdir: " , err);
        });
    }
    let orderNum = ((`${userId}`).replace(' ', ''));
    fs.writeFile(`${pathRoomFolder}/${orderNum}.txt`, JSON.stringify(jListMenu), (err) => {
        if (err != null) {
            console.log("ERR: writing file : ", err);
        }
    });

    let data;
    res.render("ordered", {
        roomId: roomId,
        link: link,
        yourBills: JSON.stringify(jListMenu)
    })
})

app.get("/summary", (req, res) => {
    let roomId = req.query.roomId;
    let link = req.query.link;
    let listMenu = {};
    console.log(`Your ID: ` + roomId + ` link: `, link);
    // create data path
    const date = new Date();
    let day = date.getDate();
    let month = date.getMonth() + 1;
    let year = date.getFullYear();
    let dailyFolder = './daily/' + year + month + day + '/';
    
    let milS = date.getMilliseconds();
    let sec = addZ(date.getSeconds());
    let min = addZ(date.getMinutes());
    let hours = addZ(date.getHours());
    let dates = `${hours}h${min}m${sec}s${milS}ms`;
    let linkId = link.slice(link.lastIndexOf("/") + 1).replace(regrexAllSpecialCase, '-');
    let pathRoomFolder = `${dailyFolder}${roomId}-${linkId}`; // folder path

    // READ DATA
    let finalBill = new Map();
    let listUserOrder = new Map();
    let listDetailOrder = new Map();
    finalBill.set('TotalPay', 0);

    if (!fs.existsSync(pathRoomFolder)) {
        console.log("No data!!!");
        res.render("summary", {
            roomId: roomId,
            link: link,
            yourBills: JSON.stringify(Object.fromEntries(finalBill)),
            listUserOrder: JSON.stringify(Object.fromEntries(listUserOrder)),
            listDetailOrder: JSON.stringify(Object.fromEntries(listDetailOrder))
        });
        return;
    }

    const fileList = fs.readdirSync(pathRoomFolder);
    let files = [];
    console.log("Nums of file: ", fileList.length);
    // Create the full path of the file/directory by concatenating the passed directory and file/directory name
    for (const file of fileList) {
        const name = `${pathRoomFolder}/${file}`;
        console.log("Checking file: ", name);
        // Check if the current file/directory is a directory using fs.statSync
        if (fs.statSync(name).isDirectory()) {
            // Do-nothing
        } else {
            // If it is a file, push the full path to the files array
            let billDetail = '';
            try {
                billDetail = fs.readFileSync(name, 'utf8');
                console.log(billDetail);
              } catch (err) {
                console.error(err);
            }
            files.push(billDetail);
      }
    }

    for (const [i, v] of Object.entries(files)) {
        console.log(i, `:`);
        let order = JSON.parse(v);
        listUserOrder.set(order['uId'], order['Time']);
        let orderDetail = '';
        for (const [k, vOrder] of Object.entries(order)) {
            //console.log(k, ' : ', v);
            if ('uId' === k || 'Time' === k) {
                continue;
            }
            if (finalBill.has(k)) {
                console.log('Existed: ', k);
                if ('TotalPay' === k) {
                  console.log('Add totalPay: ', vOrder);
                  finalBill.set(k, +vOrder + finalBill.get(k));
                } else {
                  let lastNumerReg = /(\d+)(?!.*\d)/g;
                  var currentNumber = finalBill.get(k).match(lastNumerReg);
                  currentNumber = currentNumber ? +currentNumber[0] : 0; 
                  let addMore = vOrder.match(/(\d+)(?!.*\d)/g);
                  addMore = addMore ? +addMore[0] : 0;
                  let total = addMore + currentNumber;
                  console.log(vOrder, ' => Total: ', total);
                  finalBill.set(k, vOrder.slice(0, vOrder.lastIndexOf('x') + 1) + " " + total);
                }
            } else {
              console.log(typeof(k));
              finalBill.set(k, vOrder);
            }
            orderDetail += `<div>` + k + ` - ` + vOrder + ' \n' + `</div>`;
        }
        listDetailOrder.set(order['uId'], orderDetail);
        console.log("Detail: ", JSON.stringify(Object.fromEntries(listDetailOrder)));
    }
    console.log(">", finalBill); 

    // SORTING
    finalBill = new Map([...finalBill.entries()].sort((a, b) => a[0].localeCompare(b[0])));
    listUserOrder = new Map([...listUserOrder.entries()].sort((a, b) => a[1].localeCompare(b[1])));
    listDetailOrder = new Map([...listDetailOrder.entries()].sort((a, b) => a[0].localeCompare(b[0])));
    // let test3 = test2.at[1];

    res.render("summary", {
        roomId: roomId,
        link: link,
        yourBills: JSON.stringify(Object.fromEntries(finalBill)),
        listUserOrder: JSON.stringify(Object.fromEntries(listUserOrder)),
        listDetailOrder: JSON.stringify(Object.fromEntries(listDetailOrder))
    })
})

app.listen(port, (err) => {
    if (err) {
        console.log(err);
    }
    console.log('Sever is running on port: ', port);
})

function addZ(n){return n<10? '0'+n:''+n;}

async function isFileExist(path) {
    try {
        return (await fsp.stat(path)).isFile();
    } catch (e) {
        return false;
    }
}
