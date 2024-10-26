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
const jwtCheck_1 = __importDefault(require("./jwtCheck"));
const userAuth_1 = __importDefault(require("./userAuth"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use(express_1.default.json());
//app.use(auth(config)); 
app.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield database_1.default.query('SELECT COUNT(*) FROM tickets');
        const ticketCount = result.rows[0].count;
        res.send(`<h1>Ukupan broj generiranih ulaznica: ${ticketCount}</h1>`);
    }
    catch (err) {
        console.error(err);
        res.status(500).send('Greška pri dohvaćanju podataka.');
    }
}));
app.post('/generate-qrcode', jwtCheck_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { vatin, firstName, lastName } = req.body;
    if (!vatin || !firstName || !lastName) {
        return res.status(400).send('Nedostaju potrebni podaci.');
    }
    try {
        const result = yield database_1.default.query('SELECT COUNT(*) FROM tickets WHERE vatin = $1', [vatin]);
        const ticketCount = parseInt(result.rows[0].count);
        if (ticketCount >= 3) {
            return res.status(400).send('Osoba s ovim OIB-om već ima maksimalno 3 ulaznice.');
        }
        const insertResult = yield database_1.default.query('INSERT INTO tickets (vatin, first_name, last_name, created_at) VALUES ($1, $2, $3, $4) RETURNING id', [vatin, firstName, lastName, new Date()]);
        const ticketId = insertResult.rows[0].id;
        const ticketUrl = `https://lab1-web2-onrender-com.onrender.com/${ticketId}`;
        return res.status(201).json({
            message: 'Ulaznica je uspješno generirana',
            qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?data=${ticketUrl}`,
            ticketId: ticketId
        });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json('Došlo je do pogreške prilikom generiranja ulaznice.');
    }
}));
app.get('/:ticketId', userAuth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    console.log(req.oidc.isAuthenticated());
    const { ticketId } = req.params;
    try {
        const result = yield database_1.default.query('SELECT vatin, first_name, last_name, created_at FROM tickets WHERE id = $1', [ticketId]);
        if (result.rows.length === 0) {
            return res.status(404).send('Ulaznica nije pronađena');
        }
        const ticketData = result.rows[0];
        const userName = (_a = req.oidc.user) === null || _a === void 0 ? void 0 : _a.name;
        res.send(`
      <h1>Informacije o korisniku</h1>
      <p><strong>OIB:</strong> ${ticketData.vatin}</p>
      <p><strong>Ime:</strong> ${ticketData.first_name}</p>
      <p><strong>Prezime:</strong> ${ticketData.last_name}</p>
      <p><strong>Vrijeme nastanka ulaznice:</strong> ${ticketData.created_at}</p>
      <p><strong>Korisnik koji je logiran: ${userName}</p>
    `);
    }
    catch (error) {
        console.error('Error retrieving ticket data:', error);
        res.status(500).send('An error occurred while retrieving ticket data');
    }
}));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server je pokrenut na: https://lab1-web2-onrender-com.onrender.com/`);
});
