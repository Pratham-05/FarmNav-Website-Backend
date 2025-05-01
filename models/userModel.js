const pool = require('../config/db');
const { hashPassword } = require('../utils/passwordUtils');

const createUser = async (fullName, email, username, password) => {
  const hashedPassword = await hashPassword(password);
  const query = `
    INSERT INTO users (full_name, email, username, password_hash)
    VALUES ($1, $2, $3, $4)
    RETURNING id, full_name, email, username, created_at
  `;
  const values = [fullName, email, username, hashedPassword];
  const { rows } = await pool.query(query, values);
  return rows[0];
};

const findUserByEmail = async (email) => {
  const query = 'SELECT * FROM users WHERE email = $1';
  const { rows } = await pool.query(query, [email]);
  return rows[0];
};

const findUserByUsername = async (username) => {
  const query = 'SELECT * FROM users WHERE username = $1';
  const { rows } = await pool.query(query, [username]);
  return rows[0];
};

module.exports = {
  createUser,
  findUserByEmail,
  findUserByUsername
};