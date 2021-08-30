let mongoose = require('mongoose')
const mysql = require('mysql')

//ENV Vars
const MONGO_URI = process.env.MONGO_HOST


//Create MongoDB Connection
let connectDB = async () => {
    try {
      const conn = await mongoose.connect(MONGO_URI,{
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useFindAndModify: false,
      })
      console.log(`MongoDB Connected: ${conn.connection.host}`)
    } catch (err) {
      console.error(err)
      process.exit(1)
    }

}

module.exports = connectDB

//Create Mysql connection
// const db = mysql.createConnection({
//   host     : 'localhost',
//   user     : 'root',
//   password :  ''
//   // database : 'blog'
// });

// db.connect((error)=>{
//   if(error){
//       throw error;
//   }
//   // console.log(db);
//   console.log("Connected to Mysql Server");
// });