class RestoreForm {    
    constructor(dbContext){
        this._dbContext = dbContext;
    }

    #processDataInsertion(jsonData) {
        return new Promise((resolve, reject) => {
            let errorMessage = null;
            jsonData.forEach(async (row, index, array) => {                    
                row.Created = new Date(row.Created);
                await this._dbContext.Insert('Collections', row)
                .catch((e) => {                
                    errorMessage = e;                    
                });
                if (index === array.length - 1) {
                    if (errorMessage === null)
                        resolve(jsonData.length);
                    else
                        reject(errorMessage);
                }
            });
        });
    }

    get btnFileBrowse() {
        return this._btnFileBrowse;
    }

    set btnFileBrowse(target) {
        this._btnFileBrowse = target;
        this._btnFileBrowse.addEventListener('change', (event) => {            
            if (event.target.files.length === 1 && 
                event.target.files[0].type === 'application/json') {
                this._fileList = event.target.files;                ;
                this._onValidateDataFileSuccess(this._fileList[0]);
            }
            else                
                this._onValidateDataFileFailure();
        });
    }

    get btnRestore() {
        return this._btnRestore;
    }

    OnRestoreFailure(d) {
        this._onRestoreFailure = d;
    }

    OnRestoreSuccess(d) {
        this._onRestoreSuccess = d;
    }

    OnValidateDataFileSuccess(d) {
        this._onValidateDataFileSuccess = d;
    }

    OnValidateDataFileFailure(d) {
        this._onValidateDataFileFailure = d;
    }

    set btnRestore(target) {
        this._btnRestore = target;
        this._btnRestore.addEventListener('click', (e) => {

            this._btnRestore.disabled = true;

            const reader = new FileReader();            
            reader.readAsText(this._fileList[0]);
    
            reader.addEventListener('load', (event) => {
                const jsonData = JSON.parse(event.target.result);
                this.#processDataInsertion(jsonData)
                .then((r) => {                    
                    this._onRestoreSuccess(r);
                })
                .catch((e) => {
                    this._onRestoreFailure(e);
                })
                .finally(() => {
                    this._btnRestore.disabled = false;
                });
            });            
        });        
    }   
}