const fs = require('fs');

var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var multer = require('multer');
var upload = multer({ dest: path.join(__dirname, 'uploads/') });

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function (req, res) {

  res.render('index');

});
// Route POST pour générer le rapport
app.post('/generateReport', upload.single('fileUpload'), (req, res) => {
  // Vérifier si un fichier a été envoyé dans le formulaire
  if (!req.file) {
    return res.status(400).send('Aucun fichier envoyé.');
  }

  // Le fichier est accessible via req.file

  // Récupérer le chemin du fichier
  const filePath = req.file.path;

  // Générer le rapport à partir du fichier
  const reportFilePath = generateReport(filePath);

  // Lire le contenu du fichier de rapport
  fs.readFile(reportFilePath, 'utf-8', (err, data) => {
    if (err) {
      return res.status(500).send('Erreur lors de la lecture du fichier de rapport.');
    }

    // Envoyer le contenu du fichier de rapport en réponse
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=rapport.csv');
    res.send(data);
  });
});

// Fonction pour nettoyer le dossier uploads (sauf rapport.csv)
function cleanUploadsFolder() {
  const folderPath = path.join(__dirname, 'uploads');

  // Lire les fichiers dans le dossier
  fs.readdir(folderPath, (err, files) => {
    if (err) {
      console.error('Erreur lors de la lecture du dossier uploads :', err);
      return;
    }

    // Parcourir les fichiers
    files.forEach(file => {
      const filePath = path.join(folderPath, file);

      // Supprimer le fichier
      fs.unlink(filePath, err => {
        if (err) {
          console.error('Erreur lors de la suppression du fichier', file, ':', err);
        } else {
          console.log('Fichier', file, 'supprimé avec succès.');
        }
      });
    });
  });
}


// Fonction pour générer le rapport à partir du fichier
function generateReport(filePath) {
  // Lire le contenu du fichier
  const fileContent = fs.readFileSync(filePath, 'utf-8');

  cleanUploadsFolder()

  // Diviser le contenu du fichier en lignes
  const lines = fileContent.split('\n');

  // Convertir chaque nombre en inversant son signe
  const invertedNumbers = lines.map(line => {
    const number = parseInt(line);
    if (!isNaN(number)) {
      return -number;
    } else {
      return ''; // Ignorer les lignes qui ne sont pas des nombres
    }
  });

  // Générer le contenu CSV à partir des nombres inversés
  const csvContent = invertedNumbers.join('\n');

  // Définir le chemin du fichier de rapport
  const reportFilePath = path.join(__dirname, 'uploads', 'rapport.csv');

  // Écrire le contenu du rapport dans un fichier CSV
  fs.writeFileSync(reportFilePath, csvContent, 'utf-8');

  // Retourner le chemin du fichier de rapport
  return reportFilePath;
}

module.exports = app;
