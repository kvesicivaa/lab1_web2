import { auth } from 'express-openid-connect';

import dotenv from 'dotenv';

dotenv.config();

const authConfig = auth({
  authRequired: true,
  auth0Logout: true,
  secret: process.env.AUTH0_CLIENT_SECRET,
  baseURL: 'https://localhost:3000/', //https://lab1-web2-onrender-com.onrender.com/
  clientID: process.env.AUTH0_CLIENT_ID,
  issuerBaseURL: 'https://dev-oimj0pttu1x4b3hd.us.auth0.com/',
});


export default authConfig; 
