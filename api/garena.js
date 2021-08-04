const axios = require("axios");
const CryptoJS = require("crypto-js");

const _findGarenaInfoByUID = async ({ uid }) => {
  const config = {
    method: "get",
    url: `http://gameprofile.garenanow.com/api/game_profile/?region=vn&uid=${uid}`,
  };

  const response = await axios(config);

  return response.data;
};

const getInvitationCode = async ({ token }) => {
  const config = {
    method: "get",
    url: "https://bargain.lol.garena.vn/api/profile",
    headers: {
      token,
      "User-Agent":
        "Mozilla/5.0 (Windows NT 6.2; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) LeagueOfLegendsClient/11.15.388.2387 (CEF 74) Safari/537.36",
    },
  };

  let response = await axios(config);

  const { garena_uid, invitation_code, invitation_amount, enter_code_amount } =
    response.data;

  response = await _findGarenaInfoByUID({ uid: garena_uid });

  const { user_profile } = response;

  return {
    user_profile,
    garena_uid,
    invitation_code,
    invitation_amount,
    enter_code_amount,
    token,
  };
};

const _preLogin = async ({ uid }) => {
  const { user_profile: username } = await _findGarenaInfoByUID({ uid });

  const config = {
    method: "get",
    url: `https://sso.garena.com/api/prelogin?account=${username}&format=json&id=1628055981360&app_id=10100`,
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.131 Safari/537.36",
      Cookie: "GOP=ae5d0a5165d0d88fd78e9d12706b9b86",
    },
  };

  const response = await axios(config);

  return response.data;
};

const _preLoginV2 = async ({ username }) => {
  const config = {
    method: "get",
    url: `https://sso.garena.com/api/prelogin?account=${username}&format=json&id=1628055981360&app_id=10100`,
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.131 Safari/537.36",
      Cookie: "GOP=ae5d0a5165d0d88fd78e9d12706b9b86",
    },
  };

  const response = await axios(config);

  return response.data;
};
const login = async ({ uid, username, password = "123456789" }) => {
  console.log({ uid, username, password });

  const _isValidString = (string) =>
    typeof string === "string" && string.length > 0;

  let response = {};

  if (!_isValidString(uid) && !_isValidString(username)) {
    console.log("Tên đăng nhập không hợp lệ");

    process.exit(1);
  }

  if (_isValidString(uid) && _isValidString(username)) {
    response = await _preLoginV2({ username });
  } else if (_isValidString(uid) && !_isValidString(username)) {
    response = await _preLogin({ uid });
  } else {
    response = await _preLoginV2({ username });
  }

  const { account, v1, v2 } = response;

  const passwordMd5 = CryptoJS.MD5(password);

  const passwordKey = CryptoJS.SHA256(CryptoJS.SHA256(passwordMd5 + v1) + v2);

  let encryptedPassword = CryptoJS.AES.encrypt(passwordMd5, passwordKey, {
    mode: CryptoJS.mode.ECB,
    padding: CryptoJS.pad.NoPadding,
  });

  encryptedPassword = CryptoJS.enc.Base64.parse(
    encryptedPassword.toString()
  ).toString(CryptoJS.enc.Hex);

  const config = {
    method: "get",
    url: `https://sso.garena.com/api/login?account=${account}&password=${encryptedPassword}&redirect_uri=https%3A%2F%2Faccount.garena.com%2F&format=json&id=1627888963432&app_id=10100`,
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.131 Safari/537.36",
      Referer:
        "https://sso.garena.com/ui/login?app_id=10100&redirect_uri=https%3A%2F%2Faccount.garena.com%2F&locale=vi-VN",
      Cookie: "GOP=ae5d0a5165d0d88fd78e9d12706b9b86",
    },
  };

  response = await axios(config);

  return response.data;
};

const enterInvitationCode = async ({ code, token }) => {
  const data = JSON.stringify({
    code,
    confirm: true,
  });

  const config = {
    method: "post",
    url: "https://bargain.lol.garena.vn/api/enter",
    headers: {
      token,
      "Content-Type": "application/json",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 6.2; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) LeagueOfLegendsClient/11.15.388.2387 (CEF 74) Safari/537.36",
    },
    data: data,
  };

  const response = await axios(config);

  return response.data;
};

module.exports = { getInvitationCode, login, enterInvitationCode };
