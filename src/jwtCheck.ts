import { auth } from 'express-oauth2-jwt-bearer';

const jwtCheck = auth({
  audience: 'https://ticketqr.api',
  issuerBaseURL: 'https://dev-oimj0pttu1x4b3hd.us.auth0.com/',
  tokenSigningAlg: 'RS256',
});

//console.log(jwtCheck);

export default jwtCheck; 
