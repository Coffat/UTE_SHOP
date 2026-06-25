import { MongoClient } from "mongodb";

const uri = "mongodb://localhost:27017/uteshop";

async function run() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db();
    const order = await db.collection("orders").findOne({ orderCode: "ORD-1780371741803-I4JS" });
    console.log(JSON.stringify(order, null, 2));
  } finally {
    await client.close();
  }
}
run().catch(console.error);
