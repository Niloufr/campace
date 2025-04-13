# campace

## App

`cd campace-app`

### setup

`npm install`

### run

`npm run serve`

## Api

`cd campace-api`

### setup

`npm install`

`npx prisma generate`

`npx prisma migrate dev`

### run

`npm run start`

### Database changes

create a new migration. Updates the MySQL database

`npx prisma migrate dev --name <NAME OF MIGRATION>`

Updates the javascript code

`npx prisma generate`
