import express, { Request, Response } from 'express';
import pool from './database';
import axios from 'axios';
import jwtCheck from './jwtCheck'; 
import dotenv from 'dotenv';
import authConfig from './userAuth';


dotenv.config();

async function getAccessToken() {
  try {
    const response = await axios.post(`https://${process.env.AUTH0_DOMAIN}/oauth/token`, {
      client_id: process.env.AUTH0_CLIENT_ID,
      client_secret: process.env.AUTH0_CLIENT_SECRET,
      audience: process.env.AUTH0_AUDIENCE,
      grant_type: 'client_credentials'
    },
    { headers: { "Content-Type": "application/json" } });

    console.log('Access token response:', response.data); 
    return response.data.access_token;
  } catch (error) {
    console.error('Error retrieving access token');
    throw error; 
  }
}

const app = express();

app.use(express.json()); 

app.get('/', async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT COUNT(*) FROM tickets');
    const ticketCount = result.rows[0].count;
    res.send(`<h1>Broj generiranih ulaznica: ${ticketCount}</h1>`);
  } catch (err) {
    console.error(err);
    res.status(500).send('Greška prilikom dohvaćanja podataka.');
  }
});

app.get('/get-token', async (req, res) => {
  try {
    const accessToken = await getAccessToken();
    res.json({ access_token: accessToken });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error retrieving access token');
  }
});

app.post('/generate-qrcode', async (req: Request, res: Response) => {
  const { vatin, firstName, lastName } = req.body;

  if (!vatin || !firstName || !lastName) {
    return res.status(400).send('Nedostaju podaci.');
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

    const ticketUrl = `http://localhost:3000/${ticketId}`;

    return res.status(201).json({
      message: 'Ulaznica je uspješno generirana',
      qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?data=${ticketUrl}`,
      ticketId: ticketId 
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json('Došlo je do greške prilikom generiranja ulaznice.');
  }
});

app.get('/ticket/:ticketId', async (req: Request, res: Response) => {
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

    res.send(`
      <h1>Informacije o korisniku</h1>
      <p><strong>OIB:</strong> ${ticketData.vatin}</p>
      <p><strong>Ime:</strong> ${ticketData.first_name}</p>
      <p><strong>Prezime:</strong> ${ticketData.last_name}</p>
      <p><strong>Vrijeme nastanka ulaznice:</strong> ${ticketData.created_at}</p>
    `);
  } catch (error) {
    console.error('Error retrieving ticket data:', error);
    res.status(500).send('An error occurred while retrieving ticket data');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server je pokrenut na: http://localhost:${PORT}`);
});