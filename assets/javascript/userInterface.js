var userInterface = {};
userInterface.elements = {};
userInterface.variables = {
    scrollSpeed : 1,
    scrollX : 0,
    scrollY : 0
};


userInterface.initialise = function() {
    userInterface.elements.canvas = document.getElementById("canvas");
    userInterface.elements.canvas.context = canvas.getContext("2d");
    
    userInterface.elements.canvas.addEventListener('mousemove',userInterface.canvasMoveMouseListener);
    
    userInterface.scrollLoop();

    userInterface.elements.canvas.xOffset = 0;
    userInterface.elements.canvas.yOffset = 0;
    window.onresize();
};

window.onresize = function() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
};

userInterface.canvasMoveMouseListener = function(event) {
    screenX = event.x;
    screenY = event.y;
    
    if(screenX < 100) {
        userInterface.variables.scrollX = 1;
    } else if (screenX > canvas.width - 100) {
        userInterface.variables.scrollX = -1;
    } else {
        userInterface.variables.scrollX = 0;
    }
    
    if (screenY < 100) {
        userInterface.variables.scrollY = 1;
    } else if (screenY > canvas.height - 100) {
        userInterface.variables.scrollY = -1;
    } else {
        userInterface.variables.scrollY = 0;
    }
};

userInterface.scrollLoop = function() {
    requestAnimationFrame(userInterface.scrollLoop);
    
    if (!userInterface.variables.scrollX && !userInterface.variables.scrollY) {
        return;    
    }
    
    userInterface.elements.canvas.xOffset += (userInterface.variables.scrollSpeed * userInterface.variables.scrollX);
    userInterface.elements.canvas.yOffset += (userInterface.variables.scrollSpeed * userInterface.variables.scrollY);
    
};