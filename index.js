const { getInvitationCode, enterInvitationCode } = require("./api/garena");
const {
  listChildFiles,
  readFileContent,
  checkFileExist,
  listWindowsDisks,
} = require("./helper/folder");
const { selectQuestion } = require("./helper/input");
const fs = require("fs"),
  es = require("event-stream");
const introduction = require("./helper/introduction");

const LOL_LOGS_FOLDER =
  "C:\\Garena\\Games\\32787\\Game\\Logs\\LeagueClient Log";
const LOL_CODE_FILE = "birthday_code_league_of_legends.txt";

const _parseTokens = ({ logFiles }) => {
  const tokens = logFiles
    .map((path) => {
      const content = readFileContent({ path });

      if (/\?token=[a-zA-Z0-9]*$/gim.test(content)) {
        const [tokenQueryString] = content.match(/\?token=[a-zA-Z0-9]*$/gim);

        const [, token] = tokenQueryString.split("=");

        return token;
      }
    })
    .filter((token) => typeof token === "string" && token.length > 0);

  return Array.from(new Set(tokens));
};

const _delay = async (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const _buildGamePath = async () => {
  const disks = listWindowsDisks();

  const selectedDisk = await selectQuestion({
    question: "Chọn ổ đĩa đã cài đặt game: ",
    options: disks.map((disk) => ({
      title: `Ổ ${disk._mounted}\\`,
      value: disk._mounted + "\\",
    })),
  });

  let processingDir = selectedDisk;

  while (true) {
    console.log(`Đường dẫn đang chọn hiện tại: ${processingDir}`);

    const subs = listChildFiles({ folder: processingDir, fullPath: false });

    const isRootDiskPath = /^[A-Z]{1}:\\$/gim.test(processingDir);

    const selectedSub = await selectQuestion({
      question: "Chọn tiếp đường dẫn đến thư mục log của game: ",
      options: subs
        .map((sub) => ({
          title: sub,
          value: isRootDiskPath
            ? `${processingDir}\\${sub}`
            : `${processingDir}\\\\${sub}`,
        }))
        .concat([{ title: "Chọn đường dẫn này.", value: "choose" }]),
    });

    if (selectedSub === "choose") return processingDir.replace(/\\/gim, "\\\\");

    processingDir = selectedSub;
  }
};

setImmediate(async () => {
  try {
    introduction();

    let NEW_LOL_LOGS_FOLDER = LOL_LOGS_FOLDER;

    if (!(await checkFileExist({ path: LOL_LOGS_FOLDER }))) {
      console.log("Đường dẫn đến thư mục game sai.");

      NEW_LOL_LOGS_FOLDER = await _buildGamePath();
    }

    if (!(await checkFileExist({ path: NEW_LOL_LOGS_FOLDER }))) {
      console.log("Đường dẫn đến thư mục game sai.");

      await _delay(2000);

      process.exit(1);
    }

    console.log("Đang lấy thông tin tài khoản...");

    const logFiles = listChildFiles({ folder: NEW_LOL_LOGS_FOLDER });

    const tokens = _parseTokens({ logFiles });

    const users = [];

    for (const token of tokens) {
      const userInfo = await getInvitationCode({ token });

      const userIndex = users.findIndex(
        (user) => user.garena_uid === userInfo.garena_uid
      );

      if (userIndex > -1) {
        users[userIndex]["token"] = userInfo.token;
      } else {
        users.push(userInfo);
      }
    }

    const selectedUser = await selectQuestion({
      question: "Chọn tài khoản game của bạn: ",
      options: users.map((user) => ({
        title: user.user_profile.username,
        value: user,
      })),
    });

    const {
      invitation_code,
      invitation_amount,
      enter_code_amount,
      token,
      user_profile: { username },
    } = selectedUser;

    console.log(
      `Tài khoản ${username} đã nhập CODE sinh nhật ${enter_code_amount} lần, có tổng cộng ${invitation_amount} lần mời, mã mời là ${invitation_code}.`
    );

    const s = fs
      .createReadStream(LOL_CODE_FILE)
      .pipe(es.split())
      .pipe(
        es
          .mapSync(async (code) => {
            s.pause();
            try {
              const response = await enterInvitationCode({ code, token });

              if (response.error) {
                console.log(`Mã ${code} đã hết lượt mời.`);
              } else if (response.reward.token === 10) {
                console.log(`========== Nhập mã ${code} thành công ==========`);

                fs.appendFileSync("success-code.txt", `${code}\n`);
              }

              s.resume();
            } catch (e) {
              console.log(`Xảy ra lỗi trong quá trình nhập mã ${code}.`);

              s.resume();
            }
          })
          .on("error", function (err) {
            console.log(`Xảy ra lỗi trong quá trình đọc file.`);
          })
          .on("end", function () {
            console.log(`Đã thử hết tất cả các mã.`);
          })
      );
  } catch (error) {
    console.log(error);

    console.log("Lỗi không xác định. Vui lòng thử lại.");

    await _delay(2000);

    process.exit(1);
  }
});
