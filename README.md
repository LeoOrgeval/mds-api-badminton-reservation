# Projet API de Réservation de Terrains de Badminton

## Table des matières

- [Lancer le projet](#lancer-le-projet)
- [Utiliser le service](#utiliser-le-service)
- [Conception](#conception)
- [Dictionnaire des données](#dictionnaire-des-données)
- [Tableau récapitulatif des ressources](#tableau-récapitulatif-des-ressources)
- [Sécurité](#sécurité)
- [Remarques](#remarques)
- [Références](#références)

## Lancer le projet

### 1. Installer les dépendances

Pour démarrer le projet, vous devez d'abord installer les dépendances nécessaires. Exécutez la commande suivante dans le terminal à la racine du projet :

```bash
npm install
```

### 2. Démarrer le serveur

Pour démarrer le serveur, exécutez la commande suivante dans le terminal à la racine du projet :

```bash
npm start
```

Le serveur devrait démarrer sur le port `3000`.

### 3. Configurer la base de données

Utiliser la commande suivante pour créer le container sur Docker Desktop :
    
```bash
docker run --name mysql-badminton -e MYSQL_ROOT_PASSWORD=root@root -e MYSQL_DATABASE=mds_api_badminton -p 3306:3306 -d mysql:latest
```

### 4. Utiliser les migrations et seeders

Pour créer les tables de la base de données et insérer des données de test, exécutez les commandes suivantes dans le terminal à la racine du projet :

```bash
npx sequelize-cli db:migrate
npx sequelize-cli db:seed:all
```

### 5. Tester le service

Pour tester le service, vous pouvez utiliser un outil comme [Postman](https://www.postman.com/) ou [Insomnia](https://insomnia.rest/). Vous pouvez également utiliser l'interface Swagger en accédant à l'URL suivante :

```
http://localhost:3000/api-docs
```

## Utiliser le service

Le service permet de gérer des réservations de terrains de badminton. Il expose les ressources suivantes :

- `GET /availableSlots` : récupérer les créneaux horaires disponibles d'un terrain donné et d'une date donnée
- `POST /reservations` : réserver un terrain de badminton pour un créneau horaire donné, une date donnée et un utilisateur donné
- `DELETE /reservations` : annuler une réservation de terrain de badminton pour un créneau horaire donné et une date donnée
- `POST /terrain/availability` : permet de mettre à jour la disponibilité d'un terrain de badminton

## Conception

Le service est conçu en suivant une architecture RESTful. Il est développé en Node.js avec le framework Express.js. Les données sont stockées dans une base de données PostgreSQL.
Il possède comme sécurité: 

## Dictionnaire des données

| Entité        | Type    | Description                                 |
|---------------|---------|---------------------------------------------|
| Terrain       | Objet   | Représente un terrain de badminton          |
| `name`        | string  | Nom du terrain                              |
| `isAvailable` | boolean | Indique si le terrain est disponible ou non |

| Entité       | Type    | Description                                                           |
|--------------|---------|-----------------------------------------------------------------------|
| Réservation  | Objet   | Représente une réservation pour un terrain                            |
| `name`       | string  | Nom de la personne qui a réservé le terrain                           |
| `date`       | string  | Date de la réservation                                                |
| `schedule`   | string  | Créneau horaire de la réservation                                     |
| `terrainId`  | number  | Identifiant du terrain réservé                                        |
| `isAdmin`    | boolean | Indique si la personne qui a réservé le terrain est un administrateur |

## Tableau récapitulatif des ressources

| Ressource      | URL                   | Méthodes HTTP | Paramètres d'URL / Variations          | Sécurité                                                 |
|----------------|-----------------------|---------------|----------------------------------------|----------------------------------------------------------|
| Créneaux libre | /availableSlots       | GET           | date, terrain                          | N/A                                                      |
| Réservation    | /reservation          | POST, DELETE  | date, schedule, terrain, name          | N/A                                                      |
| Terrain        | /terrain/availability | POST          | pseudo, password, terrain, isAvailable | Authentification admin, Express Rate Limit (brute force) |
| Swagger UI     | /api-docs             | GET           | N/A                                    | N/A                                                      |

## Sécurité

Le service est sécurisé en utilisant les méthodes suivantes :

- Authentification basique pour les administrateurs
- Limite de taux Express pour prévenir les attaques par force brute

## Remarques

- Les dates sont au format `YYYY-MM-DD`
- Les créneaux horaires sont au format `HH:MM`
- Les terrains sont identifiés par des lettres majuscules (`A`, `B`, `C`, `D`)
- J'ai utilisé docker desktop pour lancer le serveur PostgreSQL
- J'ai pris la liberté de changer 'time' par 'schedule' pour plus de clarté

## Références

- [Node.js](https://nodejs.org/)
- [Express.js](https://expressjs.com/)
- [PostgreSQL](https://www.postgresql.org/)
- [Swagger](https://swagger.io/)
- [Docker](https://www.docker.com/)