/* 
=================================================================
    Author: Eric W

    This programe scraps the IMDb website 
    https://www.imdb.com/showtimes/
    for cinemas and movie show time infomation within a region.

    
==================================================================

    Dependency: 

    equest-promise request cheerio

==================================================================

    To run the program:

    1) Set the parameter
    2) In terminal enter: node loadcinema.js

==================================================================

    Parameters:
    
    COUNTRY: String --one of ["AR","AU","CA","CL","DE","ES","FR","IT","MX","NZ","PT","UK","US"]
    ZIP: String --zipcode
    YEAR: String -- yyyy formatted 
    MONTH: String -- mm formatted 
    DAY: String -- dd formatted
    RADIUS: String -- one of ["5","10","20","30","50"]
    FILE_OUT: String -- output file path

==================================================================

    Output to file:

    JSON with the structure:

    [{"country": "AU",
    "zip": "3003",
    "radius": "10",
    "date": "2019-12-29",
    "cinemaArr": [
        {
        "cinema": "Cinema Nova - Melbourne",
        "movies": [
            {
            "title": "A Boy Called Sailboat (2018)",
            "showtime": [
                "10:35am",
                "12:25pm",
                ]
            }
        },{...}]
    },{...}]

=====================================================================
*/

const cheerio = require('cheerio');
const rp = require('request-promise');
var fs = require('fs');

const COUNTRY = "AU"
const ZIP = "3003"
const YEAR = "2019"
const MONTH = "12"
const DAY = "29"
const RADIUS = "10"
const FILE_OUT = "cinemaData.json"
const URL = `https://www.imdb.com/showtimes/${COUNTRY}/${ZIP}/${YEAR}-${MONTH}-${DAY}?ref_=sh_dt`

const cinemaData = new Object()

cinemaData.country = COUNTRY
cinemaData.zip = ZIP
cinemaData.radius = RADIUS
cinemaData.date = YEAR+"-"+MONTH+"-"+DAY
cinemaData.cinemaArr = []

var options = {
    uri: URL ,
    resolveWithFullResponse: true
}

// request the HTML page
rp(options).then(function(res){
    
    const $ = cheerio.load(res.body)

    const regex = new RegExp(`Within ${RADIUS} km `, "g") 

    // search for the HTML element containing all the data
    $("#cinemas-at-list").children().each(function(){
                
        // check the HTML element that saids the distance of the cinema
        // and terminate parsing the html according to radius specified
        if($(this).attr("class") === "li_group"){

            if(regex.test($(this).text().trim())){
                return false
            }
        }
        else{
            
            var cinema = new Object()

            
            // get the cinema name
            cinema.cinema = $(this).find(".fav_box")
                                    .text()
                                    .trim()

            // get the movie titles and showing times of the cinema
            cinema.movies = []

            $(this).find('.list_item').each(function(){

                var movie = new Object()

                movie.title = $(this).find('span[itemprop="name"]')
                                        .text()
                                        .trim()

                movie.showtime = $(this).find(".showtimes")
                                        .text()
                                        .replace(/\s/g,"")
                                        .split("|")
                                        
                // adding a time suffix for every showtime
                var timeSuffix = "am"
                for (var i=0; i<movie.showtime.length; i++){

                    movie.showtime[i] = movie.showtime[i].trim()
                    var suffix = movie.showtime[i].slice(-2)

                    if( suffix === "pm" ){
                        timeSuffix = "pm"
                    }
                    else if( suffix === "am" ){
                        timeSuffix = "am"
                    }
                    else{
                        movie.showtime[i] = movie.showtime[i] + timeSuffix
                    }
                }
                cinema.movies.push(movie)
            })
            
            // get the address and number
            var address = $(this).find(".address")
                                    .children()
                                    .text()
                                    .split("|")
            
            cinema.address = address[0].replace(/\n\s+/g," ").trim()
            cinema.telephone = address[1]==null ? null : address[1].trim()
            
            // put everythin in the json object
            cinemaData.cinemaArr.push(cinema)
            
        }
    })
    
    //write to file
    const cinemaDataJSON = JSON.stringify(cinemaData, null, 2)
    fs.writeFile(FILE_OUT, cinemaDataJSON, 'utf8', () => {console.log("done")});
    
}).catch(function(err){

    if (err.statusCode == "404"){
        console.log(`failed to get page with status code: ${err.statusCode}`)
    }
    else{
        console.log(err)
    }
    
})


