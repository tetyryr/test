const express = require('express');
const bodyParser = require("body-parser");
const path = require('path');
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require('express-session');
var cookieParser = require('cookie-parser');
const flash = require('connect-flash');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');
const request = require('request');
const md5 = require('md5');
const Str = require('@supercharge/strings');
const nodemailer = require('nodemailer');
var app = express();
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser('secret'));
app.use(flash());
app.use(session({
    secret: "Our little secret.",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));
// var template = require('./routes/index');
app.use(passport.initialize());
app.use(passport.session());






mongoose.connect("mongodb+srv://tester:tester1234@cluster0.ki492.mongodb.net/users?retryWrites=true&w=majority", {
    useNewUrlParser: true,
    useUnifiedTopology: true
});
mongoose.set("useCreateIndex", true);

const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
    secret: String,
    token: { type: String, default: 'testing' }
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
    done(null, user.id);
});

passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
        done(err, user);
    });
});

function uploadMailchimp(req, res) {
    var email = req.body.username;
    var data = {
        members: [{
            email_address: email,
            status: "subscribed",
        }]
    };

    var jsonData = JSON.stringify(data);

    var options = {
        url: 'https://us19.api.mailchimp.com/3.0/lists/0b30735f60',
        method: 'POST',
        headers: {
            "Authorization": "joheli 065d22ca86f79ae3839b5e83022c620d-us19"

        },
        body: jsonData
    };

    request(options, function(error, response, body) {

        if (error) {
            console.log(error);
        } else {
            console.log('successfully connected to mailchimp', response.statusCode);
        }
    });
    // res.next();
    // res.redirect("/234ab61habtt109acc34577");
}



app.get("/logout", function(req, res) {
    req.logout();
    res.redirect("/");
});

app.post("/signup", function(req, res) {

    User.register({ username: req.body.username }, req.body.password, function(err, user) {
        // uploadMailchimp(req, res);
        if (err) {
            console.log(err);
            req.flash('errorSignup', 'OOPS !! a user with the given email already exits');
            res.redirect("/signup");
        } else {
            passport.authenticate("local")(req, res, function() {
                var filter = { username: req.body.username };
                var update = { name: req.body.name };
                console.log(filter, update);
                User.findOneAndUpdate(filter, update, function(err, user) {
                    if (user) {
                        res.redirect("/434jwe98432nk4pwe293j34834jh");
                    }
                });
                console.log(req.body.username);
                console.log(user);
            });

        }
    });
});


app.post('/login', passport.authenticate('local', { failureRedirect: '/login', failureFlash: true }), function(req, res) {
    // res.redirect('/dashboard/:id');
    var userx = req.body.username;
    User.findOne({ username: userx }, function(err, user) {
        console.log(user);
        var userx = user._id;
        console.log(userx);
        if (!user) {
            res.render("error");
        } else {
            res.redirect("dashboard/" + userx);
        }

    });
});


app.get("/login", function(req, res) {
    res.render("login", {
        errorSignup: req.flash('errorSignup'),
        errorSignin: req.flash('error'),
        userlog: req.isAuthenticated() //if user is authenticated
        // user: req.user  this is the user email....
    });
    // console.log(req.user);
    // console.log(req.isAuthenticated());
});
app.get("/signup", function(req, res) {
    res.render("signup", {
        errorSignup: req.flash('errorSignup'),
        errorSignin: req.flash('error'),
        userlog: req.isAuthenticated() //if user is authenticated
        // user: req.user  this is the user email....
    });
    // console.log(req.user);
    // console.log(req.isAuthenticated());
});


app.get("/434jwe98432nk4pwe293j34834jh", function(req, res) {
    if (req.isAuthenticated()) {
        res.render("success", {
            userlog: req.isAuthenticated(),
            user: req.user
        });
    } else {
        res.redirect("/signup");
    }
});







function generateEmailToken(email, tok) {

    var tok = tok;
    var email = email;
    console.log('this is the email to send to', email, 'token key', tok);

    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'climbrtech@gmail.com',
            pass: 'Refinery1896'
        }
    });

    const mailOptions = {
        from: 'climbrtech@gmail.com',
        to: email,
        subject: 'CLIMBR: Password verification link',
        text: 'Hello, this is your password verification link it expires in 24hours' + " https://climbr.xyz/reset/" + tok + " You can ignore this mail if password change was not initiated by you. Thank you"
    };

    transporter.sendMail(mailOptions, function(error, info) {
        if (error) {
            console.log(error);
        } else {
            console.log('email sent' + info.response);
        }

    });
    // return id;
}

function generateToken() {
    var buf = Str.random()
    var id = buf;
    return id;
}

app.get('/forgot', function(req, res) {
    res.render('forgot', {
        userexist: req.flash('userExist'),
        userexistnot: req.flash('userExistNot')
    });
});

