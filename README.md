# ⚙️ Auto Project Extractor & Configuration Runner

**Author**: Habibunayka Miftah Al-Rizqi  
**Version**: 1.0.0  
**License**: MIT  
**Last Modified**: 2025-07-04  

---

## 📖 Overview

This utility script automates the review or bootstrapping of backend submissions by:

- Watching for incoming `.zip` files
- Automatically extracting archives
- Detecting backend (`api`) and frontend (`consumer`) folders
- Installing dependencies via `npm install`
- Dropping all PostgreSQL tables safely
- Generating `.env` files with predefined credentials
- Running database migrations
- Launching both API and client in separate CMD terminals
- Opening the project in Visual Studio Code
- Cleaning up by deleting the original zip

---

## 📂 Expected ZIP Structure

The extracted archive should follow this format:

submission.zip \
└── openmusic-submission/ \
├── api/ ← backend folder (matches: api, producer, backend, etc.) \
└── consumer/ ← consumer folder (any name is allowed) 


If the top-level folder only contains one directory, the script will recursively check until it finds exactly two.

---

## ⚙️ Configuration

Update the `PG_CONFIG` object in the script with your local PostgreSQL credentials:

```js
const PG_CONFIG = {
  user: "postgres",
  password: "dev",
  database: "music_db_2",
};
```

The script will automatically generate the following .env content for both folders:

```
HOST=localhost
PORT=5000

PGHOST=localhost
PGUSER=postgres
PGPASSWORD=dev
PGDATABASE=music_db
PGPORT=5432

ACCESS_TOKEN_KEY=8a890b01ccfcfa6038a6eb115ff6cacc9440d5f329cc5245b5450b4b863c59fcdff00a1c28d42329c8a5b0e963637b06cdb52b5fc0c8a62737ae28f618d3a04b
REFRESH_TOKEN_KEY=9e1c01247232a3014a41b614e1b4b8e3e59062adb2bd7a062a79b5f83fa5885699fd9f7ecf0221ca28d7cc547f3f727812917fa7fa022c06557452adff4d180c
ACCESS_TOKEN_AGE=1800

RABBITMQ_SERVER=amqp://localhost
REDIS_SERVER=localhost

AWS_BUCKET_NAME=openmusicappsbucket-reviewer
AWS_ACCESS_KEY_ID=AKIAW5R25KFQZUTXYWK4
AWS_SECRET_ACCESS_KEY=t3ptfuFgP3sDOOyZmVf+U/L8/PWEGAk7/jAE4cbj

SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=your@email.com
SMTP_PASSWORD=xxxx xxxx xxxx xxxx
```

### 🔧 Please make sure to adjust the configuration to match your own environment, especially:

- PGHOST, PGUSER, PGPASSWORD, and PGDATABASE → update these with your actual PostgreSQL connection details.

- If you are using a remote database service like Neon, make sure to replace the PGHOST and credentials accordingly.


---

## 🚀 How to Use

### ✅ Option 1: Double-click RUN.bat

You can run the script by simply double-clicking RUN.bat, which will execute watcher.js using Node.js.

### 🛠️ Option 2: Run Manually

Open CMD or terminal and run:

```
npm run start
```

Then, drag or copy a .zip submission file into the same directory.
The script will take care of the rest.

---

## 💬 Platform Compatibility

> ⚠️ WARNING - Windows Only

This script using:
- PowerShell for ZIP extraction
- cmd with start "" for launching new terminals

---

## 📜 License

This project is licensed under the MIT License. \
You are free to use, modify, and distribute it with attribution.