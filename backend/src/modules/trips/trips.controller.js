const tripService = require('./trips.service');

exports.list = async (req, res, next) => { try { const d = await tripService.list(req.query); res.json({ success: true, data: d, count: d.length }); } catch (e) { next(e); } };
exports.getById = async (req, res, next) => { try { res.json({ success: true, data: await tripService.getById(req.params.id) }); } catch (e) { next(e); } };
exports.create = async (req, res, next) => { try { res.status(201).json({ success: true, data: await tripService.create(req.body) }); } catch (e) { next(e); } };
exports.update = async (req, res, next) => { try { res.json({ success: true, data: await tripService.update(req.params.id, req.body) }); } catch (e) { next(e); } };
exports.updateStatus = async (req, res, next) => { try { res.json({ success: true, data: await tripService.updateStatus(req.params.id, req.body.status) }); } catch (e) { next(e); } };
