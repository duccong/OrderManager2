const myUtils = require('./puppeteer')
const bodyParser = require('body-parser');
const express = require('express')
const app = express()
const port = 3000
const fs = require('fs')

app.use(express.static(__dirname + '/public'));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true })); 

app.get('/',async (req, res) => {
    res.render("index", {
        data: "init"
    })
});

app.get('/shopping', async (req, res) => {
    let roomId = req.query.roomId;
    let link = req.query.link;
    // TODO: need valid user input
    let id = roomId.replace(/[.:]/g, '-');
    let linkId = link.slice(link.lastIndexOf("/") + 1); 
    let cacheFileName = `${id + "-" + linkId}`;
    console.log(`Your ID: ` + roomId + ` link: `, link);
    res.render("shopping", {
        roomId: roomId,
        link: link,
        loadingPage: cacheFileName,
        pageLoadedSuccess: true
    });
});

app.post('/shopping', async (req, res) => {
    console.log(`Your ID: ${req.body.fId} \n Link: ${req.body.fLink}`);
    let id = req.body.fId;
    let link = req.body.fLink;
    let data;
    // read link and save data
    id = id.replace(/[.:]/g, '-');
    let linkId = link.slice(link.lastIndexOf("/") + 1);
    let cacheFileName = `${id + "-" + linkId}`;
    let dataPath = `views/${cacheFileName}.ejs`;
    let pageLoadedSuccess = false;
    if (!fs.existsSync(dataPath)) {
        console.log(`Path: views/${dataPath} is not existed`);
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
    let linkId = link.slice(link.lastIndexOf("/") + 1);
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
    let linkId = link.slice(link.lastIndexOf("/") + 1);
    let pathRoomFolder = `${dailyFolder}${roomId}-${linkId}`; // folder path

    // READ DATA
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

    let finalBill = new Map();
    let listUserOrder = new Map();
    let listDetailOrder = new Map();
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
