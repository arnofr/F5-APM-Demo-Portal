var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
require('../models/Urlcategory');
require('../models/User');
require('../models/Groups');
require('../models/Apm');
var Urlcategory = mongoose.model('Urlcategory');
var User = mongoose.model('User');
var Group = mongoose.model('Group');
var APM = mongoose.model('APM');
var passport = require('passport');
var jwt = require('express-jwt');
var auth = jwt({secret: 'MYDIRTYSECRETSTATICINMYCODE', userProperty: 'payload'});
var request = require('request');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'APM Portal' });
});
router.get('/index.html', function(req, res, next) {
  res.render('index', { title: 'APM Portal' });
});
// routing for angular templates
router.get('/categories.html', function(req, res, next) {
  res.render('categories', { title: 'APM Portal' });
});

router.get('/urlcategories.html', function(req, res, next) {
  res.render('urlcategories', { title: 'APM Portal' });
});

router.get('/login.html', function(req, res, next) {
  res.render('login', { title: 'APM Portal' });
});
router.get('/register.html', function(req, res, next) {
  res.render('register', { title: 'APM Portal' });
});
router.get('/editgroups.html', function(req, res, next) {
  res.render('editgroups', { title: 'APM Portal' });
});
router.get('/groupcategory.html', function(req, res, next) {
  res.render('groupcategory', { title: 'APM Portal' });
});
router.get('/apmmgt.html', function(req, res, next) {
  res.render('apmmgt', { title: 'APM Portal' });
});

router.post('/apmconfig', function(req, res, next){
  APM.findOneAndUpdate({ 'name':req.body.name },
    { $set : {"ip"       : req.body.ip ,
              "password" : req.body.password ,
              "username" : req.body.username }
    },  {new: true }, function(err, apmconfig) {
        if(err){ return next(err); }
          res.json(apmconfig);
      }
  );

});



//routing for passport authentication
router.post('/login', function(req, res, next){
  if(!req.body.username || !req.body.password){
    //console.log("user login, user "+req.body.username+" pass "+req.body.password);
    return res.status(400).json({message: 'Please fill out all fields'});
  }

  passport.authenticate('local', function(err, user, info){
    if(err){ return next(err); }

    if(user){
      return res.json({token: user.generateJWT()});
    } else {
      return res.status(401).json(info);
    }
  })(req, res, next);
});

router.post('/register', function(req, res, next){
  if(!req.body.username || !req.body.password || !req.body.group){
    return res.status(400).json({message: 'Please fill out all fields'});
  }

  var user = new User();
  user.username = req.body.username;
  user.group = req.body.group;
  user.isadmin = req.body.isadmin;
  user.setPassword(req.body.password);
  user.save(function (err){
    if(err){
      console.log("Error Registering new user in DB");
      console.log(JSON.stringify(err));
      if (err.code == 11000) {return res.status(400).json({message: 'User already exists in DB'})}
      else {return next(err)};
    }
    return res.json({token: user.generateJWT()})
  });
} );

router.param('group', function(req, res, next, id) {
  var query = Group.findById(id);

  query.exec(function (err, group){
    if (err) { return next(err); }
    if (!group) { return next(new Error('can\'t find group')); }

    req.group = group;

    return next();
  });
});

// routing for apm deleg portal

router.param('urlcategory', function(req, res, next, id) {
  var query = Urlcategory.findById(id);

  query.exec(function (err, urlcategory){
    if (err) { return next(err); }
    if (!urlcategory) { return next(new Error('can\'t find urlcategory')); }

    req.urlcategory = urlcategory;

    return next();
  });
});

router.get('/urlcategories', auth, function(req, res, next) {
  //need to filter returned url based on categgory group and user group

  //console.log(req.payload.username);
  //we ask to retrieve user's group
  User.findOne({ username: req.payload.username },'username group', function (err, user) {
   if (err) { return next(err) }
    console.log("Logged user "+user.username + " group is " + user.group);
    //then we find group definition containing allowed categories for group user
    Group.findOne({name: user.group}, function (err, group) {
     if (err) { return (err) }
      console.log("categories from group "+user.group+ " are " + JSON.stringify(group.category));
      //find category in db belonging to that group
      Urlcategory.find({'name': { $in : group.category }}, function(err, urlcategories){
        if(err){ console.log(err);  return next(err); }
        //by filtering urlcategories

        res.json(urlcategories);
      });
    });
  });


});

