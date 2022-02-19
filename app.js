const express = require('express');
const app = express();
var _ = require('lodash')
const mongoose = require('mongoose')

app.set('view engine', 'ejs');
mongoose.connect("mongodb+srv://sharnam:Sharnam12345@cluster0.5denf.mongodb.net/todolistDB");
app.use(express.urlencoded({
    extended: true
}))
const itemsSchema = {
    name: String
}

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

const defaultItems = [item1, item2, item3];
const listSchema = {
    name: String,
    items: [itemsSchema]
}

const List = mongoose.model("List", listSchema);




app.use(express.static("public"));
let port = process.env.PORT;
if (port == null || port == "") {
    port = 3000;
}

app.listen(port, function () {
    console.log("It is running on port 3000")
})



app.get("/", function (req, res) {

    Item.find({}, function (err, foundItems) {

        if (foundItems.length === 0) {
            Item.insertMany(defaultItems, function (err) {
                if (err) {
                    console.log(err);
                } else {
                    console.log("Successfully savevd default items to DB.");
                }
            });
            res.redirect("/");
        } else {
            res.render("list", {
                listTitle: "Today",
                newListItems: foundItems
            });
        }
    });

});

app.get("/:customListName", function (req, res) {
    const customListName = _.capitalize(req.params.customListName);

    List.findOne({
        name: customListName
    }, function (err, foundList) {
        if (!err) {
            if (!foundList) {
                //Create a new list
                const list = new List({
                    name: customListName,
                    items: defaultItems
                });
                list.save(function () {
                    res.redirect("/" + customListName);
                });
            } else {
                //Show an existing list

                res.render("list", {
                    listTitle: foundList.name,
                    newListItems: foundList.items
                });
            }
        }
    });



});

app.post("/", function (req, res) {

    const itemName = req.body.newItem;
    const listName = req.body.list;

    const item = new Item({
        name: itemName
    });

    if (listName === "Today") {
        item.save();
        res.redirect("/");
    } else {
        List.findOne({
            name: listName
        }, function (err, foundList) {
            foundList.items.push(item);
            foundList.save();
            res.redirect("/" + listName);
        });
    }
});

app.post("/delete", function (req, res) {
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;

    if (listName === "Today") {
        Item.findByIdAndRemove(checkedItemId, function (err) {
            if (!err) {
                console.log("Successfully deleted checked item.");
                res.redirect("/");
            }
        });
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
        });
    }


});