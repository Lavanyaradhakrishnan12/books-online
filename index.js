import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import bcrypt from "bcrypt";
import passport from "passport";
import { Strategy } from "passport-local";
import session from "express-session";
import env from "dotenv";


const app = express();
const port  = process.env.PORT || 3000;
const saltRounds = 10;
env.config();

app.use(
    session({
      secret: process.env.SESSION_SECRET,
      resave: false,
      saveUninitialized: true,
    })
  );

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

app.use(passport.initialize());
app.use(passport.session());

const db = new pg.Client({
    user: process.env.PG_USER,
    host: process.env.PG_HOST,
    database: process.env.PG_DATABASE,
    password: process.env.PG_PASSWORD,
    port: process.env.PG_PORT,
  });
  db.connect();

app.get("/",(req,res) => {
    res.render("index.ejs");
})

app.get("/home",(req,res) => {
    res.redirect("/");
});

app.get("/login", (req, res) => {
  res.render("login.ejs");
});

app.get("/explore",(req,res) => {
    res.render("explore.ejs");
});

app.get("/register",(req,res) => {
  res.render("register.ejs");
});


app.get("/cart",(req,res) => {
  res.render("cart.ejs");
});
app.get("/contact",(req,res) => {
  res.render("contact.ejs");
});




// my user table look like always have a example what your code going to be
let users = [{id:1},{email:"something@gmail.com"},{password:"783489823"}] 
// above one is a model  

app.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/explore",
    failureRedirect: "/login",
  })
);

app.post("/register", async (req, res) => {
    const email = req.body.username;
    console.log(email);
    const password = req.body.password;
    console.log(password);
  
    try {
      const checkResult = await db.query("SELECT * FROM users WHERE email = $1", [
        email,
      ]);

      if (checkResult.rows.length > 0) {
        res.redirect("/register");
      } else {
        bcrypt.hash(password, saltRounds, async (err, hash) => {
          if (err) {
            console.error("Error hashing password:", err);
          } else {
            const result = await db.query(
              "INSERT INTO users (email, password) VALUES ($1, $2) RETURNING *",
              [email, hash]
            );
            const user = result.rows[0];
            console.log(user);
            req.login(user, (err) => {
              console.log("success");
              res.redirect("/explore");
            });
          }
        });
      }
    } catch (err) {
      console.log(err);
    }
  });

  passport.use(
    "local",
    new Strategy(async function verify(username, password, cb) {
      try {
        const result = await db.query("SELECT * FROM users WHERE email = $1 ", [
          username,
        ]);
        if (result.rows.length > 0) {
          const user = result.rows[0];
          const storedHashedPassword = user.password;
          bcrypt.compare(password, storedHashedPassword, (err, valid) => {
            if (err) {
              console.error("Error comparing passwords:", err);
              return cb(err);
            } else {
              if (valid) {
                return cb(null, user);
              } else {
                return cb(null, false);
              }
            }
          });
        } else {
          return cb("User not found");
        }
      } catch (err) {
        console.log(err);
      }
    })
  );


  app.post("/contact", async(req,res) => {
    const name = req.body.name;
    // console.log(name);
    const email = req.body.email;
    // console.log(email);
  
    try {
      const checkResult = await db.query("SELECT * FROM contact_deeds WHERE name = $1", [
        name,
      ]);

      if (checkResult.rows.length > 0) {
        res.redirect("/contact");
      } else {
            const result = await db.query(
              "INSERT INTO contact_deeds (name, email) VALUES ($1, $2) RETURNING *",
              [name, email]
            );
            const contact_user = result.rows[0];
            console.log(contact_user);
            res.redirect("/");
          };
  
    } catch (err) {
      console.log(err);
    }
  
  });


  passport.serializeUser((user, cb) => {
    cb(null, user);
  });
  
  passport.deserializeUser((user, cb) => {
    cb(null, user);
  });


app.listen(port, (req,res) => {
    console.log( `server running in ${port} `);
})