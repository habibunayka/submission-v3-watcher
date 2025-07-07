# ⚙️ Auto Project Extractor & Configuration Runner For OpenMusic V3

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

Update the `CONFIG` object in the script with your environment:

```js
const CONFIG = {
    db: {
        host: "localhost",
        user: "postgres",
        password: "dev",
        database: "music_db",
        port: 5432,
    },
    smtp: {
        host: "smtp.gmail.com",
        port: 465,
        user: "your@email.com",
        password: "xxxx xxxx xxxx xxxx",
    },
    redis: {
        host: "localhost",
    },
    rabbitmq: {
        server: "amqp://localhost",
    },
    aws: {
        bucket: "xxxx",
        accessKeyId: "xxxx",
        secretAccessKey: "xxxx",
    },
    token: {
        accessKey:
            "xxxx",
        refreshKey:
            "xxxx",
        age: 1800,
    },
    app: {
        host: "localhost",
        port: 5000,
    },
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

ACCESS_TOKEN_KEY=xxxx
REFRESH_TOKEN_KEY=xxxx
ACCESS_TOKEN_AGE=1800

RABBITMQ_SERVER=amqp://localhost
REDIS_SERVER=localhost

AWS_BUCKET_NAME=xxxx
AWS_ACCESS_KEY_ID=xxxx
AWS_SECRET_ACCESS_KEY=xxxx

SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=your@email.com
SMTP_PASSWORD=xxxx xxxx xxxx xxxx
```

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

## 📜 License

This project is licensed under the MIT License. \
You are free to use, modify, and distribute it with attribution.
