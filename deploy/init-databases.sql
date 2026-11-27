-- Runs once, the first time the Postgres volume is initialised.
-- Each microservice keeps its own database, mirroring prisma/<service>/.
CREATE DATABASE ecommerce_auth;
CREATE DATABASE ecommerce_users;
CREATE DATABASE ecommerce_products;
CREATE DATABASE ecommerce_inventory;
CREATE DATABASE ecommerce_promocodes;
CREATE DATABASE ecommerce_orders;
