import User from "../models/User.js";
import MyError from "../utils/myError.js";
import asyncHandler from "express-async-handler";
import paginate from "../utils/paginate.js";
import sendAllUserNotification from "../utils/sendAllUserNotification.js";
import Wallet from "../models/Wallet.js";
import sendNotification from "../utils/sendNotification.js";
import axios from "axios";
export const authMeUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) {
    throw new MyError(req.params.id, 401);
  }
  res.status(200).json({
    success: true,
    data: user,
  });
});

// register
export const register = asyncHandler(async (req, res, next) => {
  const user = await User.create(req.body);

  const token = user.getJsonWebToken();

  res.status(200).json({
    success: true,
    token,
    user: user,
  });
});

// логин хийнэ
export const login = asyncHandler(async (req, res, next) => {
  const { phone, password, expoPushToken } = req.body;

  // Оролтыгоо шалгана

  if (!phone || !password) {
    throw new MyError("Имэл болон нууц үйгээ дамжуулна уу", 400);
  }

  // Тухайн хэрэглэгчийн хайна
  const user = await User.findOne({ phone }).select("+password");

  if (!user) {
    throw new MyError("Утас болон нууц үгээ зөв оруулна уу", 401);
  }

  const ok = await user.checkPassword(password);

  if (!ok) {
    throw new MyError("Утас болон нууц үгээ зөв оруулна уу", 401);
  }

  user.expoPushToken = expoPushToken;
  user.save();
  const token = user.getJsonWebToken();

  const cookieOption = {
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000000),
    httpOnly: true,
  };

  res.status(200).cookie("amazon-token", token, cookieOption).json({
    success: true,
    token,
    user: user,
  });
});

export const logout = asyncHandler(async (req, res, next) => {
  const cookieOption = {
    expires: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000000),
    httpOnly: true,
  };

  res.status(200).cookie("amazon-token", null, cookieOption).json({
    success: true,
    data: "logged out...",
  });
});

export const getUsers = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const sort = req.query.sort;
  const select = req.query.select;

  ["select", "sort", "page", "limit"].forEach((el) => delete req.query[el]);

  const pagination = await paginate(page, limit, User);

  const users = await User.find(req.query, select)
    .sort(sort)
    .skip(pagination.start - 1)
    .limit(limit);

  res.status(200).json({
    success: true,
    data: users,
    pagination,
  });
});

export const getUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    throw new MyError(req.params.id + " ID-тэй хэрэглэгч байхгүй!", 400);
  }

  res.status(200).json({
    success: true,
    data: user,
  });
});

export const createUser = asyncHandler(async (req, res, next) => {
  const user = await User.create(req.body);
  res.status(200).json({
    success: true,
    data: user,
  });
});

export const updateUser = asyncHandler(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!user) {
    throw new MyError(req.params.id + " ID-тэй хэрэглэгч байхгүйээээ.", 400);
  }

  res.status(200).json({
    success: true,
    data: user,
  });
});

export const deleteUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    throw new MyError(req.params.id + " ID-тэй хэрэглэгч байхгүйээээ.", 400);
  }

  user.remove();

  res.status(200).json({
    success: true,
    data: user,
  });
});

export const allUserNotification = asyncHandler(async (req, res, next) => {
  const users = await User.find().lean();
  const { data, body, title } = req.body;

  users.map(async (user) => {
    const { expoPushToken } = user;
    if (expoPushToken) {
      await sendAllUserNotification(expoPushToken, data, title, body);
    }
  });
  res.status(200).json({
    success: true,
    data: "success",
  });
});

export const invoiceTime = asyncHandler(async (req, res, next) => {
  const profile = await User.findById(req.params.id);
  await axios({
    method: "post",
    url: "https://merchant.qpay.mn/v2/auth/token",
    headers: {
      Authorization: `Basic U0VEVTowYjRrNDJsRA==`,
    },
  })
    .then((response) => {
      const token = response.data.access_token;

      axios({
        method: "post",
        url: "https://merchant.qpay.mn/v2/invoice",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        data: {
          invoice_code: "SEDU_INVOICE",
          sender_invoice_no: "12345678",
          invoice_receiver_code: `${profile.phone}`,
          invoice_description: `Santa egg ${profile.phone}`,
          amount: req.body.amount,
          callback_url: `https://neuronsolution.info/users/callbacks/${req.params.id}/${req.body.amount}`,
        },
      })
        .then(async (response) => {
          req.body.urls = response.data.urls;
          req.body.qrImage = response.data.qr_image;
          req.body.invoiceId = response.data.invoice_id;
          const wallet = await Wallet.create(req.body);
          profile.invoiceId = wallet._id;
          profile.save();
          res.status(200).json({
            success: true,
            data: wallet._id,
          });
        })
        .catch((error) => {
          console.log(error.response.data);
        });
    })
    .catch((error) => {
      console.log(error.response.data);
    });
});

export const invoiceCheck = asyncHandler(async (req, res) => {
  await axios({
    method: "post",
    url: "https://merchant.qpay.mn/v2/auth/token",
    headers: {
      Authorization: `Basic U0VEVTowYjRrNDJsRA==`,
    },
  })
    .then((response) => {
      const token = response.data.access_token;
      axios({
        method: "post",
        url: "https://merchant.qpay.mn/v2/payment/check",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        data: {
          object_type: "INVOICE",
          object_id: req.params.id,
          page_number: 1,
          page_limit: 100,
          callback_url: `https://neuronsolution.info/users/check/challbacks/${req.params.id}/${req.params.numId}`,
        },
      })
        .then(async (response) => {
          console.log(response.data);
          const profile = await User.findById(req.params.numId);
          const count = response.data.count;
          if (count === 0) {
            res.status(402).json({
              success: false,
            });
          } else {
            // const price = parseInt(req.params.numId, 10);
            // const eggCount = price / 100;
            // profile.eggCount = profile.eggCount + eggCount;
            // profile.save();
            // await sendNotification(
            //   profile.expoPushToken,
            //   `${eggCount} өндөг амжилттай авлаа`
            // );
            res.status(200).json({
              success: true,
              data: profile,
            });
          }
        })
        .catch((error) => {
          // console.log(error, "error");
        });
    })
    .catch((error) => {
      console.log(error);
    });
});

export const chargeTime = asyncHandler(async (req, res, next) => {
  const profile = await User.findById(req.params.id);
  const price = parseInt(req.params.numId, 10);
  const eggCount = price / 100;
  profile.eggCount = profile.eggCount + eggCount;
  await sendNotification(
    profile.expoPushToken,
    `${eggCount} өндөг амжилттай авлаа`
  );
  profile.save();

  res.status(200).json({
    success: true,
    data: profile,
  });
});
