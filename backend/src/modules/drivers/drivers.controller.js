const driverService = require('./drivers.service');

exports.list = async (req, res, next) => {
  try {
    const drivers = await driverService.list(req.query);
    res.json({ success: true, data: drivers, count: drivers.length });
  } catch (err) { next(err); }
};

exports.getById = async (req, res, next) => {
  try {
    const driver = await driverService.getById(req.params.id);
    res.json({ success: true, data: driver });
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const driver = await driverService.create(req.body);
    res.status(201).json({ success: true, data: driver });
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const driver = await driverService.update(req.params.id, req.body);
    res.json({ success: true, data: driver });
  } catch (err) { next(err); }
};

exports.stats = async (req, res, next) => {
  try {
    const stats = await driverService.getStats();
    res.json({ success: true, data: stats });
  } catch (err) { next(err); }
};
