// ==UserScript==
// @name         irForum stats
// @namespace    http://tampermonkey.net/
// @version      0.9
// @description  Provide drivers information in the forum
// @author       eXenZa
// @match        https://forums.iracing.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=iracing.com
// @grant        none
// @downloadURL  https://raw.githubusercontent.com/exenza/irforumstats/main/irforumstats.js
// @updateURL    https://raw.githubusercontent.com/exenza/irforumstats/main/irforumstats.js
// ==/UserScript==

(function() {
    'use strict';
    function diff_years(date) { // birthday is a date
        var ageDifMs = Date.now() - date;
        var ageDate = new Date(ageDifMs); // miliseconds from epoch
        return Math.abs(ageDate.getUTCFullYear() - 1970);
    }


    var usernames = document.getElementsByClassName("Username")
    var author_info = document.getElementsByClassName("Author")
    var names = []
    for (const name of usernames){
        names.push(name.firstChild.data);
    }

    for (const author of author_info){
        var irstats="<br>Loading stats...<br><br>"
        var current_driver=author.getElementsByTagName('a')[0].innerText.replace("Loading\n\n", "")
        author.insertAdjacentHTML('beforeend',"<div class='loadingstats' style='color:"+setcolor()+";font-weight:bold;'>"+irstats+"</div>")
    }

    names = [...new Set(names)];
    function setcolor(){
        if(document.getElementsByTagName('html')[0].outerHTML.split('data-iracing-forums-user-color-scheme="dark"').length>1){
            return "lightgrey"
        } else {
            return "black"
        }
    }

    function getlicense(driver){
        var license = ""
        var licenses = []
        for(let i = 0; i<driver.member_info.licenses.length; i++){
            var license_class=driver.member_info.licenses[i].group_name.replace('Class ', '')
            license_class=license_class.replace('Rookie', 'R')
            var license_sr=driver.member_info.licenses[i].safety_rating
            var license_ir=" "+driver.member_info.licenses[i].irating

            var license_category=driver.member_info.licenses[i].category_name
            var license_weight
            var license_color
            var license_text_color
            switch(license_class){
                case "R":
                    license_weight=0
                    license_color="red"
                    license_text_color="lightgrey"
                    break;
                case "D":
                    license_weight=1000+Number(license_ir)
                    license_color="orange"
                    license_text_color="lightgrey"
                    break;
                case "C":
                    license_weight=1500+Number(license_ir)
                    license_color="yellow"
                    license_text_color="darkgrey"
                    break;
                case "B":
                    license_weight=2000+Number(license_ir)
                    license_color="green"
                    license_text_color="lightgrey"
                    break;
                case "A":
                    license_weight=2500+Number(license_ir)
                    license_color="blue"
                    license_text_color="lightgrey"
                    break;
                default:
                    license_weight=5000000+Number(license_ir)

            }


            licenses.push({"license_weight":license_weight, "license_category":license_category, "license_class":license_class, "license_sr":license_sr, "license_ir":license_ir, "license_color":license_color, "license_text_color":license_text_color})
            licenses.sort((a,b) => b.license_weight - a.license_weight);

        }
        var minor_licenses=[]
        licenses.forEach((other_license, index) => {
            if (index>0){
                minor_licenses.push(" "+other_license.license_category+" "+other_license.license_class+other_license.license_sr+" "+other_license.license_ir)
            }
        })
        return licenses[0].license_category+" <span style='background-color:"+licenses[0].license_color+";color:"+licenses[0].license_text_color+";'>"+licenses[0].license_class+licenses[0].license_sr+" "+licenses[0].license_ir+"</span> <span style='font-size:8pt'>("+minor_licenses+" )</span>"
    }

    function render(data, author_info){
        const boxes = document.querySelectorAll('.loadingstats');

        boxes.forEach(box => {
            box.remove();
        });
        for (const driver_name of author_info){
            var current_driver=driver_name.getElementsByTagName('a')[0].innerText.replace("Loading\n\n", "")
            var driver_stats=data[current_driver]
            // Set driver stats
            var irstats=''
            try{
                var years=diff_years(new Date(driver_stats.member_info.member_since))
                var yearspic=years
                if(yearspic>10){
                    yearspic=10
                }
                if(yearspic==0){yearspic=1}
                yearspic="https://ir-core-sites.iracing.com/members/member_images/badges/"+yearspic+"-year-badge.png"
                irstats+="<img src='"+yearspic+"' style='vertical-align:middle' /> "+driver_stats.member_info.club_name+" - <a href=\"https://members.iracing.com/membersite/member/CareerStats.do?custid="+driver_stats.member_info.cust_id+"\" target=\"_blank\" style=\"color:"+setcolor()+"\">iRacing profile</a>"
                if(driver_stats.recent_events.length>0){
                    var results=""
                    if(driver_stats.recent_events[0].subsession_id > 0){
                        results=' - <a href="#" onclick="window.open(\'https://members.iracing.com/membersite/member/EventResult.do?subsessionid='+driver_stats.recent_events[0].subsession_id+'\')" style="color:'+setcolor()+';" >RESULTS</a>'
                    }

                    irstats+='<br>Most recent '+driver_stats.recent_events[0].event_name+' ('+driver_stats.recent_events[0].event_type+') at '+driver_stats.recent_events[0].track.track_name+' on the '+driver_stats.recent_events[0].car_name+results

                } else {
                    irstats+="<br>No recent events."
                }
                irstats+="<br>"+getlicense(driver_stats)
            }catch(error){
                irstats="<br><a href=\"#\" onclick=\"window.open(\'https://support.iracing.com/support/solutions/31000076778\')\" style=\"color:"+setcolor()+";text-decoration: underline;\">iRacing Maintenance<a><br><br>"
                console.log(error)
            }
            //Write HTML
            driver_name.insertAdjacentHTML('beforeend',"<div style='color:"+setcolor()+";font-weight:bold;'>"+irstats+"</div>")
        }
    }


    fetch('https://66736j0um9.execute-api.eu-central-1.amazonaws.com/0-3-1?names='+names.join(','))
        .then((response) => response.json())
        .then((data) =>render(data, author_info));

    console.log("Fetched")
    var x = 0
    })();
