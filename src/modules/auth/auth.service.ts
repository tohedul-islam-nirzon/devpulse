import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import config from "../../config/index.js";
import { pool } from "../../db/index.js";

const signupUserIntoDB = async (payload: {
  name: string;
  email: string;
  password: string;
  role?: string;
}) => {
  const { name, email, password, role } = payload;

  // 1. Check if user already exists
  const existing = await pool.query(
    `
    SELECT id FROM users WHERE email=$1
    `,
    [email],
  );

  if (existing.rows.length > 0) {
    throw new Error("User with this email already exists!");
  }

  // 2. Hash the password
  const hashPassword = await bcrypt.hash(password, config.bcrypt_salt);

  // 3. Insert the user
  const result = await pool.query(
    `
    INSERT INTO users(name, email, password, role)
    VALUES($1, $2, $3, COALESCE($4, 'contributor'))
    RETURNING id, name, email, role, created_at, updated_at
    `,
    [name, email, hashPassword, role],
  );

  return result.rows[0];
};

const loginUserIntoDB = async (payload: {
  email: string;
  password: string;
}) => {
  const { email, password } = payload;

  // 1. Check if the user exists
  const userData = await pool.query(
    `
    SELECT * FROM users WHERE email=$1
    `,
    [email],
  );

  if (userData.rows.length === 0) {
    throw new Error("Invalid credentials!");
  }

  // 2. Compare the password
  const user = userData.rows[0];
  const matchPassword = await bcrypt.compare(password, user.password);

  if (!matchPassword) {
    throw new Error("Invalid credentials!");
  }

  // 3. Generate token
  const jwtPayload = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };

  const token = jwt.sign(jwtPayload, config.jwt_secret, {
    expiresIn: config.jwt_expires_in,
  } as jwt.SignOptions);

  // 4. Remove password before returning
  delete user.password;

  return { token, user };
};

export const authService = {
  signupUserIntoDB,
  loginUserIntoDB,
};
