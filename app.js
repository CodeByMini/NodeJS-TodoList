//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const _ = require('lodash')

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect(process.env.DATABASE_URL, {useNewUrlParser: true, useUnifiedTopology: true ,useFindAndModify:false})

const itemsSchema = new mongoose.Schema({
  name: {type: String, required:true}
});

const listSchema = new mongoose.Schema({
  name: {type: String, required:true},
  items: [itemsSchema]
});

const Item = mongoose.model('item', itemsSchema);
const List = mongoose.model('list', listSchema);

const item1 = new Item({
  name: "This is your list"
});

const item2 = new Item({
  name: "Hit + To Add Items"
});
const item3 = new Item({
  name: "<- Hit This To Delete"
});

const defaultItem = [item1, item2, item3]


app.get("/", function(req, res) {

  //const day = date.getDate();
  const title = 'Today'
  
  Item.find(function(error, items){
      if (items.length === 0){
        Item.insertMany(defaultItem, function(err){
        if(err){
        console.log(err);
        }else{
        res.redirect('/');
        }
      });
    }else{
      res.render("list", {listTitle: title, newListItems: items});
    }
  })
});

app.get("/:customListName", function(req, res){
  const listName = _.capitalize(req.params.customListName);

  List.findOne({name: listName}, function(err, foundItem){
    if (err){
      console.log(err);
    }
    if(!err){
      if(!foundItem){
          const list = new List({
          name: listName,
          items: defaultItem
        });
        list.save();
        res.redirect('/' + listName);
      }else{
        res.render("list", {listTitle: foundItem.name, newListItems: foundItem.items});
      }
    }
  });
});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list

  const item = new Item({name:itemName});
  if(listName==='Today'){
    item.save();
    res.redirect('/');
  }else{
    List.findOne({name: listName}, function(err, foundList){
      if(err){
        console.log(err);
      }else{
        foundList.items.push(item);
        foundList.save();
        res.redirect('/' + listName);
      }
    })
  }
});

app.post('/delete', function(req, res){
  const checkedItemId = req.body.checkbox
  const listName = req.body.listName;
  if(listName ==='Today'){
    Item.findByIdAndRemove(checkedItemId, function(err, item){
      if(err) {
        console.log(err);
      }else{
        console.log(item.name + ' was deleted');
      }
      res.redirect('/');
    });
  }else{
    List.findOne({name: listName}, function(err, list){
      if(err) {
        console.log(err);
      }else{
        List.findOneAndUpdate({name: listName},{$pull: {items:{_id:checkedItemId}}}, function(err, item){
          if(err){
            console.log(err);
          }else{
            console.log(item.name + ' was deleted');
          }
        });
      }
    })
    res.redirect('/' + listName);
  }
})


app.get("/about", function(req, res){
  res.render("about");
});

app.listen(process.env.PORT||3000, function() {
  console.log("Server started on port 3000");
});
