import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST, 
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER, 
  password: process.env.DB_PASSWORD, 
  database: process.env.DB_NAME,
});

const testDbConnection = async () => {
  try {
    const client = await pool.connect();
    console.log('Conexão com o banco de dados bem-sucedida!');
    client.release();
  } catch (err) {
    console.error('Erro ao conectar ao banco de dados:', err);
  }
};

testDbConnection();
