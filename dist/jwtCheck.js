"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_oauth2_jwt_bearer_1 = require("express-oauth2-jwt-bearer");
const jwtCheck = (0, express_oauth2_jwt_bearer_1.auth)({
    audience: 'https://ticketqr.api',
    issuerBaseURL: 'https://dev-oimj0pttu1x4b3hd.us.auth0.com/',
    tokenSigningAlg: 'RS256'
});
exports.default = jwtCheck;
