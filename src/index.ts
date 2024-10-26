import express, { Request, Response } from 'express';
import pool from './database';
import jwtCheck from './jwtCheck'; 
//import userAuth from './userAuth'; 
import dotenv from 'dotenv';
import { ConfigParams, requiresAuth } from 'express-openid-connect';
import { auth } from 'express-openid-connect';


dotenv.config();

const app = express();

app.use(express.json()); 

const userAuth: ConfigParams = {
  authRequired: false,
  auth0Logout: true,
  secret: process.env.AUTH0_CLIENT_SECRET_USER_AUTH,
  baseURL: 'https://lab1-web2-onrender-com.onrender.com/',
  clientID: process.env.AUTH0_CLIENT_ID_USER_AUTH,
  issuerBaseURL: 'https://dev-oimj0pttu1x4b3hd.us.auth0.com/',
};

app.use(auth(userAuth)); 

app.get('/', async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT COUNT(*) FROM tickets');
    const ticketCount = result.rows[0].count;
    res.send(`<h1>Ukupan broj generiranih ulaznica: ${ticketCount}</h1>`);
  } catch (err) {
    console.error(err);
    res.status(500).send('Greška pri dohvaćanju podataka.');
  }
});


app.post('/generate-qrcode', jwtCheck, async (req: Request, res: Response) => {
  const { vatin, firstName, lastName } = req.body;

  if (!vatin || !firstName || !lastName) {
    return res.status(400).send('Nedostaju potrebni podaci.');
  }

  try {
    const result = await pool.query('SELECT COUNT(*) FROM tickets WHERE vatin = $1', [vatin]);
    const ticketCount = parseInt(result.rows[0].count);

    if (ticketCount >= 3) {
      return res.status(400).send('Osoba s ovim OIB-om već ima maksimalno 3 ulaznice.');
    }

    const insertResult = await pool.query(
      'INSERT INTO tickets (vatin, first_name, last_name, created_at) VALUES ($1, $2, $3, $4) RETURNING id',
      [vatin, firstName, lastName, new Date()]
    );

    const ticketId = insertResult.rows[0].id; 

    const ticketUrl = `https://lab1-web2-onrender-com.onrender.com/${ticketId}`;

    return res.status(201).json({
      message: 'Ulaznica je uspješno generirana',
      qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?data=${ticketUrl}`,
      ticketId: ticketId 
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json('Došlo je do pogreške prilikom generiranja ulaznice.');
  }
});


app.get('/:ticketId', requiresAuth(), async (req: Request, res: Response) => {
  
  console.log(req.oidc.isAuthenticated());
  const { ticketId } = req.params;

  try {
    const result = await pool.query(
      'SELECT vatin, first_name, last_name, created_at FROM tickets WHERE id = $1',
      [ticketId]
    );

    if (result.rows.length === 0) {
      return res.status(404).send('Ulaznica nije pronađena');
    }

    const ticketData = result.rows[0];
    const userName = req.oidc.user?.name;
    
    res.send(`
      <h1>Informacije o korisniku</h1>
      <p><strong>OIB:</strong> ${ticketData.vatin}</p>
      <p><strong>Ime:</strong> ${ticketData.first_name}</p>
      <p><strong>Prezime:</strong> ${ticketData.last_name}</p>
      <p><strong>Vrijeme nastanka ulaznice:</strong> ${ticketData.created_at}</p>
      <p><strong>Korisnik koji je logiran: ${userName}</p>
    `);
  } catch (error) {
    console.error('Error retrieving ticket data:', error);
    res.status(500).send('An error occurred while retrieving ticket data');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server je pokrenut na: https://lab1-web2-onrender-com.onrender.com/`);
});