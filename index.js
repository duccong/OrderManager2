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
    console.log(`Your ID: ` + roomId + ` link: `, link);
    res.render("shopping", {
        roomId: roomId,
        link: link,
    });
});

app.post('/shopping', async (req, res) => {
    console.log(`Your ID: ${req.body.fId} \n Link: ${req.body.fLink}`);
    let id = req.body.fId;
    let link = req.body.fLink;
    let data;
    // read link and save data
    id = id.replace(/[.:]/g, '-');
    let dataPath = `views/${id}.ejs`;
    let pageLoadedSuccess = false;
    if (!fs.existsSync(dataPath)) {
        console.log(`Path: views/${dataPath} is not existed`);
       try {
           data = await myUtils.getData(link, id);
           pageLoadedSuccess = true;
        } catch (err) {
            // TODO: need check null ?
            if (err == null) {
                pageLoadedSuccess = true
            } else {
                console.error('ERR: Gettinng data from link: ', data)
            }
        }
    } else {
        console.log(`Path: ${dataPath} is existed`);
        pageLoadedSuccess = true;
    }

    if (!pageLoadedSuccess) {
        console.log(`Fail to load page. Re-try load shoppe page`);
       try {
           data = await myUtils.getData(link, id);
           pageLoadedSuccess = true;
        } catch (err) {
           console.error('ERR: Gettinng data from link: ', data)
        }
    }
    res.render("shopping", {
        pageLoadedSuccess: pageLoadedSuccess,
        link: link,
        roomId: id,
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
    // let orderNum = roomId;

    if (!fs.existsSync(dailyFolder)) {
        console.log('Today path is not existed', dailyFolder)
        fs.mkdirSync(dailyFolder, { recursive: true }, (err) => {
            console.error("error while writing file: " , err);
        });
    }

    let pathRoomFolder = `${dailyFolder}${roomId}/`
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
    res.render("summary", {
        roomId: roomId,
        link: link,
        yourBills: JSON.stringify(listMenu)
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
