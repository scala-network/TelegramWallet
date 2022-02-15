/**
 * This is the main wrapper for sqlite as db
 * @module engine/sqlite
 */

 class SqliteExtension {
    
    db;
    
     constructor(dbfullpath) {
        this.db = new Sqlite(dbfullpath, { verbose: console.log });
     }

    run (sql, values){
        const db = this.db;
        return Promise.resolve(db.prepare(sql).run(values ? values : []));
    }

    get (sql, values){
        const db = this.db;
        return Promise.resolve(db.prepare(sql).get(values ? values : []));
    }

    all(sql, values) {
        const db = this.db;
        return Promise.resolve(db.prepare(sql).all(values ? values : []));
    }
}

if(!global.sqlite) {

    const Sqlite = require('better-sqlite3');
    const path = require('path');

    let dbfullpath = process.env.SQLITE_FILE;

    if(!dbfullpath) 
    {
        let dbpath = global.config.datasource.path;

        if(!dbpath) {
            dbpath = path.join(process.cwd() + 'db');
        } 
        let dbfilename = global.config.datasource.filename;

        if(!dbfilename) {
            dbfilename = global.config.coin + '.sqlite';
        }

        // open the database

        dbfullpath = path.join(dbpath,dbfilename);
    }

    global.sqlite = new SqliteExtension(dbfullpath);

}


module.exports = global.sqlite;