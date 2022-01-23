const axios = require("axios");
const { clients, scans, codes } = require("../entities");
const jwt = require("jsonwebtoken");
const buildUrl = require("build-url");

module.exports.osmiauth = () => {
  return axios
    .post(`${process.env.PREFIX}/getToken`, {
      apiId: process.env.API_ID,
      apiKey: process.env.API_KEY,
    })
    .then((res) => {
      process.env.TOKEN = res.data.token;
      return res.data;
    })
    .catch((err) => {
      return err;
    });
};

module.exports.osmiSendCardSms = async (cardid, phonenumber) => {
  try {
    return await axios.get(
      `${
        process.env.PREFIX
      }/passes/${cardid}/sms/${phonenumber}?message=${encodeURIComponent(
        "Ваша карта готова"
      )}{link}&sender=OSMICARDS`,
      {
        headers: {
          Authorization: `Bearer ${process.env.TOKEN}`,
        },
      }
    );
  } catch (err) {
    //console.log(err.response);
    return err.response.data;
  }
};

module.exports.osmiCardGenerate = async (phonenumber, accepted, cafeID) => {
  let restoInfo = jwt.decode(process.env.LOCAL_TOKEN);
  console.log(restoInfo);
  let checkIfExist = await clients.findOne({ phonenumber });
  try {
    if (checkIfExist !== null) {
      if (checkIfExist.accepted == true) {
        await this.osmiSendCardSms(
          checkIfExist.card_id,
          checkIfExist.phonenumber
        );
      }
      return checkIfExist._id;
    } else {
      await clients.create({
        accepted: !accepted ? true : false,
        phonenumber,
        coffeehouse_id: !restoInfo ? cafeID : restoInfo.id,
        card_id: "",
        current_stamps: 0,
        qr_url: "",
        card_url: "",
      });

      let clientInfo = await clients.findOne({ phonenumber });
      let card_id = Math.floor(Math.random() * 10000000);

      let qr_url = buildUrl(`${process.env.URL_PREFIX}`, {
        queryParams: {
          client_id: `${clientInfo._id}`,
          rest_id: `${!restoInfo ? cafeID : restoInfo.id}`,
          phonenumber: `${phonenumber}`,
        },
      });

      await axios.post(
        `${process.env.PREFIX}/passes/${card_id}/6tampCardMain?withValues=true`,
        {
          noSharing: false,
          values: [
            {
              label: "ID клиента",
              value: `${clientInfo._id}`,
            },
            {
              label: "Количество штампов",
              value: `${clientInfo.current_stamps} / ${restoInfo.maxstamps}`,
            },
            {
              label: "Номер телефона",
              value: `${phonenumber}`,
            },
            {
              label: "ID ресторана",
              value: `${!restoInfo ? cafeID : restoInfo.id}`,
            },
          ],
          barcode: {
            message: `${qr_url}`,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.TOKEN}`,
          },
        }
      );

      let card_url = await axios.get(
        `${process.env.PREFIX}/passes/${card_id}/link`,
        {
          headers: {
            Authorization: `Bearer ${process.env.TOKEN}`,
          },
        }
      );

      await clients.updateOne(
        { phonenumber },
        { card_url: card_url.data.link, qr_url, card_id }
      );

      if (clientInfo.accepted == true) {
        await this.osmiSendCardSms(card_id, phonenumber);
      }

      return clientInfo._id;
    }
  } catch (err) {
    return err;
  }
};

module.exports.osmiCheckCode = async (url) => {
  let restoInfo = jwt.decode(process.env.LOCAL_TOKEN);
  let urlParam = new URL(url);

  let [client_id, rest_id, phonenumber] = [
    urlParam.searchParams.get("client_id"),
    urlParam.searchParams.get("rest_id"),
    urlParam.searchParams.get("phonenumber"),
  ];
  try {
    let checkClient = await clients.findOne({
      _id: `${client_id}`,
      coffeehouse_id: rest_id,
      phonenumber,
    });
    console.log(checkClient);
    if (checkClient == null) {
      return "Client not found";
    } else {
      if (checkClient.current_stamps >= restoInfo.maxstamps) {
        await clients.updateOne(
          { _id: client_id, coffeehouse_id: rest_id, phonenumber },
          { current_stamps: 0 }
        );

        await scans.create({
          client_id: checkClient._id,
          coffeehouse_id: restoInfo.id,
        });
        return "Stamps updated to ZERO";
      } else {
        await clients.updateOne(
          { _id: client_id, coffeehouse_id: rest_id, phonenumber },
          { current_stamps: checkClient.current_stamps + 1 }
        );
        let checkFinalStamps = await clients.findOne({
          _id: `${client_id}`,
          coffeehouse_id: rest_id,
          phonenumber,
        });

        await scans.create({
          client_id: checkClient._id,
          coffeehouse_id: restoInfo.id,
        });

        await axios.put(
          `${process.env.PREFIX}/passes/${checkFinalStamps.card_id}?push=true`,
          {
            noSharing: false,
            values: [
              {
                label: "ID клиента",
                value: `${client_id}`,
              },
              {
                label: "Количество",
                value: `${restoInfo.maxstamps}/${checkFinalStamps.current_stamps}`,
              },
              {
                label: "Номер телефона",
                value: `${checkFinalStamps.phonenumber}`,
              },
              {
                label: "ID ресторана",
                value: `${checkFinalStamps.coffeehouse_id}`,
              },
            ],
          },
          {
            headers: {
              Authorization: `Bearer ${process.env.TOKEN}`,
            },
          }
        );

        return `${restoInfo.maxstamps}/${checkFinalStamps.current_stamps}`;
      }
    }
  } catch (err) {
    console.log(err);
    return "Client not found";
  }
};

module.exports.clientInvite = async (phonenumber) => {
  let checkClient = await clients.findOne({ phonenumber });
  try {
    if (checkClient == null) {
      return await this.osmiCardGenerate(phonenumber, undefined);
    } else {
      return "Client is exist";
    }
  } catch (err) {
    return err.response.data;
  }
};

module.exports.register = async (phonenumber, id) => {
  let checkClient = await clients.findOne({ phonenumber });
  let data =
    '{\n\t"smsText":"Ваш пинкод для транзакции {pin}",\n\t"length":4\n}';
  try {
    if (checkClient == null) {
      let createClient = await this.osmiCardGenerate(phonenumber, true, id);
      let code = await axios.post(
        `${process.env.PREFIX}/activation/sendpin/${phonenumber}`,
        data,
        {
          headers: {
            Authorization: `Bearer ${process.env.TOKEN}`,
          },
        }
      );

      await codes.create({
        client_id: createClient,
        confirmation_code: code.data.token,
        coffeehouse_id: id,
        phonenumber: phonenumber,
      });

      return code.data.token;
    } else {
      return "User is exist";
    }
  } catch (err) {
    return err.response.data;
  }
};

module.exports.confirm = async (coffeehouse_id, code, phonenumber) => {
  let checkIsHave = await codes.findOne({
    coffeehouse_id,
    phonenumber,
  });

  try {
    await axios.post(
      `${process.env.PREFIX}/activation/checkpin`,
      {
        token: `${checkIsHave.confirmation_code}`,
        pin: `${code}`,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.TOKEN}`,
        },
      }
    );
    await clients.updateOne(
      { coffeehouse_id, phonenumber },
      { accepted: true }
    );

    return this.osmiCardGenerate(phonenumber);
  } catch (err) {
    return err.response.data;
  }
};

module.exports.regencode = async (phonenumber, coffeehouse_id) => {
  let codeIsHave = await codes.findOne({ phonenumber, coffeehouse_id });
  try {
    if (codeIsHave == null) {
      return "User is not exist";
    } else {
      let data =
        '{\n\t"smsText":"Ваш пинкод для транзакции {pin}",\n\t"length":4\n}';
      let newCode = await axios.post(
        `${process.env.PREFIX}/activation/sendpin/${phonenumber}`,
        data,
        {
          headers: {
            Authorization: `Bearer ${process.env.TOKEN}`,
          },
        }
      );
      await codes.updateOne(
        { phonenumber, coffeehouse_id },
        { confirmation_code: newCode.data.token }
      );
      return "Code updated";
    }
  } catch (err) {
    return err.response.data;
  }
};
