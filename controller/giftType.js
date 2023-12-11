import GiftType from "../models/GiftType.js";
import path from "path";
import MyError from "../utils/myError.js";
import asyncHandler from "express-async-handler";
import paginate from "../utils/paginate.js";
import User from "../models/User.js";
// api/v1/giftTypes
export const getGiftTypes = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5;
  const sort = req.query.sort;
  const select = req.query.select;

  ["select", "sort", "page", "limit"].forEach((el) => delete req.query[el]);

  const pagination = await paginate(page, limit, GiftType.find(req.query));

  const giftTypes = await GiftType.find(req.query, select)
    .sort(sort)
    .skip(pagination.start - 1)
    .limit(limit);

  res.status(200).json({
    success: true,
    count: giftTypes.length,
    data: giftTypes,
    pagination,
  });
});

export const getGiftType = asyncHandler(async (req, res, next) => {
  const giftType = await GiftType.findById(req.params.id);

  if (!giftType) {
    throw new MyError(req.params.id + " ID-тэй ном байхгүй байна.", 404);
  }

  res.status(200).json({
    success: true,
    data: giftType,
  });
});

export const createGiftType = asyncHandler(async (req, res, next) => {
  const giftType = await GiftType.create(req.body);

  res.status(200).json({
    success: true,
    data: giftType,
  });
});

export const deleteGiftType = asyncHandler(async (req, res, next) => {
  const giftType = await GiftType.findById(req.params.id);

  if (!giftType) {
    throw new MyError(req.params.id + " ID-тэй ном байхгүй байна.", 404);
  }

  if (
    giftType.createUser.toString() !== req.userId &&
    req.userRole !== "giftTypemin"
  ) {
    throw new MyError("Та зөвхөн өөрийнхөө номыг л засварлах хэрэгтэй", 403);
  }

  giftType.remove();

  res.status(200).json({
    success: true,
    data: giftType,
  });
});
