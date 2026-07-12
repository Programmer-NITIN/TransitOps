const vehicleService = require('./vehicles.service');

exports.list = async (req, res, next) => {
  try {
    const vehicles = await vehicleService.list(req.query);
    res.json({ success: true, data: vehicles, count: vehicles.length });
  } catch (err) { next(err); }
};

exports.getById = async (req, res, next) => {
  try {
    const vehicle = await vehicleService.getById(req.params.id);
    res.json({ success: true, data: vehicle });
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const vehicle = await vehicleService.create(req.body);
    res.status(201).json({ success: true, data: vehicle });
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const vehicle = await vehicleService.update(req.params.id, req.body);
    res.json({ success: true, data: vehicle });
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    await vehicleService.delete(req.params.id);
    res.json({ success: true, message: 'Vehicle deleted' });
  } catch (err) { next(err); }
};

exports.stats = async (req, res, next) => {
  try {
    const stats = await vehicleService.getStats();
    res.json({ success: true, data: stats });
  } catch (err) { next(err); }
};
