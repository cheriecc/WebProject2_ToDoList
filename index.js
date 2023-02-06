const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
// const request = require("request");
// const https = require("https");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

var items = [];
var workItems = [];

mongoose.set('strictQuery', false);
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(bodyParser.urlencoded({extended: true}));
const dbUserName = process.env.Username || "admin-cherie";
const dbPassword = process.env.Password || "test123456789";


// Create DB and item collection
// mongoose.connect("mongodb://localhost:27017/todolistDB")
mongoose.connect("mongodb+srv://" + dbUserName + ":" + dbPassword + "@cluster0.dbgiity.mongodb.net/todolistDB")


const itemSchema = {
  name: String
};
const Item = mongoose.model("Item", itemSchema);
const listSchema = {
  name: String,
  items: [itemSchema]
};
const List = mongoose.model("List", listSchema);


// create three new items
const item1 = new Item({
  name: "Welcome to your todolist!"
});
const item2 = new Item({
  name: "Hit the + button to add a new item."
});
const item3 = new Item({
  name: "<-- Hit this to delete an item."
});
const defaultItems = [item1, item2, item3];


// homepage route - get request
app.get("/", function(req, res) {

  Item.find({}, function(err, foundItems) {
    // If the collection is empty, then add three new items.
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, function(err) {
        if (err) {
          console.log(err);
        }
      });
      res.redirect("/")
    } else {
    // Show the todo list
    res.render("list", {listTitle: "Today", items: foundItems});
    }
  })

});

// homepage route - post request to add one item
app.post("/", function(req, res) {
  // Obtain the user's list name and the item input
  const listName = req.body.list;
  const itemName = req.body.newItem;
  // Create a new record for input
  const item = new Item({
    name: itemName
  });
  // Check which page is the user in
  if (listName === "Today") {
    // If user is in home page
    item.save();
    res.redirect("/");
  } else {
    // If user is in other pages, then go to the corresponding collection
    List.findOne({name: listName}, function(err, foundList) {
      if (!err) {
        foundList.items.push(item);
        foundList.save();
        res.redirect("/" + listName)
      }
    })
  }
});

// homepage route - post request to delete item
app.post("/delete", function(req, res) {
  // Obtain the user's list name and the item input
  const listName = req.body.listName;
  const checkedItemId = req.body.checkbox;
  // Check which page is the user in
  if (listName === "Today") {
    // If the user is in home page then simply search the item and delete it
    Item.findByIdAndRemove(checkedItemId, function(err) {
      if (!err) {
        res.redirect("/")
      }
    });
  } else {
    // If the user is in other pages then delete the item from other collection
    List.findOneAndUpdate(
      {name: listName},
      {$pull: {items: {_id: checkedItemId}}},
      function (err, foundList) {
        if (!err) {
          res.redirect("/" + listName);
        }
      }
    )
  }
});

// Other routes
app.get("/:listName", function(req, res) {
  const listName = _.capitalize(req.params.listName);

  List.findOne({name: listName}, function(err, foundList) {
    if (!err) {
      if (!foundList) {
        // Create a new list
        const list = new List({
          name: listName,
          items: defaultItems
        });
        list.save();
        // Go back to the page
        res.redirect("/" + listName)
      } else {
        // In case user delete all default items
        if (foundList.items.length === 0) {
          List.updateOne({name: listName}, {items: defaultItems}, function(err, list) {
            if (err) {
              console.log(err);
            };
            res.redirect("/" + listName)
          })
        } else {
        // Show existing list
        res.render("list", {listTitle: foundList.name, items: foundList.items})
        }
      }
    }
  })
});



app.listen(process.env.PORT || 3000, function() {
  console.log("Server started");
});
