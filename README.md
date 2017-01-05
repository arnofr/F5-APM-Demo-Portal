This is a delegation portal for F5 APM VPNSSL build with MEAN stack framework (MongoDB, ExpressJS, AngularJS, NodeJs) and Angular Material for UI, providing delegation capacties for some APM features :

    Custom url categories
    ACLS
    data group entry


Portal is providing a delegated interface will role based access, storing infos in Mongo Database, and pushing modification through APM V12 REST interface.

ACLS, URL categories, and datagroup (networklocation) are expected to be provisionned by super admin directly on the APM.


1) install nodejs tested with 4.4.2 https://nodejs.org/en/download/package-manager/

2) install mongoDB, tested with 3.2.4 https://docs.mongodb.org/manual/tutorial/

optional : install mongo-express. Mongo-Express available by GUI at http://fqdn:8081
Modify config file accordingly :

      mongo = {
      db:       'admin',
      host:     'localhost',
      password: 'YOURPASS',
      port:     27017,
      ssl:      false,
      url:      'mongodb://localhost:27017/admin',
      username: 'admin',
      };

      auth: [
        {
          database: process.env.ME_CONFIG_MONGODB_AUTH_DATABASE || "apmportal",
          username: process.env.ME_CONFIG_MONGODB_AUTH_USERNAME || "admin",
          password: process.env.ME_CONFIG_MONGODB_AUTH_PASSWORD || "YOURPASS",
        },
      ],


3) chmod 755 in node_modules/.bin/

4) modify apmconfig.json with your apm config infos or you can do it later on throught the portal.

4) start mongodb
  4.1 create admin user in admin db
  4.2 create apmportal db
  4.3 provide admin right in apmportal db

5) populate database apmportal :

in mongo deb repository

mongoimport --db apmportal --collection users  --drop --file "c:\F5-APM-Demo-Portal\default mongodb setup\users.json"

mongoimport --db apmportal --collection groups  --drop --file "c:\F5-APM-Demo-Portal\default mongodb setup\groups.json"

mongoimport --db apmportal --collection apmconfig  --drop --file "c:\F5-APM-Demo-Portal\default mongodb setup\apmconfig.json"

mongoimport --db apmportal --collection networklocation  --drop --file "c:\F5-APM-Demo-Portal\default mongodb setup\networklocation.json"

6) npm install

7) npm start in F5-APM-Demo-Portal folder

8) connect to portal 127.0.0.1:3000

log with admin/admin

go  to apm management menu

bulk import to retrieve existing category config from APM management menu then go to admin group management menu to associate groups and configs
