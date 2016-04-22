var app = angular.module('ApmPortal', ['ui.router','ngMaterial','md.data.table','ngMessages']);


app.config([
'$stateProvider',
'$urlRouterProvider',
function($stateProvider, $urlRouterProvider) {
  $stateProvider
  .state('logout', {
    url: '/logout',
    templateUrl: '',
    controller: 'AuthCtrl',
    resolve: {
      logoutpromise: [ 'auth', function(auth){
        return auth.logOut();
      }]
    },
    onEnter: ['$state', function($state){
      $state.go('index');
    }]
  })
  .state('index', {
    url: '/index',
    templateUrl: 'index.html',
    controller: 'MainCtrl',
    onEnter: ['$state', 'auth', function($state, auth){
      if(auth.isLoggedIn()){
        $state.go('category');
      } else {
        $state.go('login');
      }
    }]
  })

    .state('category', {
      url: '/category',
      templateUrl: 'categories.html',
      controller: 'MainCtrl',
      resolve: {
        categoriesPromise: ['urlcategories', function(urlcategories){
          return urlcategories.getAll();
        }]
      },
      onEnter: ['$state', 'auth', function($state, auth){
        if(!auth.isLoggedIn()){
          $state.go('login');
        }
      }]

    })
    .state('category.urlcategories', {
      url: '/urlcategories/{id}',
      templateUrl: '/urlcategories.html',
      controller: 'UrlcategoriesCtrl',
      onEnter: ['$state', 'auth', function($state, auth){
        if(!auth.isLoggedIn()){
          $state.go('login');
        }
      }]
    })
    .state('editgroups', {
      url: '/editgroups',
      templateUrl: '/editgroups.html',
      controller: 'GroupsCtrl',
      resolve: {
        groupsPromise: ['groups', function(groups){
          return groups.getAll();
        }]
      },
      onEnter: ['$state','auth','groups', function($state, auth,groups){
        if(!auth.isLoggedIn()){
          $state.go('login');
        }
      }]
    })
    .state('editgroups.groupcategories', {
      url: '/groupcategories/{id}',
      templateUrl: '/groupcategory.html',
      controller: 'editGroupsCtrl',
      onEnter: ['$state', 'auth', 'groups', function($state, auth,groups){
        console.log("entering state editroups.groupcategory");
        if(!auth.isLoggedIn()){
          $state.go('login');
        }
      }]
    })
    .state('login', {
      url: '/login',
      templateUrl: '/login.html',
      controller: 'AuthCtrl',
      onEnter: ['$state', 'auth', function($state, auth){
        if(auth.isLoggedIn()){
          $state.go('category');
        }
      }]
    })
    .state('register', {
      url: '/register',
      templateUrl: '/register.html',
      controller: 'AuthCtrl',
      resolve: {
        groupsPromise: ['groups', function(groups){
          return groups.getAll();
        }]
      }
    })
    .state('apmmgt', {
      url: '/apmmgt',
      templateUrl: '/apmmgt.html',
      controller: 'APMmgtCtrl',
      resolve: {
        groupsPromise: ['groups', function(groups){
          return groups.getAll();
        }]
      }
    });

    //$urlRouterProvider.otherwise('home');
    $urlRouterProvider.otherwise('index');
  }]);

  //managing user authentication
  app.factory('auth', ['$http', '$window', function($http, $window){
    var auth = {};
    auth.saveToken = function (token){
     $window.localStorage['apm-demoportal-token'] = token;
    };

    auth.getToken = function (){
      //console.log("local token "+$window.localStorage['apm-demoportal-token']);
      return $window.localStorage['apm-demoportal-token'];
    };
    auth.isAdmin = function(){
      var token = auth.getToken();

      if(token){
        var payload = JSON.parse($window.atob(token.split('.')[1]));
          return payload.isadmin;
      }
      else {
        return false;
      }
    };
    auth.isLoggedIn = function(){
      var token = auth.getToken();

      if(token){
        var payload = JSON.parse($window.atob(token.split('.')[1]));
          //console.log("yes logged");
          return payload.exp > Date.now() / 1000;

      } else {
        //console.log("no not logged");
        return false;
      }
    };

    auth.currentUser = function(){
      if(auth.isLoggedIn()){
        var token = auth.getToken();
        var payload = JSON.parse($window.atob(token.split('.')[1]));

        return payload.username;
      }
    };

    auth.register = function(user){

      return $http.post('/register', user).success(function(data){
        //dont log on register, admin do register other users
       //  auth.saveToken(data.token);
      });
    };

    auth.logIn = function(user){
      return $http.post('/login', user).success(function(data){
        auth.saveToken(data.token);
      });
    };

    auth.logOut = function(){
      $window.localStorage.removeItem('apm-demoportal-token');
      return;
    };

    return auth;
  }])

  app.controller('AuthCtrl', ['$scope','$state','auth', 'groups', function($scope, $state, auth, groups  ){
    $scope.user = {};
    $scope.user.isadmin =false;
    //we instentiate the groups table for select
    $scope.groups = groups.groups;


    $scope.register = function(form){
      auth.register($scope.user).error(function(error){
        $scope.error = error;
      }).then(function(){
        $scope.user.username="";
        $scope.user.password="";
        $scope.user.group="";
        $scope.user.isadmin=false;
        $state.go('register');
      });

    };

    $scope.logIn = function(){
      auth.logIn($scope.user).error(function(error){
        $scope.error = error;
      }).then(function(){
        $state.go('index');
      });
    };
  }])