//adding url to a category
router.put('/urlcategories/:urlcategory', auth, function(req, res, next) {
  var modification = {"name": req.body.url, "type": "glob-match"};

  req.urlcategory.urls.push(modification);
  req.urlcategory.save(function(err) {
    if(err){ return next(err); }
    return res.json(req.urlcategory);
  });

});

//update apm category
router.get('/updateapmcategory/:urlcategory', auth, function(req, res, next) {
  //removing mango _id property
  for (var i = 0; i < req.urlcategory.urls.length; i++) {
    delete req.urlcategory.urls[i]._id
  }
  APM.findOne({'name':"myapm"},  function (err, apm) {
    if (err) { return (JSON.stringify(err)) }

    var options = {
      url: "https://"+apm.username+":"+apm.password+"@"+apm.ip+"/mgmt/tm/sys/url-db/url-category/~Common~"+req.urlcategory.name,
      method: 'PATCH',
      json : {"urls": req.urlcategory.urls}, //post the urls array in json
      strictSSL : false, //no certificate validation
      rejectUnauthorized : false //no certificate validation
    };
    console.log("sending patch request to APM");
    request(options, function (error, response, body) {
        if (!error  && response.statusCode == 200) {
          console.log("apm change done");
          res.json("{OK}");
        } else {
          //console.log(response);
          console.log("error found sending category to APM ...");
          res.json(error || response.body );
        }
    })
  });
});
//retrieve a category configuration from apm
router.get('/getapmcategory/:urlcategory', auth, function(req, res, next) {
  APM.findOne({'name':"myapm"},  function (err, apm) {
    if (err) { return (JSON.stringify(err)) }

    var options = {
      url: "https://"+apm.username+":"+apm.password+"@"+apm.ip+"/mgmt/tm/sys/url-db/url-category/~Common~"+req.urlcategory.name,
      method: 'GET',
      strictSSL : false, //no certificate validation
      rejectUnauthorized : false //no certificate validation
    };
    console.log("sending GET request to APM");
    request(options, function (error, response, body) {
        if (!error  && response.statusCode == 200) {
          console.log("apm GET done");
          console.log(JSON.parse(body).urls);
          //updating mangodb
          req.urlcategory.urls=JSON.parse(body).urls;
          req.urlcategory.save();
          //sending response
          res.json(JSON.parse(body).urls);
        } else {
          //console.log(response);
          console.log("error found while retrieving category from APM ...");
          res.json("{KO}");
        }
    })
  });
});

router.get('/groups', auth, function(req, res, next) {
  //retrieve all groups
  Group.find( function (err, groups) {
    if (err) { return next(err) }
    console.log("groups retrieved :"+JSON.stringify(groups) );
    res.json(groups);
  });
});
//create a new group
router.post('/groups', auth, function(req, res, next) {

  var group= new Group();
  group.name=req.body.newgroup;
  console.log("posted new group:"+req.body.newgroup);
  group.category=[];
  group.save(function (err){
    if(err){ return next(err); }
    return res.json(group)
  });

});
//updating a group
router.put('/groups/:group', auth, function(req, res, next) {

  req.group.category =req.body.category;
  req.group.save(function(err) {
    if(err){ return next(err); }
    return res.json(req.group);
  });

});

router.delete('/urlcategories/:id1/:id2', auth, function(req, res, next) {

  Urlcategory.findOneAndUpdate({ '_id': req.params.id1},
    { $pull: {"urls": {"_id": req.params.id2} }},       //update to be done
    {  safe: true, upsert: true, new: true }, //options new : true returns modified doc
       function(err, urlcategory) {
          if(err){ return next(err); }
          return res.json(urlcategory);
       }
    );
});

module.exports = router;
