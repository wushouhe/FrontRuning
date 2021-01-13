const MongoClient = require('mongodb').MongoClient;
const url = "mongodb://localhost:27017/";
const axios = require("axios")
const client = new MongoClient(url)

const getData = async (pairID) => {

  let time = Date.now() - 8.64e+7;
  time = Math.floor(time / 1000)


  let response = await axios({
    url: 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v2',
    method: 'post',
    data: {
      query: `
  query test {
    tokenDayDatas (orderBy : dailyVolumeUSD , orderDirection : desc , 
    where : {
      date_gt : ${time},
      dailyVolumeUSD_gt : 50000
    }){
      token{
        name
        symbol
        id
      }
      dailyVolumeUSD
    }
  }

  `,
    }
  })

  response = response.data.data.tokenDayDatas;

  for (let i = 0; i < response.length; i++) {
    response[i] = {
      id: response[i].token.id,
      name: response[i].token.name
    }
  }

  return response

}

const dbInit = async () => {
  let data = await getData()
  MongoClient.connect(url, function (err, db) {
    if (err) throw err;
    var dbo = db.db("frontRun");
    dbo.collection("tokenWatchAddress").insertMany(data, function (err, res) {
      if (err) throw err;
      console.log("Number of documents inserted: " + res.insertedCount);
      db.close();
    });
  });
}

const dbClear = async () => {
  MongoClient.connect(url, function (err, db) {
    if (err) throw err;
    var dbo = db.db("frontRun");
    var myquery = { id: /\w+/ };
    dbo.collection("tokenWatchAddress").deleteMany(myquery, function (err, obj) {
      if (err) throw err;
      console.log(obj.result.n + " document(s) deleted");
      db.close();
    });
  });
}

const dbRetrieve = async () => {
  try {
    await client.connect();
    let dbo =  client.db("frontRun");
    let collection =  dbo.collection("tokenWatchAddress")
    let ret = await collection.find({}, { projection: { _id: 0, id: 1 } }).toArray();
    return ret
  } finally {
    await client.close();
  }

}

// const test = async () => {
//   let data = await dbRetrieve();
//   console.log(data)
//   process.exit()
// }

// test()


module.exports = dbRetrieve;