const express = require("express");
const { client, connectDB } = require("./db");

connectDB();   // ✅ 确保连接启动

const app = express();
app.use(express.json());
