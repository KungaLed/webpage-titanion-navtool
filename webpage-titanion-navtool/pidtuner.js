$(document).ready(function(){
    const inputlabelP = document.getElementById('inputlabelP');
    const inputlabelI = document.getElementById('inputlabelI');
    const inputlabelD = document.getElementById('inputlabelD');

    const inputsliderP = document.getElementById('inputsliderP');
    const inputsliderI = document.getElementById('inputsliderI');
    const inputsliderD = document.getElementById('inputsliderD');


    // TODO test this section
    // Updates the label value and the value in the datablock of the plc
    function updateP() {
        inputlabelP.innerHTML = inputsliderP.value;
        $.post("/p", 
        {
            "P" : inputsliderP.value
        },)
    }
    function updateI() {
        inputlabelI.innerHTML = inputsliderI.value;
        $.post("/i",
        {
            "I" : inputsliderI.value
        })
    }
    function updateD() {

        inputlabelD.innerHTML = inputsliderD.value;
        $.post("/d",
        {
            "D" : inputsliderD.value
        })
    }

    // Functions to support scrolling functionality
    function slideP(event) {
        event.preventDefault();
        if (event.deltaY < 0) inputsliderP.value++;
        else if (event.deltaY > 0) inputsliderP.value--;
        updateP();
        return false;
    }
    function slideI(event) {
        event.preventDefault();
        if (event.deltaY < 0) inputsliderI.value++;
        else if (event.deltaY > 0) inputsliderI.value--;
        updateI();
        return false;
    }
    function slideD(event) {
        event.preventDefault();
        if (event.deltaY < 0) inputsliderD.value++;
        else if (event.deltaY > 0) inputsliderD.value--;
        updateD();
        return false;
    }


    // Add slide functionality
    inputsliderP.oninput = updateP;
    inputsliderI.oninput = updateI;
    inputsliderD.oninput = updateD;

    // Add scroll functionality
    inputsliderP.onwheel = slideP;
    inputsliderI.onwheel = slideI;
    inputsliderD.onwheel = slideD;

    // Set initial values
    inputlabelP.innerHTML = inputsliderP.value;
    inputlabelI.innerHTML = inputsliderI.value;
    inputlabelD.innerHTML = inputsliderD.value;

    updateP();
    updateI();
    updateD();
});