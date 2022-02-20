const request = require('request');
const rp = require('request-promise');
const cheerio = require('cheerio');
const dateFormat = require('dateformat');
const util = require('./util');


const Knex = require('knex');
const knex = connect();

function connect () {
    const config = {
        user: 'root',
        password: 'pass',
        database: 'crawler',
        host: 'localhost'
    };

    // console.log(config);

    if (process.env.INSTANCE_CONNECTION_NAME && process.env.NODE_ENV === 'production') {
        config.socketPath = `/cloudsql/${process.env.INSTANCE_CONNECTION_NAME}`;
    }

    // Connect to the database
    const knex = Knex({
        client: 'mysql',
        connection: config
    });

    return knex;
}

var carCount = 0;
var phoneCount = 0;
var errorCount = 0;

var listUrl = "https://www.unegui.mn/avto-mashin/-avtomashin-zarna/ulan-bator/?page=";

//DnygIoKEhJrMknsr

function getTopList(){

    console.log("top");

    var options = {
        uri: "https://www.unegui.mn/avto-mashin/-avtomashin-zarna/toyota/20/ulan-bator/?tops_only&_=1536044813289",
        headers: {
            'x-requested-with':'XMLHttpRequest'
        },
        transform: function ( body) {
            return cheerio.load(body);
        }
    };

    return rp(options).then(function ($) {

        var as = $('a.announcement-block__title');

        console.log(as.length);

        for (var i = 0; i < as.length; i++) {

            let href = $(as[i]).attr('href');

            console.log(i);
            getDetail("https://www.unegui.mn" + href);

        }

    });

}

exports.getList = async function(number){

    console.log("page:",number);

    var options = {
        uri: listUrl + number,
        transform: function ( body) {
            return cheerio.load(body);
        }
    };

    try{

        let $ = await rp(options)

        var as = $('.list-simple__output [itemprop=url]');

        for (var i = 0; i < as.length; i++) {

            let href = $(as[i]).attr('href');

            if (i%4 == 0) {
                await getDetail("https://www.unegui.mn" + href, i)

            }else{
                getDetail("https://www.unegui.mn" + href, i)
            }

        }

        return true;

    }catch (e) {

        console.log(e)

        return false
    }


}

async function getDetail(url,index){

    var options = {
        timeout: 10000,
        uri: url,
        transform: function (body) {
            return cheerio.load(body);
        },
    };

    try {

        $ = await rp(options)

        var uri_data = url.split('_')[1].split('-');
        var phoneUrl = $(".phone-author").data('url');

        var car = {

            id: $("span [itemprop=sku]").text().trim(),
            url: url,
            ad_title: $("#ad-title").text().trim(),
            price: $("meta[itemprop=price]").attr("content"),
            location: $("[itemprop=address]").text().trim(),
            date_text: $(".date-meta").text().replace("Нийтэлсэн:","").trim(),
            date_crawled: dateFormat(new Date(), "yyyy.mm.dd HH:MM:ss"),
            author_id: $(".author-name").data('user'),
            descr: $(".announcement-description").text().trim(),

        };

        car = Object.assign({},car, util.getManuModel(car.ad_title));
        car.date_text = util.formatDate(car.date_text,car.date_crawled);


        let li = $('.chars-column li');

        for (var i = 0; i < li.length; i++) {

            let key = $(li[i]).find('.key-chars').text().trim();
            let value = $(li[i]).find('.value-chars').text().trim();

            switch(key){
                case "Үйлдвэрлэсэн он":
                    car.manufactured_year = value;
                    break;
                case "Орж ирсэн он":
                    car.imported_year = value;
                    break;
                case "Мотор багтаамж":
                    car.engine_capacity = value;
                    break;
                case "Төрөл":
                    car.type = value;
                    break;
                case "Хөтлөгч":
                    car.drivetrain = value;
                    break;
                case "Хаяг байршил":
                    car.address = value;
                    break;
                case "Хүрд":
                    car.steering_wheel = value;
                    break;
                case "Лизинг":
                    car.lising = value;
                    break;
                case "Нөхцөл":
                    car.status = value;
                    break;
                case "Хурдны хайрцаг":
                    car.transmission = value;
                    break;
                case "Явсан":
                    car.odo = value;
                    break;
                case "Дотор өнгө":
                    car.interior_color = value;
                    break;
                case "Өнгө":
                    car.color = value;
                    break;
                case "Хөдөлгүүр":
                    car.engine = value;
                    break;
                case "Хаалга":
                    car.door = value;
                    break;
            }

        }

        try {

            let rows = await knex('car').insert(car)

            await getPhone("https://www.unegui.mn" + phoneUrl,car.id);

            console.log(index,'returned')
            return true
        }catch (e) {
            console.log(e)

            await update(car);

            console.log(index,'returned')
            return false
        }


    }catch (e) {
        console.log(e)
        return false
    }


}

async function update(  car){

    return await knex('car').where('id', '=', car.id).update(car).then(function(rows) {

        console.log('update');
    }).catch(function(error){

        console.error(error);
    });
}


async function getPhone(url,id){

    var options = {
        timeout: 10000,
        uri: url,
        headers: {
            'x-requested-with':'XMLHttpRequest'
        },
    };

    try {

        let response = await rp(options)

        let json = JSON.parse(response);

        let rows = await knex('car').where('id', '=', id).update({phone: json['phone']})

        return true

    }catch(e){
        console.log(e)

        return false
    }

}



