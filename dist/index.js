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
const express_1 = __importDefault(require("express"));
const database_1 = __importDefault(require("./database"));
const axios_1 = __importDefault(require("axios"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
function getAccessToken() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield axios_1.default.post(`https://${process.env.AUTH0_DOMAIN}/oauth/token`, {
                client_id: process.env.AUTH0_CLIENT_ID,
                client_secret: process.env.AUTH0_CLIENT_SECRET,
                audience: process.env.AUTH0_AUDIENCE,
                grant_type: 'client_credentials'
            }, { headers: { "Content-Type": "application/json" } });
            console.log('Access token response:', response.data);
            return response.data.access_token;
        }
        catch (error) {
            console.error('Error retrieving access token');
            throw error;
        }
    });
}
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield database_1.default.query('SELECT COUNT(*) FROM tickets');
        const ticketCount = result.rows[0].count;
        res.send(`<h1>Broj generiranih ulaznica: ${ticketCount}</h1>`);
    }
    catch (err) {
        console.error(err);
        res.status(500).send('Greška prilikom dohvaćanja podataka.');
    }
}));
app.get('/get-token', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const accessToken = yield getAccessToken();
        res.json({ access_token: accessToken });
    }
    catch (error) {
        console.error(error);
        res.status(500).send('Error retrieving access token');
    }
}));
app.post('/generate-qrcode', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { vatin, firstName, lastName } = req.body;
    if (!vatin || !firstName || !lastName) {
        return res.status(400).send('Nedostaju podaci.');
    }
    try {
        const result = yield database_1.default.query('SELECT COUNT(*) FROM tickets WHERE vatin = $1', [vatin]);
        const ticketCount = parseInt(result.rows[0].count);
        if (ticketCount >= 3) {
            return res.status(400).send('Osoba s ovim OIB-om već ima maksimalno 3 ulaznice.');
        }
        const insertResult = yield database_1.default.query('INSERT INTO tickets (vatin, first_name, last_name, created_at) VALUES ($1, $2, $3, $4) RETURNING id', [vatin, firstName, lastName, new Date()]);
        const ticketId = insertResult.rows[0].id;
        const ticketUrl = `http://localhost:3000/${ticketId}`;
        return res.status(201).json({
            message: 'Ulaznica je uspješno generirana',
            qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?data=${ticketUrl}`,
            ticketId: ticketId
        });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json('Došlo je do greške prilikom generiranja ulaznice.');
    }
}));
app.get('/ticket/:ticketId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { ticketId } = req.params;
    try {
        const result = yield database_1.default.query('SELECT vatin, first_name, last_name, created_at FROM tickets WHERE id = $1', [ticketId]);
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
    }
    catch (error) {
        console.error('Error retrieving ticket data:', error);
        res.status(500).send('An error occurred while retrieving ticket data');
    }
}));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server je pokrenut na: http://localhost:${PORT}`);
});
