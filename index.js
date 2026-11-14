import express from 'express'
import dotenv from 'dotenv/config'
import { MongoClient, ObjectId } from 'mongodb';
import cors from 'cors'
import { createRemoteJWKSet, jwtVerify } from 'jose';


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

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ msg: "Unauthorized" })
  }
  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).send({ msg: "unautorized" });
  }

  const JWKS = createRemoteJWKSet(new URL(`${process.env.CLIENT_URL}/api/auth/jwks`));

  try {
    const {payload} = await jwtVerify(token, JWKS)
    next();
  } catch (error) {
    return res.status(500).send({ msg: "Server Error!" });
  }
}

app.get('/', (req, res) => {
  res.send({ msg: `Server is running at ${date.toTimeString()}` })
})

app.post('/create-event', verifyToken, async (req, res) => {
  const data = req.body;
  const result = await events.insertOne(data);
  res.send(result)
})

app.get('/upcoming-event', async (req, res) => {
  const today = new Date();
  const result = await events
    .find({
            eventDate: {
                $gte: today.toISOString()
            }
        })
    .sort({ _id: -1 })
    .toArray();
  res.send(result);
})

app.get('/upcoming-event/:id', async (req, res) => {
  const id = req.params.id;
  const result = await events.findOne(new ObjectId(id));
  res.send(result);
})

app.patch('/upcoming-event/:id', verifyToken, async (req, res) => {
  const id = req.params;
  const data = req.body;
  const result = await events.updateOne(
    { _id: new ObjectId(id) },
    { $set: data }
  )
  res.json(result)
})

app.delete('/upcoming-event/:id', verifyToken, async (req, res) => {
  const id = req.params;
  const result = await events.deleteOne({ _id: new ObjectId(id) });
  res.send(result);
})

app.get('/manage-events/:email',verifyToken ,async (req, res) => {
  const { email } = req.params;
  const result = await events.find({ email: email }).toArray();
  res.send(result);
})

app.listen(port, () => {
  console.log(`App listening on port ${port} at ${date.toTimeString()}`)
})

export default app;