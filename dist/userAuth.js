"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_openid_connect_1 = require("express-openid-connect");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const userAuth = (0, express_openid_connect_1.auth)({
    authRequired: false,
    auth0Logout: true,
    secret: process.env.AUTH0_CLIENT_SECRET,
    baseURL: 'http://localhost:3000/', //https://lab1-web2-onrender-com.onrender.com/
    clientID: process.env.AUTH0_CLIENT_ID,
    issuerBaseURL: 'https://dev-oimj0pttu1x4b3hd.us.auth0.com/',
});
exports.default = userAuth;
