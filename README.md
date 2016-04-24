1) install nodejs tested with 4.4.2 https://nodejs.org/en/download/package-manager/
2) install mongoDB, tested with 3.2.4 https://docs.mongodb.org/manual/tutorial/

optional : install mongo-express
 npm install mongo-express form webbase management db interface

3) modify apmconfig.json with your apm config infos.
4) start mongodb
5) create database apmportal :

in mongo deb repository
mongoimport --db apmportal --collection users  --drop --file "c:\F5-APM-Demo-Portal\default mongodb setup\users.json"
mongoimport --db apmportal --collection groups  --drop --file "c:\F5-APM-Demo-Portal\default mongodb setup\groups.json"
mongoimport --db apmportal --collection apmconfig  --drop --file "c:\F5-APM-Demo-Portal\default mongodb setup\apmconfig.json"

6) npm start in F5-APM-Demo-Portal folder
7) connect to portal 127.0.0.1:3000

log with admin/admin

go  to apm management menu
bulk import to retrieve existing category config from APM management menu
