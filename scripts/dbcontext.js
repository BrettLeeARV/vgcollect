class DbContext {

    constructor(databaseName, version) {   
        this._databaseName = databaseName;
        this._version = version;
        this._activeConnection = null;
    }

    get ActiveConnection() {
        if (this._activeConnection === null)
            this._activeConnection = this._schemaBuilder.connect();
        return this._activeConnection;
    }

    #InitSchema() {
        this._schemaBuilder = lf.schema.create(this._databaseName, this._version);
    }

    #InitTable(tableName, dataObject) {
        //These are system fields that are  applied to every table instance
        const tableInstance = this._schemaBuilder.createTable(tableName).
                            addColumn('Id', lf.Type.INTEGER).
                            addColumn('Created', lf.Type.DATE_TIME).
                            addPrimaryKey(['Id'], true);

        const keys = Object.keys(dataObject);
        keys.forEach((i) => {
            if (i !== 'Id' && i !== 'Created')
            {
                if (i === 'Value')
                    tableInstance.addColumn(i, lf.Type.NUMBER);
                else
                    tableInstance.addColumn(i, lf.Type.STRING);
            }
        });
    }

    /**
     * Translates CGI params into human readable error messages, if applicable.
     * For example, ?c=107&p0=1&p1=3 will maps to error code 107, and two extra
     * parameters 1 and 3 will be used to generate the final message.
     * @param {!Object} data Error messages indexed by error code.
     * @return {?string}
     */
    #getMessage(data, errorPageURI) {
        var url = document.createElement('a');
        url.href = errorPageURI;
        var params = url.search.slice(1).split('&');
        var input = {};
    
        params.forEach(function(raw) {
            var tokens = raw.split('=');
            if (tokens.length == 2) {
                input[tokens[0]] = tokens[1];
            }
        });
    
        if (input.hasOwnProperty('c') && data.hasOwnProperty(input['c'])) {
            var category;
            var code;
            try {
                code = parseInt(input['c'], 10);
                category = data[(Math.floor(code / 100) * 100).toString()];
            } catch (e) {
                return null;
            }
        
            var message = data[code.toString()];
            if (category && message &&
                typeof(category) == 'string' && typeof(message) == 'string') {
                message = category + ': (' + code.toString() + ') ' + message;
                return message.replace(/{([^}]+)}/g, function(match, pattern) {
                return decodeURIComponent(input['p' + pattern] || '');
                });
            }
        }
        return null;
    }  
  
    /**
     * @param {!Object} data
     * @return {string}
     */
    #formatJson(data) {
        var results = ['<pre>'];
        for (key in data) {
            results.push(key + ': ' + data[key]);
        }
        results.push('</pre>');
        return results.join('\n');
    }

    async #getJsonData() {
        const errCodes = await fetch('scripts/error_code.json');
        return errCodes.json();
    }
  
    async GetErrorMessage(errorPageURI) {
        const errCodes = await this.#getJsonData();
        var message = this.#getMessage(errCodes, errorPageURI);
        
        if (message && message.length)
            return message;
        else
            return this.#formatJson(errCodes);
    }

    async Insert(tableName, dataObject) {
        this.#InitSchema();
        this.#InitTable(tableName, dataObject);
        return this.ActiveConnection.then((db) => {
            const table = db.getSchema().table(tableName);
            const row = table.createRow(dataObject);
            return db.insert().
                    into(table).
                    values([row]).exec();
        })
        .then(() => {return Promise.resolve(1)})
        .catch(async (e) => {
            const err = await this.GetErrorMessage(e.message);
            return Promise.reject(err);
        });
    }

    Update(tableName, dataObject) {
        this.#InitSchema();
        this.#InitTable(tableName, dataObject);
        return this.ActiveConnection.then((db) => {
            const table = db.getSchema().table(tableName);
            const update = db.update(table);
            Object.keys(dataObject).map((key) => {
                update.set(table[key], dataObject[key]);
            });
            update.where(table.Id.eq(dataObject.Id));
            return update.exec();
        }).then(() => {return Promise.resolve(1)});
    }

    DeleteById(tableName, dataObject, id) {
        this.#InitSchema();
        this.#InitTable(tableName, dataObject);
        return this.ActiveConnection.then((db) => {
            const table = db.getSchema().table(tableName);
            return db.delete().
                    from(table).
                    where(table.Id.eq(id)).exec();
        }).then(() => {return Promise.resolve(1)});
    }

    SelectById(tableName, dataObject, id) {
        this.#InitSchema();
        this.#InitTable(tableName, dataObject);
        return this.ActiveConnection.then((db) => {
            const table = db.getSchema().table(tableName);            
            return db.select().
                from(table).
                where(table.Id.eq(id)).exec();
        }).then((rows) => {return rows});
    }

    SelectAll(tableName, dataObject) {
        this.#InitSchema();
        this.#InitTable(tableName, dataObject);
        return this.ActiveConnection.then((db) => {
            const table = db.getSchema().table(tableName);            
            return db.select().
                from(table).
                exec();
        }).then((rows) => {return Promise.resolve(rows)});
    }

    // SelectByFilter(tableName, dataObject, regEx) {
    //     this.#InitSchema();
    //     this.#InitTable(tableName, dataObject);
    //     return this.ActiveConnection.then((db) => {
    //         const table = db.getSchema().table(tableName);            
    //         return db.select().
    //             from(table).
    //             where(table.Name.match(regEx)).
    //             exec();
    //     }).then((rows) => {return Promise.resolve(rows)});
    // }

    SelectByFilter(tableName, dataObject, filterColumnName, filterColumnValueExp, filterOperator) {
        this.#InitSchema();
        this.#InitTable(tableName, dataObject);
        return this.ActiveConnection.then((db) => {
            const table = db.getSchema().table(tableName);
            const queryBuilder =  db.select().from(table);

            if (filterOperator !== undefined && filterOperator.trim().toLowerCase() === 'eq') {
                queryBuilder.where(table[filterColumnName].eq(filterColumnValueExp));
            }
            else {
                queryBuilder.where(table[filterColumnName].match(new RegExp(filterColumnValueExp, 'i')));
            }

            return queryBuilder.exec();            
        }).then((rows) => {return Promise.resolve(rows)});
    }

    static StaticMethod() {
        return 'A static method!';
    }    
}