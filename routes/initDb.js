const express = require("express");
const router = express.Router();
const db = require("../config/db");

router.get("/init-db", async (req, res) => {
  try {
    const tablesSQL = `
CREATE TABLE barbers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    name_ar VARCHAR(255) NOT NULL,
    experience VARCHAR(255),
    experience_ar VARCHAR(255),
    description TEXT,
    description_ar TEXT,
    specialty VARCHAR(255),
    specialty_ar VARCHAR(255),
    image_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE services (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    name_ar VARCHAR(255) NOT NULL,
    description TEXT,
    description_ar TEXT,
    price NUMERIC(10,2) NOT NULL,
    image_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    name_ar VARCHAR(255) NOT NULL,
    description TEXT,
    description_ar TEXT,
    price NUMERIC(10,2) NOT NULL,
    image_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE appointments (
    id SERIAL PRIMARY KEY,
    client_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(50) NOT NULL,
    barber_name VARCHAR(255) NOT NULL,
    appointment_date DATE NOT NULL,
    appointment_time VARCHAR(50) NOT NULL,
    services JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE blocked_slots (
    id SERIAL PRIMARY KEY,
    barber_name VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    times JSONB,
    is_all_day BOOLEAN DEFAULT FALSE,
    reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ads (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    title_ar VARCHAR(255) NOT NULL,
    description TEXT,
    description_ar TEXT,
    price NUMERIC(10,2),
    deadline DATE,
    image_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE business_ads (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    title_ar VARCHAR(255) NOT NULL,
    description TEXT,
    description_ar TEXT,
    redirect_url VARCHAR(500),
    images JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE appointments_analyze (
    id SERIAL PRIMARY KEY,
    client_name VARCHAR(255) NOT NULL,
    barber_name VARCHAR(255) NOT NULL,
    appointment_date DATE NOT NULL,
    appointment_time VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

    // Split into individual statements
    const statements = tablesSQL.split(";").filter(s => s.trim() !== "");

    for (const stmt of statements) {
      await db.query(stmt);
    }

    res.send("All PostgreSQL tables created successfully! 🎉");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error: " + err.message);
  }
});

module.exports = router;
