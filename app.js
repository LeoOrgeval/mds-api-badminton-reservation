const express = require('express');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const { Terrain, Reservation, Utilisateur } = require('./models');
const {Op} = require("sequelize");
const app = express();
const PORT = process.env.PORT || 3000;
const moment = require('moment');
const rateLimit = require('express-rate-limit');

// Middleware pour analyser les requêtes JSON
app.use(express.json());

const swaggerDocument = YAML.load('./swagger.yaml');

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

//  rate limiter pour la route de disponibilité du terrain
const terrainAvailabilityLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,
    message: 'Trop de requêtes. Veuillez réessayer dans 15 minutes.',
    standardHeaders: true,
    legacyHeaders: false,
});

// Middleware d'authentification pour l'administration
const adminAuthMiddleware = (req, res, next) => {
    const { pseudo, password } = req.body;
    if (pseudo === 'admybad' && password === 'astrongpassword') {
        return next();
    }
    return res.status(403).json({ error: 'Accès non autorisé.' });
};

// Route de test
app.get('/', (req, res) => {
    res.send('API de réservation de terrain de badminton');
});

app.use('/admin', adminAuthMiddleware);

// Route pour obtenir les créneaux disponibles
app.get('/availableSlots', async (req, res) => {
    const { date, terrain } = req.query;

    if (!date || !terrain) {
        return res.status(400).json({ error: 'Date et terrain sont requis.' });
    }

    try {
        const terrainData = await Terrain.findOne({ where: { name: terrain } });

        if (!terrainData) {
            return res.status(404).json({ error: 'Terrain non trouvé.' });
        }

        const formattedDate = moment(date).format('YYYY-MM-DD');
        const dayOfWeek = moment(date).day();

        // Si c'est un dimanche (day = 0), ne pas autoriser de créneaux disponibles
        if (dayOfWeek === 0 || !terrainData.isAvailable) {
            return res.status(200).json({ terrain: terrainData.name, date, availableSlots: [] });
        }

        const reservations = await Reservation.findAll({
            where: {
                date: {
                    [Op.gte]: new Date(formattedDate), // On prend en compte les réservations à partir de la date donnée
                    [Op.lt]: new Date(moment(formattedDate).add(1, 'days').toDate()) // On ajoute 1 jour pour ne pas tenir compte des heures
                },
                terrainId: terrainData.id
            }
        });

        const availableSlots = [
            '10:00', '10:45', '11:30', '12:15', '13:00', '13:45', '14:30', '15:15',
            '16:00', '16:45', '17:30', '18:15', '19:00', '19:45', '20:30', '21:15'
        ];

        const unavailableSlots = reservations.map(r => r.schedule);
        const available = availableSlots.filter(slot => !unavailableSlots.includes(slot));

        return res.json({ terrain: terrainData.name, date, availableSlots: available });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Erreur interne du serveur.' });
    }
});

// Route pour créer une réservation
app.post('/reservations', async (req, res) => {
    const { date, schedule, terrain, name, isAdmin } = req.body;

    // Vérification des données nécessaires
    if (!date || !schedule || !terrain || !name) {
        return res.status(400).json({ error: 'Date, schedule, terrain, and name are required.' });
    }

    // Liste des créneaux horaires disponibles
    const availableSlots = [
        '10:00', '10:45', '11:30', '12:15', '13:00', '13:45', '14:30', '15:15',
        '16:00', '16:45', '17:30', '18:15', '19:00', '19:45', '20:30', '21:15'
    ];

    // le créneau fait partie des créneaux disponibles
    if (!availableSlots.includes(schedule)) {
        return res.status(400).json({ error: 'Ce créneau n\'existe pas.' });
    }

    try {
        // si le terrain existe
        const terrainData = await Terrain.findOne({ where: { name: terrain } });
        if (!terrainData) {
            return res.status(404).json({ error: 'Terrain non trouvé.' });
        }

        // si le créneau est déjà réservé
        const existingReservation = await Reservation.findOne({
            where: { date, schedule, terrainId: terrainData.id }
        });

        if (existingReservation) {
            return res.status(400).json({ error: 'Ce créneau est déjà réservé.' });
        }

        // Créer la réservation
        const reservation = await Reservation.create({
            date: date,
            schedule: schedule,
            terrainId: terrainData.id,
            name: name,
            isAdmin: isAdmin || false
        });

        // succès
        return res.status(201).json({ message: 'Réservation prise en compte.' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Erreur interne du serveur.' });
    }
});

// annuler une réservation
app.delete('/reservations', async (req, res) => {
    const { date, schedule, terrain, name } = req.body;

    // Vérification des données nécessaires
    if (!date || !schedule || !terrain) {
        return res.status(400).json({ error: 'Date, créneau horaire, terrain et nom sont requis.' });
    }

    // Liste des créneaux horaires disponibles
    const availableSlots = [
        '10:00', '10:45', '11:30', '12:15', '13:00', '13:45', '14:30', '15:15',
        '16:00', '16:45', '17:30', '18:15', '19:00', '19:45', '20:30', '21:15'
    ];

    // Vérification que le créneau fait partie des créneaux disponibles
    if (!availableSlots.includes(schedule)) {
        return res.status(400).json({ error: 'Ce créneau n\'existe pas.' });
    }

    try {
        // Vérification si le terrain existe
        const terrainData = await Terrain.findOne({ where: { name: terrain } });
        if (!terrainData) {
            return res.status(404).json({ error: 'Terrain non trouvé.' });
        }

        // Vérification si la réservation existe
        const reservation = await Reservation.findOne({
            where: { date, schedule, terrainId: terrainData.id }
        });

        if (!reservation) {
            return res.status(404).json({ error: 'Réservation non trouvée.' });
        }

        // Supprimer la réservation
        await reservation.destroy();
        return res.status(200).json({ message: 'Réservation annulée.' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Erreur interne du serveur.' });
    }
});

// Route pour rendre un terrain indisponible ou disponible (admin uniquement)
app.post('/terrain/availability', adminAuthMiddleware, terrainAvailabilityLimiter, async (req, res) => {
    const { terrain, isAvailable } = req.body;

    // Vérification des données nécessaires
    if (!terrain || typeof isAvailable !== 'boolean') {
        return res.status(400).json({ error: 'Terrain et isAvailable (true/false) sont requis.' });
    }

    try {
        // Recherche du terrain dans la base de données
        const terrainData = await Terrain.findOne({ where: { name: terrain } });
        if (!terrainData) {
            return res.status(404).json({ error: 'Terrain non trouvé.' });
        }

        // Mise à jour de la disponibilité du terrain
        await terrainData.update({ isAvailable });

        // Réponse de succès
        const message = isAvailable
            ? `Le terrain ${terrain} est désormais disponible.`
            : `Le terrain ${terrain} est désormais indisponible.`;

        return res.status(200).json({ message });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Erreur interne du serveur.' });
    }
});


// Lancer le serveur
app.listen(PORT, () => {
    console.log(`Port ${PORT}`);
});
