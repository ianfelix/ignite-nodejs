const express = require('express');
const { v4: uuidv4 } = require('uuid');

const app = express();

app.use(express.json());

const customers = [];

const verifyIfCustomerExists = (req, res, next) => {
  const { cpf } = req.headers;

  const customer = customers.find((customer) => customer.cpf === cpf);

  if (!customer) {
    return res.status(400).json({ error: 'Customer does not exists' });
  }

  req.customer = customer;

  return next();
};

const getBalance = (statement) => {
  const balance = statement.reduce((acc, operation) => {
    if (operation.type === 'credit') {
      return acc + operation.amount;
    }

    return acc - operation.amount;
  }, 0);

  return balance;
};

app.post('/account', (req, res) => {
  const { cpf, name } = req.body;

  const hasCustomer = customers.some((customer) => customer.cpf === cpf);

  if (hasCustomer) {
    return res.status(400).json({ error: 'Customer already exists' });
  }

  customers.push({ id: uuidv4(), cpf, name, statement: [] });

  console.log(customers);

  return res.status(201).send();
});

app.get('/statement', verifyIfCustomerExists, (req, res) => {
  const { customer } = req;

  return res.json(customer.statement);
});

app.post('/deposit', verifyIfCustomerExists, (req, res) => {
  const { customer } = req;

  const { amount, description } = req.body;

  const statementOperation = {
    description,
    amount,
    created_at: new Date(),
    type: 'credit',
  };

  customer.statement.push(statementOperation);

  return res.status(201).send();
});

app.post('/withdraw', verifyIfCustomerExists, (req, res) => {
  const { customer } = req;

  const { amount } = req.body;

  const balance = getBalance(customer.statement);

  if (balance < amount) {
    return res.status(400).json({ error: 'Insufficient funds!' });
  }

  const statementOperation = {
    amount,
    created_at: new Date(),
    type: 'debit',
  };

  customer.statement.push(statementOperation);

  return res.status(201).send();
});

app.get('/statement/date', verifyIfCustomerExists, (req, res) => {
  const { customer } = req;
  const { date } = req.query;

  console.log(date);

  const dateFormat = new Date(date);

  const statement = customer.statement.filter((statement) => {
    return (
      new Intl.DateTimeFormat('en-US').format(statement.created_at) ===
      new Intl.DateTimeFormat('en-US').format(dateFormat)
    );
  });

  return res.status(200).json(statement);
});

app.put('/account', verifyIfCustomerExists, (req, res) => {
  const { name } = req.body;
  const { customer } = req;

  customer.name = name;

  return res.status(201).send();
});

app.get('/account', verifyIfCustomerExists, (req, res) => {
  const { customer } = req;

  return res.json(customer);
});

app.delete('/account', verifyIfCustomerExists, (req, res) => {
  const { customer } = req;

  customers.splice(customer, 1);

  return res.status(200).json(customers);
});

app.listen(3333, () => {
  console.log('servidor rodando na porta 3333');
});
