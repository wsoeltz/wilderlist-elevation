const mongoose =require('mongoose');

///// Setup MongoDb connection
if (process.env.MONGO_URI === undefined) {
  throw new Error('You must provide a MongoAtlas URI');
}
if (process.env.MONGO_AUTH_SOURCE === undefined) {
  throw new Error('You must provide a MongoDB authSource');
}
if (process.env.MONGO_DATABASE_NAME_PROD === undefined) {
  throw new Error('You must provide a dbName');
}

// const dbName = process.env.MONGO_DATABASE_NAME_DEV;
const dbName = process.env.MONGO_DATABASE_NAME_PROD;

if (dbName === process.env.MONGO_DATABASE_NAME_PROD) {
  console.log('--------------------------------');
  console.log('--------------------------------');
  console.log('                                ');
  console.log('            WARNING             ');
  console.log('   CONNECTING TO PROD DATABASE  ');
  console.log('                                ');
  console.log('--------------------------------');
  console.log('--------------------------------');
}

console.log(`connecting to ${dbName}`.toUpperCase());

mongoose.Promise = global.Promise;
mongoose.connect(process.env.MONGO_URI, {
  authSource: process.env.MONGO_AUTH_SOURCE,
  dbName,
  useCreateIndex: true,
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

mongoose.connection
  // tslint:disable-next-line
    .once('open', () => console.log('Connected to MongoLab instance.'))
  // tslint:disable-next-line
    .on('error', error => console.log('Error connecting to MongoLab:', error));

///// End MongoDb Connection Setup
