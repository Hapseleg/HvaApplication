//loads the google charts functions
google.charts.load('current', {'packages':['corechart']});
//on startup it calls getWeightData
google.charts.setOnLoadCallback(getWeightData); 

//gets a country by latitude and longitude and calls an API, I am unsure if its a good idea to show my username for the API since
//this could be abused, maybe I should have done it serverside instead?
//adds the country in the div with the id country
function getCountry(lat, lon){
     //get country by laitiude and longitude
        //example: {"languages":"de","distance":"0","countryCode":"DE","countryName":"Germany"}
        var requestURL = 'http://api.geonames.org/countryCodeJSON?lat='+lat+'&lng='+lon+'&username=jorgenn';
        //http://api.geonames.org/countryCodeJSON?formatted=true&lat=47.03&lng=10.2&username=demo
        var request = new XMLHttpRequest();
        request.open('GET', requestURL);
        request.responseType = 'json';
        

        request.onload = function() {
            //console.log(request.response.countryName);
            var countryName = request.response.countryName;
            document.getElementById('country').innerHTML = "Clicked country: "+ countryName;
          }
        request.send();

}

//creates an empty graph (this is not used anymore, I used it at the beginning before)
function createEmptyGraph(){
    var data = new google.visualization.DataTable();
    data.addColumn('date', 'X');
    data.addColumn('number', 'Weight');    
    data.addColumn({type: 'string', role: 'tooltip'});
    drawLineGraph(data);
}

//draws the graph by using google charts
function drawLineGraph(data) {   
    var chart = new google.visualization.LineChart(document.getElementById('chart_div'));
    google.visualization.events.addListener(chart, 'select', selectHandler);

    var options = {
        hAxis: {
          title: 'Time'
        },
        vAxis: {
          title: 'Weight'
        },
        backgroundColor: '#FFFFF',
    };

    function selectHandler() {
        var selection = chart.getSelection();

        if(selection[0] != undefined){
            var row = selection[0].row;
            var column = selection[0].column;

            var lat = data.og[row].c[2].v;
            var lon = data.og[row].c[3].v;

            getCountry(lat,lon);
        }
    }

    var view = new google.visualization.DataView(data);
    // exclude column 5 (Id)
    view.setColumns([0, 1]);

    chart.draw(view, options);
  }

  //AJAX function to get the weight data for the graph 
function getWeightData() {
    let timestampPast = new Date(document.getElementById("timestampPast").value).getTime();
    let timestampFuture = new Date(document.getElementById("timestampFuture").value).getTime();
    //check if past is greater than future, alert an error if it is
    if(timestampPast > timestampFuture){
        alert('The "from" value should be smaller than the "to" value')
    }
    else{
        $.ajax({
            //url: '/getWeight/' + timestampPast + '/' + timestampFuture,
            url: '/getWeight/',
            type: 'GET',
            success: function(result) {
                //console.log("Success in AJAX")
                //if the ajax call is a success, remove the data which is outside the selected range and then call addData
                for(var i in result){
                    if(result[i].timestamp <= timestampPast || result[i].timestamp >= timestampFuture){
                        delete result[i];
                    }
                }    
                addData(result);
            },
            error: function(xhr){
                console.log(xhr.status);
            }
        });
    }	
}

//add data to a datatable and call the drawLineGraph function
function addData(jsonData){
    var data = new google.visualization.DataTable();
    data.addColumn('date', 'X');
    data.addColumn('number', 'Weight');
    data.addColumn('number', 'latitude');
    data.addColumn('number', 'longitude');

    for(i in jsonData){
        var timestamp = Number(jsonData[i].timestamp);
        var weight = Number(jsonData[i].weight);
        var latitude = Number(jsonData[i].latitude);
        var longitude = Number(jsonData[i].longitude);
       

        data.addRow([
            new Date(timestamp), 
            weight,
            latitude,
            longitude
        ]);
    }
    drawLineGraph(data);
}