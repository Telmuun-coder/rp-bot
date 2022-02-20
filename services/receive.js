/**
 * Copyright 2019-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Messenger For Original Coast Clothing
 * https://developers.facebook.com/docs/messenger-platform/getting-started/sample-apps/original-coast-clothing
 */

"use strict";

const Curation = require("./curation"),
  Order = require("./order"),
  Response = require("./response"),
  Care = require("./care"),
  Survey = require("./survey"),
  GraphAPi = require("./graph-api"),
  i18n = require("../i18n.config"),
  Nlp = require("./nlp");

const config = require("./config");

module.exports = class Receive {
  constructor(user, webhookEvent) {
    this.user = user;
    this.webhookEvent = webhookEvent;
  }

  // Check if the event is a message or postback and
  // call the appropriate handler function
  async handleMessage  () {
    let event = this.webhookEvent;

    let responses;

    try {
      if (event.message) {
        let message = event.message;

        if (message.quick_reply) {
          responses = this.handleQuickReply();
        } else if (message.attachments) {
          // responses = this.handleAttachmentMessage();
        } else if (message.text) {
          responses = await this.handleTextMessage();
        }
      } else if (event.postback) {
        responses = this.handlePostback();
      } else if (event.referral) {
        responses = this.handleReferral();
      }
    } catch (error) {
      console.error(error);
      responses = {
        text: `An error has occured: '${error}'. We have been notified and \
        will fix the issue shortly!`
      };
    }

    if(!responses){
      return
    }

    if (Array.isArray(responses)) {
      let delay = 0;
      for (let response of responses) {
        this.sendMessage(response, delay * 2000);
        delay++;
      }
    } else {
      await this.sendMessage(responses);
    }
  }

  // Handles messages events with text
  async handleTextMessage () {
    console.log(
      "Received text:",
      `${this.webhookEvent.message.text} for ${this.user.psid}`
    );

    console.log(this.user)

    // check greeting is here and is confident
    let greeting = this.firstEntity(this.webhookEvent.message.nlp, "greetings");

    let message = this.webhookEvent.message.text.trim().toLowerCase();

    let response;

    if ((greeting && greeting.confidence > 0.8) || message.includes("start over")) {
      // response = Response.genNuxMessage(this.user);
      response = Response.getStarted()
      console.log(response)

    } else if (Number(message)) {

       if(message.length == 10){

         response = {
           text: "Таны РэдПойнт кодыг авлаа. Бид шалгаад хариу өгөх болно.",
         }

       }else{

         response = {
           text: "Та РэдПойнт код шалгуулах гэж байгаа бол 10 оронтой дугаар явуулна уу?",
         }

       }
    // } else if (message.includes("#")) {
    //   response = Survey.handlePayload("CSAT_SUGGESTION");
    // } else if (message.includes(i18n.__("care.help").toLowerCase())) {
    //   let care = new Care(this.user, this.webhookEvent);
    //   response = care.handlePayload("CARE_HELP");
    } else {

      let nlp = new Nlp()

      let cls = await nlp.classifyAsync(this.webhookEvent.message.text)

      if(cls.class == 'онооныталаар'){

        response = {
          text: "Сайн байна уу, та гүйлгээгээ бэлнээр хийсэн үү? Картаар хийсэн үү?",
          quick_replies: [{
            content_type: "text",
            title: 'Картаар',
            payload: "CARD"
          },{
            content_type: "text",
            title: 'Бэлнээр',
            payload: "CASH"
            }]
        }
      }else{
         response = {
            text: `Сайн байна уу ${this.user.firstName} ${this.user.lastName}. Хэрэглэгчийн лавлах утас +976 1800-1122 дугаарт холбогдоно уу. Баярлалаа.\nДэлгэрэнгүй мэдээллийг www.redpoint.mn`
         }

        GraphAPi.callPassThreadControlAPI({
          recipient: {
            id: this.user.psid
          },
          // target_app_id:510722196273544,
          target_app_id:263902037430900,
          metadata:"Pass to page inbox"
        })

        // return null
       }
    }

      // response = [
      //   Response.genText(
      //       i18n.__("fallback.any", {
      //         message: this.webhookEvent.message.text
      //       })
      //   ),
      //   Response.genText(i18n.__("get_started.guidance")),
      //   Response.genQuickReply(i18n.__("get_started.help"), [
      //     {
      //       title: i18n.__("menu.suggestion"),
      //       payload: "CURATION"
      //     },
      //     {
      //       title: i18n.__("menu.help"),
      //       payload: "CARE_HELP"
      //     }
      //   ])
      // ];

    return response;
  }

  // Handles mesage events with attachments
  handleAttachmentMessage() {
    let response;

    // Get the attachment
    let attachment = this.webhookEvent.message.attachments[0];
    console.log("Received attachment:", `${attachment} for ${this.user.psid}`);

    response = Response.genQuickReply(i18n.__("fallback.attachment"), [
      {
        title: i18n.__("menu.help"),
        payload: "CARE_HELP"
      },
      {
        title: i18n.__("menu.start_over"),
        payload: "GET_STARTED"
      }
    ]);



    return response;
  }

  // Handles mesage events with quick replies
  handleQuickReply() {
    // Get the payload of the quick reply
    let payload = this.webhookEvent.message.quick_reply.payload;

    return this.handlePayload(payload);
  }

  // Handles postbacks events
  handlePostback() {
    let postback = this.webhookEvent.postback;
    // Check for the special Get Starded with referral
    let payload;
    if (postback.referral && postback.referral.type == "OPEN_THREAD") {
      payload = postback.referral.ref;
    } else {
      // Get the payload of the postback
      payload = postback.payload;
    }
    return this.handlePayload(payload.toUpperCase());
  }

  // Handles referral events
  handleReferral() {
    // Get the payload of the postback
    let payload = this.webhookEvent.referral.ref.toUpperCase();

    return this.handlePayload(payload);
  }

  handlePayload(payload) {
    console.log("Received Payload:", `${payload} for ${this.user.psid}`);

    // Log CTA event in FBA
    GraphAPi.callFBAEventsAPI(this.user.psid, payload);

    let response;

    // Set the response based on the payload
    if(payload == 'CARD'){

      response = {
        text: "Та картаа РэдПойнт апп-д бүртгүүлсэн үү?",
        quick_replies: [{
          content_type: "text",
          title: 'Бүртгүүлээгүй',
          payload: "CARD_NOT_REGISTERED"
        },{
          content_type: "text",
          title: 'Бүртгүүлсэн',
          payload: "CARD_REGISTERED"
        }]
      }

    }else if(payload == 'CARD_NOT_REGISTERED'){

      response = {
        text: "Бүртгэлгүй картаар төлбөр хийгдсэн бол таны Redpoint оноо орох боломжгүй юм.",
        quick_replies: [{
          content_type: "text",
              title: 'Карт бүртгүүлэх заавар авах уу?',
            payload: "CARD_REGISTER_INSTRUCTION"
       }]
      }

    }else if(payload == 'CARD_REGISTER_INSTRUCTION'){

      response = [
          {
            text: "РэдПойнт аппликейшны хамгийн доор байрлах хэтэвч цэсийг сонгон карт нэмэх хэсгийг дарж төлбөрийн картын 16 оронтой тоог оруулан картаа нэмэх боломжтой."
          },
          {
            text: "Мөн төлбөрийн картаа нэмж баталгаажуулснаар бараа бүтээгдэхүүн авахдаа оноо тань хүрэхгүй бол төлбөрийн картаасаа гүйлгээгээ хийж дуусгах боломжтой юм. Ингэхийн тулд та баталгаажуулах гэж буй картаа сонгон мэдээллээ оруулснаар картын дансанд баталгаажуулах зорилгоор 1.00 - 99.99 төгрөгийн гүйлгээ хийх ба уг гүйлгээний үнийн дүнг та өөрийн дансаа шалгаж мэдсэнээр картаа баталгаажуулах хэсэгт оруулж баталгаажуулах юм."
          },
        {"attachment": {
            "type": "image",
            "payload": {
              "url": `${config.appUrl}/card.png`,
              "is_reusable":true,
            }
          }
        }
        ]

    }else if(payload == 'CARD_REGISTERED'){

      response = [{
        text: "Системийн ачааллаас шалтгаалан таны RedPoint оноо болон урамшууллын эрх 72 цагийн дотор бүртгэгдэж орох боломжтой юм.",
      }, {
          text: "72 цагаас хэтэрсэн ч оноо орохгүй байна уу?",
          quick_replies: [{
            content_type: "text",
            title: 'Тийм',
            payload: "CARD_CHECK_NUMBER"
          }]
        }
      ]

    } else if(payload == 'CARD_CHECK_NUMBER'){

      response = {
        text: "Та оноо ороогүй Рэдпойнт кодоо үлдээнэ үү.",
      }
    } else if(payload == 'CASH'){

      response = [{
        text: "Бэлэн гүйлгээ хийсэн хэрэглэгчийн хувьд, танд очих НӨАТ-ийн баримт дээрх 10 оронтой REDPOINT КОД–ыг  Redpoint аппликейшний оноо бүртгүүлэх хэсэгт оруулан оноогоо бүртгүүлэх боломжтой.",
        },
        {
          text: "Тухайн бүртгүүлж буй код нь 61-с дээш хоног болсон бол оноо орохгүй, 60 хоногийн дотор бүртгүүлж оноогоо авах боломжтой.",
        },
        {
        text: "Та оноогоо бүртгүүлсэн ч оноо орохгүй байна уу? Тийм бол оноо ороогүй  Рэдпойнт кодоо үлдээнэ үү.",
        }
      ]
    }

    else if (
      payload === "GET_STARTED"
      // payload === "DEVDOCS" ||
      // payload === "GITHUB"
    ) {

      // response = Response.genNuxMessage(this.user);
      response = Response.getStarted()
      console.log(response)

    }else if(payload == 'INTRO'){

      response = Response.intro()

    }else if(payload == 'SERVICE'){

      response = Response.service()

    }else if(payload == 'FORGER_PASSWORD'){

      response = {
        text: 'Рэдпойнт аппликейшнруу нэвтрэх нууц үгээ мартсан бол нэвтрэх хэсгийн баруун доод буланд байрлах нууц үг мартсан товч дээр даран өөрийн баталгаажуулсан утасны дугаар эсвэл имэйл хаягаа оруулан нууц үгээ сэргээн авах боломжтой. Нэг удаагийн нууц үг таны дугаарлуу мессежээр ирэх болно. '
      }

    } else if(payload == 'CONNECT') {
      response = {
        "attachment":{
          "type":"template",
          "payload":{
            "template_type":"button",
            "text":"Та манай хэрэглэгчийн лавлах утас луу холбогдож шалгуулаарай. Хэрэглэгчийн лавлах утас: 1800-1122 /2 товчийг даран дахин 0 товчийг дарах/",
            "buttons":[
              {
                "type":"phone_number",
                "title":"Яг одоо залгах",
                "payload":"+97618001122"
              }
            ]
          }
        }
      }
    } else if (payload == 'ABOUT') {

        response = {
          text: '🔴 Жолооч хүн бүрт зориулсан авто чиглэлийн үйл ажиллагаа эрхэлдэг газруудын лояалти урамшуулалт хөтөлбөрийг нэгтгэсэн аппликейшн.'
        };

        // response = {
        //   "attachment": {
        //     "type": "template",
        //     "payload": {
        //       "template_type": "button",
        //       "text": "Сайн байна уу?\n" +
        //           "\n" +
        //           "🔴 Рэдпойнт нь Петровис, Хас банк, Пс малл, Нитро Б гэх байгуулагуудын нэгдсэн урамшуулалт хөтөлбөр юм.",
        //       "buttons": [
        //         {
        //           "type": "postback",
        //           "payload": "APP_UPDATED",
        //           "title": "Апп шинэчлэгдлээ"
        //         },
        //       ]
        //     }
        //   }
        // }

    }else if(payload == 'APP_UPDATED'){

        response = {
          text: "🔊🔊 Сайн байна уу.\n" +
              "\n" +
              "Систем шинэчлэгдэж Redpoint аппликейшн илүү олон боломжуудыг хэрэглэгчдэдээ олгож байна. Та зөвхөн гар утас дээр суулгасан Redpoint аппликейшн-р нэвтрэн орж оноогоо бүртгүүлэх, шилжүүлэх, худалдан авалт хийх болон бусад үйлчилгээнүүдийг ашиглах боломжтой. Вэбээр нэвтрэх боломжгүй болсон байгаа. Та гар утсандаа Redpoint аппликейшнээ татаж аваарай. \n" +
              "\n" +
              "Аппликейшн татах линк 👇\n" +
              "https://www.redpoint.mn/",
        }

    }else if(payload == 'REGISTER'){

      // response = {
      //   text: `Та өөрийн гар утасны үйлдлийн системээс шалтгаалан дараах байдлаар Рэдпойнт аппликейшнаа суулгаж бүртгүүлэх боломжтой байгаа.\n
      //   • Android /playstore/ https://play.google.com/store/apps/details?id=mn.mid.redbox\n
      //   • iOS /appstore/ https://apps.apple.com/us/app/redpoint-mongolia/id1174327690?ls=1\n
      //   Та аппликейшнээ татаж аваад, бүртгүүлэх хэсэгт дарж бүртгүүлээрэй.`,
      // }

      response = {
        "attachment":{
          "type":"template",
          "payload":{
            "template_type":"button",
            "text":"Та өөрийн гар утасны үйлдлийн системээс шалтгаалан дараах байдлаар Рэдпойнт аппликейшнаа суулгаж бүртгүүлэх боломжтой байгаа.",
            "buttons":[
              {
                "type":"web_url",
                "url":"https://play.google.com/store/apps/details?id=mn.mid.redbox",
                "title":"Android /playstore/",
                "webview_height_ratio": "full"
              },
              {
                "type":"web_url",
                "url":"https://apps.apple.com/us/app/redpoint-mongolia/id1174327690?ls=1",
                "title":"iOS /appstore/",
                "webview_height_ratio": "full"
              }
            ]
          }
        }
      }

      // response = {
      //   text: "Та өөрийн гар утсан дээр RedPoint аппликейшнийг суулган \"Шинээр бүртгүүлэх\" цэсрүү орж, гар утасны дугаараараа бүртгүүлэн Рэдпойнт хэрэглэгч болох боломжтой.\n" +
      //           "Аппликейшн татах линк 👇\n" +
      //       "https://www.redpoint.mn/",
      // }

    }else if(payload == 'PARTNER'){

      response = Response.bePartner()

    } else if(payload == 'REDPOINT_PASS'){

      response = {
        text: "Та ямар ч шимтгэл төлөхгүйгээр өөрийн RedPoint-оо бусдад бэлэглэх, бусдаас RedPoint хүлээн авах боломжтой. Нэг өдөрт хамгийн багадаа 1000 оноо, ихдээ 10000 оноо шилжүүлж болно.",
      }

    } else if(payload == 'ONLINE_SHOP_REF'){

      response = {
        text: "Та захиалга хийсэн онлайн дэлгүүртэй дараах утсаар холбогдох боломжтой. Ardshop.mn 77003322, emonos.mn 18001883, emartmall.mn 76110101 rio.mn 77448844, Ticket.mn 19001800 утсаар лавлан асуух боломжтой.",
      }

    }else if(payload == 'MYCAR_INSTRUCTION'){

      response = {
        text: "Петровис Группээс хувь хэрэглэгчдэдээ зориулсан хамгийн том шагналын сантай “Миний машин” урамшуулалт хөтөлбөр орон даяар үргэлжилж байна. Урамшуулалт хөтөлбөрийн 2-р үе 2020.03.01-04.29 өдрийг дуустал үргэлжилнэ. \n" +
            "\n" +
            "🎁🎁 Сар бүр 1 хэрэглэгч Францын алдарт RENAULT брэндийн “0” гүйлттэй шинэ автомашины эзэн болно. Супер шагналаас гадна дараах шагналын эзэд тодорно.  \n" +
            "1. 1,000,000₮ авто сервис үйлчилгээний эрх -1 \n" +
            "2. 500,000₮ шатахууны эрх -1 \n" +
            "3. 300,00₮ мобил1 брэндийн тос, тосолгооны эрх -1 хэрэглэгч \n" +
            "\n" +
            "✨Хэрэглэгч таны 30,000₮ -ийн худалдан авалт тутамд 1 урамшууллын эрх үүсэх бөгөөд дараах байдлаар бүртгүүлээрэй. \n" +
            "\n" +
            "Redpoint хэрэглэгч - Redpoint апп-д нэвтэрч “Оноо бүртгүүлэх” хэсэгт Redpoint кодыг оруулах бөгөөд үнийн дүнд харгалзах Redpoint оноо давхар орох болно. /Та бүртгэлтэй картаар үйлчлүүлдэг бол Redpoint оноо шууд орох боловч урамшууллын эрхээ авахын тулд заавал Апп-р орж, Redpoint кодоо бүртгүүлэхийг анхаарна уу/ \n" +
            "\n" +
            "🔊 Хоёрдугаар үеийн супер шагналын эзэд 2020.04.30-ны өдөр МҮОНРТ-ийн шууд нэвтрүүлгээр тодорно.  \n" +
            "\n" +
            "Танд амжилт хүсье.",
      }

    } else if(payload == 'HELP'){

      response = {
        text: "☝️ Таны оноо болон урамшууллын эрх орохгүй байвал ... \n" +
            "\n" +
            "‼️Системийн ачааллаас шалтгаалан таны RedPoint оноо болон урамшууллын эрх 72 цагийн дотор бүртгэгдэж орох боломжтой юм. \n" +
            "\n" +
            "☝️ Танд илүү дэлгэрэнгүй мэдээлэл болон тусламж хэрэгтэй бол 1800-1122 дугаарт 08:00-17:00 цагийн хооронд холбогдорой 🙂",
      }

    }else if(payload == 'XAC_BANK'){

      response = {
        text: "Хэрэглэгч та өөрийн Хасбанкны картаар  РэдПойнт цуглуулах цэг гэж заасан газаруудад  худалдан авалт хийж картаа  уншуулсан тохиолдолд гүйлгээний 100 төгрөг тутамд 1 РэдПойнт оноо автоматаар орох болно.",
      }

    }else if(payload == 'PC_MALL'){

      response = {
        text: "Pc mall  дэлгүүрийн дурын салбар дээр хийгдсэн худалдан авалтын 100 төгрөг тутам 1 РэдПойнт оноо",
      }

    }else if(payload == 'UNIGAS'){

      response = {
        text: "Юнигазын дурын салбар дээр хийгдсэн худалдан авалтын 100 төгрөг тутам 4 РэдПойнт оноо (хувь хүн), 8 РэдПойнт оноо (байгууллага) Mas - МАS замын хажуугийн үйлчилгээг авснаар үнийн дүнгийн 100 төгрөг тутамд 1 РэдПойнт оноо",
      }

    }else if(payload == 'NITRO_B'){

      response = {
        text: "Нитро Б коффе шопоос худалдан авалт хийж үнийн дүнгийн 100 төгрөг тутамд 1 оноо Петровис - Петровисийн дурын шатахуун түгээх станц дээр хийсэн худалдан авалтын 100 төгрөг тутам 1 РэдПойнт оноо",
      }

    }else if(payload == 'PETROMART'){

      response = {
        text: "Петромартын дурын салбар дээр хийсэн худалдан авалтын 100 төгрөг тутам 1 РэдПойнт оноо",
      }

    }else if(payload == 'CARD_REGISTRATION'){

      response = {
        text: "РэдПойнт аппликейшны хамгийн доор байрлах хэтэвч цэсийг сонгон карт нэмэх хэсгийг дарж төлбөрийн картын 16 оронтой тоог оруулан картаа бүртгүүлэх боломжтой.",
      }

    }else if(payload == 'CARD_CONFIRMATION'){

      response = {
        text: "1.Та баталгаажуулах гэж буй картынхаа баруун доор байрлах баталгаажуулах товчыг дарж картын дуусах хугацаа болон арын “ оронтой  CVV  кодыг оруулна.\n" +
            "2.Картын дансанд баталгаажуулах зорилгоор ХХ.ХХ бутархай дүнтэй гүйлгээг  картын данснаас хийх ба уг гүйлгээний үнийн дүнг та өөрийн дансаа шалгаж картаа баталгаажуулах хэсэгт оруулж баталгаажуулаарай.\n",
      }

    }else if(payload == 'REDPOINT_PROBS'){

      response = Response.redpointProbs();

    }else if(payload == 'CHANGE_PHONE'){

      response = {
        text: "Та бүртгэлтэй утасны дугаараа солих бол info@redpoint.mn хаягаар эсвэл энэхүү чатаар өөрийн иргэний үнэмлэхний зураг болон хуучин болон одоо шинээр солих дугаараа бичих хүсэлтээ илгээнэ үү. Бид ажлын 1 хоногийн дотор таны асуудлыг шийдэх болно. ",
      }

    }
    else if (payload.includes("CURATION") || payload.includes("COUPON")) {
      let curation = new Curation(this.user, this.webhookEvent);
      response = curation.handlePayload(payload);
    } else if (payload.includes("CARE")) {
      let care = new Care(this.user, this.webhookEvent);
      response = care.handlePayload(payload);
    } else if (payload.includes("ORDER")) {
      response = Order.handlePayload(payload);
    } else if (payload.includes("CSAT")) {
      response = Survey.handlePayload(payload);
    } else if (payload.includes("CHAT-PLUGIN")) {
      response = [
        Response.genText(i18n.__("chat_plugin.prompt")),
        Response.genText(i18n.__("get_started.guidance")),
        Response.genQuickReply(i18n.__("get_started.help"), [
          {
            title: i18n.__("care.order"),
            payload: "CARE_ORDER"
          },
          {
            title: i18n.__("care.billing"),
            payload: "CARE_BILLING"
          },
          {
            title: i18n.__("care.other"),
            payload: "CARE_OTHER"
          }
        ])
      ];
    } else {
      response = {
        // text: `This is a default postback message for payload: ${payload}!`
        text: `Админ таньтай удахгүй холбогдох болно.`
      };
    }

    return response;
  }

  handlePrivateReply(type,object_id) {
    let welcomeMessage = i18n.__("get_started.welcome") + " " +
      i18n.__("get_started.guidance") + ". " +
      i18n.__("get_started.help");

    let response = Response.genQuickReply(welcomeMessage, [
      {
        title: i18n.__("menu.suggestion"),
        payload: "CURATION"
      },
      {
        title: i18n.__("menu.help"),
        payload: "CARE_HELP"
      }
    ]);

    let requestBody = {
      recipient: {
        [type]: object_id
      },
      message: response
    };

    GraphAPi.callSendAPI(requestBody);
  }

  sendMessage(response, delay = 0) {
    // Check if there is delay in the response
    if ("delay" in response) {
      delay = response["delay"];
      delete response["delay"];
    }

    // Construct the message body
    let requestBody = {
      recipient: {
        id: this.user.psid
      },
      message: response
    };

    // Check if there is persona id in the response
    if ("persona_id" in response) {
      let persona_id = response["persona_id"];
      delete response["persona_id"];

      requestBody = {
        recipient: {
          id: this.user.psid
        },
        message: response,
        persona_id: persona_id
      };
    }

    setTimeout(() => GraphAPi.callSendAPI(requestBody), delay);
  }

  firstEntity(nlp, name) {
    return nlp && nlp.entities && nlp.entities[name] && nlp.entities[name][0];
  }
};
