import express from 'express'
import dotenv from 'dotenv/config'
import { MongoClient, ObjectId } from 'mongodb';
import cors from 'cors'
// import cors from 'cors'
// import { createRemoteJWKSet, jwtVerify } from 'jose';


const app = express()
app.use(express.json());
app.use(cors())

const port = process.env.PORT || 5000;
const date = new Date();

const client = new MongoClient(process.env.MONGODB_URL);
export const connectToMongoDB = async () => {
  try {
    await client.connect();
    console.log("MongoDB connected successfully!");
    return client;
  } catch (err) {
    console.dir(err);
  }
}
const connectToClient = await connectToMongoDB();
const db = connectToClient.db("social-development-server");
const events = db.collection("events-data");

app.get('/', (req, res) => {
    res.send({msg: `Server is running at ${date.toTimeString()}`})
})

app.post('/create-event', async (req, res) =>{
    const data = req.body;
    const result = await events.insertOne(data);
    res.send(result)
})

app.get('/upcoming-event', async (req, res) => {
    const result = await events.find().toArray();
    res.send(result);
})

app.listen(port, () => {
  console.log(`App listening on port ${port} at ${date.toTimeString()}`)
})