app.controller('NavCtrl', ['$scope','auth',function($scope, auth){
    $scope.isLoggedIn = auth.isLoggedIn;

    $scope.currentUser = auth.currentUser;
    //$scope.logOut = auth.logOut;
  }]);

app.factory('urlcategories', ['$http', 'auth', function($http, auth){
  var o = {
    urlcategories: []
  };
  //create a category ------ a tester modifer pas fonctionnelle quoi
  o.create = function(urlcategory) {
    return $http.post('/urlcategories', urlcategory, {headers: {Authorization: 'Bearer '+auth.getToken()}}).success(function(data){
      o.urlcategories.push(data);
    });
  };
  //get all categories
  o.getAll = function() {
    return $http.get('/urlcategories', {headers: {Authorization: 'Bearer '+auth.getToken()}}).success(function(data){
      angular.copy(data, o.urlcategories);
    });

  };
  //adding url to a category
  o.addurl = function(urlcategory,arrayid,url) {
    return $http.put('/urlcategories/'+urlcategory._id,{url: url.name}, {headers: {Authorization: 'Bearer '+auth.getToken()}}).success(function(data){
      angular.copy(data.urls,o.urlcategories[arrayid].urls);
    });
  }
  o.removeurl = function(urlcategory,arrayid,urlid) {
    return $http.delete('/urlcategories/'+urlcategory._id+"/"+urlid, {headers: {Authorization: 'Bearer '+auth.getToken()}}).success(function(data){
      angular.copy(data.urls,o.urlcategories[arrayid].urls);
    });
  }
  o.pushcategorytoapm = function(category) {

    return $http.get('/updateapmcategory/'+category, {headers: {Authorization: 'Bearer '+auth.getToken()}}).success(function(data){
      if (data != "{OK}") {
        showSimpleToast('top right',"Error, change not done");
      } else {
        showSimpleToast('top right',"Change done successfully");
      }
    })};
    o.pullcategorytoapm = function(category,arrayid) {
      return $http.get('/getapmcategory/'+category, {headers: {Authorization: 'Bearer '+auth.getToken()}}).success(function(data){
        console.log(JSON.stringify(data));
        if (data != "{KO}") {
          angular.copy(data,o.urlcategories[arrayid].urls)
          //data is the category.urls part
            showSimpleToast('top right',"Change done successfully");
        } else {
          //something bad happened
            showSimpleToast('top right',"Cannot retrieve configuration from APM");
        }
      });
    };

  return o;
}]);

