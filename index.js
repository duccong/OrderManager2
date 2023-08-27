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
    res.sendFile(__dirname + '/index.html');
});

app.post('/create', async (req, res) => {
    console.log(`Your ID: ${req.body.fId} \n Link: ${req.body.fLink}`);
    let id = 'guest';
    let link = 'https://shopeefood.vn/ho-chi-minh/com-ba-ghien-nguyen-van-troi';
    let data;
    // read link and save data
    // try {
    //     data = await myUtils.getData(link, id);
    // } catch (err) {
    //     console.log('err:', data)
    //     data = err;
    // }

    fs.readFile(`${id}.txt`, "utf-8", (err, data) => {
        console.log('get: ', data.slice(0, 35));
        // render ejs file
        res.render("test", {
            data: data
            // userId: id,
        })
    });
});

app.post("/finish", (req, res) => {
    const { listMenu, userId } = req.body
    console.log( 'Id:', userId, 'menu: ', listMenu);
    const date = new Date();
    let day = date.getDate();
    let month = date.getMonth() + 1;
    let year = date.getFullYear();
    let dailyFolder = './daily/' + year + month + day + '/';
    if (!fs.existsSync(dailyFolder)) {
        console.log('Today path is not existed', dailyFolder)
        fs.mkdir(dailyFolder, { recursive: true }, (err) => {
            console.error("error: " , err);
        });
    }
    // write order
    let milS = date.getMilliseconds();
    let sec = addZ(date.getSeconds());
    let min = addZ(date.getMinutes());
    let hours = addZ(date.getHours());
    // let orderNum = ((`order-${hours}-${min}-${sec}-${milS}-${userId}`).replace(' ', ''));
    let orderNum = 'TESTING';
    fs.writeFile(`${dailyFolder+orderNum}.txt`, listMenu, (err) => {
        console.log("ERR: writing file : ", err);
    });

    res.sendFile(__dirname + '/index.html');
    // res.render("test", {
    //     data: data
    // })
})

app.listen(port, (err) => {
    if (err) {
        console.log(err);
    }
    console.log('Sever is running on port: ', port);
})

function renderHTML(path, data) {
    res.render("test", {
        data: data,
        userId: id,
    })
}

function addZ(n){return n<10? '0'+n:''+n;}