app.post('/forgot', function(req, res) {

    User.findOne({ username: req.body.username }, function(err, user) {


        if (user) {
            var tok = generateToken();
            console.log(user.username);
            var email = user.username;

            generateEmailToken(email, tok);

            req.flash("userExist", "verification email has been sent to your mailbox");
            User.findOneAndUpdate({ username: user.username }, { token: tok }, function(err, newu) {});
            res.redirect('/forgot');
        } else {
            req.flash("userExistNot", "no such user with such email")
            res.redirect('/forgot');

        }

    });
});



app.get('/reset/:token', function(req, res) {

    var token = req.params.token;
    // console.log('this is the token ',token);

    User.findOne({ token: token }, function(err, user) {
        if (!user) {
            res.render("error");
        } else {
            res.render('reset', {
                token: token,
                success: req.flash('passChangeSuccess'),
                noExist: req.flash('userNotExistChange'),
                noMatch: req.flash('userNotMatchChange')
            });
        }

    });

});

app.post('/reset/:token', function(req, res) {
    var token = req.body.token;
    var username = req.body.username;
    var password = req.body.password;


    User.findOne({ username: username }, function(err, sanitizedUser) {

        if (sanitizedUser) {
            var sant = sanitizedUser.token;
            if (token == sant) {
                sanitizedUser.setPassword(password, function() {
                    sanitizedUser.save();
                    // console.log('pass changed');
                    req.flash('passChangeSuccess', 'Great password successfully changed  ');
                    res.redirect('/reset/' + token);
                });
            } else {
                req.flash('userNotExistChange', 'User does not exist or matches verification key');
                res.redirect('/reset/' + token);
                // res.send('user does not exist')
            }
        } else {
            req.flash('userNotMatchChange', 'Your email doesnt match your verification key please retry');
            res.redirect('/reset/' + token);
            // console.log('user and token key doesnot match');
        }

    });


    // User.findByUsername(username).then(function(sanitizedUser){
    //   var sant = sanitizedUser.token;
    //   if (sanitizedUser){
    //       sanitizedUser.setPassword(password, function(){
    //           sanitizedUser.save();
    //           res.status(200).json({message: 'password reset successful'});
    //       });
    //   } else {
    //       res.status(500).json({message: 'This user does not exist'});
    //       console.log('user and token key doesnot match')
    //   }
    //   },function(err){
    //     console.error(err);
    // });



});











































































app.get("/", function(req, res) {
    res.render("index");
});
app.get("/about", function(req, res) {
    res.render("about");
});

app.get("/contact", function(req, res) {
    res.render("contact");
});
app.get("/investment", function(req, res) {
    res.render("investment");
});

app.get("/admin/staff/30303030/unicornsarereal", function(req, res) {
  var  user = [];
    User.find({}, function(err, users) {
        res.render("admin", {
            errorNone: req.flash('errorNone'),
            users: users,
            user:user
        });
        console.log(user)
    });


});
app.post("/admin/staff/30303030/unicornsarereal", function(req, res) {
    var username = req.body.username;
    User.find({}, function(err, users) {
        User.findOne({ username: username }, function(err, user) {
            if (err) {
                console.log(err);
                req.flash('errorNone', 'OOPS !! no email found' + err);
                res.redirect("/admin/staff/30303030/unicornsarereal");
            } else {
                res.render("admin", {
                    errorNone: req.flash('errorNone'),
                    users: users,
                    user: user
                });
                console.log(user);
            }
        });
    });
});

app.get('/dashboard/:userx', function(req, res) {

    var userx = req.params.userx;
    console.log('this is the user ', userx);

    User.findOne({ _id: userx }, function(err, user) {
        if (!user) {
            res.render("error");
        } else {
            if (req.isAuthenticated()) {
                res.render("dashboard", {
                    userlog: req.isAuthenticated(),
                    user: req.user
                });
            } else {
                res.redirect("/login");
            }

        }

    });
});

app.get('/dashboard/:userx/fin', function(req, res) {

    var userx = req.params.userx;

    User.findOne({ _id: userx }, function(err, user) {
        if (!user) {
            res.render("error");
        } else {
            if (req.isAuthenticated()) {
                res.render("fin", {
                    userlog: req.isAuthenticated(),
                    user: req.user
                });
            } else {
                res.redirect("/login");
            }

        }

    });
});

app.get('/dashboard/:userx/settings', function(req, res) {

    var userx = req.params.userx;

    User.findOne({ _id: userx }, function(err, user) {
        if (!user) {
            res.render("error");
        } else {
            if (req.isAuthenticated()) {
                res.render("settings", {
                    userlog: req.isAuthenticated(),
                    user: req.user
                });
            } else {
                res.redirect("/login");
            }

        }

    });
});















































// errror handling------------------------------------
// catch 404 and forward to error handler
app.use(function(req, res, next) {
    const err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});



// --------------------------------------------------------------------------------------------



let port = process.env.PORT || 3000;

// let port =8080;

app.listen(port);
console.log(
    "succefully conected to port"
);