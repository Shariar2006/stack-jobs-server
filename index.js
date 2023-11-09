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
  origin: [
    'http://localhost:5173/',
    'https://stack-jobs.web.app',
    'https://stack-jobs.firebaseapp.com'
  ],
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

//middle ware
const verifyToken = async(req,res,next)=>{
  const token = req.cookies?.token;
  console.log('first', token)
  if(!token){
    return res.status(401).send({message: 'not authorized'})
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded)=>{
    if(err){
      return res.status(401).send({message: 'not authorized'})
    }
    req.user = decoded;
    next()
  })
}

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const allJobsCollection = client.db('stackJobsDB').collection('allJobs')
    const applyJobsCollection = client.db('appliedJobsDB').collection('applyJob')

    // auth related api
    app.post('/jwt', async (req, res) => {
      const user = req.body;
      
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
      res
        .cookie('token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
        })
        .send({ success: true })
    })


    //job related api
    app.get('/allJobs', async (req, res) => {
      const cursor = allJobsCollection.find()
      const result = await cursor.toArray()
      res.send(result)
    })

    app.get('/appliesJob',verifyToken, async (req, res) => {
      console.log(req.query?.email)
      if(req.query.email !== req.user.email){
        return 
      }
      let query = {};
      console.log(query)
      if (req.query?.email) {
        query = { email: req.query.email }
      }
      const result = await applyJobsCollection.find().toArray()
      res.send(result)
    })

    app.get('/myJobs',verifyToken, async (req, res) => {
      console.log(req.query.email)
      // console.log(req.cookies)
      if(req.query.email !== req.user.email){
        return 
      }
      let query = {};
      if (req.query?.email) {
        query = { userEmail: req.query.email }
      }
      const result = await allJobsCollection.find(query).toArray()
      res.send(result)
    })

    app.delete('/myJobs/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await allJobsCollection.deleteOne(query)
      res.send(result)
    })

    app.put('/myJobUpdate/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) }
      // const option = { upsert: true }
      // const updateCard = req.body
      // const card = {

      //   $set: {
      //     name: updateCard.name,
      //     jobTitle: updateCard.jobTitle,
      //     salary: updateCard.salary,
      //     photo: updateCard.photo,
      //     category: updateCard.category,
      //     postDate: updateCard.postDate,
      //     deadline: updateCard.deadline,
      //     description: updateCard.description
      //   }
      // }
      // const result = await allJobsCollection.updateOne(filter, card, option)
      res.send(filter)
    })


    app.post('/addAJob', async (req, res) => {
      const newJob = req.body;
      const result = await allJobsCollection.insertOne(newJob)
      res.send(result)
    })

    app.post('/appliesJob', async (req, res) => {
      const newJob = req.body;
      const result = await applyJobsCollection.insertOne(newJob)
      res.send(result)
    })

    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
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