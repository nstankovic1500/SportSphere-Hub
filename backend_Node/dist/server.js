"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const database_1 = require("./config/database");
const env_1 = require("./config/env");
const startServer = async () => {
    await (0, database_1.connectDatabase)();
    app_1.app.listen(env_1.env.PORT, () => {
        console.log(`Server is running on port ${env_1.env.PORT}`);
    });
};
startServer().catch((error) => {
    console.error('Failed to start server', error);
    process.exit(1);
});
