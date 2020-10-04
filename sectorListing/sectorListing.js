function sortJSON(dataa, key, way) {
    return dataa.sort(function(a, b) {
        var x = a[key]; var y = b[key];
        if (way === '123' ) { return ((x < y) ? -1 : ((x > y) ? 1 : 0)); }
        if (way === '321') { return ((x > y) ? -1 : ((x < y) ? 1 : 0)); }
    });
}


function changeAlert(key){

  if (Notification.permission !== "granted") Notification.requestPermission();


  if ($("#alert-"+key.replace(/\s+/g, '')).prop('checked')) {
    alertServers[key.replace(/\s+/g, '')]="checked";
  } else {
    alertServers[key.replace(/\s+/g, '')]="unchecked";
  }
}
var freshServerNotification;
var alertServers={};

var icons={
  "survival":"accessibility",
  "team":"people",
  "deathmatch":"whatshot",
  "invasion":"blur_off"
}

function refreshZones(){


  var Zones = {}


  // $.getJSON('test.json', function(data) {
  $.getJSON('https://starblast.io/simstatus.json', function(data) {
      $.each(data, function(index) {

          var location = data[index].location

          var systems = data[index].systems

          $.each(systems, function(index2) {
              var system = systems[index2]
              var systemName = system.name
              var time = system.time
              var id = system.id
              var players = system.players
              var open = system.open
                // team or survival mode
              var mode = system.mode
              var mod_id = system.mod_id
              var criminality = system.criminal_activity;

              var criminalState;
              if(criminality<4){
                criminalState="greenCriminalState";
              } else if(criminality<7){
                criminalState="yellowCriminalState";
              } else {
                criminalState="redCriminalState";
              }

              try{
              Zones[location].push({"name":systemName,"time":time,"players":players,"id":id,"open":open,"mode":mode,"mod_id":mod_id,criminality":criminality,"criminalState":criminalState});
              }
              catch(e){
                  Zones[location]=[];
                  Zones[location].push({"name":systemName,"time":time,"players":players,"id":id,"open":open,"mode":mode,"mod_id":mod_id,criminality":criminality,"criminalState":criminalState});
              }
          });

      });

      $("#zoneWrapper").html("");

      var ZonesTemp = Zones;
      Zones={};

      Object.keys(ZonesTemp).sort().forEach(function(key) {
        Zones[key] = ZonesTemp[key];
      });

      for (var key in Zones){
          var zoneString="<div class='zoneCard invBlueBox'><h2 class='zoneName'>"+key+"</h2>";
          zoneString+=`
            <div class='alertWrapper'>

              <input class="alertCheckBox" type="checkbox" ${alertServers[key.replace(/\s+/g, '')]} id="alert-${key.replace(/\s+/g, '')}" onClick="changeAlert('${key.replace(/\s+/g, '')}')">
              <label  for="alert-${key.replace(/\s+/g, '')}" class="checkboxWrapper blueBox">
                <span>New sector alert
                <span class="material-icons checked">done</span>
                <span class="material-icons unchecked">close</span>
                </span>
              </label>
            </div>
          `;
          sortJSON(Zones[key], "time", "123")
          $.each(Zones[key], function(index) {

              var sys = Zones[key][index];

              var mode = sys.mode;
              //if this sector is team, and team is not checked, skip
              //if this sector is survival, and survival is not checked, skip

              if(mode=="team" && !$("#enableTeam").is(':checked')){
                return;
              }
              if(mode=="survival" && !$("#enableSurvival").is(':checked')){
                return;
              }
              if(mode=="deathmatch" && !$("#enableDeathmatch").is(':checked')){
                return;
              }
              if(mode=="invasion" && !$("#enableInvasion").is(':checked')){
                return;
              }
              if(mode=="modding" && !$("#enableModding").is(':checked')){
                return;
              }

              var newServer = "";
              minutes = Math.floor(sys.time / 60);
              if (minutes<15) {
                newServer = "newServer";
              }

              if (minutes==0){
                if (alertServers[key.replace(/\s+/g, '')]=="checked"){
                  // alert("Fresh server for "+key+"!");
                  var options = {
                    body: 'Fresh server detected.',
                    icon: "/universal/loveship.png",
                    // boop tag makes the notification overwrite old 'boop' notifications, instead of making new ones
                    tag: 'boop'
                  }
                  freshServerNotification = new Notification("Fresh server for "+key+"!",options);
                  setTimeout(freshServerNotification.close.bind(freshServerNotification), 4000);
                  var audioAlert = new Audio('/alert.mp3');
                  audioAlert.play();
                  alertServers[key.replace(/\s+/g, '')]="unchecked";
                }
              }

              seconds = sys.time % 60;



              if (sys.open){
                  var link = "https://starblast.io/#"+sys.id
                  var linkname = "<a class='"+newServer+"' href='"+link+"''>"+sys.name+"</a>"
                  var systemClass=newServer;
              } else {
                  var link = "https://starblast.io/#" + sys.id
                  var linkname = "<span class='survivalServer'>(S) "+sys.name+"</span>"
                  var systemClass = "survivalServer";
              }
              secondsString = ('00' + seconds).slice(-2);
              zoneString+=`

                <a class='system ${systemClass}' href='${link}' title='${link}'>`;
              if (sys.mode != "modding") zoneString+=`<i class="material-icons ${sys.mode}Icon modeIcon">${icons[sys.mode]}</i>`;
              else zoneString+=`<img src="https://starblast.data.neuronality.com/modding/img/${sys.mod_id}.jpg">`;
              zoneString+=`<span class='systemName'>${sys.name}</span>
                  <span class='minutes ${newServer}'>${minutes}:${secondsString}</span>
                  <div class="tooltip">
                    <i class="material-icons">face</i>
                    <span class='playerCount'>${sys.players} </span>
                    <span class="tooltiptext">Pilots in system</span>
                  </div>
                  <div class="tooltip">
                    <i class="material-icons criminalityIcon ${sys.criminalState}">warning</i>
                    <span class='criminality tooltip ${sys.criminalState}'>${sys.criminality}</span>
                    <span class="tooltiptext">Criminality: big ships killing small ships</span>
                  </div>

                </a>

              `;
          });
          // close the zoneCard
          zoneString+='</div>';
          $("#zoneWrapper").append(zoneString);
      }


  });



}

//Updates time inbetween server sourced updates
function updateTimes() {
    $('.minutes').each(function (idx) {
        var t = $(this).text().split(':');
        var time = parseInt(t[0]) * 60 + parseInt(t[1]);
        //Is not measured, may fall slightly out of sync
        time += 1;
        var min = ~~(time / 60);
        var sec = (time % 60);
        var secondsString = ('00' + sec).slice(-2);
        $(this).text(`${min}:${secondsString}`);
    });
}
//Runs time update loop
var timesIntervalId = setInterval(function () { updateTimes() }, 1 * 1000);

var intervalID = setInterval(function(){refreshZones()}, 10000);
setTimeout(refreshZones,1000);
