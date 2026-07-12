const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendCreated } = require('../utils/apiResponse');
const assetService = require('../services/asset.service');

const createAsset = asyncHandler(async (req, res) => {
  const asset = await assetService.createAsset(req.body, req.user);
  return sendCreated(res, asset, 'Asset registered');
});

const listAssets = asyncHandler(async (req, res) => {
  const assets = await assetService.listAssets(req.query, req.user);
  return sendSuccess(res, { data: assets });
});

const getAssetById = asyncHandler(async (req, res) => {
  const asset = await assetService.getAssetById(req.params.id, req.user);
  return sendSuccess(res, { data: asset });
});

const updateAsset = asyncHandler(async (req, res) => {
  const asset = await assetService.updateAsset(req.params.id, req.body, req.user);
  return sendSuccess(res, { data: asset, message: 'Asset updated' });
});

const getAssetHistory = asyncHandler(async (req, res) => {
  const history = await assetService.getAssetHistory(req.params.id, req.user);
  return sendSuccess(res, { data: history });
});

module.exports = {
  createAsset,
  listAssets,
  getAssetById,
  updateAsset,
  getAssetHistory,
};
