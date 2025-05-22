const express = require('express');
const path = require('path');
const app = express();

// Configuration CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

// Middleware pour logger les requêtes
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Servir les fichiers statiques
app.use(express.static(__dirname, {
    setHeaders: (res, path) => {
        if (path.endsWith('.css')) {
            res.setHeader('Content-Type', 'text/css');
        }
        if (path.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript');
        }
    }
}));

// Route par défaut
app.get('/', (req, res) => {
    console.log('Tentative de servir index.html');
    res.sendFile(path.join(__dirname, 'index.html'), (err) => {
        if (err) {
            console.error('Erreur lors de l\'envoi de index.html:', err);
            res.status(500).send('Erreur lors du chargement de la page');
        }
    });
});

// Gestion des erreurs 404
app.use((req, res) => {
    console.log('404 - Page non trouvée:', req.url);
    res.status(404).send('Page non trouvée');
});

// Gestion des erreurs globales
app.use((err, req, res, next) => {
    console.error('Erreur serveur:', err);
    res.status(500).send('Une erreur est survenue sur le serveur');
});

// Démarrer le serveur
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Serveur démarré sur http://localhost:${PORT}`);
    console.log('Appuyez sur Ctrl+C pour arrêter le serveur');
}); 