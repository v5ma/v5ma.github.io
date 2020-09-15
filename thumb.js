AFRAME.registerComponent('thumb-movement-controls', {
                init: function () {
                    this.el.addEventListener('thumbupstart', () => {
                        VR_LOG('thumbupstart ok');
                    });
                    this.el.addEventListener('thumbupend', () => {
                        VR_LOG('thumbupend ok');
                    });
                    this.el.addEventListener('thumbrightstart', () => {
                        VR_LOG('thumbrightstart ok');
                        document.querySelector('a-scene').emit("rotateright");
                    });
                    this.el.addEventListener('thumbrightend', () => {
                        VR_LOG('thumbrightend ok');
                        document.querySelectorAll('.menu_plane').forEach(function (e) {
                            e.object3D.visible = true;
                       });
                    });
                    this.el.addEventListener('thumbleftstart', () => {
                        VR_LOG('thumbleftstart ok');
                        document.querySelector('a-scene').emit("rotateleft");

                    });
                    this.el.addEventListener('thumbleftend', () => {
                        VR_LOG('thumbleftend ok');
                        document.querySelectorAll('.menu_plane').forEach(function (e) {
                        });
                    });
                    this.el.addEventListener('thumbdownstart', () => {
                        VR_LOG('thumbupstart ok');
                        document.querySelectorAll('.menu_plane').forEach(function (e) {
                            e.object3D.visible = false;

                        });
                    });
                    this.el.addEventListener('thumbdownend', () => {
                        VR_LOG('thumbupend ok');
                    });
                }
            });