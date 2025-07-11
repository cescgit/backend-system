import colors from 'colors';
import { exit } from "node:process";
import mysql from "mysql2/promise";

let connection;

export const connectDB = async () => {
    try {
        // * Create a connection pool to the database
        connection = mysql.createPool({
            host: process.env.DB_HOT,
            user: process.env.DB_USER,
            port: +process.env.DB_PORT,
            password: process.env.DB_PASS,
            database: process.env.DB_DATABASE,
            connectionLimit: 20,
            connectTimeout: 60000
        });

    } catch (error) {
        console.log(colors.bgRed("Error connecting to database"))
        exit(1);
    }
}

export {
    connection
}
