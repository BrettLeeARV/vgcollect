class Camera {
    constructor() {        
        Element.prototype.show = function() {
            this.classList.remove('d-none');
        }
        Element.prototype.hide = function() {
            this.classList.add('d-none');
        }
    }

    set LoadingElement(target) {
        this._loadingElement = target;
    }

    set CanvasElement(target) {
        this._canvasElement = target;
    }

    set WebcamElement(target) {
        this._webcamElement = target;
        this._webcamElement.addEventListener('click', (e) => {
            e.preventDefault();
            this.FlipWebcam();  
        })
    }

    set SnapSoundElement(target) {
        this._snapSoundElement = target
    }

    set CameraOkElement(target) {
        this._cameraOkElement = target;
    }

    set CameraCancelElement(target) {
        this._cameraCancelElement = target;
    }

    set CameraSnapElement(target) {
        this._cameraSnapElement = target;
        this._cameraSnapElement.addEventListener('click', (e) => {
            e.preventDefault();
            this._lastCapture = this._webcam.snap();
            this._webcam.stop();
            
            this._webcamElement.hide();
            this._canvasElement.show();            
            this.#showOkCancel();
        }); 
    }    

    get LastCapture() {
        return this._lastCapture;
    }

    #hideOkCancel() {
        this._cameraSnapElement.show();
        this._cameraOkElement.hide();
        this._cameraCancelElement.hide();
    }

    #showOkCancel() {
        this._cameraSnapElement.hide();
        this._cameraOkElement.show();
        this._cameraCancelElement.show();
    }

    FlipWebcam() {
        // Default to rear camera if on mobile device
        if (this._webcam.webcamList.length > 1) {
            this._webcam.flip();
            this._webcam.start();
            // This naughty sequence fips the video panel to 180, animate and revert back to original
            // Mimicks a 'flip to front/rear' in camera apps
            // Update: To use 'animationend' event listener
            this._webcamElement.classList.add('animate-rotate');
            this._webcamElement.classList.add('rotateY-180');
            this._webcamElement.classList.add('fade-out');
            setTimeout(() => {
                this._webcamElement.classList.remove('animate-rotate');
                this._webcamElement.classList.remove('rotateY-180');
                this._webcamElement.classList.add('rotateY-0');
                this._webcamElement.classList.remove('fade-out');
            }, 500);
        }
    }

    Init() {
        this._webcam = new Webcam(this._webcamElement, 'environment', this._canvasElement, this._snapSoundElement);
        this._webcamElement.style.width = '100%';        
        this._webcamElement.style.height = 'auto';
    }

    Start() {
        this._loadingElement.show();
        this._webcam.start()
        .then(result =>{
            console.log("webcam started");
            this._loadingElement.hide();
            this._webcamElement.show();
            this._canvasElement.hide();
            this.#hideOkCancel();
        })
        .catch(err => {
            console.error(err);
        });
    }

    Stop() {
        if (this._webcam !== undefined && this._webcam !== null)
            this._webcam.stop();
    }
}