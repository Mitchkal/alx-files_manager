import express from 'express';

// eslint-disable-next-line import/no-extraneous-dependencies
const bodyParser = require('body-parser');

const routes = require('./routes/index');

const port = process.argv.PORT || 5000;

const app = express();
app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: true }));

app.use('/', routes);

app.listen(port, (err) => {
  if (!err) {
    console.log(`Server is running on port ${port}`);
  } else {
    console.log(`Server error${err}`);
  }
});
