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

const i18n = require("../i18n.config");
const config = require("./config");

module.exports = class Response {
  static genQuickReply(text, quickReplies) {
    let response = {
      text: text,
      quick_replies: []
    };

    for (let quickReply of quickReplies) {
      response["quick_replies"].push({
        content_type: "text",
        title: quickReply["title"],
        payload: quickReply["payload"]
      });
    }

    return response;
  }

  static genGenericTemplate(image_url, title, subtitle, buttons) {
    let response = {
      attachment: {
        type: "template",
        payload: {
          template_type: "generic",
          elements: [
            {
              title: title,
              subtitle: subtitle,
              image_url: image_url,
              buttons: buttons,
            }
          ]
        }
      }
    };

    return response;
  }

  static genImageTemplate(image_url, title, subtitle = "") {
    let response = {
      attachment: {
        type: "template",
        payload: {
          template_type: "generic",
          elements: [
            {
              title: title,
              subtitle: subtitle,
              image_url: image_url
            }
          ]
        }
      }
    };

    return response;
  }

  static genButtonTemplate(title, buttons) {
    let response = {
      attachment: {
        type: "template",
        payload: {
          template_type: "button",
          text: title,
          buttons: buttons
        }
      }
    };

    return response;
  }

  static genText(text) {
    let response = {
      text: text
    };

    return response;
  }

  static genTextWithPersona(text, persona_id) {
    let response = {
      text: text,
      persona_id: persona_id
    };

    return response;
  }

  static genPostbackButton(title, payload) {
    let response = {
      type: "postback",
      title: title,
      payload: payload
    };

    return response;
  }

  static genWebUrlButton(title, url) {
    let response = {
      type: "web_url",
      title: title,
      url: url,
      messenger_extensions: true
    };

    return response;
  }

  static genNuxMessage(user) {
    let welcome = this.genText(
      i18n.__("get_started.welcome", {
        userFirstName: user.firstName
      })
    );

    let guide = this.genText(i18n.__("get_started.guidance"));

    let curation = this.genQuickReply(i18n.__("get_started.help"), [
      {
        title: i18n.__("menu.suggestion"),
        payload: "CURATION"
      },
      {
        title: i18n.__("menu.help"),
        payload: "CARE_HELP"
      }
    ]);

    return [welcome, guide, curation];
  }

  static getStarted() {

   let intro = {
        title: "Танилцуулга",
        subtitle: "Та дараах цэснээс RedPoint урамшуулалт хөтөлбөрийн талаар мэдээлэл авна уу :)",
        image_url: `${config.appUrl}/image1.jpg`,
         default_action: {
           "type": "web_url",
           "url": "https://www.redpoint.mn",
         },
        buttons: [
          Response.genPostbackButton(
              "RedPoint гэж юу вэ?",
              "ABOUT"
          ),
          Response.genPostbackButton(
              "Рэдпойнт апп татах",
              "REGISTER"
          ),
          Response.genPostbackButton(
              "Хамтран ажиллах",
              "PARTNER"
          )
        ],
    }

    let service = {
      title: "Үйлчилгээ",
      subtitle: "Та RedPoint-той холбоотой бүх төрлийн мэдээллийг 1800-1122 дугаараас лавлана уу",
      image_url: `${config.appUrl}/image2.jpg`,
      buttons: [
        Response.genPostbackButton(
          "Оноо шилжүүлэх заавар",
          "REDPOINT_PASS"
        ),
        Response.genPostbackButton(
          "Онлайн дэлгүүр лавлах",
          "ONLINE_SHOP_REF"
        ),
        Response.genPostbackButton(
          "Оноо орохгүй байна уу.",
          "REDPOINT_PROBS"
        )
      ],
    }

    let berkh = {
      title: "Тусламж",
      subtitle: "",
      image_url: `${config.appUrl}/help.jpg`,
      buttons: [
        Response.genPostbackButton(
            "RedPoint дугаар солих",
            "CHANGE_PHONE"
        ),
        Response.genPostbackButton(
            "Нууц үгээ мартсан",
            "FORGER_PASSWORD"
        ),
        Response.genPostbackButton(
          "Оператортай холбогдох",
          "CONNECT"
        ),
      ],
    }


    // console.log(intro)

    // return intro

    return  [
      {
        attachment: {
          type: "template",
          payload: {
            template_type: "generic",
            elements: [
              intro,
              service,
              berkh,
            ]
          }
        }
      },
      {
        text: `Сайн байна уу?  Хэрэглэгчийн лавлах утас: 1800-1122 дугаарт холбогдоно уу. Баярлалаа.`
      }
    ];
  }

  static bePartner() {


    return  {
      "attachment":{
        "type":"template",
        "payload":{
          "template_type":"button",
          "text":"Та Рэдпойнт нэгдсэн лояалти системтэй хамтран ажиллах талаар мэдээлэл авахыг хүсвэл 99041896 , 80331373 утсаар холбогдох боломжтой.",
          "buttons":[
            {
              "type":"phone_number",
              "title":"Залгах",
              "payload":"+97699041896"
            }
          ]
        }
      }
    };

  }

  static redpointProbs() {

    return  {
     text: `- Картаар хийсэн худалдан авалт дээр ямар тохиолдолд оноо орохгүй вэ?\n
      - Худалдан авалт хийсэн банкны карт Рэдпойнт апп хэтэвч цэсэнд бүртгэлгүй тохиолдолд оноо олгохгүй. Хэрвээ бүртгүүлсэн банкны картаа хаяж гээсэн, хугацаа нь дууссан учир ахин шинэ карт захиалж авсан бол хуучин картаа бүртгэлээсээ устгаж шинэ картаа бүртгүүлэх шаардлагатай.\n
      - Картаараа худалдан авалтаа хийснийхээ дараа нь худалдан авалт хийсэн картаа бүртгүүлсэн тохиолдолд өмнөх 3 сарын хугацаанд тухайн картаар хийгдсэн гүйлгээний оноо нөхөж орох болно.\n
      🔴ОНОО ОРОХГҮЙ БАЙХ БУСАД ШАЛТГААНУУД
      - Худалдан авалтаа байгууллага дээр авсан бол оноо олгохгүй. /Худалдан авалт хийсэн төлбөрийн баримт  байгууллагын регистр дээр хэвлэгдсэн тохиолдолд оноо олгохгүй/\n
      - Бөөний үнээр худалдан авалт хийсэн бол оноо олгохгүй. Худалдан авалт хийхдээ шатахуунаа  бөөний үнээр худалдан авсан бол оноо орохгүй.  ( Бөөний үнээр худалдаалдаг салбарууд болон бөөний хошуунаас худалдан авалт хийсэн тохиолдолд оноо олгохгүй )\n
      - Код оруулах хугацаа хэтэрсэн тохиолдолд оноо олгохгүй. Хэрэглэгч тухайн Рэдпойнт кодоо нь  61-с дээш хоног хугацаанд бүртгүүлээгүй  бол оноо орохгүй, 60 хоногийн дотор бүртгүүлж оноогоо авах боломжтой. ( Код оруулах хугацаа хэтэрсэн гэж апп дээр гардаг)\n
      - Мөн худалдан авалт бэлэн хийгдсэн гүйлгээг  картаар хийгдсэн гэж төлбөрийн баримт хэвлэсэн бол оноо олгогдохгүй.\n
     Дээрх шалтгаануудаас хамааран Рэдпойнт оноо орохгүй байх боломжтой бөгөөд та бүхэн Рэдпойнттой холбоотой дэлгэрэнгүй лавлах бол 1800-1122 дугаарт залган лавлана уу.`
    };

  }

  static intro() {

    let intro = {
      title: "Танилцуулга",
      subtitle: "Та дараах цэснээс RedPoint урамшуулалт хөтөлбөрийн талаар мэдээлэл авна уу :)",
      image_url: `${config.appUrl}/image1.jpg`,
      default_action: {
        "type": "web_url",
        "url": "https://www.redpoint.mn",
      },
      buttons: [
        Response.genPostbackButton(
            "RedPoint гэж юу вэ?",
            "ABOUT"
        ),
        Response.genPostbackButton(
            "Бүртгүүлэх",
            "REGISTER"
        ),
        Response.genPostbackButton(
            "Хамтран ажиллах",
            "PARTNER"
        )
      ],
    }

    return  {
      attachment: {
        type: "template",
        payload: {
          template_type: "generic",
          elements: [
            intro,
          ]
        }
      }
    };

  }

  static service() {


    let service = {
      title: "Үйлчилгээ",
      subtitle: "Та RedPoint-той холбоотой бүх төрлийн мэдээллийг 1800-1122 дугаараас лавлана уу",
      image_url: `${config.appUrl}/image2.jpg`,
      buttons: [
        Response.genPostbackButton(
          "Оноо шилжүүлэх заавар",
          "REDPOINT_PASS"
        ),
        Response.genPostbackButton(
          "Онлайн дэлгүүр лавлах",
          "ONLINE_SHOP_REF"
        ),
        Response.genPostbackButton(
          "Оноо орохгүй байна уу.",
          "REDPOINT_PROBS"
        )
      ],
    }

    return  {
        attachment: {
          type: "template",
          payload: {
            template_type: "generic",
            elements: [
              service,
            ]
          }
        }
      };
  }

  static durvunBerkh() {


    let berkh = {
      title: "Тусламж",
      subtitle: "",
      image_url: `${config.appUrl}/help.jpg`,
      buttons: [
        Response.genPostbackButton(
          "RedPoint дугаар солих",
          "CHANGE_PHONE"
        ),
        Response.genPostbackButton(
            "Нууц үгээ мартсан",
            "FORGER_PASSWORD"
        ),
        Response.genPostbackButton(
          "Оператортай холбогдох",
          "CONNECT"
        ),
      ],
    }

    return  {
      attachment: {
        type: "template",
        payload: {
          template_type: "generic",
          elements: [
            berkh,
          ]
        }
      }
    };

  }
};
