const mongoose = require('mongoose');

async function run() {
  await mongoose.connect('mongodb://localhost:27017/ute_shop_v2'); // guessing db name from context if possible
  const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
  const users = await User.find({ role: 'SALES' }).limit(3);
  console.log(users.map(u => ({ email: u.email, role: u.role })));
  process.exit(0);
}
run();
