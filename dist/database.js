"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const pool = new pg_1.Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || '5432'),
});
function initDb() {
    return __awaiter(this, void 0, void 0, function* () {
        const createExtensionQuery = `CREATE EXTENSION IF NOT EXISTS "pgcrypto";`;
        const createTableQuery = `
    CREATE TABLE IF NOT EXISTS tickets ( 
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      vatin VARCHAR(11) NOT NULL,
      first_name VARCHAR(100) NOT NULL,
      last_name VARCHAR(100) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `;
        const createIndexQuery = `
    CREATE INDEX IF NOT EXISTS idx_ticket_vatin ON tickets (vatin);
  `;
        try {
            yield pool.query(createExtensionQuery);
            yield pool.query(createTableQuery);
            yield pool.query(createIndexQuery);
        }
        catch (err) {
            console.error('Došlo je do greške pri kreiranju tablice ili indeksa:', err);
        }
    });
}
initDb();
exports.default = pool;
