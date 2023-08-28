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
    let userId = req.query.userId;
    let link = req.query.link;
    console.log(`Your ID: ` + userId + ` link: `, link);
    res.render("shopping", {
        userId: userId,
        link: link,
    });
});

app.post('/shopping', async (req, res) => {
    console.log(`Your ID: ${req.body.fId} \n Link: ${req.body.fLink}`);
    let id = 'guest';
    let link = 'https://shopeefood.vn/ho-chi-minh/com-ba-ghien-nguyen-van-troi';
    let data;
    // read link and save data
    // try {
    //     data = await myUtils.getData(link, id);
    // } catch (err) {
    //     console.log('ERR: Gettinng data from link: ', data)
    //     data = err;
    // }

    // fs.readFile(`${id}.txt`, "utf-8", (err, data) => {
    //     console.log('get: ', data.slice(0, 35));
    //     // render ejs file
    //     res.render("shopping", {
    //         data: data,
    //     })
    // });
    res.render("shopping", {
        // data: data,
        link: link,
        userId: id,
    });
});

app.post("/ordered", (req, res) => {
    const { listMenu } = req.body
    console.log(`Bill: `, listMenu);
    const date = new Date();
    let day = date.getDate();
    let month = date.getMonth() + 1;
    let year = date.getFullYear();
    let dailyFolder = './daily/' + year + month + day + '/';
    if (!fs.existsSync(dailyFolder)) {
        console.log('Today path is not existed', dailyFolder)
        fs.mkdir(dailyFolder, { recursive: true }, (err) => {
            console.error("error while writing file: " , err);
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
        if (err != null) {
            console.log("ERR: writing file : ", err);
        }
    });

    //
    let data;
    res.render("index", {
        userId: `data`
    })
})

app.listen(port, (err) => {
    if (err) {
        console.log(err);
    }
    console.log('Sever is running on port: ', port);
})

function addZ(n){return n<10? '0'+n:''+n;}