app.controller('UrlcategoriesCtrl', [
  '$scope',  '$stateParams',  'urlcategories',  '$animate',  'auth', '$mdDialog','$mdToast',
  function($scope, $stateParams, urlcategories, $animate,auth,$mdDialog,$mdToast){
    $scope.urlcategory = urlcategories.urlcategories[$stateParams.id];
    $scope.newurl={};
    $scope.newurl.urlname="";
    $scope.urlalert="";

    //md-toast function
    showSimpleToast = function(position,message) {
      $mdToast.show(
        $mdToast.simple()
          .textContent(message)
          .position(position )
          .hideDelay(3000)
      );
    };
    //md-dialog to push to apm
    $scope.showConfirmpush = function(ev) {
      var confirm = $mdDialog.confirm()
            .title('Update '+ $scope.urlcategory.name+' to APM')
            .textContent('This will overwrite this APM category configuration')
            .ariaLabel('Push to APM')
            .targetEvent(ev)
            .ok("Let's do it!")
            .cancel('Cancel');
        $mdDialog.show(confirm).then(function() {
            //if confirm
            urlcategories.pushcategorytoapm($scope.urlcategory._id);

        }, function() {
            //do nothing on cancel
            //$scope.status = 'You decided to keep your debt.';
          });
    };
    //end md-dialog
    //md-dialog to pull from apm
    $scope.showConfirmpull = function(ev) {

      var confirm = $mdDialog.confirm()
            .title('Update '+ $scope.urlcategory.name+' from APM')
            .textContent('This will overwrite this category configuration')
            .ariaLabel('Pull to APM')
            .targetEvent(ev)
            .ok("Let's do it!")
            .cancel('Cancel');
        $mdDialog.show(confirm).then(function() {
            //if confirm
            urlcategories.pullcategorytoapm($scope.urlcategory._id,$stateParams.id);

        }, function() {
          //do nothing on cancel
          //$scope.status = 'You decided to keep your debt.';
        });
    };
    //end md-dialog


    $scope.addUrl = function(form){
      //checing if requested url already exists
      //blocking to be modified
      function isurlpresent(arrayofjsonurl,lookedurl) {
        for(var k in arrayofjsonurl) {
          if(arrayofjsonurl[k].name == lookedurl) {
            $scope.urlalert="The requested url is already present in this category";
            return 1;
          }
        }

        return 0;
      };// function isurlpresent

      if(typeof ($scope.newurl.urlname) === "undefined" || $scope.newurl.urlname === '' || isurlpresent($scope.urlcategory.urls,$scope.newurl.urlname)) {

        return;
      }

      //we call the function with urlcategory , urlcategory array number in urlcaterories, form parm containing url
      urlcategories.addurl($scope.urlcategory,$stateParams.id,{name:$scope.newurl.urlname });

      $scope.newUrlform.$setValidity();
      $scope.newUrlform.$setPristine();
      $scope.newurl.urlname="";
    //  $scope.newUrlform.$error=null;


    };
    $scope.removeUrl = function(urlid){
      urlcategories.removeurl($scope.urlcategory,$stateParams.id,urlid);
      $scope.newurl.name="";
    };
}]);
app.factory('groups', ['$http', 'auth', function($http, auth){
  var o = {
    groups :[]
  };
  //get all groups
  o.getAll = function() {
    return $http.get('/groups', {headers: {Authorization: 'Bearer '+auth.getToken()}}).success(function(data){
      angular.copy(data, o.groups);
    });
  };
  o.addGroup = function(groupname) {
    return $http.post('/groups',{newgroup: groupname}, {headers: {Authorization: 'Bearer '+auth.getToken()}}).success(function(data){
      o.groups.push(data);
    });
  }
  o.categoryinGroup = function(groupname) {
    //console.log("in factory categorugroup function");
    //console.log("search "+groupname+"in"+JSON.stringify(o.groups));
  };
  return o;
}]);

app.controller('editGroupsCtrl', [
'$scope','auth','groups','urlcategories','$state','$http',
function($scope,auth,groups,urlcategories,$state,$http){
  //$scope.group=groups.groups;
  $scope.group = {"name":"error no group found",
                  "category":[]};
  //console.log(JSON.stringify(urlcategories));
  for(var mygroup in groups.groups) {
    if (groups.groups[mygroup].name == $state.params.id ) {
      $scope.group=groups.groups[mygroup];
    break;
      }
  };

  //console.log($scope.group.category);

  $scope.togglecat = function (item, list) {
    console.log("togglecat");
    var idx = list.indexOf(item);
    if (idx > -1) {
      list.splice(idx, 1);
    }
    else {
      list.push(item);
    }

    return $http.put('/groups/'+groups.groups[mygroup]._id,{category: list}, {headers: {Authorization: 'Bearer '+auth.getToken()}}).success(function(data){
      angular.copy(data.category,groups.groups[mygroup].category);
    });
    console.log("after update");
    console.log("groups "+groups.groups[mygroup].category);
    console.log("scope "+$scope.group.category);
  };
  $scope.existscat = function (item, list) {
    return list.indexOf(item) > -1;
  };
}]);

app.controller('GroupsCtrl', [
'$scope','auth','groups','$state',
function($scope,auth,groups,$state){
  $scope.groups=groups.groups;
  console.log("from ctrl :"+$state.current.name);

  $scope.addGroup = function(){
    groups.addGroup($scope.newgroup.groupname).error(function(error){
      $scope.error = error;

    }).then(function(){

      $state.go('editgroups');
    });
  };

}]);

app.controller('APMmgtCtrl', [
'$scope','urlcategories','auth','$http',
function($scope,urlcategories,auth, $http){
  $scope.apm={};
  $scope.apm.name ="myapm";
  $scope.apm.ip="192.168.142.15";
  $scope.apm.username="admin";
  $scope.apm.password="admin";

  $scope.changeapmconfig = function () {

    var apmconfig = {};
    apmconfig.name = $scope.apm.name;
    apmconfig.ip = $scope.apm.ip;
    apmconfig.username=$scope.apm.username;
    apmconfig.password=$scope.apm.password;
    return $http.post('/apmconfig', apmconfig, {headers: {Authorization: 'Bearer '+auth.getToken()}}).success(function(data){
      console.log("resturn data "+JSON.stringify(data));
    });
  }



  $scope.urlcategories = urlcategories.urlcategories;



}]);

app.controller('MainCtrl', [
'$scope','urlcategories','auth',
function($scope,urlcategories,auth){

  $scope.urlcategories = urlcategories.urlcategories;
  $scope.menufabisOpen = false;
  $scope.isAdmin = auth.isAdmin;


}]);
