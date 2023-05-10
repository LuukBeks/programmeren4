const database = require('../util/inmem-db')
const logger = require('../util/utils').logger
const assert = require('assert')
const pool = require('../util/database')

const userController = {
    getAllUsers: (req, res, next) => {
        logger.info('Get all users');

        let sqlStatement = 'SELECT * FROM `user`';

        if (req.query.isactive) {
            sqlStatement += ' WHERE active = ?';
        }

        pool.getConnection(function (err, conn) {
            if (err) {
                logger.error(err.code, err.syscall, err.address, err.port);
                next({
                    code: 500,
                    message: err.code
                });
            }
            if (conn) {
                conn.query(sqlStatement, function(err, results, fields) {
                    if (err) {
                        logger.error(err.message);
                        next({
                            code: 409,
                            message: err.message
                        });
                    }
                    if (results) {
                        logger.info('Found', results.length, 'results');
                        res.status(200).json({
                            statusCode: 200,
                            message: 'User getAll endpoint',
                            data: results
                        });
                    }
                });
                pool.releaseConnection(conn);
            }
        })
    },

    createUser(req, res) {
        logger.info('Register user');

        const user = req.body;
        logger.debug('User:', user);

        try{
            assert(typeof user.firstname === 'string', 'firstname must be a string');
            assert(typeof user.lastname === 'string', 'lastname must be a string');
            assert(typeof user.emailAdress === 'string', 'email must be a string');
            assert(typeof user.password === 'string', 'password must be a string');
            assert(typeof user.phonenumber === 'string', 'phonenumber must be a string');
            assert(typeof user.active === 'boolean', 'active must be a boolean');
        } catch (err) {
            logger.warn(err.message.toString());

            res.status(400).json({
                statusCode: 400,
                message: err.message.toString(),
                data: {}
            });
            return;
        }

        user.id = database.users.length + 1;
        database['users'].push(user);
        logger.info(`New user added to database: ${JSON.stringify(user)}`);

        res.status(200).json({
            statusCode: 200,
            message: `User met id ${user.id} is toegevoegd`,
            data: user
        });
    },
    
    deleteUser: (req, res) => {},
}

module.exports = userController;