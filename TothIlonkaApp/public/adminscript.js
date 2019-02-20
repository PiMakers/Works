/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

showStatus = function(text, isAlert, isOn) {
    var color = (isAlert) ? 'red' : (isOn) ? '#68e6c0' : 'grey';
    $("#statusTextArea").val('Admin konzol\n----------------\n' + text);
    $("#statusTextArea").css({'background': color});
    $('#startButton').attr("disabled", isOn);
    $('#stopButton').attr("disabled", !isOn);
};

startStop = function(command) {
    $.ajax({
        url: '/control',
        data: {'command': command},
        beforeSend: function(xhr) {
            startTime = new Date().getTime();
        },
        success: function(result, status) { // Sikeres letöltés esetén.
            showStatus(result.statusMessage, false, (result.currently + result.mode) !== 0);
        },
        error: function(jqXHR, textStatus, errorThrown) {
            showStatus('Nincs kapcsolat a szerverrel\n\n', true);
        },
        complete: function() {

        }
    });

};

setInterval(startStop, 1000);