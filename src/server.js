import express from "express";
import bodyParser from "body-parser";
import { MongoClient } from "mongodb";
import path from 'path';
import history from "connect-history-api-fallback";

const app = express();
app.use(bodyParser.json());(
app.use('/images',express.static(path.join(__dirname,'../assets'))));
app.use(express.static(path.resolve(__dirname, '../dist'), {maxAge:'1y',etag:false}));
app.use(history());

app.get('/api/products', async (req, res) => {
  const client = await MongoClient.connect(
    'mongodb://127.0.0.1:27017', err => {
      if (err) throw err;
      console.log('connected to MongoDB')
    }

  );
  const db = client.db('blackrose');
  const products = (await db.collection('fashion').find({}).toArray());

  res.status(200).json(products);
  client.close();
})

app.get('/api/users/:userId/cart', async (req, res) => {
  const { userId } = req.params;
  const client = await MongoClient.connect(
    'mongodb://127.0.0.1:27017', err => {
      if (err) throw err;
      console.log('connected to MongoDB')
    }

  );
  const db = client.db('blackrose');
  const user = await db.collection('users').findOne({ id: userId });
  if (!user) return res.status(404).json("Người dùng không tồn tại");
  const products = await db.collection('fashion').find({}).toArray();
  const cartItemIds = user.cartItems;
  const cartItems = cartItemIds.map(id => products.find(product => product.id === id))
  res.status(200).json(cartItems);
  client.close();
})

app.get('/api/products/:productId', async (req, res) => {
  const { productId } = req.params;
  const client = await MongoClient.connect(
    'mongodb://127.0.0.1:27017', err => {
      if (err) throw err;
      console.log('connected to MongoDB')
    }

  );
  const db = client.db('blackrose');
  const product = await db.collection('fashion').findOne({ id: productId });
  if (product) {
    res.status(200).json(product);
  } else {
    res.status(404).json('Khong tim thay san pham!');
  }
  client.close();
})



app.post('/api/users/:userId/cart', async (req, res) => {
  const { userId } = req.params;
  const { productId } = req.body;
  const client = await MongoClient.connect(
    'mongodb://127.0.0.1:27017', err => {
      if (err) throw err;
      console.log('connected to MongoDB')
    }

  );
  const db = client.db('blackrose');
  await db.collection('users').updateOne({ id: userId }, {
    $addToSet: { cartItems: productId }
  });
  const products = await db.collection('fashion').find({}).toArray();
  const user = await db.collection('users').findOne({ id: userId });
  const cartItemIds = user.cartItems;
  
  const cartItems = cartItemIds.map(id => products.find(product => product.id === id));
  res.status(200).json(cartItems);
  client.close();
})

app.delete('/api/users/:userId/cart/:productId', async (req, res) => {
  const { userId, productId } = req.params;
  const client = await MongoClient.connect(
    'mongodb://127.0.0.1:27017', err => {
      if (err) throw err;
      console.log('connected to MongoDB')
    }

  );
  const db = client.db('blackrose');
  
  await db.collection('users').updateOne({id: userId},{
    $pull: {cartItems: productId},
  });
  const user = await db.collection('users').findOne({id: userId});
  const products = await db.collection('fashion').find({}).toArray();
  const cartItemIds = user.cartItems;
  const cartItems = cartItemIds.map(id => products.find(product => product.id === id));
  res.status(200).json(cartItems);
  client.close();
})

app.get('*',(req,res)=>{
  res.sendFile(path.join(__dirname,'../dist/index.html'));
})

app.listen(8000, () => {
  console.log('Server is listening on port 8000');
})