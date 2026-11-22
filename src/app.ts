/// <reference path="./types/index.d.ts" />
import express from 'express';
import 'dotenv/config';
import webRoutes from 'src/routes/web';
import initDataBase from 'config/seed';
import passport from 'passport';
import { configPassportLocal } from 'src/middleware/passport.local';
import session from 'express-session';
import { PrismaSessionStore } from '@quixo3/prisma-session-store';
import { PrismaClient } from '@prisma/client';

const app = express();
const PORT = process.env.PORT || 8080;

// config view engine
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

// config req.body
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//config static files: images/css/js
app.use(express.static('public'));

//config session
app.use(session({
    cookie: {
        maxAge: 7 * 24 * 60 * 60 * 1000 // ms
    },
    secret: 'a santa at nasa',
    resave: true,
    saveUninitialized: true,
    store: new PrismaSessionStore(
        new PrismaClient(),
        {
            checkPeriod: 1 * 24 * 60 * 60 * 1000,  //ms
            dbRecordIdIsSessionId: true,
            dbRecordIdFunction: undefined,
        }
    )

}))

//config passport
app.use(passport.initialize());
app.use(passport.authenticate('session'));
configPassportLocal()

// config global
app.use((req, res, next) => {
    res.locals.user = req.user || null;
    next();
});

app.use((req, res, next) => {
    res.locals.user = req.user || null;
    res.locals.currentPath = req.path; // Lưu đường dẫn hiện tại, VD: "/", "/products", "/product/5"
    next();
});

// config routes
webRoutes(app);

//seeding data
initDataBase();

// handle 404
app.use((req, res) => {
    res.render("status/404.ejs");
})

app.listen(PORT, () => {
    console.log(`My app is running on port: ${PORT}`);
    console.log("env port: ", PORT);
    console.log(__dirname + '/views');
})