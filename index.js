const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser')
const app = express();
require('dotenv').config();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

//middleware 
app.use(cors({
  origin: ['http://localhost:5173'],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());





const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.wjuagmt.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const allJobsCollection = client.db('stackJobsDB').collection('allJobs')

    // auth related api
    app.post('/jwt', async (req, res) => {
      const user = req.body;
      
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
      res
        .cookie('token', token, {
          httpOnly: true,
          secure: false,
          // sameSite: 'none'
        })
        .send({ success: true })
    })


    //job related api
    app.get('/allJobs', async (req, res) => {
      const cursor = allJobsCollection.find()
      const result = await cursor.toArray()
      res.send(result)
    })

    app.get('/myJobs', async (req, res) => {
      console.log(req.query.email)
      
      let query = {};
      if (req.query?.email) {
        query = { userEmail: req.query.email }
      }
      const result = await allJobsCollection.find(query).toArray()
      res.send(result)
    })

    app.delete('/allJobs/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await allJobsCollection.deleteOne(query)
      res.send(result)
    })


    app.post('/addAJob', async (req, res) => {
      const newJob = req.body;
      const result = await allJobsCollection.insertOne(newJob)
      res.send(result)
    })
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);




app.get('/', (req, res) => {
  res.send('stack jobs is running')
})

app.listen(port, () => {

})