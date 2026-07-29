# LevelUp-GenAI
A full-stack AI-powered personal fitness tracking platform using Nodejs, JavaScript, Google FastAPI, MangoDb, and Google's Gemini API. Implemented secure JWT authentication, interactive dashboards, personalized workout based on users data. An experience system (xp) that levels up the user based on workout and other workout done. This feature keeps the users engaged and coming back for more    

#########################################
https://levelup-ai-0hbx.onrender.com
#########################################

#####################################
Testing Info:
email: andreking123@gmail.com
password: 123456789
#####################################

#####################################
API: Google API
#####################################

#####################################
DATABASE: mangoDB
SCHEMA: LevulUp
#####################################

#####################################
Deployed using RENDER
#####################################


## LevelUp Mermaid diagram
```mermaid
flowchart TD
    subgraph Browser["Browser (public/)"]
        Login["login.html / signup.html"]
        Dashboard["dashboard.ejs"]
        Workout["workout.ejs"]
        Profile["profile.ejs"]
        Motivation["motivation.ejs"]
        AuthJS["auth-script.js"]
    end

    subgraph ExpressApp["Express App (app.js)"]
        IndexRoute["routes/index.js\nGET /dashboard, /workout, /profile"]
        AuthRoute["routes/auth.js\nPOST /api/auth/signup, /login, /logout"]
        GeminiRoute["routes/gemini.js\nPOST /api/gemini/ask"]
        AuthMW["middleware/auth.js\nrequireAuthPage (JWT cookie check)"]
    end

    subgraph Models["Mongoose Models"]
        UserModel["User"]
        WorkoutModel["WorkoutLog"]
    end

    Atlas[("MongoDB Atlas\n(users, workoutlogs)")]
    GeminiAPI["Google Gemini API"]

    Login -- "fetch /api/auth/signup or /login" --> AuthRoute
    AuthJS --> Login

    AuthRoute -- "bcrypt hash + create()" --> UserModel
    AuthRoute -- "sign JWT, set cookie" --> Login

    Dashboard -- "page request" --> IndexRoute
    Workout -- "page request" --> IndexRoute
    Profile -- "page request" --> IndexRoute
    Motivation -- "page request" --> IndexRoute

    IndexRoute --> AuthMW
    AuthMW -- "valid cookie: req.user" --> IndexRoute
    AuthMW -- "no/invalid cookie: redirect" --> Login

    IndexRoute -- "findById / countDocuments" --> UserModel
    IndexRoute -- "find / create" --> WorkoutModel

    UserModel --> Atlas
    WorkoutModel --> Atlas
```

    Dashboard -- "click Ask Gemini" --> GeminiRoute
    GeminiRoute -- "recent stats" --> WorkoutModel
    GeminiRoute -- "generateContent" --> GeminiAPI
    GeminiAPI -- "AI reply" --> GeminiRoute
    GeminiRoute -- "JSON reply" --> Dashboard
