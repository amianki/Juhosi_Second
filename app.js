const express = require("express");
const mysql = require("mysql")
const bodyParser = require("body-parser");
const Excel = require('exceljs');

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
const port = 4000;

// Connect to remote database
const connection = mysql.createConnection({
    host: "db4free.net",
    user: "juhosi",
    password: "juhosi123",
    database: "juhosi",
});

// LOGIN PAGE
app.get("/", (req, res) => {
    res.sendFile(__dirname + "/index.html");
});

// SIGN IN Clicked
app.post("/", (req, res) => {
    let userId = req.body.user_id;
    let password = req.body.password;
    connection.query(`SELECT password FROM User WHERE id = "${userId}"`, (err, result, fields) => {
        if (err) console.log(err.message);
        let data = JSON.parse(JSON.stringify(result));
        // console.log(data.length);
        if (data.length > 0) {
            if (data[0].password == password) {
                res.redirect(/item/ + userId);
            } else {
                res.sendFile(__dirname + "/notfound.html");
            }
        } else {
            res.sendFile(__dirname + "/notfound.html");
        }
    });
});

// ITEM PAGE
app.get("/item/:id", (req, res) => {
    let userId = req.params.id;
    connection.query(`SELECT name FROM User WHERE id = "${userId}"`, (err, result, fields) => {
        if (err) console.log(err.message);
        let data = JSON.parse(JSON.stringify(result));
        // console.log(data);
        if (data.length > 0) {
            let name = data[0].name;
            console.log(name);
            res.render('item', { id: userId, name: name });
        }
        else {
            res.sendFile(__dirname + "/notfound.html");
        }
    })
});

// ADD Clicked
app.post("/add/:id", (req, res) => {
    let id = req.params.id;
    let order_date = req.body.order_date;
    // let company = req.body.company;
    // let order_owner = req.body.order_owner;
    let item = req.body.item;
    let count = req.body.count;
    let weight = req.body.weight;
    let request = req.body.request;

    connection.query(`INSERT INTO OrderItem 
    (id, orderDate, package, count, request_weight, requests, productId)
    VALUES 
    ("${id}", "${order_date}", "${item}", "${count}", "${weight}", "${request}", 324)`,
        (err, result, fields) => {
            if (err) console.log(err.message);
            let data = JSON.parse(JSON.stringify(result));
            // console.log(data);
            // res.write("<h1>Data inserted successfully!</h1>");
            // res.write(`<a href="/item/${id}">Go Back</a>`);
            // res.write(`<a href="/myorder/${id}"><button>Show Order Data</button></a>`);
            // res.send();
            res.render("data_added", {id:id})
        }
    );
});

// MY ORDER
app.get("/myorder/:id", (req, res) => {
    let id = req.params.id;
    connection.query(`SELECT * FROM OrderItem WHERE id = "${id}"`, (err, result, fields) => {
        if (err) console.error(err.message);
        let data = JSON.parse(JSON.stringify(result));
        // console.log(data);
        connection.query(`SELECT name FROM User WHERE id = "${id}"`, (err, result, fields) => {
            if (err) console.error(err.message);
            let username = JSON.parse(JSON.stringify(result));
            // console.log(username);
            res.render("myorder", { data: data, username: username[0].name });
        })
    })
});

// EXPORT TO EXCEL
app.get("/export/:id", (req, res) => {
    const id = req.params.id;
    const wb = new Excel.Workbook();
    const ws = wb.addWorksheet('My Sheet');

    const headers = [
        { header: 'Order Date', key: 'orderDate', width: 30 },
        { header: 'Company', key: 'id', width: 30 },
        { header: 'Order Owner', key: 'name', width: 30 },
        { header: 'Item/Product', key: 'package', width: 30 },
        { header: 'EA/Count', key: 'count', width: 30 },
        { header: 'Weight', key: 'request_weight', width: 30 },
        { header: 'Request for Shipment', key: 'requests', width: 30 },
        { header: 'Field box: Size', key: '', width: 30 },
        { header: 'Office box check', key: '', width: 30 },
        { header: 'Specifications Quantity', key: '', width: 30 },
    ]
    connection.query(`SELECT * FROM OrderItem WHERE id = "${id}"`, (err, result, fields) => {
        if (err) console.error(err.message);
        let data = JSON.parse(JSON.stringify(result));
        // console.log(data);
        connection.query(`SELECT name FROM User WHERE id = "${id}"`, (err, result, fields) => {
            if (err) console.error(err.message);
            let username = JSON.parse(JSON.stringify(result));
            ws.columns = headers;
            data.forEach(order => {
                const row = {
                    orderDate: order.orderDate,
                    id: order.id,
                    name: username[0].name,
                    package: order.package,
                    count: order.count,
                    request_weight: order.request_weight,
                    requests: order.requests
                }
                ws.addRow(row);
            });
            res.setHeader(
                "Content-Type",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            );
            res.setHeader(
                "Content-Disposition",
                `attachment; filename=orders.xlsx`
            )
            return wb.xlsx.write(res).then(()=>{
                res.status(200).send();
            });
        });
    });

    // res.send("Exported " + id);
});

// CHANGE PASSWORD Clicked
app.post("/change", (req, res) => {
    res.sendFile(__dirname + "/update.html");
});

// UPDATE PASSWORD Clicked
app.post("/updated", (req, res) => {
    let mobile_no = req.body.mobile_no;
    let new_password = req.body.new_password;
    let confirm_password = req.body.confirm_password;
    if (new_password != confirm_password) {
        res.sendFile(__dirname + "/unmatched.html");
    } else {
        connection.query(`UPDATE User SET password = "${new_password}" 
        WHERE phone_number = "${mobile_no}"`, (err, result, fields) => {
            if (err) console.log(err.message);
            let data = JSON.parse(JSON.stringify(result));
            console.log(data);

            if (data.affectedRows) {
                res.write("<h1>Password updated successfully!</h1>");
                res.write('<a href="/">Back to Login</a>');
                res.send();
            } else {
                res.write("<h1>Please enter correct mobile number!</h1>");
                res.write('<a href="/">Try Again</a>');
                res.send();
            }
        })
    }

});

app.listen(port, () => {
    console.log("App is running on port: " + port);
})












// Connect to OLD remote database
// const connectionOld = mysql.createConnection({
//     host: "sql12.freemysqlhosting.net",
//     user: "sql12629011",
//     password: "RzlzHmeUy8",
//     database: "sql12629011",
// });


