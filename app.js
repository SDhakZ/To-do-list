const express = require('express');
const app = express();
const items = ["Start Day", "Breakfast"];
var _ = require('lodash')
const mongoose = require('mongoose')

mongoose.connect("mongodb+srv://sharnam:Sharnam12345@cluster0.5denf.mongodb.net/todolistDB");
const itemsSchema = new mongoose.Schema({
    name: String
})

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
    name: "Welome to our to do list"
})

const item2 = new Item({
    name: "Hit the + button to add a new item"
})

const item3 = new Item({
    name: "<-- Hit this to remove item"
})

const defaultItem = [item1, item2, item3];
const listSchema = {
    name: String,
    items: [itemsSchema]
}

const List = mongoose.model("List", listSchema)


app.set('view engine', 'ejs');

app.use(express.static("public"));

app.listen(3000, function () {
    console.log("It is running on port 3000")
})

app.use(express.urlencoded({
    extended: true
}))

app.get('/', function (req, res) {


    Item.find(function (err, foundItems) {
        if (foundItems.length === 0) {
            Item.insertMany(defaultItem, function (err) {
                if (err) {
                    console.log(err)
                } else {
                    console.log("Succesfully added items")
                }
            })
            res.redirect("/")
        } else {
            res.render("list", {
                listTitle: "Today",
                newListItems: foundItems
            });
        }
    })
})

app.get("/:customListName", function (req, res) {
    const customListName = _.capitalize(req.params.customListName);
    List.findOne({
        name: customListName
    }, function (err, foundList) {
        if (!err) {
            if (!foundList) {
                const list = new List({
                    name: customListName,
                    items: defaultItem
                });
                list.save();
                res.redirect("/" + customListName)
            } else {
                res.render("list", {
                    listTitle: foundList.name,
                    newListItems: foundList.items
                });
            }
        }
    })
})

app.post('/', function (req, res) {
    const itemName = req.body.newItem;
    const listName = req.body.list;

    const item = new Item({
        name: itemName,
    })

    if (listName === "Today") {
        item.save();
        res.redirect("/");
    } else {
        List.findOne({
            name: listName
        }, function (err, foundList) {
            foundList.items.push(item);
            foundList.save();
            res.redirect("/" + listName)
        })
    }

})

app.post('/delete', function (req, res) {
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;
    if (listName === "Today") {
        Item.findOneAndRemove(checkedItemId, function (err) {
            if (!err) {
                console.log("Successfully deleted")
                res.redirect("/");
            }
        })
    } else {
        List.findOneAndUpdate({
            name: listName
        }, {
            $pull: {
                items: {
                    _id: checkedItemId
                }
            }
        }, function (err, foundList) {
            if (!err) {
                res.redirect("/" + listName);
            }
        })
    }


})