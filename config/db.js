const Sequelize = require('sequelize');

module.exports = new Sequelize('meeti', 'postgres', 'admin', {
    host: '127.0.0.1',
    port: '5432',
    dialect: 'postgres',
    pool: {
        max:5,
        min:0,
        acquire: 30000,
        idle: 10000
    },
    // define: {
    //     timestamps: false
    // }, Para quitar las tablas de cuando se creo en mi bdd postgres

    logging: false //para que no salga inf coneccion en la consola
});