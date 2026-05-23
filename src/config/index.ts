import dotenv from "dotenv";
import path from "path";

dotenv.config({
  path: path.join(process.cwd(), ".env"),
});

const config = {
  port: process.env.PORT,
  database_url: process.env.DATABASE_URL as string,
  jwt_secret: process.env.JWT_SECRET as string,
  jwt_expires_in: process.env.JWT_EXPIRES_IN || "7d",
  bcrypt_salt: Number(process.env.BCRYPT_SALT) || 10,
  cors_origin: process.env.CORS_ORIGIN || "*",
  node_env: process.env.NODE_ENV || "development",
};

export default config;
