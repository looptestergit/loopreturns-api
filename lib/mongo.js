import { MongoClient } from "mongodb";

const uri = process.env.MONGO_URI;
if (!uri) throw new Error("Missing MONGO_URI");

let client = new MongoClient(uri);
let clientPromise = client.connect();

export default clientPromise;
